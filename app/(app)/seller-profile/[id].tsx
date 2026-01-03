import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore, InventoryItem } from "@/store/auth-store";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import {
  } from "@expo/vector-icons";
import { MaterialCommunityIcons as Icon, Feather as Icon2 } from "@expo/vector-icons"; 

export default function SellerProfileScreen() {
  const { id } = useLocalSearchParams();
  const sellerId = Array.isArray(id) ? id[0] : id;

  // Validate seller ID
  if (!sellerId || typeof sellerId !== 'string' || sellerId.trim() === '') {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>Invalid seller ID</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const {
    user,
    getBuyRequestsForSeller,
    getInventoryItemsForSellerAPI,
    getUserById,
    createBuyRequest,
    acceptBuyRequest,
    declineBuyRequest,
    getUserBuyRequestCount,
    hasReachedBuyRequestLimit,
    inventoryItems, // Use global state
    setInventoryItems, // Use global state setter
    getUsers, // Add this to fetch users from backend
    fetchSellerData // Add this to fetch specific seller data
  } = useAuthStore();

  const router = useRouter();

  const [seller, setSeller] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuyLoading, setIsBuyLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Check if user is premium
  const isPremiumUser = user?.isPremium || false;

  // Get user's buy request count
  const buyRequestCount = user ? getUserBuyRequestCount(user.id) : 0;
  // Request limits removed - users can make unlimited requests

  // Fetch seller details and inventory items
  useEffect(() => {
    if (sellerId) {
      const fetchSellerAndInventory = async () => {
        try {
          setIsLoading(true);
          setError(null);

          // First try to get seller from local store
          let sellerData = getUserById(sellerId);

          // If not found locally, fetch from backend
          if (!sellerData) {
            console.log('Seller not found in local store, fetching from backend...');
            const result = await fetchSellerData(sellerId);
            if (result.success && result.seller) {
              sellerData = result.seller;
            } else {
              console.error('Failed to fetch seller data:', result.error);
              setError(result.error || 'Failed to fetch seller data');
              setSeller(null);
              setIsLoading(false);
              return;
            }
          }

          setSeller(sellerData);

          // Fetch inventory items for seller
          if (sellerData) {
            const result = await useAuthStore.getState().getInventoryItemsForSellerAPI(sellerId);
            if (result.success && Array.isArray(result.items)) {
              const filtered = result.items.filter((item: InventoryItem) => item.isSellPremiumEnabled && item.isVisible);
              setInventoryItems(filtered);
            } else {
              console.error('Failed to fetch inventory items:', result.error);
              setError(result.error || 'Failed to fetch inventory items');
              setInventoryItems([]);
            }
          }
        } catch (error) {
          console.error('Error fetching seller data:', error);
          setError('Network error. Please check your connection and try again.');
          setSeller(null);
          setInventoryItems([]);
        } finally {
          setIsLoading(false);
        }
      };

      fetchSellerAndInventory();
    }
  }, [sellerId, retryCount]);

  // Add focus effect to refresh inventory when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (sellerId) {
        const refreshData = async () => {
          try {
            // Refresh seller data if needed
            let sellerData = getUserById(sellerId);
            if (!sellerData) {
              const result = await fetchSellerData(sellerId);
              if (result.success && result.seller) {
                sellerData = result.seller;
                setSeller(sellerData);
              }
            }

            // Refresh inventory items
            if (sellerData) {
              const result = await useAuthStore.getState().getInventoryItemsForSellerAPI(sellerId);
              if (result.success && Array.isArray(result.items)) {
                const filtered = result.items.filter((item: InventoryItem) => item.isSellPremiumEnabled && item.isVisible);
                setInventoryItems(filtered);
              } else {
                console.error('Failed to refresh inventory items:', result.error);
                setInventoryItems([]);
              }
            }
          } catch (error) {
            console.error('Error refreshing data:', error);
          }
        };
        refreshData();
      }
    }, [sellerId])
  );


  // Handle buy request
  const handleBuyRequest = async (itemId: string) => {
    if (!user) {
      Alert.alert(
        "Login Required",
        "Please login to send buy requests.",
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Login",
            onPress: () => router.push("/auth/login")
          }
        ]
      );
      return;
    }

    // Check if user has reached the buy limit and is not premium
    if (!isPremiumUser && hasReachedLimit) {
      // Redirect to premium upgrade page
      Alert.alert(
        "Buy Limit Reached",
        "You have reached your free buy request limit. Would you like to upgrade to premium for unlimited requests?",
        [
          {
            text: "Not Now",
            style: "cancel"
          },
          {
            text: "Upgrade to Premium",
            onPress: () => router.push("/auth/premium-subscription")
          }
        ]
      );
      return;
    }

    setIsBuyLoading(true);

    try {
      // Trigger haptic feedback
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      // Create buy request
      const result = await createBuyRequest(itemId, user.id, sellerId);

      if (result.success) {
        // Show success alert
        Alert.alert(
          "Buy Request Sent",
          "Your request has been sent to the seller. You will be notified when they respond.",
          [{ text: "OK" }]
        );
      } else {
        Alert.alert("Error", result.error || "Failed to send buy request. Please try again.");
      }
    } catch (error) {
      console.error("Error sending buy request:", error);
      Alert.alert("Error", "Failed to send buy request. Please try again.");
    } finally {
      setIsBuyLoading(false);
    }
  };

  // Handle contact seller
  const handleContactSeller = () => {
    if (!user) {
      Alert.alert(
        "Login Required",
        "Please login to contact sellers.",
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Login",
            onPress: () => router.push("/auth/login")
          }
        ]
      );
      return;
    }

    // Trigger haptic feedback
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Contact dealer
    // contactDealer(sellerId); // This function is no longer available in useAuthStore

    // Show success alert with seller contact info
    Alert.alert(
      "Contact Information",
      `You can contact ${seller.brandName || seller.fullName || seller.name} at:

Phone: ${seller.phone}
Email: ${seller.email}`,
      [{ text: "OK" }]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D4AF37" />
        <Text style={styles.loadingText}>Loading seller profile...</Text>
      </SafeAreaView>
    );
  }

  if (!seller && !isLoading) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>
          {error || 'Seller not found'}
        </Text>
        <View style={styles.errorButtons}>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => setRetryCount(prev => prev + 1)}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar style="light" />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Seller Header with Catalog Image */}
        <View style={styles.headerContainer}>
          {seller.catalogImage ? (
            <Image
              source={{ uri: seller.catalogImage }}
              style={styles.catalogImage}
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={["#1976D2", "#64B5F6"]}
              style={styles.catalogImagePlaceholder}
            />
          )}

          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.7)"]}
            style={styles.headerGradient}
          >
            <View style={styles.headerContent}>
              <Text style={styles.brandName}>
                {seller.brandName || seller.fullName || seller.name}
              </Text>

              {seller.sellerVerified && (
                <View style={styles.verifiedBadge}>
                  <Icon2 name="check" size={12} color="#ffffff" />
                  <Text style={styles.verifiedText}>Verified Seller</Text>
                </View>
              )}

              {seller.city && (
                <View style={styles.locationContainer}>
                  <Icon2 name="map-pin" size={16} color="#ffffff" style={styles.locationIcon} />
                  <Text style={styles.locationText}>
                    {seller.city}{seller.state ? `, ${seller.state}` : ""}
                  </Text>
                </View>
              )}

              {seller.referralCode && (
                <View style={styles.referralCodeContainer}>
                  <Text style={styles.referralCodeLabel}>Referral Code:</Text>
                  <Text style={styles.referralCode}>{seller.referralCode}</Text>
                </View>
              )}
            </View>
          </LinearGradient>
        </View>

        {/* Buy Limit Banner - Only for non-premium users */}
        {!isPremiumUser && user && (
          <View style={[styles.buyLimitBanner, hasReachedLimit && styles.buyLimitBannerReached]}>
            <View style={styles.buyLimitIconContainer}>
              {hasReachedLimit ? (
                <Lock size={20} color="#E53935" />
              ) : (
                <Icon2 name="shopping-bag" size={20} color={hasReachedLimit ? "#E53935" : "#1976D2"} />
              )}
            </View>
            <View style={styles.buyLimitContent}>
              <Text style={[styles.buyLimitTitle, hasReachedLimit && styles.buyLimitTitleReached]}>
                {hasReachedLimit ? "Buy Limit Reached" : "Buy Request Limit"}
              </Text>
              <Text style={styles.buyLimitText}>
                {hasReachedLimit
                  ? "Upgrade to premium for unlimited buy requests"
                  : `${buyRequestCount} buy requests made`}
              </Text>
            </View>
            {hasReachedLimit && (
              <TouchableOpacity
                style={styles.upgradeButton}
                onPress={() => router.push("/auth/premium-subscription")}
              >
                <Text style={styles.upgradeButtonText}>Upgrade</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Seller Contact Information */}
        <View style={styles.contactInfoContainer}>
          {seller.phone && (
            <View style={styles.contactInfoItem}>
              <Icon2 name="phone" size={20} color="#1976D2" style={styles.contactInfoIcon} />
              <Text style={styles.contactInfoText}>{seller.phone}</Text>
            </View>
          )}

          {seller.email && (
            <View style={styles.contactInfoItem}>
              <Icon2 name="mail" size={20} color="#1976D2" style={styles.contactInfoIcon} />
              <Text style={styles.contactInfoText}>{seller.email}</Text>
            </View>
          )}
        </View>

        {/* About Seller Section */}
        {seller.about && (
          <View style={styles.aboutContainer}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.aboutText}>{seller.about}</Text>
          </View>
        )}

        {/* Benefits Section */}
        {seller.benefits && seller.benefits.length > 0 && (
          <View style={styles.benefitsContainer}>
            <Text style={styles.sectionTitle}>Why Choose Us</Text>

            {seller.benefits.map((benefit: string, index: number) => (
              <View key={index} style={styles.benefitItem}>
                <Icon2 name="award" size={16} color="#D4AF37" style={styles.benefitIcon} />
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Inventory Items Section */}
        {inventoryItems.length > 0 && (
          <View style={styles.inventoryContainer}>
            <Text style={styles.sectionTitle}>Available Products</Text>

            {inventoryItems.map((item) => {
              // Check if user has reached buy limit and is not premium
              const isBuyDisabled = false; // Request limits removed

              return (
                <View key={item.id} style={styles.productCard}>
                  <View style={styles.productCardHeader}>
                    {item.image ? (
                      <Image
                        source={{ uri: item.image }}
                        style={styles.productImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.productImagePlaceholder}>
                        <Icon2 name="package" size={32} color="#e0e0e0" />
                      </View>
                    )}

                    <View style={styles.productInfo}>
                      <Text style={styles.productName}>{item.productName}</Text>

                      {item.isSellPremiumEnabled && (
                        <View style={styles.premiumContainer}>
                          <Icon name="currency-usd" size={16} color="#666666" style={styles.premiumIcon} />
                          <Text style={styles.premiumText}>
                            Sell Premium: ₹{item.sellPremium.toLocaleString()}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.buyButton,
                      isBuyDisabled && styles.buyButtonDisabled
                    ]}
                    onPress={() => handleBuyRequest(item.id)}
                    disabled={isBuyLoading || isBuyDisabled}
                  >
                    {isBuyLoading ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        {isBuyDisabled ? (
                          <>
                            <Lock size={16} color="#ffffff" style={styles.buyButtonIcon} />
                            <Text style={styles.buyButtonText}>Upgrade to Buy</Text>
                          </>
                        ) : (
                          <>
                            <Icon2 name="shopping-bag" size={16} color="#ffffff" style={styles.buyButtonIcon} />
                            <Text style={styles.buyButtonText}>Buy Now</Text>
                          </>
                        )}
                      </>
                    )}
                  </TouchableOpacity>

                  {/* Buy Limit Indicator for non-premium users */}
                  {!isPremiumUser && !hasReachedLimit && (
                    <View style={styles.buyLimitIndicator}>
                      <Text style={styles.buyLimitIndicatorText}>
                        {buyRequestCount} requests made
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Premium Upgrade Banner - Only for non-premium users */}
        {!isPremiumUser && user && (
          <TouchableOpacity
            style={styles.premiumUpgradeBanner}
            onPress={() => router.push("/auth/premium-subscription")}
          >
            <LinearGradient
              colors={["#D4AF37", "#F5D76E"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.premiumUpgradeGradient}
            >
              <Icon2 name="award" size={24} color="#ffffff" style={styles.premiumUpgradeIcon} />
              <View style={styles.premiumUpgradeContent}>
                <Text style={styles.premiumUpgradeTitle}>Upgrade to Premium</Text>
                <Text style={styles.premiumUpgradeText}>
                  Get unlimited buy requests and exclusive deals
                </Text>
              </View>
              <TouchableOpacity
                style={styles.premiumUpgradeButton}
                onPress={() => router.push("/auth/premium-subscription")}
              >
                <Text style={styles.premiumUpgradeButtonText}>Upgrade</Text>
              </TouchableOpacity>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Contact Button */}
        <TouchableOpacity
          style={styles.contactButton}
          onPress={handleContactSeller}
        >
          <LinearGradient
            colors={["#D4AF37", "#F5D76E"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.contactButtonGradient}
          >
            <Text style={styles.contactButtonText}>Contact Seller</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: "#E53935",
    marginBottom: 16,
  },
  errorButtons: {
    flexDirection: "row",
    gap: 12,
  },
  retryButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  backButton: {
    backgroundColor: "#1976D2",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  headerContainer: {
    position: "relative",
    height: 250,
  },
  catalogImage: {
    width: "100%",
    height: "100%",
  },
  catalogImagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#1976D2",
  },
  headerGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerContent: {
    width: "100%",
  },
  brandName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4CAF50",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#ffffff",
    marginLeft: 4,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  locationIcon: {
    marginRight: 4,
  },
  locationText: {
    fontSize: 14,
    color: "#ffffff",
  },
  referralCodeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  referralCodeLabel: {
    fontSize: 12,
    color: "#ffffff",
    marginRight: 4,
  },
  referralCode: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#ffffff",
    letterSpacing: 1,
  },
  // Buy Limit Banner Styles
  buyLimitBanner: {
    flexDirection: "row",
    backgroundColor: "#E3F2FD",
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#BBDEFB",
    alignItems: "center",
  },
  buyLimitBannerReached: {
    backgroundColor: "#FFEBEE",
    borderColor: "#FFCDD2",
  },
  buyLimitIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  buyLimitContent: {
    flex: 1,
  },
  buyLimitTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1976D2",
    marginBottom: 4,
  },
  buyLimitTitleReached: {
    color: "#E53935",
  },
  buyLimitText: {
    fontSize: 14,
    color: "#333333",
    lineHeight: 20,
  },
  upgradeButton: {
    backgroundColor: "#D4AF37",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  upgradeButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  contactInfoContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  contactInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  contactInfoIcon: {
    marginRight: 12,
  },
  contactInfoText: {
    fontSize: 16,
    color: "#333333",
  },
  aboutContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 12,
  },
  aboutText: {
    fontSize: 16,
    color: "#666666",
    lineHeight: 24,
  },
  benefitsContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  benefitIcon: {
    marginRight: 12,
  },
  benefitText: {
    fontSize: 16,
    color: "#333333",
  },
  inventoryContainer: {
    padding: 20,
  },
  productCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    position: "relative",
  },
  productCardHeader: {
    flexDirection: "row",
    marginBottom: 16,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  productImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  productInfo: {
    flex: 1,
    justifyContent: "center",
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 8,
  },
  premiumContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  premiumIcon: {
    marginRight: 4,
  },
  premiumText: {
    fontSize: 14,
    color: "#666666",
  },
  buyButton: {
    backgroundColor: "#D4AF37",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  buyButtonDisabled: {
    backgroundColor: "#E53935",
  },
  buyButtonIcon: {
    marginRight: 8,
  },
  buyButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  // Buy Limit Indicator Styles
  buyLimitIndicator: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(25, 118, 210, 0.8)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  buyLimitIndicatorText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "bold",
  },
  // Premium Upgrade Banner Styles
  premiumUpgradeBanner: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#D4AF37",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  premiumUpgradeGradient: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  premiumUpgradeIcon: {
    marginRight: 16,
  },
  premiumUpgradeContent: {
    flex: 1,
  },
  premiumUpgradeTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  premiumUpgradeText: {
    fontSize: 14,
    color: "#ffffff",
    opacity: 0.9,
  },
  premiumUpgradeButton: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  premiumUpgradeButtonText: {
    color: "#D4AF37",
    fontSize: 14,
    fontWeight: "600",
  },
  contactButton: {
    marginHorizontal: 20,
    marginBottom: 30,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#D4AF37",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  contactButtonGradient: {
    height: 56,
    justifyContent: "center",
    alignItems: "center",
  },
  contactButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
});