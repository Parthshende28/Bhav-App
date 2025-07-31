import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  FlatList,
  Modal,
  TextInput,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { TrendingUp, TrendingDown, RefreshCw, PenBox, PenBoxIcon, Package, ShoppingBag, Lock, ArrowDownWideNarrowIcon, Plus, Check, Menu, ArrowDownCircleIcon, CircleChevronDown, Bell, X, Send } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { Platform, Dimensions } from "react-native";
import * as Font from "expo-font";
import { useMetalPrices } from "@/hooks/useMetalPrices";
import { useAuthStore, InventoryItem, MAX_BUY_REQUESTS, User } from "@/store/auth-store";
import { images } from "@/constants/images";
import { router, useFocusEffect } from "expo-router";
import colors from "@/constants/colors";
// import { NotificationBell } from "@/components/NotificationBell";
import { userAPI, inventoryAPI } from '@/services/api';

type TabType = 'all' | 'gold' | 'silver';

export default function RatesScreen() {
  const {
    user,
    getSellerReferralsForCustomer,
    getUserById,
    getInventoryItemsForSellerAPI,
    setSelectedSeller,
    selectedSeller,
    getUserBuyRequestCount,
    hasReachedBuyRequestLimit,
    contactDealer,
    createRequestAPI,
    getInventoryItemsForSellerAPI: getInventoryItemsAPI,
    inventoryItems, // Use global state instead of local state
    setInventoryItems, // Use global state setter
  } = useAuthStore();

  const [showSellerModal, setShowSellerModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [requestType, setRequestType] = useState<'buy' | 'sell'>('buy');
  const [quantity, setQuantity] = useState('1');
  const [message, setMessage] = useState('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [isLoadingInventory, setIsLoadingInventory] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Shared state for added sellers
  const [addedSellers, setAddedSellers] = useState<User[]>([]);

  // Use addedSellers for seller selection
  const customerSellers = addedSellers;

  // Get inventory for the selected seller - use global state
  const selectedSellerInventory = selectedSeller && (selectedSeller.id || selectedSeller._id)
    ? inventoryItems.filter(item => (item.sellerId === selectedSeller.id || item.sellerId === selectedSeller._id) && item.isVisible)
    : [];

  const handleSelectSeller = (seller: User | null | undefined) => {
    if (selectedSeller?.id === seller?.id) {
      Alert.alert(
        "Seller Already Selected",
        "You have already selected this seller. Please select another seller.",
        [{ text: "OK" }]
      );
      return;
    }

    setSelectedSeller(seller ?? null);
    Alert.alert(
      "Seller Selected",
      `You have selected ${seller?.brandName || seller?.fullName || seller?.name}.`,
      [{ text: "OK" }]
    );
  };

  const openSellerSelection = () => {
    if (customerSellers.length === 0) {
      Alert.alert(
        "No Sellers Found",
        "You have not added any sellers yet. Please add sellers using their referral codes.",
        [{ text: "OK" }]
      );
      return;
    }

    const sellerOptions = customerSellers.map(seller => ({
      text: (seller as User)?.brandName || (seller as User)?.fullName || (seller as User)?.name,
      onPress: () => handleSelectSeller(seller as User),
    }));

    Alert.alert(
      "Select Seller",
      undefined,
      [...sellerOptions, { text: "Close", style: "destructive" }]
    );
  };

  const closeSellerSelection = () => setShowSellerModal(false);

  // Handle buy/sell request
  const handleRequest = async (item: InventoryItem, type: 'buy' | 'sell') => {
    if (!user) {
      Alert.alert(
        "Login Required",
        "Please login to send requests.",
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
    if (!user.isPremium && hasReachedBuyRequestLimit(user.id)) {
      // Redirect to premium upgrade page
      router.push("/auth/premium-subscription");
      return;
    }

    setSelectedItem(item);
    setRequestType(type);
    setQuantity('1');
    setMessage('');
    setShowRequestModal(true);
  };

  // Submit request
  const submitRequest = async () => {
    if (!selectedItem || !user) return;

    setIsSubmittingRequest(true);

    try {
      // Trigger haptic feedback
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      // Calculate the captured amount based on current rates and premium
      let capturedAmount = 0;
      if (requestType === 'buy' && selectedItem.buyPremium !== 0) {
        if (selectedItem.productType === "Gold") {
          capturedAmount = Number(goldBuy) + selectedItem.buyPremium;
        } else if (selectedItem.productType === "Silver") {
          capturedAmount = Number(silverBuy) + selectedItem.buyPremium;
        }
      } else if (requestType === 'sell' && selectedItem.sellPremium !== 0) {
        if (selectedItem.productType === "Gold") {
          capturedAmount = Number(goldSell) + selectedItem.sellPremium;
        } else if (selectedItem.productType === "Silver") {
          capturedAmount = Number(silverSell) + selectedItem.sellPremium;
        }
      }

      // Ensure capturedAmount is valid
      if (!capturedAmount || isNaN(capturedAmount) || capturedAmount <= 0) {
        Alert.alert("Error", "Unable to calculate price. Please try again later.");
        return;
      }

      const result = await createRequestAPI(
        selectedItem.id,
        requestType,
        quantity,
        message,
        capturedAmount
      );

      if (result.success) {
        // Show success alert
        Alert.alert(
          "Request Sent",
          `Your ${requestType} request has been sent to the seller. You will be notified when they respond.`,
          [{ text: "OK" }]
        );
        setShowRequestModal(false);
      } else {
        if (result.limitReached) {
          // Redirect to premium upgrade page
          Alert.alert(
            "Request Limit Reached",
            "You have reached your free request limit. Would you like to upgrade to premium for unlimited requests?",
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
        } else {
          Alert.alert("Error", result.error || "Failed to send request. Please try again.");
        }
      }
    } catch (error) {
      console.error("Error sending request:", error);
      Alert.alert("Error", "Failed to send request. Please try again.");
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const {
    prices, Error
  } = useMetalPrices();

  // Store previous prices
  const prevGoldBuy = useRef<string | null>(null);
  const prevGoldSell = useRef<string | null>(null);
  const prevSilverBuy = useRef<string | null>(null);
  const prevSilverSell = useRef<string | null>(null);

  // Store color states
  const [goldBuyColor, setGoldBuyColor] = useState("#333333");
  const [goldSellColor, setGoldSellColor] = useState("#333333");
  const [silverBuyColor, setSilverBuyColor] = useState("#333333");
  const [silverSellColor, setSilverSellColor] = useState("#333333");

  // Timer refs to clear timeouts
  const goldBuyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const goldSellTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const silverBuyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const silverSellTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get user's buy request count
  const buyRequestCount = user ? getUserBuyRequestCount(user.id) : 0;
  const hasReachedLimit = user ? hasReachedBuyRequestLimit(user.id) : false;

  const isPremiumUser = user?.isPremium || false;

  const isSeller = user?.role === "seller";
  const isCustomer = user?.role === "customer";
  const isAdmin = user?.role === "admin";
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [isBuyLoading, setIsBuyLoading] = useState(false);

  const [sellerProducts, setSellerProducts] = useState<{ [key: string]: InventoryItem[] }>({});

  const [activeTab, setActiveTab] = useState<TabType>("all");

  const editInventory = () => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
    // Navigate to inventory management screen
    router.push("/(app)/inventory");
  };

  const addSeller = () => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
    // Navigate to inventory management screen
    router.push("/(app)/seller-data");
  };

  // Navigate to seller profile
  const navigateToSellerProfile = (sellerId: string) => {
    router.push(`/seller-profile/${sellerId}`);
  };

  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    Font.loadAsync({
      'LavishlyYours-Regular': require('../../../assets/fonts/LavishlyYours-Regular.ttf'),
    }).then(() => setFontsLoaded(true));
  }, []);

  // Define fetchAddedSellers function outside useEffect so it can be reused
  const fetchAddedSellers = async () => {
    if (user && (isCustomer || isAdmin)) {
      try {
        const referralsRes = await userAPI.getSellerReferrals();
        const sellers: User[] = (referralsRes.data?.sellerReferrals || []).map((seller: any) => ({
          ...seller,
          id: seller._id || seller.id,
          _id: seller._id || seller.id,
        }));
        setAddedSellers(sellers);

        // Clear selected seller if it's no longer in the added sellers list
        if (selectedSeller && !sellers.some(seller => seller.id === selectedSeller.id || seller._id === selectedSeller._id)) {
          setSelectedSeller(null);
        }
      } catch (err) {
        setAddedSellers([]);
        // Clear selected seller if there's an error fetching sellers
        if (selectedSeller) {
          setSelectedSeller(null);
        }
      }
    } else {
      setAddedSellers([]);
      // Clear selected seller if user is not customer or admin
      if (selectedSeller) {
        setSelectedSeller(null);
      }
    }
  };

  // Fetch the list of sellers only when the user changes
  useEffect(() => {
    fetchAddedSellers();
  }, [user, selectedSeller]);

  // Add focus effect to refresh sellers when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user && (isCustomer || isAdmin)) {
        fetchAddedSellers();
      }
    }, [user])
  );

  // Replace the fetchSellerProducts useEffect with the following:
  useEffect(() => {
    async function fetchSellerProducts() {
      const sellerId = selectedSeller && (selectedSeller.id || selectedSeller._id);
      if (sellerId && typeof sellerId === 'string') {
        setIsLoadingInventory(true);
        try {
          let productsRes;
          // If the user is a seller and viewing their own inventory
          if (user?.role === 'seller' && (user.id === sellerId || user._id === sellerId)) {
            productsRes = await inventoryAPI.getSellerInventory(sellerId);
          } else {
            // For customers, admins, or sellers viewing other sellers, use the public endpoint
            productsRes = await inventoryAPI.getPublicInventory(sellerId);
          }
          const products = productsRes.data?.items?.filter((item: InventoryItem) => item.isVisible) || [];
          // Update global state instead of local state
          setInventoryItems(products);
        } catch (err) {
          console.error('Error fetching seller products:', err);
          setInventoryItems([]);
        } finally {
          setIsLoadingInventory(false);
        }
      } else {
        console.log('No seller ID available for inventory fetch');
        setInventoryItems([]);
        setIsLoadingInventory(false);
      }
    }

    fetchSellerProducts();
  }, [selectedSeller?.id, selectedSeller?._id, user?.role, user?.id, user?._id]);

  // Add focus effect to refresh inventory when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user?.role === 'seller') {
        // For sellers, refresh their own inventory
        const fetchSellerInventory = async () => {
          setIsLoadingInventory(true);
          try {
            const result = await getInventoryItemsForSellerAPI(user.id);
            if (result.success && result.items) {
              setInventoryItems(result.items);
            } else {
              setInventoryItems([]);
            }
          } catch (err) {
            console.error('Error fetching seller inventory:', err);
            setInventoryItems([]);
          } finally {
            setIsLoadingInventory(false);
          }
        };
        fetchSellerInventory();
      } else if (selectedSeller) {
        // For customers/admins, refresh selected seller's inventory
        const fetchSelectedSellerInventory = async () => {
          setIsLoadingInventory(true);
          try {
            const productsRes = await inventoryAPI.getPublicInventory(selectedSeller.id);
            const products = productsRes.data?.items?.filter((item: InventoryItem) => item.isVisible) || [];
            setInventoryItems(products);
          } catch (err) {
            console.error('Error fetching selected seller inventory:', err);
            setInventoryItems([]);
          } finally {
            setIsLoadingInventory(false);
          }
        };
        fetchSelectedSellerInventory();
      }
    }, [user, selectedSeller])
  );

  useEffect(() => {
    // Gold Buy Price
    if (prices.gold?.buy && prevGoldBuy.current !== null && prevGoldBuy.current !== prices.gold.buy) {
      const currentPrice = Number(prices.gold.buy);
      const previousPrice = Number(prevGoldBuy.current);

      if (currentPrice > previousPrice) {
        setGoldBuyColor("#4CAF50"); // Green
        if (goldBuyTimer.current) clearTimeout(goldBuyTimer.current);
        goldBuyTimer.current = setTimeout(() => {
          setGoldBuyColor("#333333"); // Back to black
        }, 1000);
      } else if (currentPrice < previousPrice) {
        setGoldBuyColor("#F44336"); // Red
        if (goldBuyTimer.current) clearTimeout(goldBuyTimer.current);
        goldBuyTimer.current = setTimeout(() => {
          setGoldBuyColor("#333333"); // Back to black
        }, 1000);
      }
    }
    prevGoldBuy.current = typeof prices.gold?.buy === "string" ? prices.gold.buy : null;

    // Gold Sell Price
    if (prices.gold?.sell && prevGoldSell.current !== null && prevGoldSell.current !== prices.gold.sell) {
      const currentPrice = Number(prices.gold.sell);
      const previousPrice = Number(prevGoldSell.current);

      if (currentPrice > previousPrice) {
        setGoldSellColor("#4CAF50"); // Green
        if (goldSellTimer.current) clearTimeout(goldSellTimer.current);
        goldSellTimer.current = setTimeout(() => {
          setGoldSellColor("#333333"); // Back to black
        }, 1000);
      } else if (currentPrice < previousPrice) {
        setGoldSellColor("#F44336"); // Red
        if (goldSellTimer.current) clearTimeout(goldSellTimer.current);
        goldSellTimer.current = setTimeout(() => {
          setGoldSellColor("#333333"); // Back to black
        }, 1000);
      }
    }
    prevGoldSell.current = typeof prices.gold?.sell === "string" ? prices.gold.sell : null;

    // Silver Buy Price
    if (prices.silver?.buy && prevSilverBuy.current !== null && prevSilverBuy.current !== prices.silver.buy) {
      const currentPrice = Number(prices.silver.buy);
      const previousPrice = Number(prevSilverBuy.current);

      if (currentPrice > previousPrice) {
        setSilverBuyColor("#4CAF50"); // Green
        if (silverBuyTimer.current) clearTimeout(silverBuyTimer.current);
        silverBuyTimer.current = setTimeout(() => {
          setSilverBuyColor("#333333"); // Back to black
        }, 1000);
      } else if (currentPrice < previousPrice) {
        setSilverBuyColor("#F44336"); // Red
        if (silverBuyTimer.current) clearTimeout(silverBuyTimer.current);
        silverBuyTimer.current = setTimeout(() => {
          setSilverBuyColor("#333333"); // Back to black
        }, 1000);
      }
    }
    prevSilverBuy.current = typeof prices.silver?.buy === "string" ? prices.silver.buy : null;

    // Silver Sell Price
    if (prices.silver?.sell && prevSilverSell.current !== null && prevSilverSell.current !== prices.silver.sell) {
      const currentPrice = Number(prices.silver.sell);
      const previousPrice = Number(prevSilverSell.current);

      if (currentPrice > previousPrice) {
        setSilverSellColor("#4CAF50"); // Green
        if (silverSellTimer.current) clearTimeout(silverSellTimer.current);
        silverSellTimer.current = setTimeout(() => {
          setSilverSellColor("#333333"); // Back to black
        }, 1000);
      } else if (currentPrice < previousPrice) {
        setSilverSellColor("#F44336"); // Red
        if (silverSellTimer.current) clearTimeout(silverSellTimer.current);
        silverSellTimer.current = setTimeout(() => {
          setSilverSellColor("#333333"); // Back to black
        }, 1000);
      }
    }
    prevSilverSell.current = typeof prices.silver?.sell === "string" ? prices.silver.sell : null;

    // Cleanup function
    return () => {
      if (goldBuyTimer.current) clearTimeout(goldBuyTimer.current);
      if (goldSellTimer.current) clearTimeout(goldSellTimer.current);
      if (silverBuyTimer.current) clearTimeout(silverBuyTimer.current);
      if (silverSellTimer.current) clearTimeout(silverSellTimer.current);
    };
  }, [prices.gold?.buy, prices.gold?.sell, prices.silver?.buy, prices.silver?.sell]);

  if (!fontsLoaded) return null;

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
  };

  const openModal = (itemId: string) => {
    router.push({
      pathname: "/modal",
      params: { itemId }
    });
  };

  const openDrawer = () => {
    router.push("/drawer");
  };

  const openSellers = () => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
    // Navigate to select sellers screen
    router.push("/sellers" as any);
  }

  // Update the goldBuy, goldSell, silverBuy, silverSell variables
  const goldBuy = prices.gold?.buy || "Loading";
  const goldSell = prices.gold?.sell || "Loading";
  const silverBuy = prices.silver?.buy || "Loading";
  const silverSell = prices.silver?.sell || "Loading";

  const onRefresh = async () => {
    setRefreshing(true);
    // If you have a function to reload rates, call it here as well
    setRefreshing(false);
  };

  return (
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
          <Text style={styles.headerTitle}>Live Rates</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#F3B62B"]}
            tintColor="#F3B62B"
          />
        }
      >
        {/* Only show one spinner at a time */}
        {isLoadingInventory && !refreshing && (
          <View style={{ alignItems: "center", marginVertical: 10 }}>
            <ActivityIndicator size="large" color="#F3B62B" />
          </View>
        )}

        {/* Brand/logo section */}
        {isSeller && (
          <View style={styles.top}>
            {user?.brandImage ? (
              <Image
                source={{ uri: user.brandImage }}
                style={styles.brandCoverImage}
              />
            ) : user?.brandName ? (
              <Text style={styles.brandName}>{user.brandName}</Text>
            ) : (
              <Image
                source={images.bhavLogo}
                style={styles.logo}
              />
            )}
          </View>
        )}

        {(isCustomer || isAdmin) && (
          <>
            {selectedSeller ? (
              <View style={styles.top}>
                {selectedSeller.brandImage ? (
                  <Image source={{ uri: selectedSeller.brandImage }} style={styles.brandCoverImage} />
                ) : selectedSeller.brandName ? (
                  <Text style={styles.brandName}>{selectedSeller.brandName}</Text>
                ) : (
                  <Image source={images.bhavLogo} style={styles.logo} />
                )}
              </View>
            ) : (
              <View style={styles.top}>
                <Image source={images.bhavLogo} style={styles.logo} />
              </View>
            )}
          </>
        )}


        {/* Top row */}
        <>
          <View style={{ flexDirection: "row", justifyContent: "center", marginBottom: 5 }}>
            {/* silver dollar */}
            <View style={[styles.card, { marginHorizontal: 5 }]}>
              <LinearGradient
                colors={["#FFF8E1", "#FFF3CD"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <View>
                  <Text style={styles.cardTitle}>Silver $</Text>
                </View>

                <Text style={styles.priceText}>
                  {prices.spotSilver?.comex || "Loading"}
                </Text>

                <View style={styles.detailsContainer}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailValue}>
                      {prices.spotSilver?.low || "Loading"}  |  {prices.spotSilver?.high || "Loading"}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </View>

            {/* USD/INR */}
            <View style={[styles.card, { marginHorizontal: 5 }]}>
              <LinearGradient
                colors={["#FFF8E1", "#FFF3CD"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <View>
                  <Text style={styles.cardTitle}>USD/INR</Text>
                </View>

                <Text style={styles.priceText}>
                  {prices.usdinr?.comex || "Loading"}
                </Text>

                <View style={styles.detailsContainer}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailValue}>
                      {prices.usdinr?.low || "Loading"}  |  {prices.usdinr?.high || "Loading"}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </View>

            {/* gold dollar */}
            <View style={[styles.card, { marginHorizontal: 5 }]}>
              <LinearGradient
                colors={["#FFF8E1", "#FFF3CD"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <View>
                  <Text style={styles.cardTitle}>Gold $</Text>
                </View>

                <Text style={styles.priceText}>
                  {prices.spotGold?.spot || "Loading"}
                </Text>

                <View style={styles.detailsContainer}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailValue}>
                      {prices.spotGold?.low || "Loading"}  |  {prices.spotGold?.high || "Loading"}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
          </View>
        </>


        {/* Bottom row */}
        <>
          <View style={{ flexDirection: "row", justifyContent: "center", marginBottom: 5, }}>
            {/* gold MCX */}
            <View style={[styles.card, { marginHorizontal: 5, width: "50%" }]}>
              <LinearGradient
                colors={["#FFF8E1", "#FFF3CD"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <View>
                  <Text style={styles.cardTitle}>Gold MCX</Text>
                </View>

                <View style={{ flexDirection: "row", justifyContent: "space-evenly", width: "100%" }}>
                  <Text style={[styles.priceText, { color: goldBuyColor }]}>
                    {goldBuy}
                  </Text>
                  <Text style={[styles.priceText, { color: goldSellColor }]}>
                    {goldSell}
                  </Text>
                </View>

                <View style={styles.detailsContainer}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailValue}>
                      {prices.gold?.low || "Loading"}  |  {prices.gold?.high || "Loading"}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </View>

            {/* Silver MCX */}
            <View style={[styles.card, { marginHorizontal: 2, width: "50%" }]}>
              <LinearGradient
                colors={["#FFF8E1", "#FFF3CD"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <View>
                  <Text style={styles.cardTitle}>Silver MCX</Text>
                </View>

                <View style={{ flexDirection: "row", justifyContent: "space-evenly", width: "100%" }}>
                  <Text style={[styles.priceText, { color: silverBuyColor }]}>
                    {silverBuy}
                  </Text>
                  <Text style={[styles.priceText, { color: silverSellColor }]}>
                    {silverSell}
                  </Text>
                </View>

                <View style={styles.detailsContainer}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailValue}>
                      {prices.silver?.low || "Loading"}  |  {prices.silver?.high || "Loading"}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
          </View>
        </>

        <View style={styles.horizontalRow} />


        {/* For Sellers - Show their own inventory */}
        {isSeller && (
          <>
            {/* manage inventory seller */}

            <View style={styles.alertsHeader}>
              <Text style={styles.sectionTitle}>Manage Inventory</Text>
              <TouchableOpacity onPress={editInventory}>
                <PenBoxIcon size={24} color="#333333" />
              </TouchableOpacity>
            </View>

            <View>
              {isLoadingInventory ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#F3B62B" />
                  <Text style={styles.loadingText}>Loading inventory...</Text>
                </View>
              ) : inventoryItems.length > 0 ? (
                inventoryItems
                  .filter(item => (item.sellerId === user?.id || item.sellerId === user?._id) && item.isVisible)
                  .map((item, index) => (
                    <TouchableOpacity onPress={() => openModal(String(item._id ?? item.id))} key={String(item._id ?? item.id ?? index)}>
                      <View key={String(item._id ?? item.id ?? index)} style={styles.inventoryCard}>
                        <View style={styles.inventoryCardHeader}>
                          <Text style={styles.inventoryProductName}>
                            {item.productName}
                          </Text>
                          <View style={styles.ratesContainer}>
                            {/* Only show buy price if buyPremium > 0 */}
                            {item.buyPremium !== 0 && (
                              <View style={styles.buysell}>
                                <Text style={[styles.detailBuyInventory, {
                                  color: item.productType === "Gold" ? goldBuyColor : silverBuyColor,
                                }]}>
                                  {item.productType === "Gold"
                                    ? Number(goldBuy) + item.buyPremium
                                    : item.productType === "Silver"
                                      ? Number(silverBuy) + item.buyPremium
                                      : "Loading"}
                                </Text>
                                <Text style={[styles.buy, {
                                  color: "#333333"
                                }]}>
                                  Buy ₹{item.buyPremium > 0 ? '+' : ''}{item.buyPremium.toLocaleString()}
                                </Text>
                              </View>
                            )}

                            {/* Only show sell price if sellPremium is not 0 */}
                            {item.sellPremium !== 0 && (
                              <View style={styles.buysell}>
                                <Text style={[styles.detailSellInventory, {
                                  color: item.productType === "Gold" ? goldSellColor : silverSellColor
                                }]}>
                                  {item.productType === "Gold"
                                    ? Number(goldSell) + item.sellPremium
                                    : item.productType === "Silver"
                                      ? Number(silverSell) + item.sellPremium
                                      : "Loading"}
                                </Text>
                                <Text style={[styles.sell, {
                                  color: "#333333"
                                }]}>
                                  Sell ₹{item.sellPremium > 0 ? '+' : ''}{item.sellPremium.toLocaleString()}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))
              ) : (
                <Text style={styles.noProductsText}>
                  No products in your inventory
                </Text>
              )}
            </View>
          </>
        )}



        {/* Live Inventory Section */}
        {(isCustomer || isAdmin) && (
          <>
            <View style={styles.alertsHeader}>
              <Text style={styles.sectionTitle}>Live Inventory</Text>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: 150 }}>
                <Text style={styles.selectSeller} onPress={openSellerSelection}>
                  {selectedSeller ? "Change Seller" : "Select Seller"}
                </Text>

                <TouchableOpacity onPress={addSeller} style={{ marginHorizontal: 2 }}>
                  <Plus size={24} color="#333333" />
                </TouchableOpacity>
              </View>
            </View>

            {selectedSeller ? (
              <View>
                {isLoadingInventory ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#F3B62B" />
                    <Text style={styles.loadingText}>Loading inventory...</Text>
                  </View>
                ) : inventoryItems.length > 0 ? (
                  inventoryItems.map((item, index) => (
                    <TouchableOpacity onPress={() => openModal(String(item._id ?? item.id))} key={String(item._id ?? item.id ?? index)}>
                      <View style={styles.inventoryCard}>
                        <View style={styles.inventoryCardHeader}>
                          <Text style={styles.inventoryProductName}>{item.productName}</Text>
                          <View style={styles.ratesContainer}>
                            {item.buyPremium !== 0 && (
                              <View style={styles.buysell}>
                                <Text style={[styles.detailBuyInventory, { color: item.productType === "Gold" ? goldBuyColor : silverBuyColor }]}>
                                  {item.productType === "Gold"
                                    ? Number(goldBuy) + item.buyPremium
                                    : Number(silverBuy) + item.buyPremium}
                                </Text>
                                <Text style={styles.buy}>Buy ₹{item.buyPremium.toLocaleString()}</Text>
                              </View>
                            )}
                            {item.sellPremium !== 0 && (
                              <View style={styles.buysell}>
                                <Text style={[styles.detailSellInventory, { color: item.productType === "Gold" ? goldSellColor : silverSellColor }]}>
                                  {item.productType === "Gold"
                                    ? Number(goldSell) + item.sellPremium
                                    : Number(silverSell) + item.sellPremium}
                                </Text>
                                <Text style={styles.sell}>Sell ₹{item.sellPremium.toLocaleString()}</Text>
                              </View>
                            )}
                          </View>
                        </View>

                        {/* Request buttons for customers */}

                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={styles.noProductsText}>No products available</Text>
                )}
              </View>
            ) : (
              <View style={{ alignItems: "center", marginVertical: 24, marginHorizontal: 16 }}>
                <Text style={{ color: "#999", fontStyle: "italic" }}>Select a seller to view their inventory.</Text>
              </View>
            )}

            {/* Seller Selection Modal */}
            {showSellerModal && (
              <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                  <Text style={styles.modalTitle}>Select Seller</Text>
                  {customerSellers.length === 0 ? (
                    <Text style={{ color: "#999", fontStyle: "italic" }}>No sellers added yet.</Text>
                  ) : (
                    customerSellers.map((seller, index) => (
                      seller ? (
                        <TouchableOpacity key={String((seller as User)?.id ?? (seller as User)?._id ?? index)} onPress={() => handleSelectSeller(seller as User)}>
                          <View style={styles.sellerItem}>
                            <Text style={styles.sellerName}>{(seller as User).brandName || (seller as User).fullName || (seller as User).name}</Text>
                          </View>
                        </TouchableOpacity>
                      ) : null
                    ))
                  )}
                  <TouchableOpacity onPress={closeSellerSelection}>
                    <Text style={styles.closeButton}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}

        {/* Request Modal */}
        <Modal
          visible={showRequestModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowRequestModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.requestModalContainer}>
              <View style={styles.requestModalHeader}>
                <Text style={styles.requestModalTitle}>
                  {requestType === 'buy' ? 'Buy' : 'Sell'} Request
                </Text>
                <TouchableOpacity
                  onPress={() => setShowRequestModal(false)}
                  style={styles.closeModalButton}
                >
                  <X size={24} color="#333333" />
                </TouchableOpacity>
              </View>

              {selectedItem && (
                <View style={styles.requestItemInfo}>
                  <Text style={styles.requestItemName}>{selectedItem.productName}</Text>
                  <Text style={styles.requestItemType}>{selectedItem.productType}</Text>
                </View>
              )}

              <View style={styles.requestForm}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Quantity</Text>
                  <TextInput
                    style={styles.input}
                    value={quantity}
                    onChangeText={setQuantity}
                    keyboardType="numeric"
                    placeholder="Enter quantity"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Message (Optional)</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={message}
                    onChangeText={setMessage}
                    placeholder="Add a message for the seller"
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.submitButton, isSubmittingRequest && styles.submitButtonDisabled]}
                  onPress={submitRequest}
                  disabled={isSubmittingRequest}
                >
                  {isSubmittingRequest ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <Send size={16} color="#ffffff" />
                      <Text style={styles.submitButtonText}>Send Request</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

function createBuyRequest(itemId: string, id: string, sellerId: string): { success: boolean; limitReached?: boolean; error?: string } {
  // TODO: Implement actual buy request logic here.
  // This is a mock implementation for demonstration.
  // Replace with real API call or logic as needed.
  return {
    success: true,
    limitReached: false,
    error: undefined,
  };
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  top: {
    backgroundColor: "#002810",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 10,
    borderRadius: 16,
    height: 150,
    color: "#ffffff",
  },
  brandName: {
    fontSize: 50,
    fontWeight: "500",
    color: "#F3B62B",
    fontFamily: 'LavishlyYours-Regular',
  },
  scrollContent: {
    paddingHorizontal: 15,
    paddingBottom: 100,
    display: "flex",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333333",
    marginVertical: 5,
    marginHorizontal: 5,
  },
  selectSeller: {
    fontSize: 14,
    color: "#1976D2",
    fontWeight: "500",
    borderWidth: 1.3,
    borderColor: "#1976D2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  card: {
    borderRadius: 16,
    marginBottom: 5,
    overflow: "hidden",
    elevation: 2,
    width: "31.5%",
  },
  cardGradient: {
    paddingVertical: 10,
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: "light",
    color: "#333333",
  },
  priceText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333333",
    marginVertical: 5,
  },
  detailsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailItem: {
    alignItems: "center",
  },
  detailValue: {
    fontSize: 10,
    fontWeight: "400",
    color: "#444444",
    marginHorizontal: -10
  },

  // faqs
  alertsContainer: {
    marginTop: 10,
  },
  alertsGradient: {
    borderRadius: 16,
    padding: 16,
    height: 80,
  },
  alertsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 12,
    alignItems: "center",
  },
  alertsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
    marginLeft: 8,
  },
  alertsList: {
    gap: 8,
  },
  alertItem: {
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  alertItemText: {
    fontSize: 14,
    color: "#333333",
  },
  horizontalRow: {
    height: 1, // Thickness of the row
    backgroundColor: "#E0E0E0", // Color of the row
    marginVertical: 5, // Space above and below the row
  },

  logo: {
    width: 200,
    height: 200,
    resizeMode: "contain",
    marginTop: 20,
  },

  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  premiumSectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  premiumSectionIcon: {
    marginRight: 8,
  },
  viewAllText: {
    fontSize: 14,
    color: "#F3B62B",
    fontWeight: "500",
  },

  // inventory
  // Inventory Items Styles
  inventoryContainer: {
    paddingHorizontal: 20,
    paddingRight: 40,
  },
  inventoryCard: {
    width: "100%",
    borderRadius: 12,
    marginBottom: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
    elevation: 2,
    position: "relative",
    borderWidth: 1,
    borderColor: "#d0d0d0",
    backgroundColor: "#eeeeee",
  },
  inventoryCardHeader: {
    padding: 16,
    paddingVertical: 20,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  inventoryProductName: {
    fontSize: 14,
    textAlign: "left",
    fontWeight: "400",
    color: "#333333",
  },
  inventoryDetailsContainer: {
    // paddingHorizontal: 12,
  },
  inventoryDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  inventoryDetailLabel: {
    fontSize: 14,
    color: "#666666",
  },
  inventoryDetailValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333333",
  },
  inventoryCardActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    paddingTop: 0,
  },
  buyButton: {
    backgroundColor: "#F3B62B",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buyButtonDisabled: {
    backgroundColor: "#E53935",
  },
  buyButtonIcon: {
    marginRight: 4,
  },
  buyButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#ffffff",
  },


  contactSellerButton: {
    backgroundColor: "#1976D2",
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  contactSellerButtonText: {
    fontSize: 14,
    paddingHorizontal: 16,
    fontWeight: "500",
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
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },

  // seller section
  sellerCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  sellerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sellerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
  },
  verifiedBadge: {
    backgroundColor: "#4CAF50",
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  verifiedText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "bold",
  },
  codeLabel: {
    fontSize: 14,
    color: "#666666",
    marginTop: 8,
  },
  codeValue: {
    fontWeight: "500",
    color: "#333333",
  },
  locationText: {
    fontSize: 14,
    color: "#333333",
    marginTop: 5,
  },
  productsTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333333",
    marginTop: 12,
    marginBottom: 8,
  },
  productCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
    alignItems: "center",
    width: "100%",
  },
  productImage: {
    width: "100%",
    height: 100,
    borderRadius: 8,
    marginBottom: 4,
  },
  productImagePlaceholder: {
    width: "100%",
    height: 100,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e0e0e0",
    marginBottom: 4,
  },
  productName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333333",
    textAlign: "center",
  },
  premiumContainer: {
    marginTop: 4,
    backgroundColor: "#FFF3CD",
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: "600",
    // color: "#F3B62B",
    textAlign: "center",
  },
  noProductsText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginTop: 8,
  },

  ratesContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    width: "55%",
  },
  // detailValueInventory: {
  //   fontSize: 16,
  //   fontWeight: "500",
  //   alignItems: "flex-end",
  //   justifyContent: "flex-end",
  // },
  detailBuyInventory: {
    fontSize: 16,
    fontWeight: "500",
    paddingHorizontal: 10,
  },
  detailSellInventory: {
    paddingHorizontal: 10,
    fontSize: 16,
    fontWeight: "500",
  },
  // detailValueInventory: {
  //   fontSize: 20,
  //   fontWeight: "bold",
  //   color: "#F44336",
  // },
  sell: {
    fontSize: 10,
    color: "333333"
  },
  buy: {
    fontSize: 10,
    color: "333333",
  },
  buysell: {
    alignItems: "center",
  },
  editButton: {
    backgroundColor: "#1976D2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  editButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },



  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  menuButton: {
    // padding: 5,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
    marginLeft: -20, // Adjust this value to center the title
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
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
  markAllReadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end"
  },

  brandCoverImage: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
  },


  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    backdropFilter: "blur(500px)",
  },
  modalContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    width: "80%",
    maxWidth: 400,
    alignSelf: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 16,
  },
  sellerItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  closeButton: {
    marginTop: 16,
    color: "#1976D2",
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "center",
  },

  requestModalContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    width: "80%",
    maxWidth: 400,
    alignSelf: "center",
  },
  requestModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  requestModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333333",
  },
  closeModalButton: {
    padding: 8,
  },
  requestItemInfo: {
    marginVertical: 16,
  },
  requestItemName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333333",
  },
  requestItemType: {
    fontSize: 14,
    color: "#666666",
  },
  requestForm: {
    marginTop: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d0d0d0",
    borderRadius: 8,
    padding: 12,
  },
  textArea: {
    height: 100,
  },
  submitButton: {
    backgroundColor: "#1976D2",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#E53935",
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#ffffff",
  },
  requestButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  requestButton: {
    backgroundColor: "#1976D2",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buyRequestButton: {
    backgroundColor: "#4CAF50",
  },
  sellRequestButton: {
    backgroundColor: "#F44336",
  },
  requestButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#ffffff",
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 14,
    color: "#333333",
    marginTop: 16,
  },
});


