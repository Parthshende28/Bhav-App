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
  Alert,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { FileText, Upload, CheckCircle, Camera, Menu, AlertCircle, X, User, Mail, Phone, MapPin, Store, Plus, ArrowUpCircle, Save, LogOut, Trash, Trash2 } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { images } from "@/constants/images";
import { router } from "expo-router";
import { useAuthStore } from "@/store/auth-store";
import { cloudinaryAPI } from "@/services/cloudinary";
import { userAPI } from "@/services/api";
import TermsLinks from "@/components/TermsLinks";
import SubscriptionStatus from "@/components/SubscriptionStatus";


export default function ProfileScreen() {
  const { user, updateUser, token, logout } = useAuthStore();

  const [fullName, setFullName] = useState(user?.fullName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState(user?.address || "");
  const [about, setAbout] = useState(user?.about || ""); // Added about state
  const [brandName, setBrandName] = useState(user?.brandName || "");
  const [whatsappNumber, setWhatsappNumber] = useState(user?.whatsappNumber || "");
  const [instagramHandle, setInstagramHandle] = useState(user?.instagramHandle || "");
  const [location, setLocation] = useState(user?.location || "");
  const [profileImage, setProfileImage] = useState(user?.profileImage || null);
  const [brandImage, setBrandImage] = useState(user?.brandImage || null);
  const [catalogueImages, setCatalogueImages] = useState<string[]>(user?.catalogueImages || []);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState("");

  // Referral code activation state
  const [referralCode, setReferralCode] = useState("M@uryanJēwels24");
  const [isActivating, setIsActivating] = useState(false);

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
      setAddress(user.address || "");
      setAbout(user.about || "");
      setBrandName(user.brandName || "");
      setWhatsappNumber(user.whatsappNumber || "");
      setInstagramHandle(user.instagramHandle || "");
      setLocation(user.location || "");
      setProfileImage(user.profileImage || null);
      setBrandImage(user.brandImage || null);
      setCatalogueImages(user.catalogueImages || []);
    }
  }, [user]);

  const pickImage = async () => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      try {
        setIsLoading(true);
        // Upload to Cloudinary
        const cloudinaryUrl = await cloudinaryAPI.uploadImage(
          result.assets[0].uri,
          'profile',
          'profile.jpg'
        );
        setProfileImage(cloudinaryUrl);
      } catch (error) {
        console.error('Error uploading profile image:', error);
        Alert.alert('Error', 'Failed to upload profile image');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const pickBrandImage = async () => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      try {
        setIsLoading(true);
        // Upload to Cloudinary
        const cloudinaryUrl = await cloudinaryAPI.uploadImage(
          result.assets[0].uri,
          'profile',
          'brand.jpg'
        );
        setBrandImage(cloudinaryUrl);
      } catch (error) {
        console.error('Error uploading brand image:', error);
        Alert.alert('Error', 'Failed to upload brand image');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const pickCatalogueImage = async () => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      try {
        setIsLoading(true);
        // Upload to Cloudinary
        const cloudinaryUrl = await cloudinaryAPI.uploadImage(
          result.assets[0].uri,
          'catalogue',
          `catalogue_${Date.now()}.jpg`
        );
        setCatalogueImages(prev => [...prev, cloudinaryUrl]);
      } catch (error) {
        console.error('Error uploading catalogue image:', error);
        Alert.alert('Error', 'Failed to upload catalogue image');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const removeCatalogueImage = (index: number) => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }

    setCatalogueImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError("");

    try {
      // Create user data object with updated fields
      const userData = {
        fullName,
        name: fullName, // Update name to match fullName
        email,
        phone,
        address,
        profileImage: profileImage ?? undefined,
        brandImage: user?.role === 'seller' ? (brandImage ?? undefined) : undefined, // Add this line
        brandName: user?.role === 'seller' ? brandName : undefined, // Only include brandName for sellers
        about: user?.role === 'seller' ? about : undefined, // Only include about for sellers
        whatsappNumber: user?.role === 'seller' ? whatsappNumber : undefined, // Only include whatsappNumber for sellers
        instagramHandle: user?.role === 'seller' ? instagramHandle : undefined, // Only include instagramHandle for sellers
        location: user?.role === 'seller' ? location : undefined, // Only include location for sellers
        catalogueImages: user?.role === 'seller'
          ? (catalogueImages.length > 0 ? catalogueImages : undefined)
          : undefined, // Pass array directly
      };

      // Call updateUser function from auth store
      const result = await updateUser(userData);

      if (result.success) {
        // Trigger haptic feedback on success
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);

        // Show success alert
        if (Platform.OS === 'web') {
          alert("Profile updated successfully!");
        } else {
          Alert.alert(
            "Profile Updated",
            "Your profile information has been updated successfully.",
            [{ text: "OK" }]
          );
        }
      } else {
        setError(result.error || "Failed to update profile. Please try again.");
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Failed to update profile. Please try again.");
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle referral code activation
  const handleActivateSubscription = async () => {
    if (!referralCode.trim()) {
      Alert.alert("Error", "Please enter a referral code");
      return;
    }

    setIsActivating(true);
    try {
      const response = await userAPI.updateSubscriptionWithReferral(referralCode.trim());

      if (response.data.success) {
        // Update user data in the store
        const updatedUser = {
          ...user,
          isPremium: response.data.user.isPremium,
          premiumPlan: response.data.user.premiumPlan,
          subscriptionStatus: response.data.user.subscriptionStatus,
          subscriptionStartDate: response.data.user.subscriptionStartDate,
          subscriptionEndDate: response.data.user.subscriptionEndDate,
          usedReferralCode: response.data.user.usedReferralCode
        };

        updateUser(updatedUser);

        Alert.alert(
          "Success!",
          "Your 3-month free subscription has been activated! You can now manage your inventory.",
          [{ text: "OK" }]
        );
      } else {
        Alert.alert("Error", response.data.message || "Failed to activate subscription");
      }
    } catch (error: any) {
      console.error("Error activating subscription:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to activate subscription. Please try again."
      );
    } finally {
      setIsActivating(false);
    }
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account?\nThis action cannot be undone",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Permanently",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Deleting Your Account Permanently",
              "Please click Yes to confirm",
              [
                { text: "No", style: "cancel" },
                {
                  text: "Yes",
                  style: "destructive",
                  onPress: async () => {
                    try {
                      setIsLoading(true);

                      // Check backend connectivity first
                      const isBackendReachable = await checkBackendConnection();
                      if (!isBackendReachable) {
                        Alert.alert(
                          "Connection Error",
                          "Cannot connect to server. Please check your internet connection and try again."
                        );
                        return;
                      }

                      // Call backend API to delete account
                      console.log("Attempting to delete account for user:", user?.id);
                      console.log("Using API base URL:", 'https://bhav-backend.onrender.com/api');
                      console.log("Full endpoint:", 'https://bhav-backend.onrender.com/api/users/delete-account');

                      const result = await userAPI.deleteAccount(user?.id || '');

                      if (result.status === 200) {
                        // Account deleted successfully, logout user
                        Alert.alert(
                          "Account Deleted",
                          "Your account has been permanently deleted. You will be logged out.",
                          [
                            {
                              text: "OK",
                              onPress: () => {
                                // Clear user data and redirect to login
                                logout();
                                router.replace("/auth/login");
                              }
                            }
                          ]
                        );
                      } else {
                        Alert.alert("Error", `Failed to delete account. Status: ${result.status}`);
                      }
                    } catch (error: any) {
                      console.error("Error deleting account:", error);

                      let errorMessage = "Failed to delete account. Please try again.";

                      if (error.response) {
                        // Server responded with error status
                        errorMessage = `Server error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`;
                      } else if (error.request) {
                        // Request was made but no response received
                        errorMessage = "Network error: No response from server. Please check your internet connection.";
                      } else {
                        // Something else happened
                        errorMessage = `Error: ${error.message || 'Unknown error occurred'}`;
                      }

                      Alert.alert("Error", errorMessage);
                    } finally {
                      setIsLoading(false);
                    }
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  // Use a placeholder image if no profile image is set
  const getProfileImage = () => {
    if (profileImage) {
      return profileImage;
    }
    return images.profilePlaceholder;
  };
  // Use a placeholder image if no brand image is set
  const getBrandImage = () => {
    if (brandImage) return brandImage;
  };

  // Handle upgrade to seller
  const handleUpgradeToSeller = () => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }

    if (!user) return;

    // Navigate to subscription page with user ID
    router.push({
      pathname: "/auth/subscription",
      params: { userId: user.id }
    });
  };

  const openDrawer = () => {
    router.push("/drawer");
  };

  // Check if backend is reachable
  const checkBackendConnection = async () => {
    try {
      const response = await fetch('https://bhav-backend.onrender.com/');
      return response.ok;
    } catch (error) {
      console.error("Backend connection check failed:", error);
      return false;
    }
  };


  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={openDrawer}
        >
          <Menu size={24} color="#333333" />
        </TouchableOpacity>
        {/* <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>My Profile</Text>
        </View> */}
      </View>


      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>My Profile</Text>
            <Text style={styles.headerSubtitle}>
              Manage your personal information
            </Text>
          </View>

          <View style={styles.profileImageContainer}>
            {/* Brand Cover Image - Only for sellers */}
            {user?.role === 'seller' && (
              <View style={styles.top}>
                {/* Show brand image if available, otherwise show brand name */}
                {brandImage ? (
                  <Image
                    source={{ uri: getBrandImage() }}
                    style={styles.brandCoverImage}
                    contentFit="cover"
                  />
                ) : (
                  /* Default brand name display when no image */
                  user?.brandName && (
                    <Text style={styles.brandName}>{user.brandName}</Text>
                  )
                )}

                {/* Camera button - always visible */}
                <TouchableOpacity
                  style={styles.brandCameraButton}
                  onPress={pickBrandImage}
                >
                  <Camera size={16} color="#ffffff" />
                </TouchableOpacity>
              </View>
            )}



            {/* Profile Image - positioned over brand cover */}
            <View style={styles.profileImageWrapper}>
              <Image
                source={{ uri: getProfileImage() }}
                style={styles.profileImage}
                contentFit="cover"
              />
              <TouchableOpacity
                style={styles.cameraButton}
                onPress={pickImage}
              >
                <Camera size={16} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <Text style={styles.profileName}>{fullName}</Text>

            {user?.role === 'admin' && (
              <Text style={styles.profileEmail}>{user?.role}</Text>
            )}

            {/* Display seller badge if user is a seller */}
            {user?.role === 'seller' && (
              <View style={styles.sellerBadge}>
                <Text style={styles.sellerBadgeText}>
                  Verified Seller
                </Text>
              </View>
            )}

            {/* Subscription Status for Sellers */}
            {user?.role === 'seller' && (
              <>
                <SubscriptionStatus
                  subscriptionStatus={user.subscriptionStatus || 'expired'}
                  subscriptionEndDate={user.subscriptionEndDate}
                  daysLeft={user.subscriptionEndDate ?
                    Math.ceil((new Date(user.subscriptionEndDate).getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000)) :
                    undefined
                  }
                  onRenewPress={() => {
                    // Navigate to subscription page
                    router.push("/auth/subscription");
                  }}
                />

                {/* Referral Code Activation for Sellers without Active Subscription */}
                {user?.subscriptionStatus !== 'active' && (
                  <View style={styles.referralActivationContainer}>
                    <LinearGradient
                      colors={["#E8F5E9", "#C8E6C9"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.referralActivationCard}
                    >
                      <View style={styles.referralActivationHeader}>
                        <CheckCircle size={24} color="#4CAF50" />
                        <Text style={styles.referralActivationTitle}>Activate Free Subscription</Text>
                      </View>

                      <Text style={styles.referralActivationDescription}>
                        Enter the referral code "M@uryanJēwels24" to get a 3-month free subscription and start managing your inventory!
                      </Text>

                      <View style={styles.referralCodeInputContainer}>
                        <TextInput
                          style={styles.referralCodeInput}
                          placeholder="Enter referral code"
                          value={referralCode}
                          onChangeText={setReferralCode}
                          placeholderTextColor="#9e9e9e"
                        />
                      </View>

                      <TouchableOpacity
                        style={styles.activateButton}
                        onPress={handleActivateSubscription}
                        disabled={isActivating}
                      >
                        {isActivating ? (
                          <ActivityIndicator color="#ffffff" />
                        ) : (
                          <>
                            <Plus size={20} color="#ffffff" />
                            <Text style={styles.activateButtonText}>Activate Free Subscription</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </LinearGradient>
                  </View>
                )}
              </>
            )}
          </View>


          {/* Referral Code Section - Only for sellers */}
          {/* {user?.role === 'seller' && (
            <View style={styles.referralCodeContainer}>
              <View style={styles.referralCodeHeader}>
                <Text style={styles.referralCodeTitle}>Your Referral Code</Text>
                {referralCode && (
                  <TouchableOpacity
                    style={styles.shareButton}
                    onPress={handleShareReferralCode}
                  >
                    <Share2 size={18} color="#1976D2" />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.referralCodeContent}>
                {referralCode ? (
                  <>
                    <Text style={styles.referralCode}>{referralCode}</Text>
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
                  <TouchableOpacity
                    style={styles.generateButton}
                    onPress={handleGenerateReferralCode}
                    disabled={isGeneratingCode}
                  >
                    {isGeneratingCode ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={styles.generateButtonText}>Generate Code</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>

              <Text style={styles.referralCodeInfo}>
                Share this code with your customers so they can add you as their seller.
              </Text>
            </View>
          )} */}

          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Personal Information</Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <View style={styles.inputContainer}>
                <User size={20} color="#F3B62B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  placeholderTextColor="#9e9e9e"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
            </View>


            {/* Brand Name field - only visible for sellers */}
            {user?.role === 'seller' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Brand Name</Text>
                  <View style={styles.inputContainer}>
                    <Store size={20} color="#F3B62B" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your business or brand name"
                      placeholderTextColor="#9e9e9e"
                      value={brandName}
                      onChangeText={setBrandName}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>About</Text>
                  <View style={styles.textAreaContainer}>
                    <Store size={20} color="#F3B62B" style={[styles.inputIcon, { marginTop: 6 }]} />
                    <TextInput
                      style={styles.textArea}
                      placeholder="Enter a brief description about your business"
                      placeholderTextColor="#9e9e9e"
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                      value={about}
                      onChangeText={setAbout}
                    />
                  </View>
                </View>
              </>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={styles.inputContainer}>
                <Mail size={20} color="#F3B62B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#9e9e9e"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <View style={styles.inputContainer}>
                <Phone size={20} color="#F3B62B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your phone number"
                  placeholderTextColor="#9e9e9e"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Address</Text>
              <View style={styles.textAreaContainer}>
                <MapPin size={20} color="#F3B62B" style={[styles.inputIcon, { marginTop: 6 }]} />
                <TextInput
                  style={styles.textArea}
                  placeholder="Enter your address"
                  placeholderTextColor="#9e9e9e"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  value={address}
                  onChangeText={setAddress}
                />
              </View>
            </View>


            {user?.role === 'seller' && (
              <>
                {/* WhatsApp Input */}
                <Text style={styles.inputLabel}>WhatsApp</Text>
                <View style={styles.socialInputContainer}>
                  <View style={styles.socialIconContainer}>
                    <Phone size={20} color="#25D366" />
                  </View>
                  <TextInput
                    style={styles.socialInput}
                    placeholder="WhatsApp number"
                    placeholderTextColor="#9e9e9e"
                    keyboardType="phone-pad"
                    value={whatsappNumber}
                    onChangeText={setWhatsappNumber}
                  />
                </View>

                {/* Instagram Input */}
                <Text style={styles.inputLabel}>Instagram</Text>
                <View style={styles.socialInputContainer}>
                  <View style={styles.socialIconContainer}>
                    <Camera size={20} color="#E4405F" />
                  </View>
                  <TextInput
                    style={styles.socialInput}
                    placeholder="Instagram link"
                    placeholderTextColor="#9e9e9e"
                    value={instagramHandle}
                    onChangeText={setInstagramHandle}
                  />
                </View>

                {/* Location Input */}
                <Text style={styles.inputLabel}>Location</Text>
                <View style={styles.socialInputContainer}>
                  <View style={styles.socialIconContainer}>
                    <MapPin size={20} color="#1F7D53" />
                  </View>
                  <TextInput
                    style={styles.socialInput}
                    placeholder="Location link"
                    placeholderTextColor="#9e9e9e"
                    value={location}
                    onChangeText={setLocation}
                  />
                </View>

                {/* Catalogue Images Section */}
                <View style={styles.inputGroup}>
                  <View style={styles.catalogueHeader}>
                    <Text style={styles.inputLabel}>Catalogue Images</Text>
                    <Text style={styles.catalogueCount}>
                      {catalogueImages.length}/8
                    </Text>
                  </View>

                  <View style={styles.catalogueContainer}>
                    <FlatList
                      data={[...catalogueImages, 'add']}
                      numColumns={2}
                      scrollEnabled={false}
                      keyExtractor={(item, index) =>
                        typeof item === 'string' && item === 'add' ? 'add-button' : `image-${index}`
                      }
                      renderItem={({ item, index }) => {
                        if (item === 'add' && catalogueImages.length < 8) {
                          return (
                            <TouchableOpacity
                              style={styles.addImageButton}
                              onPress={pickCatalogueImage}
                            >
                              <Plus size={32} color="#F3B62B" />
                              <Text style={styles.addImageText}>Add Image</Text>
                            </TouchableOpacity>
                          );
                        } else if (item !== 'add') {
                          return (
                            <View style={styles.catalogueImageContainer}>
                              <Image
                                source={{ uri: item }}
                                style={styles.catalogueImage}
                                contentFit="cover"
                              />
                              <TouchableOpacity
                                style={styles.removeImageButton}
                                onPress={() => removeCatalogueImage(index)}
                              >
                                <X size={16} color="#ffffff" />
                              </TouchableOpacity>
                            </View>
                          );
                        }
                        return null;
                      }}
                      contentContainerStyle={styles.catalogueGrid}
                    />
                  </View>

                  <Text style={styles.catalogueInfo}>
                    Upload product images to showcase your inventory. Maximum 8 images allowed.
                  </Text>
                </View>
              </>
            )}


            <TouchableOpacity
              style={styles.buttonContainer}
              onPress={handleSave}
              disabled={isLoading}
            >
              <LinearGradient
                colors={["#F3B62B", "#F5D76E"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.button}
              >
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Text style={styles.buttonText}>Save Changes</Text>
                    <Save size={18} color="#ffffff" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>


            <TouchableOpacity
              style={styles.buttonContainer}
              onPress={handleDeleteAccount}
            >
              <LinearGradient
                colors={["#FB4141", "#E43636"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.button}
              >
                <Text style={styles.buttonText}>Delete Account</Text>
                <Trash2 size={18} color="#ffffff" />
              </LinearGradient>
            </TouchableOpacity>


            {isSaved && (
              <View style={styles.savedMessage}>
                <CheckCircle size={18} color="#4CAF50" style={styles.savedIcon} />
                <Text style={styles.savedMessageText}>Profile updated successfully!</Text>
              </View>
            )}
          </View>

          {/* Terms and Privacy Policy Links */}
          <TermsLinks />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView >
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333333",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666666",
  },
  errorText: {
    color: "#ff3b30",
    marginBottom: 16,
    fontSize: 14,
  },
  profileImageContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  brandCoverImage: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
  },
  brandCameraButton: {
    position: "absolute",
    top: 8,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  brandNameOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  brandNameText: {
    color: "#F5D76E", // Golden color like "Sarth Jewels"
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    fontFamily: Platform.OS === 'ios' ? 'Brush Script MT' : 'cursive', // Elegant script font
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  profileImageWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 5,
    zIndex: 1, // Ensure profile image is above brand cover
    margin: "auto",
    // marginTop: -60, // Overlap with brand cover
  },
  profileImage: {
    borderWidth: 2,
    borderColor: "#ffffff",
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#002810",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  profileName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 8,
    fontWeight: "500",
  },
  sellerBadge: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 12,
    marginTop: 8,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  sellerBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4CAF50",
  },
  upgradeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8E1",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F5D76E",
    marginTop: 8,
  },
  upgradeIcon: {
    marginRight: 8,
  },
  upgradeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F3B62B",
  },
  formContainer: {
    marginHorizontal: 20,
    padding: 20,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333333",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
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
  textAreaContainer: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#f9f9f9",
  },
  textArea: {
    flex: 1,
    height: 75,
    color: "#333333",
    textAlignVertical: "top",
    paddingTop: 8,
  },
  largeUpgradeButton: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#F3B62B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  largeUpgradeButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  largeUpgradeIcon: {
    marginRight: 8,
  },
  largeUpgradeText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  buttonContainer: {
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 8,
    elevation: 3,
    shadowColor: "#F3B62B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  button: {
    height: 56,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
  savedMessage: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#E8F5E9",
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  savedIcon: {
    marginRight: 8,
  },
  savedMessageText: {
    color: "#4CAF50",
    fontWeight: "500",
  },



  // Referral Code Styles
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

  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
  },

  // Social Inputs
  socialInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: "#f9f9f9",
    marginBottom: 16,
  },
  socialIconContainer: {
    marginRight: 12,
  },
  socialInput: {
    flex: 1,
    height: 56,
    color: "#333333",
  },

  // Catalogue Images Styles
  catalogueHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  catalogueCount: {
    fontSize: 14,
    color: "#666666",
    fontWeight: "500",
  },
  catalogueContainer: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#f9f9f9",
  },
  catalogueGrid: {
    gap: 12,
  },
  catalogueImageContainer: {
    position: "relative",
    width: "45%",
    aspectRatio: 4 / 3,
    margin: 8,
  },
  catalogueImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  removeImageButton: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(244, 67, 54, 0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  addImageButton: {
    width: "45%",
    aspectRatio: 4 / 3,
    borderWidth: 2,
    borderColor: "#F3B62B",
    borderStyle: "dashed",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF8E1",
    margin: 8,
  },
  addImageText: {
    marginTop: 8,
    fontSize: 12,
    color: "#F3B62B",
    fontWeight: "600",
  },
  catalogueInfo: {
    fontSize: 12,
    color: "#666666",
    marginTop: 8,
    lineHeight: 16,
  },

  top: {
    backgroundColor: "#002810",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 10,
    borderRadius: 16,
    width: "90%",
    height: 150,
    color: "#ffffff",
    marginBottom: -60,
  },
  logo: {
    width: 200,
    height: 200,
    resizeMode: "contain",
    marginTop: 20,
  },
  brandName: {
    fontSize: 50,
    fontFamily: 'LavishlyYours-Regular',
    fontWeight: "bold",
    color: "#F3B62B",
    marginTop: -30,
  },

  // Referral Activation Styles
  referralActivationContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  referralActivationCard: {
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  referralActivationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  referralActivationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4CAF50",
    marginLeft: 8,
  },
  referralActivationDescription: {
    fontSize: 14,
    color: "#333333",
    lineHeight: 20,
    marginBottom: 16,
  },
  referralCodeInputContainer: {
    marginBottom: 16,
  },
  referralCodeInput: {
    borderWidth: 1,
    borderColor: "#4CAF50",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#ffffff",
    color: "#333333",
  },
  activateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  activateButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});