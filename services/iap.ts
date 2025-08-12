import {
    initConnection,
    endConnection,
    getProducts,
    requestPurchase,
    finishTransaction,
    validateReceiptIos,
    Product,
    PurchaseError,
    Purchase,
} from 'react-native-iap';
import { Platform } from 'react-native';
import { paymentAPI } from './api';

// Product IDs for iOS IAP
export const IOS_PRODUCT_IDS = [
    'seller_lite_6months',
    'seller_pro_12months',
    'super_seller_12months'
];

// Map product IDs to plan details
export const PRODUCT_PLAN_MAP = {
    'seller_lite_6months': {
        id: 'half-yearly',
        title: 'Seller Lite',
        durationMonths: 6
    },
    'seller_pro_12months': {
        id: 'yearly',
        title: 'Seller Pro',
        durationMonths: 12
    },
    'super_seller_12months': {
        id: 'super-seller',
        title: 'Super Seller',
        durationMonths: 12
    }
};

export interface IAPProduct extends Product {
    planId: string;
    planTitle: string;
    durationMonths: number;
}

export interface PurchaseResult {
    success: boolean;
    purchase?: Purchase;
    error?: string;
}

export interface ValidationResult {
    success: boolean;
    isValid: boolean;
    error?: string;
    receiptData?: any;
}

class IAPService {
    private isInitialized = false;
    private products: IAPProduct[] = [];

    // Initialize IAP connection
    async initialize(): Promise<boolean> {
        if (Platform.OS !== 'ios') {
            console.log('IAP: Not iOS platform, skipping initialization');
            return false;
        }

        try {
            const result = await initConnection();
            console.log('IAP: Connection initialized', result);
            this.isInitialized = true;

            // Load products after initialization
            await this.loadProducts();

            return true;
        } catch (error) {
            console.error('IAP: Failed to initialize connection', error);
            return false;
        }
    }

    // Load available products from App Store
    async loadProducts(): Promise<IAPProduct[]> {
        if (!this.isInitialized || Platform.OS !== 'ios') {
            return [];
        }

        try {
            const products = await getProducts({ skus: IOS_PRODUCT_IDS });
            console.log('IAP: Products loaded', products);

            // Map products with plan details
            this.products = products.map(product => {
                const planInfo = PRODUCT_PLAN_MAP[product.productId];
                return {
                    ...product,
                    planId: planInfo?.id || product.productId,
                    planTitle: planInfo?.title || product.title,
                    durationMonths: planInfo?.durationMonths || 12
                };
            });

            return this.products;
        } catch (error) {
            console.error('IAP: Failed to load products', error);
            return [];
        }
    }

    // Get loaded products
    getProducts(): IAPProduct[] {
        return this.products;
    }

    // Purchase a product
    async purchaseProduct(productId: string): Promise<PurchaseResult> {
        if (!this.isInitialized || Platform.OS !== 'ios') {
            return { success: false, error: 'IAP not available' };
        }

        try {
            console.log('IAP: Requesting purchase for', productId);
            const purchase = await requestPurchase({ sku: productId });
            console.log('IAP: Purchase successful', purchase);

            return { success: true, purchase };
        } catch (error) {
            console.error('IAP: Purchase failed', error);

            const purchaseError = error as PurchaseError;
            let errorMessage = 'Purchase failed';

            if (purchaseError.code === 'E_USER_CANCELLED') {
                errorMessage = 'Purchase cancelled by user';
            } else if (purchaseError.code === 'E_NETWORK_ERROR') {
                errorMessage = 'Network error, please try again';
            } else if (purchaseError.code === 'E_SERVICE_ERROR') {
                errorMessage = 'App Store service error';
            }

            return { success: false, error: errorMessage };
        }
    }

    // Validate receipt with App Store
    async validateReceipt(receiptData: string, isProduction: boolean = false): Promise<ValidationResult> {
        try {
            console.log('IAP: Validating receipt');

            const receiptBody = {
                'receipt-data': receiptData,
                'password': process.env.EXPO_PUBLIC_IOS_SHARED_SECRET, // Your shared secret
                'exclude-old-transactions': true
            };

            // Use sandbox for development, production for live app
            const url = isProduction
                ? 'https://buy.itunes.apple.com/verifyReceipt'
                : 'https://sandbox.itunes.apple.com/verifyReceipt';

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(receiptBody),
            });

            const result = await response.json();
            console.log('IAP: Receipt validation result', result);

            const isValid = result.status === 0;

            return {
                success: true,
                isValid,
                receiptData: result
            };
        } catch (error) {
            console.error('IAP: Receipt validation failed', error);
            return {
                success: false,
                isValid: false,
                error: error.message
            };
        }
    }

    // Complete purchase and update backend
    async completePurchase(
        purchase: Purchase,
        userId: string,
        brandName?: string
    ): Promise<{ success: boolean; error?: string }> {
        try {
            console.log('IAP: Completing purchase', purchase);

            const planInfo = PRODUCT_PLAN_MAP[purchase.productId];
            if (!planInfo) {
                throw new Error('Unknown product ID');
            }

            // Validate receipt first
            const validation = await this.validateReceipt(
                purchase.transactionReceipt,
                !__DEV__ // Use production in release builds
            );

            if (!validation.success || !validation.isValid) {
                throw new Error('Receipt validation failed');
            }

            // Send purchase data to backend
            const paymentData = {
                userId,
                amount: parseFloat(purchase.localizedPrice?.replace(/[^0-9.]/g, '') || '0'),
                plan: planInfo.id,
                paymentMethod: 'apple_iap',
                durationMonths: planInfo.durationMonths,
                brandName,
                // Apple IAP specific data
                appleTransactionId: purchase.transactionId,
                appleOriginalTransactionId: purchase.originalTransactionId,
                appleReceipt: purchase.transactionReceipt,
                appleProductId: purchase.productId
            };

            console.log('IAP: Sending payment data to backend', paymentData);

            // Call your existing payment completion API
            const result = await paymentAPI.completePayment(paymentData);

            if (!result.data.success) {
                throw new Error(result.data.message || 'Backend payment completion failed');
            }

            // Finish the transaction
            await finishTransaction({ purchase });
            console.log('IAP: Transaction finished');

            return { success: true };
        } catch (error) {
            console.error('IAP: Failed to complete purchase', error);
            return { success: false, error: error.message };
        }
    }

    // Restore purchases (for non-renewing subscriptions, this might be limited)
    async restorePurchases(): Promise<Purchase[]> {
        if (!this.isInitialized || Platform.OS !== 'ios') {
            return [];
        }

        try {
            // Note: For non-renewing subscriptions, restore might not work as expected
            // You might need to implement your own restore logic based on user account
            console.log('IAP: Restoring purchases (limited for non-renewing subscriptions)');

            // This is mainly for debugging - non-renewing subscriptions don't restore well
            return [];
        } catch (error) {
            console.error('IAP: Failed to restore purchases', error);
            return [];
        }
    }

    // Clean up IAP connection
    async disconnect(): Promise<void> {
        if (this.isInitialized) {
            try {
                await endConnection();
                console.log('IAP: Connection ended');
                this.isInitialized = false;
            } catch (error) {
                console.error('IAP: Failed to end connection', error);
            }
        }
    }

    // Check if IAP is available
    isAvailable(): boolean {
        return Platform.OS === 'ios' && this.isInitialized;
    }

    // Format price for display
    formatPrice(product: Product): string {
        return product.localizedPrice || product.price || 'N/A';
    }
}

// Export singleton instance
export const iapService = new IAPService();

// Utility functions
export const getProductDisplayName = (productId: string): string => {
    const planInfo = PRODUCT_PLAN_MAP[productId];
    return planInfo?.title || productId;
};

export const getProductDuration = (productId: string): number => {
    const planInfo = PRODUCT_PLAN_MAP[productId];
    return planInfo?.durationMonths || 12;
};

export const isIOSPlatform = (): boolean => {
    return Platform.OS === 'ios';
};