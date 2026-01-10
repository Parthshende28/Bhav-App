import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Linking
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "@/store/auth-store";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import { MaterialCommunityIcons as Icon, Feather as Icon2 } from "@expo/vector-icons";
import { BlurView } from 'expo-blur';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window'); 

export default function SellerProfileScreen() {
  const { id } = useLocalSearchParams();
  const sellerId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();

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

  const user = useAuthStore((s) => s.user);
  const getUserById = useAuthStore((s) => s.getUserById);
  const getUsers = useAuthStore((s) => s.getUsers);

  const [seller, setSeller] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [networkError, setNetworkError] = useState(false);

  // Enhanced fetch function with better error handling
  const loadSellerData = useCallback(async (showLoader = true) => {
    if (!sellerId) return;
    
    try {
      if (showLoader) {
        setIsLoading(true);
      }
      setError(null);
      setNetworkError(false);

      // First try to get seller from local store
      let sellerData = getUserById(sellerId);

      // If not found locally, fetch from backend
      if (!sellerData) {
        console.log('Seller not found in local store, fetching from backend...');
        
        try {
          await getUsers();
          sellerData = getUserById(sellerId);
          if (!sellerData) {
            setError('Seller not found');
            setSeller(null);
            setIsLoading(false);
            return;
          }
        } catch (err) {
          console.error('Error fetching users:', err);
          setError('Unable to load seller data');
          setSeller(null);
          setIsLoading(false);
          return;
        }
      }

      setSeller(sellerData);
    } catch (error: any) {
      console.error('Error fetching seller data:', error);
      setNetworkError(true);
      setError('Unable to load seller profile. Please try again.');
      setSeller(null);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [sellerId, getUserById, getUsers]);

  // Fetch seller details
  useEffect(() => {
    loadSellerData();
  }, [loadSellerData, retryCount]);

  // Add focus effect to refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (sellerId) {
        loadSellerData(false);
      }
    }, [sellerId, loadSellerData])
  );

  // Pull to refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadSellerData(false);
  }, [loadSellerData]);


  // Handle phone call
  const handlePhoneCall = (phoneNumber: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    Linking.openURL(`tel:${phoneNumber}`);
  };

  // Handle email
  const handleEmail = (email: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    Linking.openURL(`mailto:${email}`);
  };

  // Handle WhatsApp
  const handleWhatsApp = (phoneNumber: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
    Linking.openURL(`whatsapp://send?phone=${cleanNumber}`);
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
        <View style={styles.errorIconContainer}>
          <Icon2 
            name={networkError ? "wifi-off" : "user-x"} 
            size={64} 
            color="#E53935" 
          />
        </View>
        <Text style={styles.errorTitle}>
          {networkError ? 'Connection Error' : 'Seller Not Found'}
        </Text>
        <Text style={styles.errorText}>
          {error || (networkError ? 'Please check your internet connection' : 'This seller profile is not available')}
        </Text>
        <View style={styles.errorButtons}>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setRetryCount(prev => prev + 1);
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
            }}
          >
            <Icon2 name="refresh-cw" size={16} color="#ffffff" style={{ marginRight: 8 }} />
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              router.back();
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
            }}
          >
            <Icon2 name="arrow-left" size={16} color="#ffffff" style={{ marginRight: 8 }} />
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar style="light" />

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#D4AF37']}
            tintColor="#D4AF37"
          />
        }
      >
        {/* Seller Header with Catalog Image */}
        <View style={styles.headerContainer}>
          {seller?.brandImage ? (
              <Image
              source={{ uri: seller.brandImage }}
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

        {/* Seller Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Icon2 name="star" size={20} color="#FFD700" />
            <Text style={styles.statValue}>4.8</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Icon2 name="users" size={20} color="#4CAF50" />
            <Text style={styles.statValue}>250+</Text>
            <Text style={styles.statLabel}>Customers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Icon2 name="clock" size={20} color="#2196F3" />
            <Text style={styles.statValue}>2 hrs</Text>
            <Text style={styles.statLabel}>Response</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          {seller.phone && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handlePhoneCall(seller.phone)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#4CAF50', '#45a049']}
                style={styles.actionButtonGradient}
              >
                <Icon2 name="phone" size={20} color="#ffffff" />
                <Text style={styles.actionButtonText}>Call</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
          
          {seller.phone && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleWhatsApp(seller.phone)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#25D366', '#128C7E']}
                style={styles.actionButtonGradient}
              >
                <Icon name="whatsapp" size={20} color="#ffffff" />
                <Text style={styles.actionButtonText}>WhatsApp</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
          
          {seller.email && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleEmail(seller.email)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#2196F3', '#1976D2']}
                style={styles.actionButtonGradient}
              >
                <Icon2 name="mail" size={20} color="#ffffff" />
                <Text style={styles.actionButtonText}>Email</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        {/* About Seller Section */}
        {/* {seller.about && (
          <View style={styles.aboutContainer}>
            <View style={styles.sectionHeaderWithIcon}>
              <Icon2 name="info" size={20} color="#D4AF37" />
              <Text style={styles.sectionTitle}>About Seller</Text>
            </View>
            <Text style={styles.aboutText}>{seller.about}</Text>
          </View>
        )} */}

        {/* Services & Specialties */}
        {/* <View style={styles.servicesContainer}>
          <View style={styles.sectionHeaderWithIcon}>
            <Icon2 name="briefcase" size={20} color="#D4AF37" />
            <Text style={styles.sectionTitle}>Services & Specialties</Text>
          </View>
          
          <View style={styles.serviceGrid}>
            <View style={styles.serviceCard}>
              <Icon2 name="truck" size={24} color="#4CAF50" />
              <Text style={styles.serviceTitle}>Fast Delivery</Text>
              <Text style={styles.serviceDesc}>Quick & reliable service</Text>
            </View>
            
            <View style={styles.serviceCard}>
              <Icon2 name="shield" size={24} color="#2196F3" />
              <Text style={styles.serviceTitle}>Quality Assured</Text>
              <Text style={styles.serviceDesc}>100% authentic products</Text>
            </View>
            
            <View style={styles.serviceCard}>
              <Icon2 name="headphones" size={24} color="#FF9800" />
              <Text style={styles.serviceTitle}>24/7 Support</Text>
              <Text style={styles.serviceDesc}>Always here to help</Text>
            </View>
            
            <View style={styles.serviceCard}>
              <Icon2 name="award" size={24} color="#9C27B0" />
              <Text style={styles.serviceTitle}>Best Prices</Text>
              <Text style={styles.serviceDesc}>Competitive rates</Text>
            </View>
          </View>
        </View>
        
         Benefits Section 
        {seller.benefits && seller.benefits.length > 0 && (
          <View style={styles.benefitsContainer}>
            <View style={styles.sectionHeaderWithIcon}>
              <Icon2 name="star" size={20} color="#D4AF37" />
              <Text style={styles.sectionTitle}>Why Choose Us</Text>
            </View>

            {seller.benefits.map((benefit: string, index: number) => (
              <View key={index} style={styles.benefitItem}>
                <View style={styles.benefitIconContainer}>
                  <Icon2 name="check-circle" size={16} color="#4CAF50" />
                </View>
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>
        )} */}

        {/* Contact Information Card */}
         <View style={styles.contactCard}> 
          <View style={styles.sectionHeaderWithIcon}>
            <Icon2 name="phone" size={20} color="#D4AF37" />
            <Text style={styles.sectionTitle}>Contact Information</Text>
          </View>
          
          <View style={styles.contactDetails}>
            {seller.phone && (
              <View style={styles.contactDetailItem}>
                <View style={styles.contactDetailIcon}>
                  <Icon2 name="phone" size={16} color="#4CAF50" />
                </View>
                <View style={styles.contactDetailContent}>
                  <Text style={styles.contactDetailLabel}>Phone</Text>
                  <Text style={styles.contactDetailValue}>{seller.phone}</Text>
                </View>
              </View>
            )}
            
            {seller.email && (
              <View style={styles.contactDetailItem}>
                <View style={styles.contactDetailIcon}>
                  <Icon2 name="mail" size={16} color="#2196F3" />
                </View>
                <View style={styles.contactDetailContent}>
                  <Text style={styles.contactDetailLabel}>Email</Text>
                  <Text style={styles.contactDetailValue}>{seller.email}</Text>
                </View>
              </View>
            )}
            
            {seller.city && (
              <View style={styles.contactDetailItem}>
                <View style={styles.contactDetailIcon}>
                  <Icon2 name="map-pin" size={16} color="#FF9800" />
                </View>
                <View style={styles.contactDetailContent}>
                  <Text style={styles.contactDetailLabel}>Location</Text>
                  <Text style={styles.contactDetailValue}>
                    {seller.city}{seller.state ? `, ${seller.state}` : ""}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View> 



        {/* Main Contact Button */}
        {/* <View style={styles.mainContactContainer}>
          <TouchableOpacity
            style={styles.mainContactButton}
            onPress={handleContactSeller}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={["#D4AF37", "#F5D76E"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.mainContactGradient}
            >
              <Icon2 name="message-circle" size={24} color="#ffffff" />
              <Text style={styles.mainContactText}>Get in Touch</Text>
              <Icon2 name="arrow-right" size={20} color="#ffffff" />
            </LinearGradient>
          </TouchableOpacity>
        </View> */}
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
  errorIconContainer: {
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 8,
    textAlign: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#666666",
    marginBottom: 24,
    textAlign: "center",
    lineHeight: 24,
  },
  errorButtons: {
    flexDirection: "row",
    gap: 12,
  },
  retryButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
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
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#1976D2",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
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
    borderRadius: 30,
    overflow: "hidden",
    backgroundColor: "#E0E0E0",
  },
  catalogImage: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
  },
  catalogImagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#1976D2",
    borderRadius: 16,
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
    fontSize: 28,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 8,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
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
  // Stats Container
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    alignItems: "center",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333333",
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#666666",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#E0E0E0",
    marginHorizontal: 10,
  },
  // Quick Actions
  quickActionsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionButtonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  actionButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  aboutContainer: {
    backgroundColor: "#ffffff",
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  sectionHeaderWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333333",
    marginLeft: 8,
  },
  aboutText: {
    fontSize: 16,
    color: "#666666",
    lineHeight: 26,
  },
  // Services Section
  servicesContainer: {
    backgroundColor: "rgb(255, 255, 255)",
    marginHorizontal: 12,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  serviceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  serviceCard: {
    width: (screenWidth - 76) / 2,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333333",
    marginTop: 8,
    textAlign: "center",
  },
  serviceDesc: {
    fontSize: 12,
    color: "#666666",
    marginTop: 4,
    textAlign: "center",
  },
  benefitsContainer: {
    backgroundColor: "#ffffff",
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  benefitIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#E8F5E8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    marginTop: 2,
  },
  benefitText: {
    fontSize: 16,
    color: "#333333",
    flex: 1,
    lineHeight: 24,
  },
  // Contact Card
  contactCard: {
    backgroundColor: "#ffffff",
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  contactDetails: {
    gap: 16,
  },
  contactDetailItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  contactDetailIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F8F9FA",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  contactDetailContent: {
    flex: 1,
  },
  contactDetailLabel: {
    fontSize: 12,
    color: "#666666",
    marginBottom: 2,
  },
  contactDetailValue: {
    fontSize: 16,
    color: "#333333",
    fontWeight: "500",
  },
  // Main Contact Button
  mainContactContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  mainContactButton: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 6,
    shadowColor: "#D4AF37",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  mainContactGradient: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  mainContactText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },
});