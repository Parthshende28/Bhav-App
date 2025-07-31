import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useAuthStore, User, InventoryItem } from '@/store/auth-store';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { X, Plus, ArrowLeft, Search, ShoppingBag, IndianRupee, ExternalLink } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { userAPI, inventoryAPI } from '@/services/api';



const SellerData = () => {
  const {
    user,
    getSellerReferralsForCustomer,
    hasReachedSellerReferralLimit,
    removeSellerReferral,
    getUserById
  } = useAuthStore();

  const [referralCode, setReferralCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [addedSellers, setAddedSellers] = useState<User[]>([]);
  const [sellerProducts, setSellerProducts] = useState<{ [key: string]: InventoryItem[] }>({});
  const [expandedSeller, setExpandedSeller] = useState<string | null>(null);

  // Add this useEffect to always fetch the seller list from backend
  useEffect(() => {
    async function fetchAddedSellersAndProducts() {
      if (user) {
        try {
          const referralsRes = await userAPI.getSellerReferrals();
          const sellers: User[] = (referralsRes.data?.sellerReferrals || []).map((seller: any) => ({
            ...seller,
            id: seller._id || seller.id,
            _id: seller._id || seller.id,
          }));
          setAddedSellers(sellers);

          // Fetch public inventory for each seller
          const productsMap: { [key: string]: InventoryItem[] } = {};
          await Promise.all(
            sellers.map(async seller => {
              try {
                // Fetch only public (visible) products for each seller
                const productsRes = await inventoryAPI.getPublicInventory(seller.id);
                const products = productsRes.data?.items || [];
                productsMap[seller.id] = products;
              } catch (err) {
                productsMap[seller.id] = [];
              }
            })
          );
          setSellerProducts(productsMap);
        } catch (err) {
          setAddedSellers([]);
          setSellerProducts({});
        }
      }
    }
    fetchAddedSellersAndProducts();
  }, [user]);

  // Load existing sellers that the customer has added
  const loadExistingSellers = async () => {
    if (!user) return;

    try {
      // 1. Fetch all seller referrals for this user from backend
      const referralsRes = await userAPI.getSellerReferrals();
      // referrals is now an array of user objects (populated)
      const sellers: User[] = referralsRes.data?.referrals || [];
      setAddedSellers(sellers);

      // 2. Fetch products for each seller using public inventory API
      const productsMap: { [key: string]: InventoryItem[] } = {};
      await Promise.all(
        sellers.map(async seller => {
          try {
            const productsRes = await inventoryAPI.getPublicInventory(seller.id);
            const products = productsRes.data?.items || [];
            productsMap[seller.id] = products;
          } catch (err) {
            productsMap[seller.id] = [];
          }
        })
      );
      setSellerProducts(productsMap);
    } catch (err) {
      setAddedSellers([]);
      setSellerProducts({});
    }
  };

  const handleAddSeller = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to add sellers');
      return;
    }

    if (!referralCode.trim()) {
      setError('Please enter a referral code');
      return;
    }

    // Check if reached limit
    if (hasReachedSellerReferralLimit(user.id)) {
      Alert.alert(
        'Limit Reached',
        "You've reached the limit of 15 sellers. Please remove one to add another."
      );
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Use backend API to find seller by referral code (phone number)
      const response = await userAPI.getSellerByReferralCode(referralCode.trim());
      const seller = response.data?.seller;

      if (!seller) {
        setError('Invalid referral code. Please check and try again.');
        setIsLoading(false);
        return;
      }

      // Check if seller is already added
      if (addedSellers.some(s => s.id === seller._id || s._id === seller._id)) {
        setError('You have already added this seller');
        setIsLoading(false);
        return;
      }

      // Add seller referral using backend API
      const addResult = await userAPI.addSellerReferral(seller._id);

      if (addResult.data?.success) {
        // Refresh the seller list from backend to ensure consistency
        await loadExistingSellers();
        // Clear input
        setReferralCode('');
        // Show success message
        Alert.alert(
          'Seller Added!',
          `${seller.brandName || seller.fullName || seller.name} has been added successfully. You can now see their products.`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate back to rates screen to show the updated seller list
                router.push('/(app)/(tabs)/rates');
              }
            }
          ]
        );
        // Trigger haptic feedback on success
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } else {
        setError(addResult.data?.message || 'Failed to add seller');

        // Trigger haptic feedback on error
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      }
    } catch (err: any) {
      console.error('Error adding seller:', err);
      setError(err?.response?.data?.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveSeller = async (sellerId: string) => {
    if (!user) return;

    // Show confirmation dialog
    Alert.alert(
      'Remove Seller',
      'Do you really want to remove this seller?',
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            // Trigger haptic feedback
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }

            try {
              // Remove the seller directly using the seller ID
              // The backend will remove this seller ID from the customer's sellerReferrals array
              const removeResult = await userAPI.removeSellerReferral(sellerId);

              if (removeResult.status === 200 || removeResult.data?.success) {
                // Remove seller from local state
                setAddedSellers(prev => prev.filter(seller => seller.id !== sellerId));

                // Remove seller products from state
                setSellerProducts(prev => {
                  const updated = { ...prev };
                  delete updated[sellerId];
                  return updated;
                });

                // If this was the expanded seller, collapse it
                if (expandedSeller === sellerId) {
                  setExpandedSeller(null);
                }

                // Clear selected seller from auth store if it matches the removed seller
                const { setSelectedSeller } = useAuthStore.getState();
                if (setSelectedSeller) {
                  setSelectedSeller(null);
                }

                // Show success message
                Alert.alert(
                  'Success',
                  'Seller removed successfully',
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        // Navigate back to rates screen to show the updated seller list
                        router.push('/(app)/(tabs)/rates');
                      }
                    }
                  ]
                );
              } else {
                Alert.alert('Error', 'Failed to remove seller from backend');
              }
            } catch (error: any) {
              console.error('Error removing seller:', error);
              Alert.alert('Error', error?.response?.data?.message || 'Failed to remove seller');
            }
          },
        },
      ]
    );
  };

  const toggleSellerExpansion = async (sellerId: string) => {
    // Trigger haptic feedback
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }

    setExpandedSeller(prev => {
      if (prev === sellerId) {
        return null; // Collapse if already expanded
      } else {
        // Fetch latest products for this seller
        (async () => {
          try {
            const productsRes = await inventoryAPI.getPublicInventory(sellerId);
            const products = productsRes.data?.items || [];
            setSellerProducts(prevProducts => ({
              ...prevProducts,
              [sellerId]: products,
            }));
          } catch (err) {
            setSellerProducts(prevProducts => ({
              ...prevProducts,
              [sellerId]: [],
            }));
          }
        })();
        return sellerId;
      }
    });
  };

  const navigateToSellerProfile = (sellerId: string) => {
    router.push(`/seller-profile/${sellerId}`);
  };

  // Refresh products when screen is focused
  useFocusEffect(
    useCallback(() => {
      if (user) {
        const fetchProducts = async () => {
          const updatedProducts: { [key: string]: InventoryItem[] } = {};
          await Promise.all(
            addedSellers.map(async seller => {
              try {
                const productsRes = await inventoryAPI.getPublicInventory(seller.id);
                const products = productsRes.data?.items || [];
                updatedProducts[seller.id] = products;
              } catch (err) {
                updatedProducts[seller.id] = [];
              }
            })
          );
          setSellerProducts(updatedProducts);
        };
        fetchProducts();
      }
    }, [addedSellers, user])
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}>
          <ArrowLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Sellers</Text>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.formTitle}>Enter Seller Referral Code</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={referralCode}
            onChangeText={setReferralCode}
            placeholder="Enter referral code"
            placeholderTextColor="#999"
            autoCapitalize="characters"
          />
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddSeller}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.addButtonText}>Add Seller</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.sellerCount}>
          Added Sellers: {addedSellers.length}/15
        </Text>
      </View>

      {addedSellers.length > 0 ? (
        <FlatList
          data={addedSellers}
          keyExtractor={(item, index) => String(item.id ?? item._id ?? index)}
          renderItem={({ item }: { item: User }) => (
            <View style={styles.sellerCard}>
              <View style={styles.sellerHeader}>
                <TouchableOpacity
                  style={styles.sellerNameContainer}
                  onPress={() => toggleSellerExpansion(item.id)}
                >
                  <Text style={styles.sellerName}>{item.brandName || item.fullName || item.name}</Text>
                  {item.sellerVerified && (
                    <View style={styles.verifiedBadge}>
                      <Text style={styles.verifiedText}>Verified</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <View style={styles.sellerActions}>
                  {/* <TouchableOpacity
                    onPress={() => navigateToSellerProfile(item.id)}
                    style={styles.viewProfileButton}
                  >
                    <ExternalLink size={16} color="#007AFF" />
                  </TouchableOpacity> */}


                  <TouchableOpacity
                    onPress={() => handleRemoveSeller(item.id)}
                    style={styles.removeButton}
                  >
                    <X size={18} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.sellerInfo}>
                <Text style={styles.codeLabel}>Code: <Text style={styles.codeValue}>{item.phone}</Text></Text>

                {item.city && (
                  <Text style={styles.locationText}>
                    {item.city}{item.state ? `, ${item.state}` : ""}
                  </Text>
                )}
              </View>

              {/* Always show products for each seller */}
              <View style={styles.productsContainer}>
                <Text style={styles.productsTitle}>Products:</Text>
                {sellerProducts[item.id] && sellerProducts[item.id].length > 0 ? (
                  <FlatList
                    data={sellerProducts[item.id]}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(product, index) => String(product.id ?? product._id ?? index)}
                    renderItem={({ item: product }) => (
                      <View style={styles.productCard}>
                        {product.image ? (
                          <Image
                            source={{ uri: `${product.image}?w=200&h=200&fit=crop&auto=format` }}
                            style={styles.productImage}
                          />
                        ) : (
                          <View style={styles.productImagePlaceholder}>
                            <ShoppingBag size={24} color="#e0e0e0" />
                          </View>
                        )}
                        <Text style={styles.productName}>{product.productName}</Text>

                        {product.sellPremium > 0 && (
                          <View style={styles.premiumContainer}>
                            <IndianRupee size={14} color="#007AFF" />
                            <Text style={styles.productPrice}>{product.sellPremium.toLocaleString()}</Text>
                          </View>
                        )}
                      </View>
                    )}
                  />
                ) : (
                  <Text style={styles.noProductsText}>No products available</Text>
                )}
              </View>
            </View>
          )}
        />
      ) : (
        <View style={styles.emptyState}>
          <Search size={64} color="#e0e0e0" style={styles.emptyStateIcon} />
          <Text style={styles.emptyStateText}>
            No sellers added yet.
          </Text>
          <Text style={styles.emptyStateText}>
            Enter a referral code to add a seller.
          </Text>
          <Text style={styles.emptyStateSubtext}>
            Ask your preferred sellers for their referral codes to add them here.
          </Text>
        </View>
      )
      }
    </SafeAreaView >
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
    color: '#333333',
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333333',
  },
  errorText: {
    color: '#FF3B30',
    marginBottom: 12,
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  input: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    color: '#333333',
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 100,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  sellerCount: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  sellerCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sellerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sellerNameContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginRight: 8,
  },
  verifiedBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#4CAF50',
  },
  sellerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewProfileButton: {
    padding: 8,
    marginRight: 4,
  },
  removeButton: {
    padding: 8,
  },
  sellerInfo: {
    marginBottom: 12,
  },
  codeLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  codeValue: {
    fontWeight: '500',
    color: '#333333',
  },
  locationText: {
    fontSize: 14,
    color: '#666666',
  },
  productsContainer: {
    marginBottom: 12,
  },
  productsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333333',
  },
  productCard: {
    width: 140,
    marginRight: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 100,
    resizeMode: 'cover',
  },
  productImagePlaceholder: {
    width: '100%',
    height: 100,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    marginTop: 8,
    marginHorizontal: 8,
  },
  premiumContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
    marginHorizontal: 8,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  noProductsText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  expandButton: {
    backgroundColor: '#F0F7FF',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  expandButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 50,
  },
  emptyStateIcon: {
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default SellerData;