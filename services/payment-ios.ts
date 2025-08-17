import { Platform } from 'react-native';
import {
    initConnection,
    getProducts,
    purchaseErrorListener,
    purchaseUpdatedListener,
    finishTransaction,
    requestSubscription,
    getAvailablePurchases
} from 'react-native-iap';
import { iosIAPAPI } from './api';

// iOS Product configuration
export const IOS_SUBSCRIPTION_PRODUCTS = {
    'seller_lite_6m': {
        id: 'seller_lite_6m',
        title: 'Seller Lite - 6 Months',
        price: '₹2,999',
        period: '6 months',
        planId: 'half-yearly',
        durationMonths: 6
    },
    'seller_pro_12m': {
        id: 'seller_pro_12m',
        title: 'Seller Pro - 12 Months',
        price: '₹4,999',
        period: '12 months',
        planId: 'yearly',
        durationMonths: 12
    },
    'super_seller_12m': {
        id: 'super_seller_12m',
        title: 'Super Seller - 12 Months',
        price: '₹9,999',
        period: '12 months',
        planId: 'super-seller',
        durationMonths: 12
    }
} as const;

export interface IOSProduct {
    id: string;
    title: string;
    price: string;
    period: string;
    planId: string;
    durationMonths: number;
}

export interface IOSPurchaseResult {
    success: boolean;
    transactionId?: string;
    receipt?: string;
    productId?: string;
    error?: string;
}

export class IOSPaymentService {
    private isInitialized = false;
    private purchaseUpdateSubscription: any;
    private purchaseErrorSubscription: any;

    // Initialize iOS IAP service
    async initialize(): Promise<boolean> {
        if (this.isInitialized) return true;

        if (Platform.OS !== 'ios') {
            console.log('iOS Payment Service: Not iOS platform');
            return false;
        }

        try {
            // Initialize connection to App Store
            const result = await initConnection();
            console.log('iOS Payment Service: Connection result:', result);

            // Set up purchase listeners
            this.setupPurchaseListeners();

            this.isInitialized = true;
            console.log('iOS Payment Service: Initialized successfully');
            return true;
        } catch (error) {
            console.error('iOS Payment Service: Failed to initialize:', error);
            return false;
        }
    }

    // Set up purchase listeners
    private setupPurchaseListeners() {
        // Listen for successful purchases
        this.purchaseUpdateSubscription = purchaseUpdatedListener(
            async (purchase: any) => {
                console.log('iOS Payment Service: Purchase updated:', purchase);

                // Finish the transaction
                if (purchase.transactionId) {
                    try {
                        await finishTransaction({ purchase, isConsumable: false });
                        console.log('iOS Payment Service: Transaction finished successfully');
                    } catch (error) {
                        console.error('iOS Payment Service: Error finishing transaction:', error);
                    }
                }
            }
        );

        // Listen for purchase errors
        this.purchaseErrorSubscription = purchaseErrorListener(
            (error: any) => {
                console.error('iOS Payment Service: Purchase error:', error);
            }
        );
    }

    // Get available products
    async getProducts(): Promise<IOSProduct[]> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        try {
            const productIds = Object.keys(IOS_SUBSCRIPTION_PRODUCTS);
            console.log('iOS Payment Service: Fetching products for IDs:', productIds);

            const products = await getProducts({ skus: productIds });
            console.log('iOS Payment Service: Products fetched successfully:', products);

            // Return our mapped products (since we know the details)
            return Object.values(IOS_SUBSCRIPTION_PRODUCTS);
        } catch (error) {
            console.error('iOS Payment Service: Error fetching products:', error);
            return [];
        }
    }

    // Purchase a product
    async purchaseProduct(productId: string, userId: string, brandName?: string): Promise<IOSPurchaseResult> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        try {
            console.log(`iOS Payment Service: Starting purchase for product: ${productId}`);

            // Request subscription purchase
            const purchase = await this.requestSubscription(productId);

            if (purchase) {
                console.log('iOS Payment Service: Purchase successful:', purchase);

                // Validate receipt with backend
                const validationResult = await iosIAPAPI.validateReceipt({
                    receiptData: purchase.transactionReceipt,
                    productId: purchase.productId,
                    userId: userId,
                    planId: this.getPlanIdFromProductId(productId),
                    purchaseDate: new Date().toISOString(),
                    transactionId: purchase.transactionId,
                    brandName: brandName
                });

                if (validationResult.data?.success) {
                    // Finish the transaction
                    await finishTransaction({ purchase, isConsumable: false });

                    return {
                        success: true,
                        transactionId: purchase.transactionId,
                        receipt: purchase.transactionReceipt,
                        productId: purchase.productId
                    };
                } else {
                    throw new Error(validationResult.data?.message || 'Receipt validation failed');
                }
            } else {
                throw new Error('Purchase failed - no purchase object returned');
            }
        } catch (error: any) {
            console.error('iOS Payment Service: Error during purchase:', error);
            return {
                success: false,
                error: error.message || 'iOS purchase failed. Please try again.'
            };
        }
    }

    // Request subscription purchase
    private async requestSubscription(productId: string): Promise<any> {
        try {
            const purchase = await requestSubscription({
                sku: productId,
                andDangerouslyFinishTransactionAutomaticallyIOS: false
            });

            console.log('iOS Payment Service: Subscription purchase result:', purchase);

            // Handle the return type properly
            if (Array.isArray(purchase)) {
                return purchase[0] || null;
            }

            return purchase || null;
        } catch (error) {
            console.error('iOS Payment Service: Subscription request failed:', error);
            throw error;
        }
    }

    // Get plan ID from product ID
    private getPlanIdFromProductId(productId: string): string {
        const product = IOS_SUBSCRIPTION_PRODUCTS[productId as keyof typeof IOS_SUBSCRIPTION_PRODUCTS];
        return product?.planId || productId;
    }

    // Restore purchases
    async restorePurchases(): Promise<IOSPurchaseResult[]> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        try {
            const purchases = await getAvailablePurchases();
            console.log('iOS Payment Service: Available purchases restored:', purchases);

            return purchases.map((purchase: any) => ({
                success: true,
                transactionId: purchase.transactionId,
                receipt: purchase.transactionReceipt,
                productId: purchase.productId
            }));
        } catch (error) {
            console.error('iOS Payment Service: Error restoring purchases:', error);
            return [];
        }
    }

    // Check if service is available
    isAvailable(): boolean {
        return Platform.OS === 'ios' && this.isInitialized;
    }

    // Get service name
    getServiceName(): string {
        return 'iOS In-App Purchase';
    }

    // Cleanup resources
    async cleanup(): Promise<void> {
        if (this.isInitialized) {
            try {
                // Remove listeners
                if (this.purchaseUpdateSubscription) {
                    this.purchaseUpdateSubscription.remove();
                }
                if (this.purchaseErrorSubscription) {
                    this.purchaseErrorSubscription.remove();
                }

                this.isInitialized = false;
                console.log('iOS Payment Service: Disconnected');
            } catch (error) {
                console.error('iOS Payment Service: Error disconnecting:', error);
            }
        }
    }

    // Get product by plan ID
    getProductByPlanId(planId: string): IOSProduct | undefined {
        return Object.values(IOS_SUBSCRIPTION_PRODUCTS).find(product => product.planId === planId);
    }

    // Get product by App Store product ID
    getProductByProductId(productId: string): IOSProduct | undefined {
        return IOS_SUBSCRIPTION_PRODUCTS[productId as keyof typeof IOS_SUBSCRIPTION_PRODUCTS];
    }
}
