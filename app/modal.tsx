import { StatusBar } from "expo-status-bar";
import { Platform, StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, Linking } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useAuthStore } from "@/store/auth-store";
import { useMetalPrices } from "@/hooks/useMetalPrices";
import { MaterialCommunityIcons as Icon, Feather as Icon2 } from "@expo/vector-icons";
import React, { useState, useEffect, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";

export default function ModalScreen() {
  const { itemId } = useLocalSearchParams();
  const { prices } = useMetalPrices();
  const { getAllInventoryItems, updateInventoryItemAPI, user, getInventoryItemsForSellerAPI, setInventoryItems, toggleInventoryItemVisibilityAPI, selectedSeller, getPublicInventoryForSellerAPI } = useAuthStore();

  const isSeller = user?.role === "seller";
  const isCustomer = user?.role === "customer";
  const isAdmin = user?.role === "admin";

  const [item, setItem] = useState<any>(null);
  const [editBuyPremium, setEditBuyPremium] = useState('');
  const [editSellPremium, setEditSellPremium] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);


  useEffect(() => {
    const fetchItem = async () => {
      try {
        // Don't refetch if we already have the item and it matches the itemId
        if (item && (item._id === itemId || item.id === itemId)) {
          console.log('Item already loaded, skipping fetch');
          return;
        }

        setIsLoading(true);
        let found = null;

        if (typeof itemId !== 'string' || !itemId || itemId === 'undefined' || itemId === 'null') {
          console.log('Invalid itemId:', itemId);
          setIsLoading(false);
          setItem(null);
          Alert.alert("Error", "Invalid product information.");
          router.back();
          return;
        }

        // For customers, ensure they have a selectedSeller
        if (isCustomer && !selectedSeller) {
          console.log('Customer has no selectedSeller');
          setIsLoading(false);
          setItem(null);
          Alert.alert("Error", "No seller selected. Please select a seller first.");
          router.back();
          return;
        }

        // For customers, also ensure selectedSeller has valid ID
        if (isCustomer && selectedSeller && !selectedSeller.id && !selectedSeller._id) {
          console.log('Customer selectedSeller has no valid ID');
          setIsLoading(false);
          setItem(null);
          Alert.alert("Error", "Invalid seller information. Please select a seller again.");
          router.back();
          return;
        }



        if (isSeller && user) {
          // For sellers, fetch their inventory from API
          const sellerId = (user.id || user._id);
          if (sellerId) {
            const result = await getInventoryItemsForSellerAPI(sellerId);
            if (result.success && result.items) {
              found = result.items.find((i: any) => i._id === itemId || i.id === itemId);

            }
          }
        }

        // If not found as seller, or if customer/admin, try public inventory
        if (!found) {
          let sellerId = null;

          // For customers/admins, prioritize selectedSeller
          if (isCustomer || isAdmin) {
            sellerId = selectedSeller?.id || selectedSeller?._id;
          } else {
            // For sellers viewing other sellers, use selectedSeller or fallback to user
            sellerId = selectedSeller?.id || selectedSeller?._id || user?.id || user?._id;
          }

          if (sellerId) {
            console.log('Fetching public inventory for seller:', sellerId, 'User role:', user?.role);
            const result = await getPublicInventoryForSellerAPI(sellerId);
            if (result.success && result.items) {
              found = result.items.find((i: any) => i._id === itemId || i.id === itemId);
              console.log('Found in public inventory:', !!found, 'Items count:', result.items.length);
            } else {
              console.log('Public inventory API failed:', result.error);
            }
          } else {
            console.log('No seller ID available for public inventory fetch');
          }
        }

        if (found) {
          setItem(found);
          setEditBuyPremium(found.buyPremium?.toString() || '0');
          setEditSellPremium(found.sellPremium?.toString() || '0');
          setIsVisible(found.isVisible !== false);
        } else {
          console.log('Item not found in any inventory');
          // For customers, show a specific error if no selectedSeller
          if (isCustomer && !selectedSeller) {
            Alert.alert("Error", "No seller selected. Please select a seller first.");
          } else {
            Alert.alert("Error", "Product not found. It may have been removed or is not available.");
          }
        }
      } catch (error) {
        console.error('Error fetching item:', error);
        Alert.alert("Error", "Failed to load product details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchItem();

    // Cleanup function to prevent memory leaks
    return () => {
      // Reset state when component unmounts
      setItem(null);
      setIsLoading(false);
      setIsUpdating(false);
    };
  }, [itemId, user?.id, user?._id, user?.role, selectedSeller?.id, selectedSeller?._id]);

  const handleUpdateProduct = async () => {
    if (!item) return;

    // Validate inputs
    if (isNaN(Number(editBuyPremium)) || isNaN(Number(editSellPremium))) {
      Alert.alert("Error", "Please enter valid premium values");
      return;
    }

    setIsUpdating(true);
    try {
      const result = await updateInventoryItemAPI(item._id || item.id, {
        buyPremium: Number(editBuyPremium),
        sellPremium: Number(editSellPremium),
        isVisible,
      });

      if (result.success) {
        // Update the local item state immediately
        const updatedItem = { ...item, buyPremium: Number(editBuyPremium), sellPremium: Number(editSellPremium), isVisible };
        setItem(updatedItem);

        // Refresh the entire inventory to ensure consistency
        await refreshInventory();

        Alert.alert("Success", "Product updated successfully!", [
          {
            text: "OK",
            onPress: () => {
              // Don't navigate back automatically, let user decide
              router.back();
            }
          }
        ]);
      } else {
        Alert.alert("Error", result.error || "Failed to update product");
      }
    } catch (error) {
      console.error("Error updating product:", error);
      Alert.alert("Error", "Failed to update product");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleVisibility = async () => {
    if (!item) return;

    try {
      const result = await toggleInventoryItemVisibilityAPI(item._id || item.id);

      if (result.success) {
        const newVisibility = !isVisible;
        setIsVisible(newVisibility);
        setItem({ ...item, isVisible: newVisibility });

        // Refresh the entire inventory to ensure consistency
        await refreshInventory();

        Alert.alert(
          "Success",
          newVisibility ? "Product made visible successfully!" : "Product hidden successfully!"
        );
      } else {
        Alert.alert("Error", result.error || "Failed to update product visibility");
      }
    } catch (error) {
      console.error("Error toggling visibility:", error);
      Alert.alert("Error", "Failed to update product visibility");
    }
  };

  const refreshInventory = async () => {
    if (user && (user.id || user._id)) {
      try {
        const sellerId = user.id || user._id;
        if (!sellerId) {
          console.log('No seller ID available for inventory refresh');
          return;
        }
        const result = await getInventoryItemsForSellerAPI(sellerId);
        if (result.success && result.items) {
          setInventoryItems(result.items);
          console.log('Inventory refreshed, items count:', result.items.length);
        }
      } catch (error) {
        console.error("Error refreshing inventory:", error);
      }
    }
  };

  // Add focus effect to refresh inventory when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user?.role === 'seller') {
        refreshInventory();
      }
    }, [user])
  );

  // Add function to handle calling the seller
  const handleCallSeller = async () => {
    if (!item?.sellerId) {
      Alert.alert("Error", "Seller information not available.");
      return;
    }

    try {
      // Get seller information
      const { getUserById } = useAuthStore.getState();
      const seller = getUserById(item.sellerId);

      if (!seller || !seller.phone) {
        Alert.alert("Error", "Seller's phone number is not available.");
        return;
      }

      // Create phone URL
      const phoneUrl = `tel:${seller.phone}`;

      // Check if device can handle the phone URL
      const canOpen = await Linking.canOpenURL(phoneUrl);

      if (canOpen) {
        await Linking.openURL(phoneUrl);
      } else {
        Alert.alert("Error", "Unable to make phone calls on this device.");
      }
    } catch (error) {
      console.error("Error calling seller:", error);
      Alert.alert("Error", "Failed to initiate call. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
        <StatusBar style={Platform.OS === "ios" ? "light" : "auto"} />
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Product not found</Text>
        <StatusBar style={Platform.OS === "ios" ? "light" : "auto"} />
      </View>
    );
  }

  return (
    <>
      {isSeller && (
        <View style={styles.container}>
          {/* Only the modal content (no outer container or StatusBar) */}
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{item.productName}</Text>
              <TouchableOpacity onPress={() => router.back()}>
                <Icon2 name="x" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <View style={styles.productDetails}>
              <Text style={styles.detailLabel}>Product Type:</Text>
              <Text style={styles.detailValue}>{item.productType}</Text>
              <Text style={styles.detailLabel}>Today's Buy:</Text>
              <Text style={styles.highRate}>
                {item.productType === "Gold"
                  ? prices.gold?.buy
                  : item.productType === "Silver"
                    ? prices.silver?.buy
                    : "Loading..."}
              </Text>
              <Text style={styles.detailLabel}>Today's Sell:</Text>
              <Text style={styles.lowRate}>
                {item.productType === "Gold"
                  ? prices.gold?.sell
                  : item.productType === "Silver"
                    ? prices.silver?.sell
                    : "Loading..."}
              </Text>
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Buy Premium (₹)</Text>
              <TextInput
                style={styles.input}
                value={editBuyPremium}
                onChangeText={setEditBuyPremium}
                keyboardType="default"
                placeholder="Enter buy premium"
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Sell Premium (₹)</Text>
              <TextInput
                style={styles.input}
                value={editSellPremium}
                onChangeText={setEditSellPremium}
                keyboardType="default"
                placeholder="Enter sell premium"
              />
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.hideButton]}
                onPress={handleToggleVisibility}
              >
                <Text style={styles.buttonText}>{isVisible ? "Hide" : "Unhide"}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.updateButton]}
                onPress={handleUpdateProduct}
                disabled={isUpdating}
              >
                <Text style={styles.buttonText}>
                  {isUpdating ? "Updating..." : "Update"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {(isCustomer || isAdmin) && (
        <View style={styles.container}>
          {/* Only the modal content (no outer container or StatusBar) */}
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{item.productName}</Text>
              <View style={styles.headerActions}>
                <TouchableOpacity
                  style={styles.phoneButton}
                  onPress={handleCallSeller}
                >
                  <Icon2 name="phone" color="#333" size={22} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.phoneButton} onPress={() => router.back()}>
                  <Icon2 name="x" size={24} color="#333" />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.productDetails}>
              <Text style={styles.detailLabel}>Product Type:</Text>
              <Text style={styles.detailValue}>{item.productType}</Text>
              <Text style={styles.detailLabel}>Today's Buy:</Text>
              <Text style={styles.highRate}>
                {item.productType === "Gold"
                  ? prices.gold?.buy
                  : item.productType === "Silver"
                    ? prices.silver?.buy
                    : "Loading..."}
              </Text>
              <Text style={styles.detailLabel}>Today's Sell:</Text>
              <Text style={styles.lowRate}>
                {item.productType === "Gold"
                  ? prices.gold?.sell
                  : item.productType === "Silver"
                    ? prices.silver?.sell
                    : "Loading..."}
              </Text>
              <Text style={styles.inputLabel}>Buy Premium (₹): <Text style={{ fontWeight: "bold" }}>{item.buyPremium}</Text></Text>
              <Text style={styles.inputLabel}>Sell Premium (₹): <Text style={{ fontWeight: "bold" }}>{item.sellPremium}</Text></Text>
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.buyButton]}
                onPress={async () => {
                  if (!item || !user) {
                    Alert.alert("Error", "Please login to send requests.");
                    return;
                  }

                  try {
                    // Calculate the captured amount for buy request
                    let capturedAmount = 0;
                    if (item.productType === "Gold") {
                      capturedAmount = Number(prices.gold?.buy || 0) + (item.buyPremium || 0);
                    } else if (item.productType === "Silver") {
                      capturedAmount = Number(prices.silver?.buy || 0) + (item.buyPremium || 0);
                    }

                    // Ensure capturedAmount is valid
                    if (!capturedAmount || isNaN(capturedAmount) || capturedAmount <= 0) {
                      Alert.alert("Error", "Unable to calculate price. Please try again later.");
                      return;
                    }

                    const result = await useAuthStore.getState().createRequestAPI(item._id || item.id, 'buy', '', '', capturedAmount);
                    if (result.success) {
                      Alert.alert(
                        "Buy Request Sent",
                        "Your buy request has been sent to the seller. You will be notified when they respond.",
                        [{ text: "OK", onPress: () => router.back() }]
                      );
                    } else {
                      Alert.alert("Error", result.error || "Failed to send buy request.");
                    }
                  } catch (error) {
                    console.error("Error sending buy request:", error);
                    Alert.alert("Error", "Failed to send buy request. Please try again.");
                  }
                }}
              >
                <Text style={styles.buttonText}>Buy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.contactButton]}
                onPress={async () => {
                  if (!item || !user) {
                    Alert.alert("Error", "Please login to send requests.");
                    return;
                  }

                  try {
                    // Calculate the captured amount for sell request
                    let capturedAmount = 0;
                    if (item.productType === "Gold") {
                      capturedAmount = Number(prices.gold?.sell || 0) + (item.sellPremium || 0);
                    } else if (item.productType === "Silver") {
                      capturedAmount = Number(prices.silver?.sell || 0) + (item.sellPremium || 0);
                    }

                    // Ensure capturedAmount is valid
                    if (!capturedAmount || isNaN(capturedAmount) || capturedAmount <= 0) {
                      Alert.alert("Error", "Unable to calculate price. Please try again later.");
                      return;
                    }

                    const result = await useAuthStore.getState().createRequestAPI(item._id || item.id, 'sell', '', '', capturedAmount);
                    if (result.success) {
                      Alert.alert(
                        "Sell Request Sent",
                        "Your sell request has been sent to the seller. You will be notified when they respond.",
                        [{ text: "OK", onPress: () => router.back() }]
                      );
                    } else {
                      Alert.alert("Error", result.error || "Failed to send sell request.");
                    }
                  } catch (error) {
                    console.error("Error sending sell request:", error);
                    Alert.alert("Error", "Failed to send sell request. Please try again.");
                  }
                }}
              >
                <Text style={styles.buttonText}>Sell</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    width: "90%",
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  productDetails: {
    backgroundColor: "#f5f5f5",
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
    marginBottom: 12,
  },
  highRate: {
    fontSize: 16,
    color: "#4CAF50",
    fontWeight: "500",
    marginBottom: 8,
  },
  lowRate: {
    fontSize: 16,
    color: "#F44336",
    fontWeight: "500",
    marginBottom: 8,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  hideButton: {
    backgroundColor: "#1976D2",
    marginRight: 8,
  },
  updateButton: {
    backgroundColor: "#4CAF50",
    marginLeft: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  buyButton: {
    backgroundColor: "#4CAF50",
    marginRight: 8,
  },
  contactButton: {
    backgroundColor: "#1976D2",
    marginLeft: 8,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  phoneButton: {
    padding: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});