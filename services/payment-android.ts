import { Platform } from 'react-native';
import { paymentAPI } from './api';
import { createRazorpayOrder, verifyRazorpayPayment } from './razorpay';

// Android Product configuration
export const ANDROID_SUBSCRIPTION_PRODUCTS = {
    'half-yearly': {
        id: 'half-yearly',
        title: 'Seller Lite - 6 Months',
        price: '₹2,999',
        period: '6 months',
        planId: 'half-yearly',
        durationMonths: 6
    },
    'yearly': {
        id: 'yearly',
        title: 'Seller Pro - 12 Months',
        price: '₹4,999',
        period: '12 months',
        planId: 'yearly',
        durationMonths: 12
    },
    'super-seller': {
        id: 'super-seller',
        title: 'Super Seller - 12 Months',
        price: '₹9,999',
        period: '12 months',
        planId: 'super-seller',
        durationMonths: 12
    }
} as const;

export interface AndroidProduct {
    id: string;
    title: string;
    price: string;
    period: string;
    planId: string;
    durationMonths: number;
}

export interface AndroidPurchaseResult {
    success: boolean;
    transactionId?: string;
    receipt?: string;
    productId?: string;
    error?: string;
}

export class AndroidPaymentService {
    private isInitialized = false;

    // Initialize Android Razorpay service
    async initialize(): Promise<boolean> {
        if (this.isInitialized) return true;

        if (Platform.OS !== 'android') {
            console.log('Android Payment Service: Not Android platform');
            return false;
        }

        try {
            // Android Razorpay doesn't need explicit initialization
            // Just check if we're on the right platform
            this.isInitialized = true;
            console.log('Android Payment Service: Initialized successfully');
            return true;
        } catch (error) {
            console.error('Android Payment Service: Failed to initialize:', error);
            return false;
        }
    }

    // Get available products
    async getProducts(): Promise<AndroidProduct[]> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        try {
            console.log('Android Payment Service: Getting products');
            // Return our mapped products (since we know the details)
            return Object.values(ANDROID_SUBSCRIPTION_PRODUCTS);
        } catch (error) {
            console.error('Android Payment Service: Error getting products:', error);
            return [];
        }
    }

    // Purchase a product
    async purchaseProduct(productId: string, userId: string, brandName?: string): Promise<AndroidPurchaseResult> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        try {
            console.log(`Android Payment Service: Starting purchase for product: ${productId}`);

            // Get product details
            const product = ANDROID_SUBSCRIPTION_PRODUCTS[productId as keyof typeof ANDROID_SUBSCRIPTION_PRODUCTS];
            if (!product) {
                throw new Error(`Unknown product ID: ${productId}`);
            }

            // Create Razorpay order
            const orderResponse = await createRazorpayOrder({
                userId: userId,
                amount: this.parseAmount(product.price),
                plan: product.planId,
                durationMonths: product.durationMonths,
                brandName: brandName || ''
            });

            if (orderResponse.data) {
                console.log('Android Payment Service: Order created successfully:', orderResponse.data);

                // Return success with order details
                // The actual payment will be handled by RazorpayWebView component
                return {
                    success: true,
                    transactionId: orderResponse.data.orderId,
                    productId: productId,
                    receipt: JSON.stringify(orderResponse.data)
                };
            } else {
                throw new Error('Failed to create order');
            }
        } catch (error: any) {
            console.error('Android Payment Service: Error during purchase:', error);
            return {
                success: false,
                error: error.message || 'Android purchase failed. Please try again.'
            };
        }
    }

    // Parse amount from price string (e.g., "₹2,999" -> 2999)
    private parseAmount(price: string): number {
        const numericPrice = price.replace(/[^\d]/g, '');
        return parseInt(numericPrice, 10);
    }

    // Verify payment with backend
    async verifyPayment(paymentData: any): Promise<boolean> {
        try {
            console.log('Android Payment Service: Verifying payment:', paymentData);

            const verificationResult = await verifyRazorpayPayment({
                razorpayOrderId: paymentData.razorpay_order_id,
                razorpayPaymentId: paymentData.razorpay_payment_id,
                razorpaySignature: paymentData.razorpay_signature,
            });

            return verificationResult.data.success || false;
        } catch (error) {
            console.error('Android Payment Service: Payment verification failed:', error);
            return false;
        }
    }

    // Check if service is available
    isAvailable(): boolean {
        return Platform.OS === 'android' && this.isInitialized;
    }

    // Get service name
    getServiceName(): string {
        return 'Android Razorpay';
    }

    // Get product by plan ID
    getProductByPlanId(planId: string): AndroidProduct | undefined {
        return Object.values(ANDROID_SUBSCRIPTION_PRODUCTS).find(product => product.planId === planId);
    }

    // Get product by product ID
    getProductByProductId(productId: string): AndroidProduct | undefined {
        return ANDROID_SUBSCRIPTION_PRODUCTS[productId as keyof typeof ANDROID_SUBSCRIPTION_PRODUCTS];
    }

    // Get product price by plan ID
    getProductPrice(planId: string): string {
        const product = this.getProductByPlanId(planId);
        return product?.price || '₹0';
    }

    // Get product duration by plan ID
    getProductDuration(planId: string): number {
        const product = this.getProductByPlanId(planId);
        return product?.durationMonths || 0;
    }

    // Cleanup resources
    async cleanup(): Promise<void> {
        this.isInitialized = false;
        console.log('Android Payment Service: Cleaned up');
    }
}
