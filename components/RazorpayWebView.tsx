import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth-store';
import { createRazorpayOrder, verifyRazorpayPayment, validatePaymentResponse, parseAmount } from '@/services/razorpay';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface RazorpayWebViewProps {
  amount: string;
  planId: string;
  planTitle: string;
  planPeriod: string;
  brandName?: string;
  onClose: () => void;
}

export default function RazorpayWebView({
  amount,
  planId,
  planTitle,
  planPeriod,
  brandName,
  onClose,
}: RazorpayWebViewProps) {
  const router = useRouter();
  const webViewRef = useRef<WebView>(null);
  const { user, updateUser, addNotification } = useAuthStore();

  const [isLoading, setIsLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'failed' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<any>(null);

  // Parse amount to number
  const parsedAmount = parseAmount(amount);
  const durationMonths = planId === 'yearly' ? 12 : 1;

  // Create order when component mounts
  useEffect(() => {
    createOrder();
  }, []);

  const createOrder = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!user?.id && !user?._id) {
        throw new Error('User not found');
      }

      const userId = user.id || user._id;

      const orderResponse = await createRazorpayOrder({
        userId: userId as string,
        amount: parsedAmount,
        plan: planId,
        durationMonths: durationMonths,
        brandName: brandName,
      });

      setOrderData(orderResponse.data);

    } catch (error: any) {
      console.error('Create order error:', error);
      setError(error.message || 'Failed to create order');
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const generateRazorpayHTML = (orderData: any) => {
    const userData = {
      name: user?.fullName || user?.name || '',
      email: user?.email || '',
      contact: user?.phone || '',
    };

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              margin: 0;
              padding: 20px;
              background: #f5f5f5;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            .container {
              background: white;
              border-radius: 12px;
              padding: 24px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
              max-width: 400px;
              width: 100%;
            }
            .header {
              text-align: center;
              margin-bottom: 24px;
            }
            .title {
              font-size: 24px;
              font-weight: bold;
              color: #333;
              margin-bottom: 8px;
            }
            .subtitle {
              font-size: 16px;
              color: #666;
            }
            .order-details {
              background: #f9f9f9;
              border-radius: 8px;
              padding: 16px;
              margin-bottom: 24px;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
            }
            .detail-label {
              color: #666;
              font-size: 14px;
            }
            .detail-value {
              color: #333;
              font-weight: 600;
              font-size: 14px;
            }
            .amount {
              font-size: 20px;
              color: #F3B62B;
              font-weight: bold;
            }
            .pay-button {
              width: 100%;
              background: #F3B62B;
              color: white;
              border: none;
              border-radius: 8px;
              padding: 16px;
              font-size: 16px;
              font-weight: 600;
              cursor: pointer;
              transition: background 0.3s;
            }
            .pay-button:hover {
              background: #E6A800;
            }
            .pay-button:disabled {
              background: #ccc;
              cursor: not-allowed;
            }
            .loading {
              text-align: center;
              color: #666;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="title">Complete Payment</div>
              <div class="subtitle">Bhav App Subscription</div>
            </div>
            
            <div class="order-details">
              <div class="detail-row">
                <span class="detail-label">Plan:</span>
                <span class="detail-value">${planTitle}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Duration:</span>
                <span class="detail-value">${planPeriod}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Amount:</span>
                <span class="detail-value amount">₹${parsedAmount.toLocaleString()}</span>
              </div>
            </div>
            
            <button id="pay-button" class="pay-button" onclick="initiatePayment()">
              Pay ₹${parsedAmount.toLocaleString()}
            </button>
            
            <div id="loading" class="loading" style="display: none; margin-top: 16px;">
              Processing payment...
            </div>
          </div>

          <script>
            function initiatePayment() {
              const button = document.getElementById('pay-button');
              const loading = document.getElementById('loading');
              
              button.disabled = true;
              button.textContent = 'Processing...';
              loading.style.display = 'block';
              
              const options = {
                key: '${orderData.keyId}',
                amount: ${orderData.amount},
                currency: '${orderData.currency}',
                name: 'Bhav App',
                description: '${planTitle} Subscription',
                order_id: '${orderData.orderId}',
                handler: function(response) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'payment_success',
                    data: response
                  }));
                },
                prefill: {
                  name: '${userData.name}',
                  email: '${userData.email}',
                  contact: '${userData.contact}'
                },
                notes: {
                  address: 'Bhav App Corporate Office'
                },
                theme: {
                  color: '#F3B62B'
                },
                modal: {
                  ondismiss: function() {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'payment_cancelled'
                    }));
                  }
                }
              };
              
              const rzp = new Razorpay(options);
              rzp.open();
              
              rzp.on('payment.failed', function(response) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'payment_failed',
                  data: response
                }));
              });
            }
          </script>
        </body>
      </html>
    `;
  };

  const handleWebViewMessage = async (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);

      switch (message.type) {
        case 'payment_success':
          await handlePaymentSuccess(message.data);
          break;
        case 'payment_failed':
          handlePaymentFailure(message.data);
          router.back();
          break;
        case 'payment_cancelled':
          handlePaymentCancelled();
          break;
      }
    } catch (error) {
      console.error('WebView message error:', error);
    }
  };

  const handlePaymentSuccess = async (paymentData: any) => {
    try {
      setPaymentStatus('pending');

      if (!validatePaymentResponse(paymentData)) {
        throw new Error('Invalid payment response');
      }

      // Verify payment with backend
      const verificationResult = await verifyRazorpayPayment({
        razorpayOrderId: paymentData.razorpay_order_id,
        razorpayPaymentId: paymentData.razorpay_payment_id,
        razorpaySignature: paymentData.razorpay_signature,
      });

      // Update user subscription
      if (verificationResult.data.user) {
        await updateUser(verificationResult.data.user);
      }

      // Send notification
      await addNotification({
        title: "Payment Successful",
        message: `Your ${planTitle} subscription has been activated successfully.`,
        type: "payment_success",
        data: {
          plan: planTitle,
          amount: amount,
          paymentId: paymentData.razorpay_payment_id,
        },
      });

      setPaymentStatus('success');

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Redirect after success
      setTimeout(() => {
        router.push('/(app)/(tabs)/rates');
      }, 2000);

    } catch (error: any) {
      console.error('Payment verification error:', error);
      setError(error.message || 'Payment verification failed');
      setPaymentStatus('failed');

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  };

  const handlePaymentFailure = (errorData: any) => {
    console.error('Payment failed:', errorData);
    setPaymentStatus('failed');
    setError('Payment failed. Please try again.');

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handlePaymentCancelled = () => {
    setPaymentStatus('failed');
    setError('Payment was cancelled.');

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  };

  const renderContent = () => {
    if (paymentStatus === 'success') {
      return (
        <View style={styles.successContainer}>
          <CheckCircle size={80} color="#43A047" />
          <Text style={styles.successTitle}>Payment Successful!</Text>
          <Text style={styles.successMessage}>
            Your {planTitle} subscription has been activated.
          </Text>
        </View>
      );
    }

    if (paymentStatus === 'failed' || error) {
      return (
        <View style={styles.errorContainer}>
          <XCircle size={80} color="#f44336" />
          <Text style={styles.errorTitle}>Payment Failed</Text>
          <Text style={styles.errorMessage}>
            {error || 'Something went wrong. Please try again.'}
          </Text>
        </View>
      );
    }

    return (
      <WebView
        ref={webViewRef}
        source={{ html: orderData ? generateRazorpayHTML(orderData) : '<div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: system-ui;">Loading payment gateway...</div>' }}
        onMessage={handleWebViewMessage}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#F3B62B" />
            <Text style={styles.loadingText}>Loading payment gateway...</Text>
          </View>
        )}
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <LinearGradient
          colors={['#F3B62B', '#F5D76E']}
          style={styles.headerGradient}
        >
          <Text style={styles.headerTitle}>Payment</Text>
        </LinearGradient>
      </View>

      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 24,
    marginBottom: 16,
  },
  successMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 24,
    marginBottom: 16,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
  },
}); 