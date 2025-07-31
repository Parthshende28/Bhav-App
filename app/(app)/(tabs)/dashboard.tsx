import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  Platform,
  FlatList,
  Share,
  Modal,
  Image,
  Linking
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore, BuyRequest } from "@/store/auth-store";
import { useRouter, useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";
import {
  BarChart2,
  Package,
  Settings,
  User,
  ChevronRight,
  ShoppingBag,
  Bell,
  Mail,
  Phone,
  MapPin,
  Clock,
  Check,
  X,
  Users,
  Tag,
  Copy,
  Share2,
  Award,
  Gift,
  UserCheck,
  CheckCircle,
  LogOut,
  AlertTriangle,
  Trash2,
  Menu,
  ArrowUpRight,
  TrendingUp,
  UsersIcon,
  Info,
  ArrowUpCircle,
  IndianRupee,
  ThumbsUpIcon,
  ThumbsDownIcon
} from "lucide-react-native";
import { NotificationBell } from "@/components/NotificationBell";
import * as Clipboard from 'expo-clipboard';
import { images } from "@/constants/images";
import { FontAwesome } from "@expo/vector-icons";
import { notificationAPI } from '@/services/api';

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 40); // Adjust this value as needed for your layout

export default function SellerDashboardScreen() {
  const {
    user,
    getNotificationsForUser,
    markNotificationAsRead,
    getBuyRequestsForSeller,
    getInventoryItemsForSellerAPI,
    getUserById,
    acceptBuyRequest,
    declineBuyRequest,
    logout, notifications, unreadNotificationsCount, markAllNotificationsAsRead, users, getSellerCount, getCustomerCount, selectedSeller, setSelectedSeller
  } = useAuthStore();

  const isAdmin = user?.role === 'admin';
  const isCustomer = user?.role === 'customer';
  const isSeller = user?.role === 'seller';

  const router = useRouter();
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const [buyRequests, setBuyRequests] = useState<BuyRequest[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [inventoryCount, setInventoryCount] = useState(0);

  // States for async data fetching
  const [requestDetails, setRequestDetails] = useState<{ [key: string]: { product: any, customer: any } }>({});
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Load inventory count and other metrics
  useEffect(() => {
    const loadInventoryCount = async () => {
      if (user?.role === 'seller') {
        try {
          const result = await getInventoryItemsForSellerAPI(user.id);
          if (result.success && result.items) {
            setInventoryCount(result.items.length);
          }
        } catch (error) {
          console.error('Error loading inventory count:', error);
        }
      }
    };
    loadInventoryCount();
  }, [user]);

  // Add focus effect to refresh metrics when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const loadInventoryCount = async () => {
        if (user?.role === 'seller') {
          try {
            const result = await getInventoryItemsForSellerAPI(user.id);
            if (result.success && result.items) {
              setInventoryCount(result.items.length);
            }
          } catch (error) {
            console.error('Error loading inventory count:', error);
          }
        }
      };
      loadInventoryCount();
    }, [user])
  );

  // Get notifications for the current seller
  const sellerNotifications = user ? getNotificationsForUser(user.id).filter(n =>
    n.type === 'contact_request' ||
    n.type === 'rate_interest' ||
    n.type === 'buy_request' ||
    n.type === 'sell_request' ||
    n.type === 'buy_request_accepted' ||
    n.type === 'buy_request_declined' ||
    n.type === 'sell_request_accepted' ||
    n.type === 'sell_request_declined' ||
    n.type === 'referral'
  ) : [];

  // Calculate sales count (accepted requests)
  const salesCount = buyRequests.filter(request => request.status === 'accepted').length;

  // Calculate total requests count
  const totalRequestsCount = buyRequests.length;

  // Fetch buy requests for the current seller
  useEffect(() => {
    const fetchRequests = async () => {
      if (user && user.role === 'seller') {
        try {
          const result = await useAuthStore.getState().getSellerRequestsAPI();

          if (result.success && result.requests) {

            // Convert backend format to frontend format and extract populated data
            const convertedRequests = result.requests.map((req: any) => {
              const converted = {
                id: req._id ? req._id.toString() : req.id,
                itemId: typeof req.itemId === 'object' ? (req.itemId._id ? req.itemId._id.toString() : req.itemId.id) : req.itemId,
                customerId: typeof req.customerId === 'object' ? (req.customerId._id ? req.customerId._id.toString() : req.customerId.id) : req.customerId,
                sellerId: typeof req.sellerId === 'object' ? (req.sellerId._id ? req.sellerId._id.toString() : req.sellerId.id) : req.sellerId,
                status: req.status,
                createdAt: req.createdAt ? new Date(req.createdAt).getTime() : Date.now(),
                updatedAt: req.updatedAt ? new Date(req.updatedAt).getTime() : Date.now(),
                requestType: req.requestType,
                capturedAmount: req.capturedAmount,
                capturedAt: req.capturedAt,
                quantity: req.quantity,
                message: req.message
              };

              // Extract populated data for immediate use
              if (req.customerId && typeof req.customerId === 'object') {
                const customerData = {
                  id: req.customerId._id ? req.customerId._id.toString() : req.customerId.id,
                  fullName: req.customerId.fullName,
                  name: req.customerId.fullName,
                  email: req.customerId.email,
                  phone: req.customerId.phone,
                  city: req.customerId.city,
                  state: req.customerId.state
                };

                // Cache customer data immediately
                setRequestDetails(prev => ({
                  ...prev,
                  [converted.id]: {
                    ...prev[converted.id],
                    customer: customerData
                  }
                }));
              }

              if (req.itemId && typeof req.itemId === 'object') {
                const productData = {
                  id: req.itemId._id ? req.itemId._id.toString() : req.itemId.id,
                  productName: req.itemId.productName,
                  productType: req.itemId.productType,
                  buyPremium: req.itemId.buyPremium,
                  sellPremium: req.itemId.sellPremium,
                  capturedAmount: req.capturedAmount,
                  capturedAt: req.capturedAt
                };

                // Cache product data immediately
                setRequestDetails(prev => ({
                  ...prev,
                  [converted.id]: {
                    ...prev[converted.id],
                    product: productData
                  }
                }));
              }

              return converted;
            });

            setBuyRequests(convertedRequests);
          } else {
            setBuyRequests([]);
          }
        } catch (error) {
          console.error('Error fetching requests:', error);
          setBuyRequests([]);
        }
      }
    };
    fetchRequests();
  }, [user]);

  // Reset selected seller for new users and validate selected seller
  useEffect(() => {
    if (!selectedSeller && user?.role === 'customer') {
      setSelectedSeller(null);
    }

    // If there's a selected seller, validate that it's still in the user's added sellers
    if (selectedSeller && user?.role === 'customer') {
      // This will be handled by the rates screen which fetches the sellers
      // The selectedSeller will be cleared automatically when it's removed
    }
  }, [user, selectedSeller]);

  // Add focus effect to refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Refresh any necessary data when the screen comes into focus
      // This ensures the dashboard shows the latest state after navigation
    }, [])
  );

  // Format timestamp to readable date/time
  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;

    // Less than a minute
    if (diff < 60000) {
      return "Just now";
    }

    // Less than an hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
    }

    // Less than a day
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
    }

    // Less than a week
    if (diff < 604800000) {
      const days = Math.floor(diff / 86400000);
      return `${days} ${days === 1 ? "day" : "days"} ago`;
    }

    // Format as date
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  // Handle notification press
  const handleNotificationPress = (id: string) => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
    markNotificationAsRead(id);
  };

  // Handle accept buy request
  const handleAcceptBuyRequest = async (requestId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setIsProcessing(true);

    try {
      const result = await useAuthStore.getState().acceptRequestAPI(requestId);

      if (result.success) {
        // Update local state
        setBuyRequests(prevRequests =>
          prevRequests.map(req =>
            req.id === requestId ? { ...req, status: 'accepted', updatedAt: Date.now() } : req
          )
        );

        // Show success message
        Alert.alert(
          "Request Accepted",
          "The request has been accepted. The user will be notified.",
          [{ text: "OK" }]
        );
      } else {
        console.error('Accept request failed:', result.error);
        Alert.alert("Error", result.error || "Failed to accept request");
      }
    } catch (error: any) {
      console.error("Error accepting request:", error);
      let errorMessage = "Failed to accept request. Please try again.";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle decline buy request
  const handleDeclineBuyRequest = async (requestId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setIsProcessing(true);

    try {
      const result = await useAuthStore.getState().declineRequestAPI(requestId);

      if (result.success) {
        // Update local state
        setBuyRequests(prevRequests =>
          prevRequests.map(req =>
            req.id === requestId ? { ...req, status: 'declined', updatedAt: Date.now() } : req
          )
        );

        // Show success message
        Alert.alert(
          "Request Declined",
          "The request has been declined. The user will be notified.",
          [{ text: "OK" }]
        );
      } else {
        console.error('Decline request failed:', result.error);
        Alert.alert("Error", result.error || "Failed to decline request");
      }
    } catch (error: any) {
      console.error("Error declining request:", error);
      let errorMessage = "Failed to decline request. Please try again.";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  // Get product and customer details for a buy request
  const getRequestDetails = async (request: BuyRequest) => {
    // Check if we already have cached details
    if (requestDetails[request.id]) {
      return requestDetails[request.id];
    }

    // If no cached details, return empty object (data should be populated when requests are fetched)
    return { product: null, customer: null };
  };





  // Handle copy referral code
  const handleCopyReferralCode = async () => {
    if (!user?.phone) return;

    try {
      await Clipboard.setStringAsync(user.phone);
      setCodeCopied(true);

      // Reset copied state after 3 seconds
      setTimeout(() => setCodeCopied(false), 3000);

      // Trigger haptic feedback on success
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error("Error copying phone number:", error);
      Alert.alert("Error", "Failed to copy phone number.");
    }
  };

  // Handle share referral code
  const handleShareReferralCode = async () => {
    if (!user?.phone || !user) return;

    try {
      const brandName = user.brandName || user.fullName || user.name;
      const message = `Add ${brandName} as your seller in Bhav app using my phone number: ${user.phone}`;

      await Share.share({
        message,
        title: "Bhav Seller Referral Code"
      });

      // Trigger haptic feedback on success
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error("Error sharing phone number:", error);
      Alert.alert("Error", "Failed to share phone number.");
    }
  };


  // admin
  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'user_signup':
        return <User size={20} color="#1976D2" />;
      case 'user_deletion':
        return <Trash2 size={20} color="#E53935" />;
      case 'transaction':
        return <IndianRupee size={20} color="#F3B62B" />;
      case 'system':
        return <Settings size={20} color="#43A047" />;
      case 'alert':
        return <AlertTriangle size={20} color="#E53935" />;
      case 'referral':
        return <Gift size={20} color="#F3B62B" />;
      case 'contact_request':
        return <User size={20} color="#1976D2" />;
      case 'role_change':
        return <UserCheck size={20} color="#5C6BC0" />;
      case 'payment_success':
        return <CheckCircle size={20} color="#43A047" />;
      default:
        return <Bell size={20} color="#333333" />;
    }
  };

  const [showNotifications, setShowNotifications] = useState(false);
  const adminNotifications = notifications;

  const sellerCount = getSellerCount();
  const customerCount = getCustomerCount();

  const openDrawer = () => {
    router.push("/drawer");
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Logout",
          onPress: () => {
            logout();
            router.push("/auth/login");
          },
          style: "destructive"
        }
      ]
    );
  };

  const toggleNotifications = () => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
    setShowNotifications(!showNotifications);
  };

  const handleMarkAllAsRead = () => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
    markAllNotificationsAsRead();
  };


  const handleSellerClick = () => {
    if (selectedSeller) {
      router.push(`/seller-profile/${selectedSeller.id}`);
    }
  };


  // handle contact
  const handlePhoneClick = () => {
    if (selectedSeller?.phone) {
      // Clean the phone number (remove spaces, dashes, etc.)
      const cleanNumber = selectedSeller.phone.replace(/[\s\-\(\)]/g, '');
      Linking.openURL(`tel:${cleanNumber}`);
    } else {
      Alert.alert("Phone Number Not Available", "The seller has not provided a phone number.");
    }
  };

  const handleLocationClick = () => {
    if (selectedSeller?.location) {
      // Check if location is a valid URL or address
      let locationUrl = selectedSeller.location;

      // If it's not a URL, try to open it in maps
      if (!locationUrl.startsWith('http://') && !locationUrl.startsWith('https://')) {
        // Encode the location for maps URL
        const encodedLocation = encodeURIComponent(locationUrl);
        locationUrl = `https://maps.google.com/maps?q=${encodedLocation}`;
      }

      Linking.openURL(locationUrl);
    } else {
      Alert.alert("Location Not Available", "The seller has not provided a location.");
    }
  };

  const handleWhatsAppClick = () => {
    if (selectedSeller?.whatsappNumber) {
      // Clean the phone number (remove spaces, dashes, etc.)
      const cleanNumber = selectedSeller.whatsappNumber.replace(/[\s\-\(\)]/g, '');

      // Add country code if not present (assuming India +91)
      let whatsappNumber = cleanNumber;
      if (!cleanNumber.startsWith('91') && !cleanNumber.startsWith('+91')) {
        whatsappNumber = `91${cleanNumber}`;
      }

      Linking.openURL(`https://wa.me/${whatsappNumber}`);
    } else {
      Alert.alert("WhatsApp Not Available", "The seller has not provided a WhatsApp number.");
    }
  };

  const handleInstagramClick = () => {
    if (selectedSeller?.instagramHandle) {
      let instagramUrl = selectedSeller.instagramHandle;

      // If it's not a full URL, construct the Instagram URL
      if (!instagramUrl.startsWith('http://') && !instagramUrl.startsWith('https://')) {
        // Remove @ if present
        const handle = instagramUrl.replace('@', '');
        instagramUrl = `https://www.instagram.com/${handle}`;
      }

      Linking.openURL(instagramUrl);
    } else {
      Alert.alert("Instagram Not Available", "The seller has not provided an Instagram profile.");
    }
  };

  // Render buy request with cached details instead of calling getRequestDetails directly
  const renderBuyRequest = (request: BuyRequest) => {
    const details = requestDetails[request.id];
    const isBuyRequest = request.requestType === 'buy';
    const isSellRequest = request.requestType === 'sell';

    // If we have cached details, use them
    if (details && details.product && details.customer) {
      const { product, customer } = details;

      return (
        <View key={request.id} style={styles.buyRequestCard}>
          <View style={styles.buyRequestHeader}>
            <View style={styles.buyRequestIconContainer}>
              {isBuyRequest ? (
                <ShoppingBag size={20} color="#4CAF50" />
              ) : (
                <Package size={20} color="#F44336" />
              )}
            </View>
            <View style={styles.buyRequestTitleContainer}>
              <Text style={styles.buyRequestTitle}>
                {`${isBuyRequest ? 'Buy' : 'Sell'} Request: ${product.productName}`}
              </Text>
              <Text style={styles.buyRequestTime}>{formatTimestamp(request.createdAt)}</Text>
            </View>
          </View>

          <View style={styles.buyRequestDetailsContainer}>
            <View style={styles.buyRequestDetailRow}>
              <Package size={16} color="#666666" style={styles.buyRequestDetailIcon} />
              <Text style={styles.buyRequestDetailLabel}>Product:</Text>
              <Text style={styles.buyRequestDetailValue}>{product.productName}</Text>
            </View>

            {isBuyRequest && product.capturedAmount && (
              <>
                <View style={styles.buyRequestDetailRow}>
                  <IndianRupee size={16} color="#666666" style={styles.buyRequestDetailIcon} />
                  <Text style={styles.buyRequestDetailLabel}>Buy Premium:</Text>
                  <Text style={styles.buyRequestDetailValue}>₹{product.buyPremium}</Text>
                </View>
                <View style={styles.buyRequestDetailRow}>
                  <IndianRupee size={16} color="#666666" style={styles.buyRequestDetailIcon} />
                  <Text style={styles.buyRequestDetailLabel}>Total Cost:</Text>
                  <Text style={styles.buyRequestDetailValue}>₹{product.capturedAmount.toLocaleString()}</Text>
                </View>
              </>
            )}

            {isSellRequest && product.capturedAmount && (
              <>
                <View style={styles.buyRequestDetailRow}>
                  <IndianRupee size={16} color="#666666" style={styles.buyRequestDetailIcon} />
                  <Text style={styles.buyRequestDetailLabel}>Sell Premium:</Text>
                  <Text style={styles.buyRequestDetailValue}>₹{product.sellPremium}</Text>
                </View>
                <View style={styles.buyRequestDetailRow}>
                  <IndianRupee size={16} color="#666666" style={styles.buyRequestDetailIcon} />
                  <Text style={styles.buyRequestDetailLabel}>Total Amount:</Text>
                  <Text style={styles.buyRequestDetailValue}>₹{product.capturedAmount.toLocaleString()}</Text>
                </View>
              </>
            )}
          </View>

          <View style={styles.customerDetailsContainer}>
            <Text style={styles.customerDetailsTitle}>User Details:</Text>

            <View style={styles.customerDetailRow}>
              <User size={16} color="#666666" style={styles.customerDetailIcon} />
              <Text style={styles.customerDetailText}>{customer.fullName || customer.name}</Text>
            </View>

            <View style={styles.customerDetailRow}>
              <Mail size={16} color="#666666" style={styles.customerDetailIcon} />
              <Text style={styles.customerDetailText}>{customer.email}</Text>
            </View>

            {customer.phone && (
              <View style={styles.customerDetailRow}>
                <Phone size={16} color="#666666" style={styles.customerDetailIcon} />
                <Text style={styles.customerDetailText}>{customer.phone}</Text>
              </View>
            )}

            {customer.city && (
              <View style={styles.customerDetailRow}>
                <MapPin size={16} color="#666666" style={styles.customerDetailIcon} />
                <Text style={styles.customerDetailText}>
                  {customer.city}
                  {customer.state ? `, ${customer.state}` : ""}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.buyRequestActions}>
            <TouchableOpacity
              style={[
                styles.buyRequestActionButton,
                request.status === 'accepted' ? styles.acceptedButton : styles.acceptButton,
                request.status === 'declined' && styles.dimmedButton
              ]}
              onPress={() => handleAcceptBuyRequest(request.id)}
              disabled={isProcessing || request.status !== 'pending'}
            >
              <Check size={16} color="#ffffff" />
              <Text style={styles.buyRequestActionText}>
                {request.status === 'accepted' ? 'Accepted' : 'Accept'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.buyRequestActionButton,
                request.status === 'declined' ? styles.declinedButton : styles.declineButton,
                request.status === 'accepted' && styles.dimmedButton
              ]}
              onPress={() => handleDeclineBuyRequest(request.id)}
              disabled={isProcessing || request.status !== 'pending'}
            >
              <X size={16} color="#ffffff" />
              <Text style={styles.buyRequestActionText}>
                {request.status === 'declined' ? 'Declined' : 'Decline'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // If details are not available yet, show a loading state with basic request info
    return (
      <View key={request.id} style={styles.buyRequestCard}>
        <View style={styles.buyRequestHeader}>
          <View style={styles.buyRequestIconContainer}>
            {isBuyRequest ? (
              <ShoppingBag size={20} color="#4CAF50" />
            ) : (
              <Package size={20} color="#F44336" />
            )}
          </View>
          <View style={styles.buyRequestTitleContainer}>
            <Text style={styles.buyRequestTitle}>
              {`${isBuyRequest ? 'Buy' : 'Sell'} Request`}
            </Text>
            <Text style={styles.buyRequestTime}>{formatTimestamp(request.createdAt)}</Text>
          </View>
        </View>

        <View style={styles.buyRequestDetailsContainer}>
          <View style={styles.buyRequestDetailRow}>
            <Package size={16} color="#666666" style={styles.buyRequestDetailIcon} />
            <Text style={styles.buyRequestDetailLabel}>Request ID:</Text>
            <Text style={styles.buyRequestDetailValue}>{request.id}</Text>
          </View>

          <View style={styles.buyRequestDetailRow}>
            <Clock size={16} color="#666666" style={styles.buyRequestDetailIcon} />
            <Text style={styles.buyRequestDetailLabel}>Status:</Text>
            <Text style={styles.buyRequestDetailValue}>
              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.customerDetailsContainer}>
          <Text style={styles.customerDetailsTitle}>Loading user details...</Text>
        </View>

        <View style={styles.buyRequestActions}>
          <TouchableOpacity
            style={[
              styles.buyRequestActionButton,
              request.status === 'accepted' ? styles.acceptedButton : styles.acceptButton,
              request.status === 'declined' && styles.dimmedButton
            ]}
            onPress={() => handleAcceptBuyRequest(request.id)}
            disabled={isProcessing || request.status !== 'pending'}
          >
            <Check size={16} color="#ffffff" />
            <Text style={styles.buyRequestActionText}>
              {request.status === 'accepted' ? 'Accepted' : 'Accept'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.buyRequestActionButton,
              request.status === 'declined' ? styles.declinedButton : styles.declineButton,
              request.status === 'accepted' && styles.dimmedButton
            ]}
            onPress={() => handleDeclineBuyRequest(request.id)}
            disabled={isProcessing || request.status !== 'pending'}
          >
            <X size={16} color="#ffffff" />
            <Text style={styles.buyRequestActionText}>
              {request.status === 'declined' ? 'Declined' : 'Decline'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };


  return (
    <>
      {isAdmin && (
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          <StatusBar style="dark" />
          <View style={styles.header}>
            <TouchableOpacity
              onPress={openDrawer}
              style={styles.menuButton}
            >
              <Menu size={24} color="#333333" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Admin Dashboard</Text>
            </View>
            <NotificationBell />
          </View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeText}>Welcome Admin,</Text>
              <Text style={styles.adminName}>{user?.fullName || user?.name}</Text>
            </View>

            {/* Stats Cards */}
            <View style={styles.statsContainer}>
              <LinearGradient
                colors={["#1976D2", "#64B5F6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.singleStatCard}
              >
                <View style={styles.statIconContainerAdmin}>
                  <UsersIcon size={24} color="#ffffff" />
                </View>
                <Text style={styles.statValueAdmin}>{users.length}</Text>
                <Text style={styles.statLabelAdmin}>Total Users</Text>
                <View style={styles.statTrend}>
                  <ArrowUpRight size={16} color="#ffffff" />
                  <Text style={styles.statTrendText}>+12%</Text>
                </View>
              </LinearGradient>
            </View>

            {/* Seller and Customer Stats */}
            <View style={styles.statsContainer}>
              <LinearGradient
                colors={["#F3B62B", "#F5D76E"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.singleStatCard}
              >
                <View style={styles.statIconContainerAdmin}>
                  <ShoppingBag size={24} color="#ffffff" />
                </View>
                <Text style={styles.statValueAdmin}>{sellerCount}</Text>
                <Text style={styles.statLabelAdmin}>Total Sellers</Text>
                <View style={styles.statTrend}>
                  <ArrowUpRight size={16} color="#ffffff" />
                  <Text style={styles.statTrendText}>+8%</Text>
                </View>
              </LinearGradient>
            </View>

            <View style={styles.statsContainer}>
              <LinearGradient
                colors={["#002810", "#43A047"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.singleStatCard}
              >
                <View style={styles.statIconContainerAdmin}>
                  <User size={24} color="#ffffff" />
                </View>
                <Text style={styles.statValueAdmin}>{customerCount}</Text>
                <Text style={styles.statLabelAdmin}>Total Customers</Text>
                <View style={styles.statTrend}>
                  <ArrowUpRight size={16} color="#ffffff" />
                  <Text style={styles.statTrendText}>+15%</Text>
                </View>
              </LinearGradient>
            </View>

            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitleAdmin}>Quick Actions</Text>
              <View style={styles.quickActionsContainer}>
                <TouchableOpacity
                  style={styles.quickActionButton}
                  onPress={() => router.push("/(admin)/users")}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: "#E3F2FD" }]}>
                    <UsersIcon size={24} color="#1976D2" />
                  </View>
                  <Text style={styles.quickActionText}>Manage Users</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickActionButton}
                  onPress={() => router.push("/(admin)/analytics")}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: "#FFF8E1" }]}>
                    <BarChart2 size={24} color="#F3B62B" />
                  </View>
                  <Text style={styles.quickActionText}>View Analytics</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickActionButton}
                  onPress={() => router.push("/(app)/live-rates")}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: "#E8F5E9" }]}>
                    <TrendingUp size={24} color="#43A047" />
                  </View>
                  <Text style={styles.quickActionText}>Live Rates</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickActionButton}
                  onPress={() => router.push("/(app)/share")}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: "#FFF3E0" }]}>
                    <Gift size={24} color="#FF9800" />
                  </View>
                  <Text style={styles.quickActionText}>Referral Program</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitleAdmin}>Recent Activities</Text>
              <View style={styles.activitiesContainer}>
                {/* Recent Activities from Notifications */}
                {adminNotifications.slice(0, 5).map((notification, index) => (
                  <View style={styles.activityItem} key={notification.id || `activity-${index}`}>
                    <View style={[styles.activityIcon, {
                      backgroundColor: notification.type === 'user_signup' ? "#E3F2FD" :
                        notification.type === 'transaction' ? "#FFF8E1" :
                          notification.type === 'system' ? "#E8F5E9" :
                            notification.type === 'alert' ? "#FFEBEE" :
                              notification.type === 'contact_request' ? "#E8F5E9" :
                                notification.type === 'role_change' ? "#E8F5E9" :
                                  notification.type === 'payment_success' ? "#E8F5E9" :
                                    notification.type === 'referral' ? "#FFF8E1" :
                                      "#f5f5f5"
                    }]}>
                      {getNotificationIcon(notification.type)}
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>{notification.title}</Text>
                      <Text style={styles.activityDescription}>{notification.message}</Text>
                      <View style={styles.activityMeta}>
                        <Clock size={14} color="#9e9e9e" />
                        <Text style={styles.activityTime}>{formatTimestamp(notification.timestamp)}</Text>
                      </View>
                    </View>
                  </View>
                ))}

                {adminNotifications.length === 0 && (
                  <View style={styles.emptyActivities}>
                    <Text style={styles.emptyActivitiesText}>No recent activities</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Logout Button */}
            <View style={styles.logoutContainer}>
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
              >
                <LogOut size={20} color="#ffffff" />
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Notifications Modal */}
          <Modal
            visible={showNotifications}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowNotifications(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.notificationContainer}>
                <View style={styles.notificationHeader}>
                  <Text style={styles.notificationHeaderTitle}>Notifications</Text>
                  <TouchableOpacity
                    onPress={() => setShowNotifications(false)}
                    style={styles.closeButton}
                  >
                    <X size={24} color="#333333" />
                  </TouchableOpacity>
                </View>

                {adminNotifications.length > 0 ? (
                  <>
                    <View style={styles.notificationActions}>
                      <TouchableOpacity
                        style={styles.markAllReadButton}
                        onPress={handleMarkAllAsRead}
                      >
                        <Check size={16} color="#1976D2" />
                        <Text style={styles.markAllReadText}>Mark all as read</Text>
                      </TouchableOpacity>
                    </View>

                    <FlatList
                      data={adminNotifications}
                      keyExtractor={(item) => item.id}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={[
                            styles.notificationItem,
                            !item.read && styles.notificationItemUnread
                          ]}
                          onPress={() => handleNotificationPress(item.id)}
                        >
                          {item.type === 'contact_request' ? (
                            <View style={styles.contactRequestNotification}>
                              <View style={styles.contactRequestHeader}>
                                <User size={24} color="#1976D2" style={styles.contactRequestIcon} />
                                <View style={styles.contactRequestTitleContainer}>
                                  <Text style={styles.contactRequestTitle}>{item.title}</Text>
                                  <Text style={styles.contactRequestTime}>{formatTimestamp(item.timestamp)}</Text>
                                </View>
                                {!item.read && <View style={styles.unreadIndicator} />}
                              </View>

                              <Text style={styles.contactRequestMessage}>{item.message}</Text>

                              {item.data?.customer && item.data?.dealer && (
                                <View style={styles.contactDetailsContainer}>
                                  <View style={styles.contactDetailSection}>
                                    <Text style={styles.contactDetailSectionTitle}>Customer:</Text>
                                    <View style={styles.contactDetailRow}>
                                      <User size={16} color="#666666" style={styles.contactDetailIcon} />
                                      <Text style={styles.contactDetailText}>{item.data.customer.name}</Text>
                                    </View>
                                    <View style={styles.contactDetailRow}>
                                      <Mail size={16} color="#666666" style={styles.contactDetailIcon} />
                                      <Text style={styles.contactDetailText}>{item.data.customer.email}</Text>
                                    </View>
                                    {item.data.customer.phone && (
                                      <View style={styles.contactDetailRow}>
                                        <Phone size={16} color="#666666" style={styles.contactDetailIcon} />
                                        <Text style={styles.contactDetailText}>{item.data.customer.phone}</Text>
                                      </View>
                                    )}
                                  </View>

                                  <View style={styles.contactDetailDivider} />

                                  <View style={styles.contactDetailSection}>
                                    <Text style={styles.contactDetailSectionTitle}>Dealer:</Text>
                                    <View style={styles.contactDetailRow}>
                                      <User size={16} color="#666666" style={styles.contactDetailIcon} />
                                      <Text style={styles.contactDetailText}>{item.data.dealer.name}</Text>
                                    </View>
                                    <View style={styles.contactDetailRow}>
                                      <Mail size={16} color="#666666" style={styles.contactDetailIcon} />
                                      <Text style={styles.contactDetailText}>{item.data.dealer.email}</Text>
                                    </View>
                                    {item.data.dealer.phone && (
                                      <View style={styles.contactDetailRow}>
                                        <Phone size={16} color="#666666" style={styles.contactDetailIcon} />
                                        <Text style={styles.contactDetailText}>{item.data.dealer.phone}</Text>
                                      </View>
                                    )}
                                    {item.data.dealer.brandName && (
                                      <View style={styles.contactDetailRow}>
                                        <Award size={16} color="#F3B62B" style={styles.contactDetailIcon} />
                                        <Text style={styles.contactDetailText}>{item.data.dealer.brandName}</Text>
                                      </View>
                                    )}
                                  </View>
                                </View>
                              )}
                            </View>
                          ) : item.type === 'role_change' ? (
                            <View style={styles.roleChangeNotification}>
                              <View style={styles.notificationIconContainer}>
                                <UserCheck size={20} color="#5C6BC0" />
                              </View>
                              <View style={styles.notificationContent}>
                                <Text style={styles.notificationTitle}>{item.title}</Text>
                                <Text style={styles.notificationMessage}>{item.message}</Text>

                                {item.data?.user && (
                                  <View style={styles.userDetailsContainer}>
                                    <View style={styles.userDetailRow}>
                                      <User size={14} color="#666666" style={styles.userDetailIcon} />
                                      <Text style={styles.userDetailText}>{item.data.user.name}</Text>
                                    </View>
                                    <View style={styles.userDetailRow}>
                                      <Mail size={14} color="#666666" style={styles.userDetailIcon} />
                                      <Text style={styles.userDetailText}>{item.data.user.email}</Text>
                                    </View>
                                    {item.data.user.phone && (
                                      <View style={styles.userDetailRow}>
                                        <Phone size={14} color="#666666" style={styles.userDetailIcon} />
                                        <Text style={styles.userDetailText}>{item.data.user.phone}</Text>
                                      </View>
                                    )}
                                    {item.data.user.city && (
                                      <View style={styles.userDetailRow}>
                                        <MapPin size={14} color="#666666" style={styles.userDetailIcon} />
                                        <Text style={styles.userDetailText}>
                                          {item.data.user.city}
                                          {item.data.user.state ? `, ${item.data.user.state}` : ""}
                                        </Text>
                                      </View>
                                    )}
                                    {item.data.user.brandName && (
                                      <View style={styles.userDetailRow}>
                                        <ShoppingBag size={14} color="#F3B62B" style={styles.userDetailIcon} />
                                        <Text style={styles.userDetailText}>{item.data.user.brandName}</Text>
                                      </View>
                                    )}
                                  </View>
                                )}

                                <Text style={styles.notificationTime}>
                                  {formatTimestamp(item.timestamp)}
                                </Text>
                              </View>
                              {!item.read && <View style={styles.unreadIndicator} />}
                            </View>
                          ) : item.type === 'payment_success' ? (
                            <View style={styles.paymentSuccessNotification}>
                              <View style={styles.notificationIconContainer}>
                                <CheckCircle size={20} color="#43A047" />
                              </View>
                              <View style={styles.notificationContent}>
                                <Text style={styles.notificationTitle}>{item.title}</Text>
                                <Text style={styles.notificationMessage}>{item.message}</Text>

                                {item.data?.user && (
                                  <View style={styles.userDetailsContainer}>
                                    <View style={styles.userDetailRow}>
                                      <User size={14} color="#666666" style={styles.userDetailIcon} />
                                      <Text style={styles.userDetailText}>{item.data.user.name}</Text>
                                    </View>
                                    <View style={styles.userDetailRow}>
                                      <Mail size={14} color="#666666" style={styles.userDetailIcon} />
                                      <Text style={styles.userDetailText}>{item.data.user.email}</Text>
                                    </View>
                                    {item.data.user.phone && (
                                      <View style={styles.userDetailRow}>
                                        <Phone size={14} color="#666666" style={styles.userDetailIcon} />
                                        <Text style={styles.userDetailText}>{item.data.user.phone}</Text>
                                      </View>
                                    )}
                                    {item.data.plan && (
                                      <View style={styles.userDetailRow}>
                                        <IndianRupee size={14} color="#F3B62B" style={styles.userDetailIcon} />
                                        <Text style={styles.userDetailText}>
                                          {item.data.plan.title} Plan - {item.data.plan.price}
                                        </Text>
                                      </View>
                                    )}
                                  </View>
                                )}

                                <Text style={styles.notificationTime}>
                                  {formatTimestamp(item.timestamp)}
                                </Text>
                              </View>
                              {!item.read && <View style={styles.unreadIndicator} />}
                            </View>
                          ) : (
                            <>
                              <View style={styles.notificationIconContainer}>
                                {getNotificationIcon(item.type)}
                              </View>
                              <View style={styles.notificationContent}>
                                <Text style={styles.notificationTitle}>{item.title}</Text>
                                <Text style={styles.notificationMessage}>{item.message}</Text>

                                {/* Show user details for user_signup notifications */}
                                {item.type === 'user_signup' && item.data?.user && (
                                  <View style={styles.userDetailsContainer}>
                                    <View style={styles.userDetailRow}>
                                      <Mail size={14} color="#666666" style={styles.userDetailIcon} />
                                      <Text style={styles.userDetailText}>{item.data.user.email}</Text>
                                    </View>
                                    {item.data.user.phone && (
                                      <View style={styles.userDetailRow}>
                                        <Phone size={14} color="#666666" style={styles.userDetailIcon} />
                                        <Text style={styles.userDetailText}>{item.data.user.phone}</Text>
                                      </View>
                                    )}
                                    {item.data.user.city && item.data.user.state && (
                                      <View style={styles.userDetailRow}>
                                        <MapPin size={14} color="#666666" style={styles.userDetailIcon} />
                                        <Text style={styles.userDetailText}>{item.data.user.city}, {item.data.user.state}</Text>
                                      </View>
                                    )}
                                    {item.data.user.role && (
                                      <View style={styles.userDetailRow}>
                                        <UserCheck size={14} color="#5C6BC0" style={styles.userDetailIcon} />
                                        <Text style={styles.userDetailText}>
                                          Role: {item.data.user.role.charAt(0).toUpperCase() + item.data.user.role.slice(1)}
                                        </Text>
                                      </View>
                                    )}
                                  </View>
                                )}

                                {/* Show referral details for referral notifications */}
                                {item.type === 'referral' && item.data && (
                                  <View style={styles.referralDetailsContainer}>
                                    <View style={styles.referralDetailRow}>
                                      <User size={14} color="#666666" style={styles.referralDetailIcon} />
                                      <Text style={styles.referralDetailText}>
                                        {item.data.user.name} ({item.data.user.email})
                                      </Text>
                                    </View>
                                    <View style={styles.referralDetailRow}>
                                      <Gift size={14} color="#F3B62B" style={styles.referralDetailIcon} />
                                      <Text style={styles.referralDetailText}>
                                        Code: <Text style={styles.referralCode}>{item.data.referralCode}</Text>
                                      </Text>
                                    </View>
                                    <View style={styles.referralDetailRow}>
                                      <Award size={14} color="#F3B62B" style={styles.referralDetailIcon} />
                                      <Text style={styles.referralDetailText}>
                                        Premium access granted
                                      </Text>
                                    </View>
                                  </View>
                                )}

                                <Text style={styles.notificationTime}>
                                  {formatTimestamp(item.timestamp)}
                                </Text>
                              </View>
                              {!item.read && <View style={styles.unreadIndicator} />}
                            </>
                          )}
                        </TouchableOpacity>
                      )}
                      showsVerticalScrollIndicator={false}
                      contentContainerStyle={styles.notificationsList}
                    />
                  </>
                ) : (
                  <View style={styles.emptyNotifications}>
                    <Bell size={48} color="#e0e0e0" />
                    <Text style={styles.emptyNotificationsText}>No notifications yet</Text>
                  </View>
                )}
              </View>
            </View>
          </Modal>
        </SafeAreaView>
      )}







      {/* Seller Dashboard */}
      {isSeller && (
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          <StatusBar style="dark" />

          <View style={styles.header}>
            <TouchableOpacity
              onPress={openDrawer}
              style={styles.menuButton}
            >
              <Menu size={24} color="#333333" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Seller Dashboard</Text>
            </View>
            <NotificationBell />
          </View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeText}>Welcome,</Text>
              <Text style={styles.sellerName}>{user?.fullName || user?.name}</Text>
            </View>

            {/* Referral Code Section */}
            <View style={styles.referralCodeContainer}>
              <View style={styles.referralCodeHeader}>
                <Text style={styles.referralCodeTitle}>Your Referral Code</Text>
                <TouchableOpacity
                  style={styles.shareButton}
                  onPress={handleShareReferralCode}
                  disabled={!user?.phone}
                >
                  <Share2 size={18} color="#1976D2" />
                </TouchableOpacity>
              </View>

              <View style={styles.referralCodeContent}>
                {user?.phone ? (
                  <>
                    <Text style={styles.referralCode}>{user.phone}</Text>
                    <TouchableOpacity
                      style={styles.copyButton}
                      onPress={handleCopyReferralCode}
                    >
                      {codeCopied ? (
                        <Check size={20} color="#4CAF50" />
                      ) : (
                        <Copy size={20} color="#1976D2" />
                      )}
                    </TouchableOpacity>
                  </>
                ) : (
                  <Text style={styles.noPhoneText}>No phone number available</Text>
                )}
              </View>

              <Text style={styles.referralCodeInfo}>
                Share your phone number with your users so they can add you as their seller.
              </Text>
            </View>

            {/* Quick Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <View style={[styles.statIconContainer, { backgroundColor: "#E3F2FD" }]}>
                  <Package size={24} color="#1976D2" />
                </View>
                <Text style={styles.statValue}>{inventoryCount}</Text>
                <Text style={styles.statLabel}>Products</Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIconContainer, { backgroundColor: "#FFF8E1" }]}>
                  <IndianRupee size={24} color="#F3B26B" />
                </View>
                <Text style={styles.statValue}>{salesCount}</Text>
                <Text style={styles.statLabel}>Sales</Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIconContainer, { backgroundColor: "#E8F5E9" }]}>
                  <BarChart2 size={24} color="#43A047" />
                </View>
                <Text style={styles.statValue}>{totalRequestsCount}</Text>
                <Text style={styles.statLabel}>Total Requests</Text>
              </View>
            </View>

            {/* Buy Requests Section - updated to use cached details */}
            <View style={styles.buyRequestsContainer}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>Buy & Sell Requests</Text>
                {buyRequests.filter(req => req.status === 'pending').length > 2 && (
                  <TouchableOpacity
                    onPress={() => setShowAllNotifications(!showAllNotifications)}
                    style={styles.viewAllButton}
                  >
                    <Text style={styles.viewAllButtonText}>
                      {showAllNotifications ? "Show Less" : "View All"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {buyRequests.filter(req => req.status === 'pending').length > 0 ? (
                /* Use the renderBuyRequest function for each request */
                (showAllNotifications
                  ? buyRequests.filter(req => req.status === 'pending')
                  : buyRequests.filter(req => req.status === 'pending').slice(0, 2)
                ).map(request => renderBuyRequest(request))
              ) : (
                <View style={styles.buyRequestCard}>
                  <View style={styles.buyRequestHeader}>
                    <View style={styles.buyRequestIconContainer}>
                      <Info size={25} color="#666666" />
                    </View>
                    <View style={styles.buyRequestTitleContainer}>
                      <Text style={styles.buyRequestTitle}>No Pending Requests</Text>
                      <Text style={styles.buyRequestTime}>All caught up!</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>


            {/* Information Card */}
            <View style={styles.infoCardContainer}>
              <LinearGradient
                colors={["#E3F2FD", "#BBDEFB"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.infoCard}
              >
                <View style={styles.infoCardHeader}>
                  <Bell size={24} color="#1976D2" />
                  <Text style={styles.infoCardTitle}>User Inquiries</Text>
                </View>
                <Text style={styles.infoCardContent}>
                  When users contact you or send buy/sell requests, their details will appear in the sections above. You can reach out to them directly using their contact information or accept/decline their requests.
                </Text>
              </LinearGradient>
            </View>
          </ScrollView>
        </SafeAreaView>
      )}






      {isCustomer && (
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          <StatusBar style="dark" />

          <View style={styles.header}>
            <TouchableOpacity
              onPress={openDrawer}
              style={styles.menuButton}
            >
              <Menu size={24} color="#333333" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>User Dashboard</Text>
            </View>
            <NotificationBell />
          </View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}>


            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeText}>Welcome,</Text>
              <Text style={styles.sellerName}>{user?.fullName || user?.name}</Text>
            </View>

            {/* Brand/logo section */}
            {(isCustomer) ? (
              <TouchableOpacity style={styles.headerCustomer} onPress={handleSellerClick}>

                {selectedSeller?.brandImage ? (
                  <Image source={{ uri: selectedSeller.brandImage }} style={styles.brandCoverImage} />
                ) : selectedSeller?.brandName ? (
                  <Text style={styles.brandName}>{selectedSeller.brandName}</Text>
                ) : (
                  <Image source={images.bhavLogo} style={styles.logo} />
                )}
              </TouchableOpacity>
            ) : (
              <Image source={images.bhavLogo} style={styles.logo} />
            )}


            {selectedSeller ? (
              <>
                <View style={styles.sellerContainer}>
                  <View style={styles.sellerHeader}>
                    <Text style={styles.sellerInfo}>Store</Text>
                    <Text style={styles.sellerDetails}>{selectedSeller.brandName}</Text>
                  </View>

                  <View style={styles.sellerHeader}>
                    <Text style={styles.sellerInfo}>Owner</Text>
                    <Text style={styles.sellerDetails}>{selectedSeller.fullName}</Text>
                  </View>

                  <View style={styles.sellerHeader}>
                    <Text style={styles.sellerInfo}>About</Text>
                    <Text style={styles.sellerDetails}>{selectedSeller.about || "No information available"}</Text>
                  </View>

                  <View style={styles.sellerHeader}>
                    <Text style={styles.sellerInfo}>Catalogue</Text>
                    {selectedSeller.catalogueImages && selectedSeller.catalogueImages.length > 0 ? (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.catalogueContainer}>
                          {selectedSeller.catalogueImages.map((image, index) => (
                            <Image
                              key={index}
                              source={{ uri: image }}
                              style={styles.catalogueImage}
                            />
                          ))}
                        </View>
                      </ScrollView>
                    ) : (
                      <Text style={styles.sellerDetails}>No catalogue images available</Text>
                    )}
                  </View>

                  <View style={styles.sellerHeader}>
                    <Text style={styles.sellerInfo}>Contact</Text>
                    <View style={styles.sellerContactIcons}>
                      <TouchableOpacity onPress={handlePhoneClick}>
                        <FontAwesome
                          name="phone"
                          size={30}
                          color="#fff"
                          style={{
                            borderWidth: 2,
                            borderColor: "#1F7D53",
                            backgroundColor: "#1F7D53",
                            borderRadius: 100,
                            paddingVertical: 2,
                            paddingHorizontal: 5,
                          }}
                        />
                      </TouchableOpacity>

                      <TouchableOpacity onPress={handleLocationClick}>
                        <FontAwesome
                          name="map-marker"
                          size={30}
                          color="#fff"
                          style={{
                            borderWidth: 2,
                            borderColor: "#1976D2",
                            backgroundColor: "#1976D2",
                            borderRadius: 100,
                            paddingVertical: 2,
                            paddingHorizontal: 8,
                          }}
                        />
                      </TouchableOpacity>

                      <TouchableOpacity onPress={handleWhatsAppClick}>
                        <FontAwesome
                          name="whatsapp"
                          size={30}
                          color="#fff"
                          style={{
                            borderWidth: 2,
                            borderColor: "#25D366",
                            backgroundColor: "#25D366",
                            borderRadius: 100,
                            paddingVertical: 2,
                            paddingHorizontal: 4,
                          }}
                        />
                      </TouchableOpacity>

                      <TouchableOpacity onPress={handleInstagramClick}>
                        <FontAwesome
                          name="instagram"
                          size={30}
                          color="#fff"
                          style={{
                            borderWidth: 2,
                            borderColor: "#E4405F",
                            backgroundColor: "#E4405F",
                            borderRadius: 100,
                            paddingVertical: 2,
                            paddingHorizontal: 4,
                          }}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </>
            ) : (
              // informative content
              <>
                <View style={styles.infoCardContainerCustomer}>
                  <LinearGradient
                    colors={["#E3F2FD", "#BBDEFB"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.infoCard}
                  >
                    <View style={styles.infoCardHeader}>
                      <Info size={24} color="#1976D2" />
                      <Text style={styles.infoCardTitle}>User Dashboard</Text>
                    </View>
                    <Text style={styles.infoCardContent}>
                      At Bhav, as a user you can view your seller's details, contact them directly, and manage your buy requests.
                    </Text>
                  </LinearGradient>
                </View>
              </>
            )}




            <View style={styles.customerContainer}>
              <View style={{ width: "48%" }}>
                <TouchableOpacity onPress={() => router.push("../seller-data")}>
                  <LinearGradient
                    colors={["#FFF8E1", "#FFF3CD"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.cardGradient}
                  >
                    <Users size={50} color="#F3B62B" />
                    <Text style={styles.customerText}>Connect to a Seller</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <View style={{ width: "48%" }}>
                <TouchableOpacity onPress={() => router.push("/auth/subscription")}>
                  <LinearGradient
                    colors={["#FFF8E1", "#FFF3CD"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.cardGradient}
                  >
                    <ArrowUpCircle size={50} color="#F3B62B" />
                    <Text style={styles.customerText}>
                      Upgrade to Seller
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.infoCardContainer}>
              <LinearGradient
                colors={["#E3F2FD", "#BBDEFB"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.infoCard}
              >
                <View style={styles.infoCardHeader}>
                  <Info size={24} color="#1976D2" />
                  <Text style={styles.infoCardTitle}>Benfits for Seller</Text>
                </View>
                <Text style={styles.infoCardContent}>
                  At Bhav, as a user you can view your seller's details, contact them directly, and manage your buy requests.
                </Text>
              </LinearGradient>
            </View>
          </ScrollView>
        </SafeAreaView >
      )}

    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1976D2",
    marginLeft: 20,
  },
  scrollView: {
    flex: 1,
  },
  welcomeContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  welcomeText: {
    margin: 0,
    fontSize: 16,
    color: "#666666",
  },
  sellerName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1976D2",
    marginBottom: 4,
  },
  brandName: {
    fontSize: 50,
    color: "#F3B62B",
    fontWeight: "600",
    fontFamily: 'LavishlyYours-Regular',
  },
  // Referral Code Section
  referralCodeContainer: {
    backgroundColor: "#E3F2FD",
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#BBDEFB",
  },
  referralCodeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  referralCodeTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1976D2",
  },
  shareButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  referralCodeContent: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
  },
  referralCode: {
    flex: 1,
    fontSize: 18,
    fontWeight: "bold",
    color: "#333333",
    letterSpacing: 1,
  },
  copyButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0F7FF",
    alignItems: "center",
    justifyContent: "center",
  },
  generateButton: {
    flex: 1,
    backgroundColor: "#1976D2",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  generateButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  referralCodeInfo: {
    fontSize: 14,
    color: "#666666",
    lineHeight: 20,
  },
  noPhoneText: {
    fontSize: 16,
    color: "#9e9e9e",
    fontStyle: "italic",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statCard: {
    width: (width - 75) / 3,
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 1,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#666666",
  },
  buyRequestsContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  notificationsContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333333",
  },
  viewAllButton: {
    padding: 8,
  },
  viewAllButtonText: {
    fontSize: 14,
    color: "#1976D2",
    fontWeight: "500",
  },
  buyRequestCard: {
    backgroundColor: "#FFF8E1",
    borderRadius: 12,
    padding: 14,
    marginBottom: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  buyRequestHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  buyRequestIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  buyRequestTitleContainer: {
    flex: 1,
  },
  buyRequestTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
  },
  buyRequestTime: {
    fontSize: 12,
    color: "#9e9e9e",
    marginTop: 2,
  },
  buyRequestDetailsContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  buyRequestDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  buyRequestDetailIcon: {
    marginRight: 8,
  },
  buyRequestDetailLabel: {
    fontSize: 14,
    color: "#666666",
    width: 100,
  },
  buyRequestDetailValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333333",
    flex: 1,
  },
  buyRequestActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  buyRequestActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    paddingVertical: 10,
    marginHorizontal: 4,
  },
  acceptButton: {
    backgroundColor: "#4CAF50",
  },
  declineButton: {
    backgroundColor: "#E53935",
  },
  acceptedButton: {
    backgroundColor: "#4CAF50",
    opacity: 0.7,
  },
  declinedButton: {
    backgroundColor: "#E53935",
    opacity: 0.7,
  },
  dimmedButton: {
    opacity: 0.5,
  },
  buyRequestActionText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  notificationCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  unreadNotification: {
    backgroundColor: "#E3F2FD",
  },
  notificationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  notificationTitleContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
  },
  notificationTime: {
    fontSize: 12,
    color: "#9e9e9e",
    marginTop: 2,
  },
  unreadIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#1976D2",
    position: "absolute",
    top: 0,
    right: 0,
  },
  notificationMessage: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 12,
  },
  customerDetailsContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  customerDetailsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 8,
  },
  customerDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    paddingLeft: 8,
  },
  customerDetailIcon: {
    marginRight: 8,
  },
  customerDetailText: {
    fontSize: 14,
    color: "#666666",
  },
  rateDetailsContainer: {
    backgroundColor: "#FFF8E1",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  rateDetailsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 8,
  },
  rateDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  rateDetailIcon: {
    marginRight: 8,
  },
  rateDetailText: {
    fontSize: 14,
    color: "#666666",
  },
  readStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  readStatusText: {
    fontSize: 12,
    color: "#43A047",
    marginLeft: 4,
  },
  actionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: "#666666",
  },
  infoCardContainer: {
    marginHorizontal: 20,
    marginBottom: 100,
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1976D2",
    marginLeft: 8,
  },
  infoCardContent: {
    fontSize: 14,
    color: "#333333",
    lineHeight: 22,
  },


  //admin
  menuButton: {
    // padding: 5,
  },
  notificationButton: {
    padding: 8,
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#E53935",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationBadgeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "bold",
  },
  adminName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1976D2",
  },
  singleStatCard: {
    width: CARD_WIDTH,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIconContainerAdmin: {
    marginBottom: 12,
  },
  statTrend: {
    position: "absolute",
    top: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statTrendText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#ffffff",
    marginLeft: 2,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  quickActionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    justifyContent: "space-between",
  },
  quickActionButton: {
    width: "48%",
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333333",
  },
  activitiesContainer: {
    paddingHorizontal: 20,
  },
  activityItem: {
    flexDirection: "row",
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 8,
  },
  activityMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  activityTime: {
    fontSize: 12,
    color: "#9e9e9e",
    marginLeft: 4,
  },
  emptyActivities: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyActivitiesText: {
    fontSize: 16,
    color: "#9e9e9e",
  },
  logoutContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    marginTop: 10,
  },
  logoutButton: {
    backgroundColor: "#E53935",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 70,
  },
  logoutText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 10,
  },
  // Notification Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  notificationContainer: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: "80%",
    paddingBottom: 20,
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  notificationHeaderTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333333",
  },
  closeButton: {
    padding: 8,
  },
  notificationActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  markAllReadButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
  },
  markAllReadText: {
    fontSize: 14,
    color: "#1976D2",
    marginLeft: 4,
  },
  notificationsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  notificationItem: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    position: "relative",
  },
  notificationItemUnread: {
    backgroundColor: "#f0f7ff",
  },
  notificationContent: {
    flex: 1,
  },
  emptyNotifications: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyNotificationsText: {
    fontSize: 16,
    color: "#9e9e9e",
    marginTop: 16,
  },
  userDetailsContainer: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  userDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  userDetailIcon: {
    marginRight: 8,
  },
  userDetailText: {
    fontSize: 13,
    color: "#666666",
  },
  premiumUser: {
    fontWeight: "500",
  },
  referralDetailsContainer: {
    backgroundColor: "#FFF8E1",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  referralDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  referralDetailIcon: {
    marginRight: 8,
  },
  referralDetailText: {
    fontSize: 13,
    color: "#666666",
  },

  // Contact Request Notification Styles
  contactRequestNotification: {
    flex: 1,
  },
  contactRequestHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    position: "relative",
  },
  contactRequestIcon: {
    marginRight: 12,
  },
  contactRequestTitleContainer: {
    flex: 1,
  },
  contactRequestTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
  },
  contactRequestTime: {
    fontSize: 12,
    color: "#9e9e9e",
    marginTop: 2,
  },
  contactRequestMessage: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 12,
  },
  contactDetailsContainer: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  contactDetailSection: {
    marginBottom: 8,
  },
  contactDetailSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 6,
  },
  contactDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    paddingLeft: 8,
  },
  contactDetailIcon: {
    marginRight: 8,
  },
  contactDetailText: {
    fontSize: 14,
    color: "#666666",
  },
  contactDetailDivider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 8,
  },

  // Role Change Notification Styles
  roleChangeNotification: {
    flexDirection: "row",
    flex: 1,
  },

  // Payment Success Notification Styles
  paymentSuccessNotification: {
    flexDirection: "row",
    flex: 1,
  },
  statValueAdmin: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  statLabelAdmin: {
    fontSize: 14,
    color: "#ffffff",
    opacity: 0.9,
  },
  sectionTitleAdmin: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 16,
    paddingHorizontal: 20,
  },


  // customer
  logo: {
    width: 200,
    height: 200,
    resizeMode: "contain",
    marginTop: 10,
  },
  headerCustomer: {
    backgroundColor: "#002810",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 16,
    height: 150,
    color: "#ffffff",
  },
  cardGradient: {
    paddingHorizontal: 22,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 14,
    justifyContent: "center",
    marginBottom: 20,
  },
  customerContainer: {
    display: "flex",
    flexDirection: "row",
    marginHorizontal: 16,
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 24,
  },
  customerText: {
    marginTop: 15,
    fontWeight: "bold",
    fontSize: 14,
    color: "#333333",
    textAlign: "center",
  },
  infoCardContainerCustomer: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  brandCoverImage: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
  },

  // seller
  sellerContainer: {
    marginHorizontal: 20,
    marginBottom: 5,
  },
  sellerHeader: {
    marginBottom: 14,
  },
  sellerInfo: {
    fontSize: 14,
    color: "#333",
  },
  sellerDetails: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  sellerContactIcons: {
    flex: 1,
    flexDirection: "row",
    gap: 15,
    paddingBottom: 12,
    paddingTop: 5,
    borderBottomWidth: 2,
    borderBottomColor: "#f0f0f0",
  },
  catalogueContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 10,
  },
  catalogueImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
});