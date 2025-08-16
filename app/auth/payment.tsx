import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Image,
  Modal,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { ArrowLeft, CreditCard, Calendar, Lock, CheckCircle, User, QrCode, Copy, Smartphone, Shield, Apple } from "lucide-react-native";
import { useAuthStore } from "@/store/auth-store";
import * as Clipboard from 'expo-clipboard';
import { paymentAPI, iosIAPAPI } from "@/services/api";
import { images } from "@/constants/images";
import RazorpayWebView from "@/components/RazorpayWebView";
import AppleIAPService, { SUBSCRIPTION_PRODUCTS } from "@/services/apple-iap";

export default function PaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { userId, planId, planTitle, planPrice, planPeriod, brandName } = params;
  const { updateUser, addNotification, getUserById } = useAuthStore();

  // Platform detection
  const isIOS = Platform.OS === 'ios';
  const isAndroid = Platform.OS === 'android';

  // Payment method state - Platform specific
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'ios_iap'>(isIOS ? 'ios_iap' : 'razorpay');

  // Card payment states
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");

  // UPI payment states
  const [upiId, setUpiId] = useState("");
  const [upiCopied, setUpiCopied] = useState(false);

  // Common states
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);

  // iOS IAP states
  const [iosProducts, setIosProducts] = useState<any[]>([]);
  const [selectedIosProduct, setSelectedIosProduct] = useState<any>(null);

  // Animation values
  const successScale = React.useRef(new Animated.Value(0)).current;
  const successOpacity = React.useRef(new Animated.Value(0)).current;

  // UPI details
  const merchantUpiId = "bhavApp@ybl";
  // Fix for TypeScript error - ensure userId and planId are strings before using substring
  const userIdStr = typeof userId === 'string' ? userId : Array.isArray(userId) ? userId[0] : '';
  const planIdStr = typeof planId === 'string' ? planId : Array.isArray(planId) ? planId[0] : '';

  console.log("Payment screen - userId from params:", userId);
  console.log("Payment screen - userIdStr:", userIdStr);
  console.log("Payment screen - Current user from store:", useAuthStore.getState().user);
  const upiReference = `BHAV${userIdStr.substring(0, 4)}${planIdStr.substring(0, 2)}${Date.now().toString().substring(8, 13)}`;

  // Initialize iOS IAP on component mount
  useEffect(() => {
    if (isIOS) {
      initializeIOSIAP();
    }
  }, [isIOS]);

  // Initialize iOS IAP service
  const initializeIOSIAP = async () => {
    try {
      const iapService = AppleIAPService.getInstance();
      const initialized = await iapService.initialize();

      if (initialized) {
        const products = await iapService.getProducts();
        setIosProducts(products);

        // Find the product that matches the selected plan
        const matchingProduct = products.find(product => product.planId === planIdStr);
        if (matchingProduct) {
          setSelectedIosProduct(matchingProduct);
        }
      }
    } catch (error) {
      console.error('Failed to initialize iOS IAP:', error);
    }
  };

  // Handle iOS In-App Purchase
  const handleIOSPurchase = async () => {
    if (!selectedIosProduct) {
      Alert.alert('Error', 'No product selected for purchase');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const iapService = AppleIAPService.getInstance();
      const purchaseResult = await iapService.purchaseProduct(selectedIosProduct.id);

      if (purchaseResult.success && purchaseResult.receipt) {
        // Validate receipt with backend
        const validationResult = await iosIAPAPI.validateReceipt({
          receiptData: purchaseResult.receipt,
          productId: selectedIosProduct.id,
          userId: userIdStr,
          brandName: typeof brandName === 'string' ? brandName : Array.isArray(brandName) ? brandName[0] : ''
        });

        if (validationResult.data.success) {
          // Finish the transaction
          await iapService.finishTransaction(purchaseResult.transactionId!);

          // Update user profile
          await updateUser({
            id: userIdStr,
            role: "seller",
            sellerPlan: selectedIosProduct.planId,
            sellerVerified: true,
            isPremium: true,
            subscriptionStatus: "active",
            brandName: typeof brandName === 'string' ? brandName : Array.isArray(brandName) ? brandName[0] : undefined,
          });

          // Get user details for notification
          const user = getUserById(userIdStr);

          // Send payment success notification to admin
          await addNotification({
            title: "iOS Seller Subscription Payment",
            message: `${user?.fullName || user?.name} has completed payment for ${selectedIosProduct.title} plan using iOS In-App Purchase.`,
            type: "payment_success",
            data: {
              user: {
                id: userIdStr,
                name: user?.fullName || user?.name,
                email: user?.email,
                phone: user?.phone,
                brandName: typeof brandName === 'string' ? brandName : Array.isArray(brandName) ? brandName[0] : user?.brandName
              },
              plan: {
                id: selectedIosProduct.planId,
                title: selectedIosProduct.title,
                price: selectedIosProduct.price,
                period: selectedIosProduct.period
              },
              paymentMethod: 'ios_in_app_purchase'
            }
          });

          // Show success animation
          setIsSuccess(true);

          if (Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }

          // Animate success message
          Animated.parallel([
            Animated.spring(successScale, {
              toValue: 1,
              friction: 5,
              tension: 40,
              useNativeDriver: true,
            }),
            Animated.timing(successOpacity, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start();

          // Redirect to home after a short delay
          setTimeout(() => {
            router.push("/(app)/(tabs)/rates");
          }, 2000);

        } else {
          throw new Error(validationResult.data.message || 'Receipt validation failed');
        }
      } else {
        throw new Error(purchaseResult.error || 'Purchase failed');
      }
    } catch (error: any) {
      console.error('iOS purchase error:', error);
      setError(error.message || 'iOS purchase failed. Please try again.');

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatCardNumber = (text: string) => {
    // Remove all non-digit characters
    const cleaned = text.replace(/\D/g, "");
    // Add space after every 4 digits
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, "$1 ");
    // Limit to 19 characters (16 digits + 3 spaces)
    return formatted.slice(0, 19);
  };

  const formatExpiryDate = (text: string) => {
    // Remove all non-digit characters
    const cleaned = text.replace(/\D/g, "");
    // Format as MM/YY
    if (cleaned.length > 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    }
    return cleaned;
  };

  const handleCardNumberChange = (text: string) => {
    setCardNumber(formatCardNumber(text));
  };

  const handleExpiryDateChange = (text: string) => {
    setExpiryDate(formatExpiryDate(text));
  };

  const copyToClipboard = async (text: string) => {
    if (Platform.OS !== "web") {
      await Clipboard.setStringAsync(text);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      await navigator.clipboard.writeText(text);
    }
    setUpiCopied(true);
    setTimeout(() => setUpiCopied(false), 2000);
  };

  // Card and UPI validation functions commented out - Only Razorpay available
  /*
  const validateCardPayment = () => {
    // Basic validation for card payment
    if (!cardNumber || !cardName || !expiryDate || !cvv) {
      setError("Please fill in all payment details");
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return false;
    }

    if (cardNumber.replace(/\s/g, "").length !== 16) {
      setError("Please enter a valid 16-digit card number");
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return false;
    }

    if (expiryDate.length !== 5) {
      setError("Please enter a valid expiry date (MM/YY)");
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return false;
    }

    if (cvv.length !== 3) {
      setError("Please enter a valid 3-digit CVV");
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return false;
    }

    return true;
  };

  const validateUpiPayment = () => {
    // Basic validation for UPI payment
    if (!upiId) {
      setError("Please enter your UPI ID for verification");
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return false;
    }

    // Simple UPI ID validation (basic format check)
    const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/;
    if (!upiRegex.test(upiId)) {
      setError("Please enter a valid UPI ID (e.g., name@upi)");
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return false;
    }

    return true;
  };
  */

  // Legacy handlePayment function commented out - Only Razorpay available
  /*
  const handlePayment = async () => {
    // Validate based on payment method
    let isValid = false;

    if (paymentMethod === 'card') {
      isValid = validateCardPayment();
    } else {
      isValid = validateUpiPayment();
    }

    if (!isValid) return;

    setError("");
    setIsLoading(true);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Get user details for notification
      const user = getUserById(userIdStr);

      // Calculate duration months based on plan type
      let durationMonths = 1; // Default to 1 month
      if (planIdStr === 'half-yearly') {
        durationMonths = 6;
      } else if (planIdStr === 'yearly') {
        durationMonths = 12;
      } else if (planIdStr === 'super-seller') {
        durationMonths = 12; // Super seller is also 12 months
      }

      // Get the current user's ID as fallback
      const currentUser = useAuthStore.getState().user;
      const finalUserId = userIdStr || currentUser?.id || currentUser?._id;

      if (!finalUserId) {
        throw new Error('No valid user ID found');
      }

      // Prepare payment data
      const paymentData = {
        userId: finalUserId,
        amount: parseFloat(typeof planPrice === 'string' ? planPrice.replace('₹', '').replace(/,/g, '') : '0'),
        plan: planIdStr,
        paymentMethod: paymentMethod,
        durationMonths: durationMonths
      };

      console.log("Sending payment data:", paymentData);

      // Call backend payment completion API
      const paymentResult = await paymentAPI.completePayment(paymentData);

      if (!paymentResult.data.success) {
        throw new Error(paymentResult.data.message || 'Payment completion failed');
      }

      // Update user with subscription details and brand name
      await updateUser({
        id: finalUserId,
        role: "seller", // Update role to seller
        sellerPlan: planIdStr,
        sellerVerified: true,
        isPremium: true, // Set isPremium to true after payment
        subscriptionStatus: "active", // Set subscription status to active
        brandName: typeof brandName === 'string' ? brandName : Array.isArray(brandName) ? brandName[0] : undefined, // Update brand name if provided
      });

      // Refresh user profile from backend to ensure latest subscription status
      if (typeof useAuthStore.getState().refreshUserProfile === 'function') {
        await useAuthStore.getState().refreshUserProfile();
      }

      // Send payment success notification to admin
      await addNotification({
        title: "Seller Subscription Payment",
        message: `${user?.fullName || user?.name} has completed payment for ${planTitle} plan using ${paymentMethod.toUpperCase()}.`,
        type: "payment_success",
        data: {
          user: {
            id: userIdStr,
            name: user?.fullName || user?.name,
            email: user?.email,
            phone: user?.phone,
            brandName: typeof brandName === 'string' ? brandName : Array.isArray(brandName) ? brandName[0] : user?.brandName
          },
          plan: {
            id: planIdStr,
            title: typeof planTitle === 'string' ? planTitle : Array.isArray(planTitle) ? planTitle[0] : '',
            price: typeof planPrice === 'string' ? planPrice : Array.isArray(planPrice) ? planPrice[0] : '',
            period: typeof planPeriod === 'string' ? planPeriod : Array.isArray(planPeriod) ? planPeriod[0] : ''
          },
          paymentMethod: paymentMethod
        }
      });

      // Show success animation
      setIsSuccess(true);

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Animate success message
      Animated.parallel([
        Animated.spring(successScale, {
          toValue: 1,
          friction: 5,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(successOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Redirect to home after a short delay
      setTimeout(() => {
        router.push("/(app)/(tabs)/rates");
      }, 2000);

    } catch (error: any) {
      console.error("Payment error:", error);

      // Extract error message from response
      let errorMessage = "Payment processing failed. Please try again.";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setIsLoading(false);
    }
  };
  */

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            {!isSuccess && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <ArrowLeft size={24} color="#333" />
              </TouchableOpacity>
            )}

            {isSuccess ? (
              <Animated.View
                style={[
                  styles.successContainer,
                  {
                    opacity: successOpacity,
                    transform: [{ scale: successScale }]
                  }
                ]}
              >
                <CheckCircle size={80} color="#43A047" />
                <Text style={styles.successTitle}>Payment Successful!</Text>
                <Text style={styles.successMessage}>
                  Your seller account has been activated.
                </Text>
              </Animated.View>
            ) : (
              <>
                <Text style={styles.title}>Payment Details</Text>
                <Text style={styles.subtitle}>
                  Complete your subscription payment
                </Text>

                <View style={styles.planSummary}>
                  <Text style={styles.planSummaryTitle}>Order Summary</Text>
                  <View style={styles.planDetails}>
                    <Text style={styles.planName}>{planTitle} Plan</Text>
                    <Text style={styles.planPrice}>{planPrice}</Text>
                  </View>
                  <Text style={styles.planPeriod}>{planPeriod}</Text>
                </View>

                {/* Platform-specific payment methods */}
                {isIOS ? (
                  // iOS In-App Purchase UI
                  <View style={styles.paymentMethodContainer}>
                    <View style={styles.iosInfo}>
                      <Apple size={24} color="#000000" style={styles.iosIcon} />
                      <Text style={styles.iosTitle}>iOS In-App Purchase</Text>
                      <Text style={styles.iosSubtitle}>
                        Secure payment through Apple's App Store
                      </Text>
                    </View>

                    {selectedIosProduct && (
                      <View style={styles.iosProductDetails}>
                        <Text style={styles.iosProductTitle}>{selectedIosProduct.title}</Text>
                        <Text style={styles.iosProductPrice}>{selectedIosProduct.price}</Text>
                        <Text style={styles.iosProductPeriod}>{selectedIosProduct.period}</Text>
                      </View>
                    )}

                    <View style={styles.iosFeatures}>
                      <View style={styles.featureItem}>
                        <CheckCircle size={16} color="#43A047" />
                        <Text style={styles.featureText}>Secure Apple payment processing</Text>
                      </View>
                      <View style={styles.featureItem}>
                        <CheckCircle size={16} color="#43A047" />
                        <Text style={styles.featureText}>Instant subscription activation</Text>
                      </View>
                      <View style={styles.featureItem}>
                        <CheckCircle size={16} color="#43A047" />
                        <Text style={styles.featureText}>Automatic receipt validation</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={handleIOSPurchase}
                      disabled={isLoading || !selectedIosProduct}
                      style={styles.iosButton}
                    >
                      <LinearGradient
                        colors={["#000000", "#333333"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.button}
                      >
                        {isLoading ? (
                          <ActivityIndicator color="#ffffff" />
                        ) : (
                          <Text style={styles.buttonText}>
                            Purchase with Apple
                          </Text>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>

                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                    <Text style={styles.secureText}>
                      <Lock size={12} color="#666666" /> Secure payment processing
                    </Text>
                  </View>
                ) : (
                  // Android Razorpay Payment UI
                  <View style={styles.paymentMethodContainer}>
                    <View style={styles.razorpayInfo}>
                      <Shield size={24} color="#F3B62B" style={styles.razorpayIcon} />
                      <Text style={styles.razorpayTitle}>Secure Payment Gateway</Text>
                      <Text style={styles.razorpaySubtitle}>
                        Powered by Razorpay - India's most trusted payment platform
                      </Text>
                    </View>

                    <View style={styles.razorpayFeatures}>
                      <View style={styles.featureItem}>
                        <CheckCircle size={16} color="#43A047" />
                        <Text style={styles.featureText}>256-bit SSL encryption</Text>
                      </View>
                      <View style={styles.featureItem}>
                        <CheckCircle size={16} color="#43A047" />
                        <Text style={styles.featureText}>PCI DSS compliant</Text>
                      </View>
                      <View style={styles.featureItem}>
                        <CheckCircle size={16} color="#43A047" />
                        <Text style={styles.featureText}>Multiple payment options</Text>
                      </View>
                      <View style={styles.featureItem}>
                        <CheckCircle size={16} color="#43A047" />
                        <Text style={styles.featureText}>Instant payment confirmation</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => setShowRazorpayModal(true)}
                      style={styles.razorpayButton}
                    >
                      <LinearGradient
                        colors={["#F3B62B", "#F5D76E"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.button}
                      >
                        <Text style={styles.buttonText}>
                          Proceed Transaction
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    <Text style={styles.secureText}>
                      <Lock size={12} color="#666666" /> Secure payment processing
                    </Text>

                    <View style={styles.razorpayBadgeContainer}>
                      <Image
                        source={{ uri: "https://badges.razorpay.com/badge-light.png" }}
                        resizeMode="contain"
                        style={styles.razorpayBadge}
                      />
                    </View>
                  </View>
                )}
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Razorpay Modal - Only for Android */}
      {isAndroid && (
        <Modal
          visible={showRazorpayModal}
          animationType="slide"
          presentationStyle="fullScreen"
        >
          <RazorpayWebView
            amount={typeof planPrice === 'string' ? planPrice : Array.isArray(planPrice) ? planPrice[0] : ''}
            planId={typeof planIdStr === 'string' ? planIdStr : Array.isArray(planIdStr) ? planIdStr[0] : ''}
            planTitle={typeof planTitle === 'string' ? planTitle : Array.isArray(planTitle) ? planTitle[0] : ''}
            planPeriod={typeof planPeriod === 'string' ? planPeriod : Array.isArray(planPeriod) ? planPeriod[0] : ''}
            brandName={typeof brandName === 'string' ? brandName : Array.isArray(brandName) ? brandName[0] : ''}
            onClose={() => setShowRazorpayModal(false)}
          />
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#ffffff",
  },
  backButton: {
    position: "absolute",
    top: 16,
    left: 16,
    zIndex: 10,
    padding: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333333",
    marginTop: 60,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666666",
    marginBottom: 24,
  },
  planSummary: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  planSummaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 12,
  },
  planDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  planName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333333",
  },
  planPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#F3B62B",
  },
  planPeriod: {
    fontSize: 14,
    color: "#666666",
  },
  paymentMethodContainer: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  paymentMethodTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    backgroundColor: "#f9f9f9",
  },
  paymentMethodTabActive: {
    backgroundColor: "#ffffff",
    borderBottomWidth: 2,
    borderBottomColor: "#F3B62B",
  },
  paymentMethodIcon: {
    marginRight: 8,
  },
  paymentMethodText: {
    fontSize: 16,
    color: "#9e9e9e",
  },
  paymentMethodTextActive: {
    color: "#333333",
    fontWeight: "600",
  },
  errorText: {
    color: "#ff3b30",
    marginBottom: 16,
    fontSize: 14,
    textAlign: "center",
  },
  cardContainer: {
    height: 200,
    marginBottom: 24,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  cardBackground: {
    flex: 1,
    padding: 24,
    justifyContent: "space-between",
  },
  cardChip: {
    width: 40,
    height: 30,
    backgroundColor: "#FFD700",
    borderRadius: 6,
    marginBottom: 20,
  },
  cardNumberPreview: {
    fontSize: 25,
    color: "#ffffff",
    letterSpacing: 2,
    marginBottom: 20,
  },
  cardDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardDetailLabel: {
    fontSize: 10,
    color: "#B0BEC5",
    marginBottom: 4,
  },
  cardDetailValue: {
    fontSize: 16,
    color: "#ffffff",
  },
  formContainer: {
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: "#f9f9f9",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 56,
    color: "#333333",
  },
  rowInputs: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfInput: {
    flex: 0.48,
  },
  buttonContainer: {
    borderRadius: 12,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#F3B62B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  button: {
    height: 56,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  secureText: {
    fontSize: 12,
    marginTop: 12,
    color: "#666666",
    textAlign: "center",
    margin: "auto",
  },
  successContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333333",
    marginTop: 24,
    marginBottom: 16,
  },
  successMessage: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    lineHeight: 24,
  },
  // UPI Payment Styles
  upiContainer: {
    marginBottom: 24,
  },
  upiQrContainer: {
    backgroundColor: "#f9f9f9",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  upiQrIcon: {
    marginBottom: 8,
  },
  upiQrText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 16,
  },
  qrCodeBox: {
    width: 200,
    height: 200,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    overflow: "hidden",
  },
  qrCodeImage: {
    width: 180,
    height: 180,
  },
  upiDetailsContainer: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  upiDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  upiDetailLabel: {
    fontSize: 14,
    color: "#666666",
    fontWeight: "500",
  },
  upiDetailValue: {
    fontSize: 14,
    color: "#333333",
    fontWeight: "600",
  },
  upiIdContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  copyButton: {
    padding: 4,
    marginLeft: 8,
  },
  copiedBadge: {
    position: "absolute",
    bottom: 8,
    backgroundColor: "rgba(67, 160, 71, 0.9)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  copiedText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  upiVerificationContainer: {
    backgroundColor: "#FFF8E1",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#F5D76E",
  },
  upiVerificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 8,
  },
  upiVerificationSubtitle: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 16,
  },
  razorpayContainer: {
    marginBottom: 24,
  },
  razorpayInfo: {
    alignItems: "center",
    marginBottom: 24,
  },
  razorpayIcon: {
    marginBottom: 12,
  },
  razorpayTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 8,
  },
  razorpaySubtitle: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
    lineHeight: 20,
  },
  razorpayFeatures: {
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  featureText: {
    fontSize: 14,
    color: "#333333",
    marginLeft: 12,
  },
  razorpayButton: {
    borderRadius: 12,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#F3B62B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  razorpayBadgeContainer: {
    marginTop: 12,
    alignItems: "center",
  },
  razorpayBadge: {
    height: 50,
    width: 200,
  },
  // iOS Specific Styles
  iosInfo: {
    alignItems: "center",
    marginBottom: 24,
  },
  iosIcon: {
    marginBottom: 12,
  },
  iosTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 8,
  },
  iosSubtitle: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
    lineHeight: 20,
  },
  iosProductDetails: {
    alignItems: "center",
    marginBottom: 16,
    padding: 16,
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  iosProductTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 4,
  },
  iosProductPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#F3B62B",
    marginBottom: 4,
  },
  iosProductPeriod: {
    fontSize: 14,
    color: "#666666",
  },
  iosFeatures: {
    marginBottom: 16,
  },
  iosButton: {
    borderRadius: 12,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
});