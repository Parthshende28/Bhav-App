import { paymentAPI } from './api';

export interface RazorpayOrderData {
    userId: string;
    amount: number;
    plan: string;
    durationMonths?: number;
    brandName?: string;
}

export interface RazorpayOrderResponse {
    success: boolean;
    message: string;
    data: {
        orderId: string;
        amount: number;
        currency: string;
        receipt: string;
        keyId: string;
    };
}

export interface PaymentVerificationData {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
}

export interface PaymentStatusResponse {
    success: boolean;
    data: {
        status: 'pending' | 'success' | 'failed' | 'cancelled';
        amount: number;
        plan: string;
        createdAt: string;
        updatedAt: string;
    };
}

// Create Razorpay order
export const createRazorpayOrder = async (orderData: RazorpayOrderData): Promise<RazorpayOrderResponse> => {
    try {
        const response = await paymentAPI.createOrder(orderData);
        return response.data;
    } catch (error: any) {
        console.error('Create order error:', error);
        throw new Error(error.response?.data?.message || 'Failed to create order');
    }
};

// Verify payment
export const verifyRazorpayPayment = async (verificationData: PaymentVerificationData) => {
    try {
        const response = await paymentAPI.verifyPayment(verificationData);
        return response.data;
    } catch (error: any) {
        console.error('Payment verification error:', error);
        throw new Error(error.response?.data?.message || 'Payment verification failed');
    }
};

// Get payment status
export const getPaymentStatus = async (orderId: string): Promise<PaymentStatusResponse> => {
    try {
        const response = await paymentAPI.getPaymentStatus(orderId);
        return response.data;
    } catch (error: any) {
        console.error('Get payment status error:', error);
        throw new Error(error.response?.data?.message || 'Failed to get payment status');
    }
};

// Generate Razorpay checkout options
export const generateCheckoutOptions = (
    orderId: string,
    amount: number,
    currency: string,
    keyId: string,
    userData: {
        name: string;
        email: string;
        contact: string;
    },
    onSuccess: (response: any) => void,
    onFailure: (error: any) => void,
    onCancel: () => void
) => {
    return {
        key: keyId,
        amount: amount,
        currency: currency,
        name: 'Bhav App',
        description: 'Seller Subscription Payment',
        order_id: orderId,
        handler: onSuccess,
        prefill: {
            name: userData.name,
            email: userData.email,
            contact: userData.contact,
        },
        notes: {
            address: 'Bhav App Corporate Office',
        },
        theme: {
            color: '#F3B62B',
        },
        modal: {
            ondismiss: onCancel,
        },
        config: {
            display: {
                blocks: {
                    utib: {
                        name: 'Pay using UPI',
                        instruments: [
                            {
                                method: 'upi',
                            },
                        ],
                    },
                    other: {
                        name: 'Other Payment Methods',
                        instruments: [
                            {
                                method: 'card',
                            },
                            {
                                method: 'netbanking',
                            },
                        ],
                    },
                },
                sequence: ['block.utib', 'block.other'],
                preferences: {
                    show_default_blocks: false,
                },
            },
        },
    };
};

// Validate payment response
export const validatePaymentResponse = (response: any): boolean => {
    return (
        response &&
        response.razorpay_payment_id &&
        response.razorpay_order_id &&
        response.razorpay_signature
    );
};

// Format amount for display
export const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
    }).format(amount);
};

// Parse amount from string (remove currency symbols and commas)
export const parseAmount = (amountString: string): number => {
    return parseFloat(amountString.replace(/[₹,]/g, ''));
}; 