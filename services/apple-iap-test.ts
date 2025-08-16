// Test configuration for iOS In-App Purchases
// This file contains your App Store Connect credentials for testing
// DO NOT commit this file to production - keep it secure

export const APP_STORE_CONFIG = {
    // Your App Store Connect credentials
    sharedSecret: 'c071bfc9af40478f98e539305b111c2f',
    iapPurchaseKeyId: '7NNS5Q5HGA',
    issuerId: 'f3432c4f-94e2-42c8-b574-8f827c21d393',
    apiKeyId: '2J25F2V2UF',

    // App Store Connect API configuration
    apiUrl: 'https://api.storekit.itunes.apple.com',
    sandboxUrl: 'https://sandbox.itunes.apple.com',

    // Your app bundle ID
    bundleId: 'com.vipinsoni.bhav',

    // Subscription product IDs (matching App Store Connect)
    productIds: {
        sellerLite: 'seller_lite_6months',
        sellerPro: 'seller_pro_12months',
        superSeller: 'super_seller_12months'
    }
};

// Test environment detection
export const isTestEnvironment = () => {
    return __DEV__ || process.env.NODE_ENV === 'development';
};

// Sandbox vs Production URLs
export const getReceiptValidationUrl = () => {
    return isTestEnvironment()
        ? APP_STORE_CONFIG.sandboxUrl
        : APP_STORE_CONFIG.apiUrl;
};

export default APP_STORE_CONFIG;
