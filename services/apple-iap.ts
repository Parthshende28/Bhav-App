import { Platform } from 'react-native';
import {
  initConnection,
  getProducts,
  purchaseErrorListener,
  purchaseUpdatedListener,
  finishTransaction,
  Product,
  Purchase,
  PurchaseError,
  SubscriptionPurchase,
  ProductPurchase,
  requestSubscription,
  getAvailablePurchases
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
      async (purchase: ProductPurchase | SubscriptionPurchase) => {
        console.log('Purchase updated:', purchase);

        // Finish the transaction
        if (purchase.transactionId) {
          try {
            await finishTransaction({ purchase, isConsumable: false });
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

  async getProducts(): Promise<AppleIAPProduct[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const productIds = Object.keys(SUBSCRIPTION_PRODUCTS);
      console.log('Fetching products for IDs:', productIds);

      const products = await getProducts({ skus: productIds });
      console.log('Products fetched successfully:', products);

      // Return our mapped products (since we know the details)
      return Object.values(SUBSCRIPTION_PRODUCTS);
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  }

  async purchaseProduct(productId: string): Promise<PurchaseResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      console.log(`Starting purchase for product: ${productId}`);

      // For subscriptions, we need to use requestSubscription
      const purchase = await this.requestSubscription(productId);

      if (purchase) {
        console.log('Purchase successful:', purchase);

        return {
          success: true,
          transactionId: purchase.transactionId,
          receipt: purchase.transactionReceipt,
          productId: purchase.productId
        };
      } else {
        throw new Error('Purchase failed - no purchase object returned');
      }
    } catch (error) {
      console.error('Error during purchase:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private async requestSubscription(productId: string): Promise<SubscriptionPurchase | null> {
    try {
      // Request subscription purchase
      const purchase = await requestSubscription({
        sku: productId,
        andDangerouslyFinishTransactionAutomaticallyIOS: false
      });

      console.log('Subscription purchase result:', purchase);

      // Handle the return type properly - requestSubscription can return an array
      if (Array.isArray(purchase)) {
        return purchase[0] || null;
      }

      return purchase || null;
    } catch (error) {
      console.error('Subscription request failed:', error);
      throw error;
    }
  }

  async finishTransaction(transactionId: string): Promise<boolean> {
    try {
      // For react-native-iap, transactions are finished automatically
      // But we can acknowledge the purchase if needed
      console.log('Transaction finished automatically:', transactionId);
      return true;
    } catch (error) {
      console.error('Error finishing transaction:', error);
      return false;
    }
  }

  async restorePurchases(): Promise<PurchaseResult[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Get available purchases (non-consumable items and subscriptions)
      const purchases = await getAvailablePurchases();

      console.log('Available purchases restored:', purchases);

      return purchases.map((purchase: SubscriptionPurchase) => ({
        success: true,
        transactionId: purchase.transactionId,
        receipt: purchase.transactionReceipt,
        productId: purchase.productId
      }));
    } catch (error) {
      console.error('Error restoring purchases:', error);
      return [];
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
