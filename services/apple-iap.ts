import { Platform } from 'react-native';
import {
  initConnection,
  getProducts,
  requestPurchase,
  purchaseErrorListener,
  purchaseUpdatedListener,
  finishTransaction,
  getAvailablePurchases,
  Product,
  Purchase,
  PurchaseError
} from 'react-native-iap';

// Product IDs from your App Store Connect
export const SUBSCRIPTION_PRODUCTS = {
  'seller_lite_6months': {
    id: 'seller_lite_6months',
    title: 'Seller Lite - 6 Months',
    price: '₹2,999',
    period: '6 months',
    planId: 'half-yearly',
    durationMonths: 6
  },
  'seller_pro_12months': {
    id: 'seller_pro_12months',
    title: 'Seller Pro - 12 Months',
    price: '₹4,999',
    period: '12 months',
    planId: 'yearly',
    durationMonths: 12
  },
  'super_seller_12months': {
    id: 'super_seller_12months',
    title: 'Super Seller - 12 Months',
    price: '₹9,999',
    period: '12 months',
    planId: 'super-seller',
    durationMonths: 12
  }
} as const;

export interface AppleIAPProduct {
  id: string;
  title: string;
  price: string;
  period: string;
  planId: string;
  durationMonths: number;
}

export interface PurchaseResult {
  success: boolean;
  transactionId?: string;
  receipt?: string;
  productId?: string;
  error?: string;
}

export class AppleIAPService {
  private static instance: AppleIAPService;
  private isInitialized = false;
  private purchaseUpdateSubscription: any;
  private purchaseErrorSubscription: any;
  private products: Product[] = [];

  static getInstance(): AppleIAPService {
    if (!AppleIAPService.instance) {
      AppleIAPService.instance = new AppleIAPService();
    }
    return AppleIAPService.instance;
  }

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    if (Platform.OS !== 'ios') {
      console.log('Apple IAP not supported on this platform');
      return false;
    }

    try {
      // Initialize connection to App Store
      const result = await initConnection();
      console.log('Apple IAP connection result:', result);

      // Set up purchase listeners
      this.setupPurchaseListeners();

      this.isInitialized = true;
      console.log('Apple IAP initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize Apple IAP:', error);
      return false;
    }
  }

  private setupPurchaseListeners() {
    // Listen for successful purchases
    this.purchaseUpdateSubscription = purchaseUpdatedListener(
      async (purchase: Purchase) => {
        console.log('Purchase updated:', purchase);

        // Finish the transaction
        if (purchase.transactionId) {
          try {
            await finishTransaction({ purchase });
            console.log('Transaction finished successfully');
          } catch (error) {
            console.error('Error finishing transaction:', error);
          }
        }
      }
    );

    // Listen for purchase errors
    this.purchaseErrorSubscription = purchaseErrorListener(
      (error: PurchaseError) => {
        console.error('Purchase error:', error);
      }
    );
  }

  async getProducts(): Promise<Product[]> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const productIds = Object.keys(SUBSCRIPTION_PRODUCTS);
      const products = await getProducts({ skus: productIds });
      this.products = products;
      return products;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  async purchaseProduct(productId: string): Promise<any> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const purchase = await requestPurchase({ sku: productId });

      // Handle single purchase or array of purchases
      if (Array.isArray(purchase)) {
        return purchase[0] || null;
      }

      return purchase;
    } catch (error) {
      console.error('Error purchasing product:', error);
      throw error;
    }
  }

  private async requestSubscription(productId: string): Promise<any> {
    // For non-renewing subscriptions, use purchase instead
    const result = await this.purchaseProduct(productId);
    return result;
  }

  async finishTransaction(purchase: Purchase): Promise<void> {
    try {
      await finishTransaction({ purchase });
    } catch (error) {
      console.error('Error finishing transaction:', error);
      throw error;
    }
  }

  async restorePurchases(): Promise<Purchase[]> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const purchases = await getAvailablePurchases();
      return purchases;
    } catch (error) {
      console.error('Error restoring purchases:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
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
        console.log('Apple IAP disconnected');
      } catch (error) {
        console.error('Error disconnecting Apple IAP:', error);
      }
    }
  }

  // Helper method to get product by plan ID
  getProductByPlanId(planId: string): AppleIAPProduct | undefined {
    return Object.values(SUBSCRIPTION_PRODUCTS).find(product => product.planId === planId);
  }

  // Helper method to get product by App Store product ID
  getProductByProductId(productId: string): AppleIAPProduct | undefined {
    return SUBSCRIPTION_PRODUCTS[productId as keyof typeof SUBSCRIPTION_PRODUCTS];
  }

  // Cleanup method for component unmount
  cleanup() {
    this.disconnect();
  }
}

export default AppleIAPService;
