import { Platform } from 'react-native';
import { IOSPaymentService } from './payment-ios';
import { AndroidPaymentService } from './payment-android';

// Unified payment interface
export interface PaymentService {
    initialize(): Promise<boolean>;
    getProducts(): Promise<any[]>;
    purchaseProduct(productId: string, userId: string, brandName?: string): Promise<any>;
    isAvailable(): boolean;
    getServiceName(): string;
}

// Main payment manager class
export class PaymentManager {
    private static instance: PaymentManager;
    private paymentService: PaymentService | null = null;
    private isInitialized = false;

    static getInstance(): PaymentManager {
        if (!PaymentManager.instance) {
            PaymentManager.instance = new PaymentManager();
        }
        return PaymentManager.instance;
    }

    // Initialize the appropriate payment service based on platform
    async initialize(): Promise<boolean> {
        if (this.isInitialized) {
            return true;
        }

        try {
            // Platform-specific service selection
            if (Platform.OS === 'ios') {
                this.paymentService = new IOSPaymentService();
                console.log('Payment Manager: Using iOS IAP service');
            } else if (Platform.OS === 'android') {
                this.paymentService = new AndroidPaymentService();
                console.log('Payment Manager: Using Android Razorpay service');
            } else {
                console.log('Payment Manager: Platform not supported');
                return false;
            }

            // Initialize the selected service
            if (this.paymentService) {
                const success = await this.paymentService.initialize();
                this.isInitialized = success;
                return success;
            }

            return false;
        } catch (error) {
            console.error('Payment Manager: Failed to initialize:', error);
            return false;
        }
    }

    // Get available products
    async getProducts(): Promise<any[]> {
        if (!this.paymentService || !this.isInitialized) {
            await this.initialize();
        }

        if (this.paymentService) {
            return await this.paymentService.getProducts();
        }

        return [];
    }

    // Purchase a product
    async purchaseProduct(productId: string, userId: string, brandName?: string): Promise<any> {
        if (!this.paymentService || !this.isInitialized) {
            await this.initialize();
        }

        if (this.paymentService) {
            return await this.paymentService.purchaseProduct(productId, userId, brandName);
        }

        throw new Error('Payment service not available');
    }

    // Check if payment service is available
    isAvailable(): boolean {
        return this.isInitialized && this.paymentService !== null;
    }

    // Get the name of the current payment service
    getServiceName(): string {
        if (this.paymentService) {
            return this.paymentService.getServiceName();
        }
        return 'None';
    }

    // Get the current payment service instance
    getCurrentService(): PaymentService | null {
        return this.paymentService;
    }

    // Check if running on iOS
    isIOS(): boolean {
        return Platform.OS === 'ios';
    }

    // Check if running on Android
    isAndroid(): boolean {
        return Platform.OS === 'android';
    }

    // Get platform-specific product IDs
    getProductIds(): string[] {
        if (this.isIOS()) {
            return ['seller_lite_6m', 'seller_pro_12m', 'super_seller_12m'];
        } else if (this.isAndroid()) {
            return ['half-yearly', 'yearly', 'super-seller'];
        }
        return [];
    }

    // Cleanup resources
    async cleanup(): Promise<void> {
        if (this.paymentService) {
            // Add cleanup logic if needed
            this.paymentService = null;
        }
        this.isInitialized = false;
    }
}

// Export singleton instance
export const paymentManager = PaymentManager.getInstance();

// Export platform detection utilities
export const isIOSPlatform = (): boolean => Platform.OS === 'ios';
export const isAndroidPlatform = (): boolean => Platform.OS === 'android';
