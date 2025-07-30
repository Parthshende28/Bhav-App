import API from '@/store/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Auth API
export const authAPI = {
    login: (email: string, password: string) =>
        API.post('/auth/login', { email, password }),

    signup: (userData: any) =>
        API.post('/auth/signup', userData),

    forgotPassword: (email: string, newPassword: string, confirmPassword: string) =>
        API.post('/auth/forgot-password', { email, newPassword, confirmPassword }),

    getAllUsers: () =>
        API.get('/auth/all-users'),

    deleteUser: (userId: string) =>
        API.delete(`/auth/users/${userId}`),
};

// KYC API
export const kycAPI = {
    submitKYC: (kycData: any) =>
        API.post('/kyc/submit', kycData),

    getKYCStatus: () =>
        API.get('/kyc/status'),

    updateKYC: (kycData: any) =>
        API.put('/kyc/update', kycData),

    // Admin routes
    getAllKYCApplications: (params?: any) =>
        API.get('/kyc/admin/applications', { params }),

    getKYCById: (kycId: string) =>
        API.get(`/kyc/admin/${kycId}`),

    approveKYC: (kycId: string) =>
        API.patch(`/kyc/admin/${kycId}/approve`),

    rejectKYC: (kycId: string, rejectionReason: string) =>
        API.patch(`/kyc/admin/${kycId}/reject`, { rejectionReason }),
};

// User Profile API
export const userAPI = {
    getProfile: () =>
        API.get('/users/profile'),

    updateProfile: (profileData: any) =>
        API.put('/users/profile', profileData),

    uploadProfileImage: (imageUrl: string) =>
        API.post('/users/profile/image', { imageUrl }),

    uploadBrandImage: (imageUrl: string) =>
        API.post('/users/brand/image', { imageUrl }),

    uploadCatalogueImage: (imageUrl: string) =>
        API.post('/users/catalogue/images', { imageUrl }),

    deleteCatalogueImage: (imageIndex: number) =>
        API.delete(`/users/catalogue/images/${imageIndex}`),

    // Referral routes
    getSellerByReferralCode: (referralCode: string) =>
        API.get(`/users/referral/${referralCode}`),

    addSellerReferral: (sellerId: string) =>
        API.post('/users/referral/add', { sellerId }),

    removeSellerReferral: (referralId: string) =>
        API.delete(`/users/referral/${referralId}`),

    getSellerReferrals: () =>
        API.get('/users/referrals'),

    getUserById: (userId: string) =>
        API.get(`/users/${userId}`),

    getSellerById: (sellerId: string) =>
        API.get(`/users/seller/${sellerId}`),
};

// Inventory API
export const inventoryAPI = {
    addInventoryItem: (itemData: any) =>
        API.post('/inventory', itemData),

    getSellerInventory: (sellerId: string) =>
        API.get(`/inventory/seller/${sellerId}`),

    updateInventoryItem: (id: string, updateData: any) =>
        API.put(`/inventory/${id}`, updateData),

    deleteInventoryItem: (id: string) =>
        API.delete(`/inventory/${id}`),

    getPublicInventory: (sellerId: string) =>
        API.get(`/inventory/public/${sellerId}`),

    toggleVisibility: (id: string) =>
        API.patch(`/inventory/${id}/toggle-visibility`),
};

// Request API
export const requestAPI = {
    createRequest: ({ itemId, requestType, quantity, message, capturedAmount }: { itemId: string, requestType: 'buy' | 'sell', quantity?: string, message?: string, capturedAmount: number }) =>
        API.post('/requests', { itemId, requestType, quantity, message, capturedAmount }),

    getSellerRequests: (status?: string) =>
        API.get('/requests/seller', { params: { status } }),

    getCustomerRequests: (status?: string) =>
        API.get('/requests/customer', { params: { status } }),

    getRequestById: (requestId: string) =>
        API.get(`/requests/${requestId}`),

    acceptRequest: (requestId: string) =>
        API.patch(`/requests/${requestId}/accept`),

    declineRequest: (requestId: string) =>
        API.patch(`/requests/${requestId}/decline`),
};

// Notification API
export const notificationAPI = {
    getUserNotifications: (params?: any) =>
        API.get('/notifications/user', { params }),

    getUnreadCount: () =>
        API.get('/notifications/unread-count'),

    markNotificationAsRead: (notificationId: string) =>
        API.patch(`/notifications/${notificationId}/read`),

    markAllNotificationsAsRead: () =>
        API.patch('/notifications/mark-all-read'),

    deleteNotification: (notificationId: string) =>
        API.delete(`/notifications/${notificationId}`),

    // Admin routes
    getAllNotifications: (params?: any) =>
        API.get('/notifications/admin/all', { params }),

    createSystemNotification: (notificationData: any) =>
        API.post('/notifications/admin/system', notificationData),

    createNotification: (notificationData: any) =>
        API.post('/notifications/create', notificationData),
};

// Subscription API
export const subscriptionAPI = {
    createSubscription: (subscriptionData: any) =>
        API.post('/subscriptions/create', subscriptionData),

    activateSubscription: (subscriptionId: string, transactionId?: string) =>
        API.patch(`/subscriptions/${subscriptionId}/activate`, { transactionId }),

    getUserSubscription: () =>
        API.get('/subscriptions/user'),

    getSubscriptionHistory: (params?: any) =>
        API.get('/subscriptions/history', { params }),

    cancelSubscription: (subscriptionId: string, reason: string) =>
        API.patch(`/subscriptions/${subscriptionId}/cancel`, { reason }),

    // Admin routes
    getAllSubscriptions: (params?: any) =>
        API.get('/subscriptions/admin/all', { params }),

    getSubscriptionStats: () =>
        API.get('/subscriptions/admin/stats'),
};

// Payment API
export const paymentAPI = {
    createOrder: (orderData: any) =>
        API.post('/payment/create-order', orderData),

    verifyPayment: (verificationData: any) =>
        API.post('/payment/verify', verificationData),

    getPaymentStatus: (orderId: string) =>
        API.get(`/payment/status/${orderId}`),

    completePayment: (paymentData: any) =>
        API.post('/payment/complete', paymentData),
};

// Utility functions
export const apiUtils = {
    handleError: (error: any) => {
        console.error('API Error:', error);
        if (error.response?.data?.message) {
            return error.response.data.message;
        }
        return 'An unexpected error occurred';
    },

    handleSuccess: (response: any) => {
        return response.data;
    },

    // Check if user needs subscription
    checkSubscriptionRequired: (error: any) => {
        return error.response?.data?.requiresSubscription === true;
    },

    // Check if user needs KYC
    checkKYCRequired: (error: any) => {
        return error.response?.status === 403 &&
            error.response?.data?.message?.includes('KYC');
    },
};

export default {
    auth: authAPI,
    kyc: kycAPI,
    user: userAPI,
    inventory: inventoryAPI,
    request: requestAPI,
    notification: notificationAPI,
    subscription: subscriptionAPI,
    utils: apiUtils,
};

API.interceptors.request.use(
    async (config) => {
        try {
            const token = await AsyncStorage.getItem('auth-storage');
            // console.log('Token from AsyncStorage:', token);
            if (token) {
                const parsedToken = JSON.parse(token);
                if (parsedToken.state?.token) {
                    config.headers.Authorization = `Bearer ${parsedToken.state.token}`;
                }
            }
        } catch (error) {
            console.error('Error getting auth token:', error);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
); 