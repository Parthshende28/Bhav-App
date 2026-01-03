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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { images } from "@/constants/images";
import { router } from "expo-router";
import { useAuthStore } from "@/store/auth-store";
import { kycAPI } from "@/services/api";
import { cloudinaryAPI } from "@/services/cloudinary";

export default function KycScreen() {
  const [fullName, setFullName] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [aadharNumber, setAadharNumber] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [address, setAddress] = useState("");
  const [panImage, setPanImage] = useState<string | null>(null);
  const [aadharImage, setAadharImage] = useState<string | null>(null);
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [kycStatus, setKycStatus] = useState<any>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  const { user } = useAuthStore();

  const isSeller = user?.role === "seller";

  // Load existing KYC status on component mount
  useEffect(() => {
    loadKYCStatus();
  }, []);

  const loadKYCStatus = async () => {
    try {
      setIsLoadingStatus(true);
      const response = await kycAPI.getKYCStatus();
      if (response.data?.success && response.data?.kyc) {
        setKycStatus(response.data.kyc);
        setIsSubmitted(true);

        // Pre-fill form with existing data
        setFullName(response.data.kyc.fullName || "");
        setPanNumber(response.data.kyc.panNumber || "");
        setAadharNumber(response.data.kyc.aadharNumber || "");
        setGstNumber(response.data.kyc.gstNumber || "");
        setAddress(response.data.kyc.address || "");
        setPanImage(response.data.kyc.panImage || null);
        setAadharImage(response.data.kyc.aadharImage || null);
        setSelfieImage(response.data.kyc.selfieImage || null);
      }
    } catch (error: any) {
      // If KYC not found, that's fine - user can submit new one
      console.log('No existing KYC found:', error.message);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const pickImage = async (setImageFunction: React.Dispatch<React.SetStateAction<string | null>>, imageType: string) => {
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
          'kyc',
          `${imageType}_${Date.now()}.jpg`
        );
        setImageFunction(cloudinaryUrl);
      } catch (error) {
        console.error(`Error uploading ${imageType} image:`, error);
        Alert.alert('Error', `Failed to upload ${imageType} image`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const createKYCData = () => {
    const kycData: any = {
      fullName,
      panNumber,
      aadharNumber,
      address,
      panImage,
      aadharImage,
      selfieImage
    };

    if (gstNumber) {
      kycData.gstNumber = gstNumber;
    }

    return kycData;
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!fullName || !panNumber || !aadharNumber || !address) {
      setError("Please fill in all required fields");
      return;
    }

    // Validate required images
    if (!panImage || !aadharImage || !selfieImage) {
      setError("Please upload all required documents");
      return;
    }

    // Validate PAN number format (10 characters, alphanumeric)
    if (panNumber.length !== 10) {
      setError("PAN number must be 10 characters long");
      return;
    }

    // Validate Aadhar number format (12 digits)
    if (aadharNumber.length !== 12 || !/^\d+$/.test(aadharNumber)) {
      setError("Aadhar number must be 12 digits");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const kycData = createKYCData();

      console.log('Submitting KYC with data:', {
        fullName,
        panNumber,
        aadharNumber,
        address,
        gstNumber,
        hasPanImage: !!panImage,
        hasAadharImage: !!aadharImage,
        hasSelfieImage: !!selfieImage
      });

      let response;
      if (kycStatus) {
        // Update existing KYC
        console.log('Updating existing KYC...');
        response = await kycAPI.updateKYC(kycData);
      } else {
        // Submit new KYC
        console.log('Submitting new KYC...');
        response = await kycAPI.submitKYC(kycData);
      }

      console.log('KYC API response:', response);

      if (response.data?.success) {
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        setIsSubmitted(true);
        setKycStatus(response.data.kyc);

        Alert.alert(
          "Success",
          kycStatus ? "KYC updated successfully!" : "KYC submitted successfully!",
          [{ text: "OK" }]
        );
      } else {
        throw new Error(response.data?.message || 'KYC submission failed');
      }
    } catch (err: any) {
      console.error('KYC submission error:', err);

      // Handle specific error cases
      if (err.response?.status === 401) {
        setError("Authentication failed. Please log in again.");
      } else if (err.response?.status === 400) {
        setError(err.response?.data?.message || "Invalid data provided. Please check your information.");
      } else if (err.response?.status === 500) {
        setError("Server error. Please try again later.");
      } else if (err.code === 'NETWORK_ERROR') {
        setError("Network error. Please check your internet connection.");
      } else {
        setError(err.response?.data?.message || err.message || "Failed to submit KYC. Please try again.");
      }

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return '#4CAF50';
      case 'rejected':
        return '#F44336';
      case 'pending':
        return '#FFC107';
      default:
        return '#FFC107';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'pending':
        return 'Under Review';
      default:
        return 'Under Review';
    }
  };

  const openDrawer = () => {
    router.push("/drawer");
  };

  if (isLoadingStatus) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F3B62B" />
          <Text style={styles.loadingText}>Loading KYC status...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity onPress={openDrawer}>
          <Icon name="menu" size={24} color="#333333" />
        </TouchableOpacity>
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
            <Text style={styles.headerTitle}>KYC Verification</Text>
            <Text style={styles.headerSubtitle}>
              Complete your verification to start trading
            </Text>
          </View>

          {isSubmitted ? (
            <View style={styles.successContainer}>
              <LinearGradient
                colors={["#FFF8E1", "#FFF3CD"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.successGradient}
              >
                {kycStatus?.status === 'approved' ? (
                  <Icon name="check-circle" size={60} color="#4CAF50" />
                ) : kycStatus?.status === 'rejected' ? (
                  <Icon name="alert-circle" size={60} color="#F44336" />
                ) : (
                  <Icon name="file-document" size={60} color="#FFC107" />
                )}

                <Text style={styles.successTitle}>
                  {kycStatus?.status === 'approved' ? 'KYC Approved!' :
                    kycStatus?.status === 'rejected' ? 'KYC Rejected' : 'KYC Submitted!'}
                </Text>

                <Text style={styles.successText}>
                  {kycStatus?.status === 'approved' ?
                    'Your KYC has been verified successfully. You can now access all features.' :
                    kycStatus?.status === 'rejected' ?
                      `Your KYC was rejected: ${kycStatus?.rejectionReason || 'Please check your documents and try again.'}` :
                      'Your KYC documents have been submitted successfully. We\'ll verify your details and update you shortly.'
                  }
                </Text>

                <View style={styles.statusContainer}>
                  <Text style={styles.statusLabel}>Status:</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(kycStatus?.status) }]}>
                    <Text style={styles.statusText}>{getStatusText(kycStatus?.status)}</Text>
                  </View>
                </View>

                {(kycStatus?.status === 'rejected' || kycStatus?.status === 'pending') && (
                  <TouchableOpacity
                    style={styles.updateButton}
                    onPress={() => setIsSubmitted(false)}
                  >
                    <Text style={styles.updateButtonText}>
                      {kycStatus?.status === 'rejected' ? 'Resubmit KYC' : 'Update KYC'}
                    </Text>
                  </TouchableOpacity>
                )}
              </LinearGradient>
            </View>
          ) : (
            <View style={styles.formContainer}>
              <Text style={styles.formTitle}>Personal Information</Text>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  placeholderTextColor="#9e9e9e"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>PAN Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your PAN number"
                  placeholderTextColor="#9e9e9e"
                  autoCapitalize="characters"
                  value={panNumber}
                  onChangeText={setPanNumber}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Aadhar Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your Aadhar number"
                  placeholderTextColor="#9e9e9e"
                  keyboardType="number-pad"
                  value={aadharNumber}
                  onChangeText={setAadharNumber}
                />
              </View>

              {isSeller && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>GST Certificate Number</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your GST Certificate number"
                    placeholderTextColor="#9e9e9e"
                    keyboardType="number-pad"
                    value={gstNumber}
                    onChangeText={setGstNumber}
                  />
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Address</Text>
                <TextInput
                  style={styles.textArea}
                  placeholder="Enter your full address"
                  placeholderTextColor="#9e9e9e"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  value={address}
                  onChangeText={setAddress}
                />
              </View>

              <Text style={styles.sectionTitle}>Document Upload</Text>

              <View style={styles.documentContainer}>
                <Text style={styles.documentLabel}>PAN Card</Text>
                {panImage ? (
                  <View style={styles.imagePreviewContainer}>
                    <Image
                      source={{ uri: panImage }}
                      style={styles.imagePreview}
                      contentFit="cover"
                    />
                    <TouchableOpacity
                      style={styles.changeImageButton}
                      onPress={() => pickImage(setPanImage, 'pan')}
                    >
                      <Text style={styles.changeImageText}>Change</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={() => pickImage(setPanImage, 'pan')}
                  >
                    <Upload size={24} color="#F3B62B" />
                    <Text style={styles.uploadText}>Upload PAN Card</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.documentContainer}>
                <Text style={styles.documentLabel}>Aadhar Card</Text>
                {aadharImage ? (
                  <View style={styles.imagePreviewContainer}>
                    <Image
                      source={{ uri: aadharImage }}
                      style={styles.imagePreview}
                      contentFit="cover"
                    />
                    <TouchableOpacity
                      style={styles.changeImageButton}
                      onPress={() => pickImage(setAadharImage, 'aadhar')}
                    >
                      <Text style={styles.changeImageText}>Change</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={() => pickImage(setAadharImage, 'aadhar')}
                  >
                    <Upload size={24} color="#F3B62B" />
                    <Text style={styles.uploadText}>Upload Aadhar Card</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.documentContainer}>
                <Text style={styles.documentLabel}>Selfie</Text>
                {selfieImage ? (
                  <View style={styles.imagePreviewContainer}>
                    <Image
                      source={{ uri: selfieImage }}
                      style={styles.imagePreview}
                      contentFit="cover"
                    />
                    <TouchableOpacity
                      style={styles.changeImageButton}
                      onPress={() => pickImage(setSelfieImage, 'selfie')}
                    >
                      <Text style={styles.changeImageText}>Change</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={() => pickImage(setSelfieImage, 'selfie')}
                  >
                    <Icon name="camera" size={24} color="#F3B62B" />
                    <Text style={styles.uploadText}>Upload Selfie</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                style={styles.buttonContainer}
                onPress={handleSubmit}
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
                      <Text style={styles.buttonText}>
                        {kycStatus ? 'Update KYC' : 'Submit KYC'}
                      </Text>
                      <Icon2 name="file-text" size={18} color="#ffffff" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
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
    fontSize: 16,
    color: "#666666",
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
  errorText: {
    color: "#ff3b30",
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
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    paddingHorizontal: 16,
    color: "#333333",
    backgroundColor: "#f9f9f9",
  },
  textArea: {
    height: 120,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    color: "#333333",
    backgroundColor: "#f9f9f9",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333333",
    marginTop: 16,
    marginBottom: 16,
  },
  documentContainer: {
    marginBottom: 16,
  },
  documentLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333333",
    marginBottom: 8,
  },
  uploadButton: {
    height: 120,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
  },
  uploadText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "500",
    color: "#F3B62B",
  },
  imagePreviewContainer: {
    position: "relative",
    height: 160,
    borderRadius: 12,
    overflow: "hidden",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
  },
  changeImageButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderTopLeftRadius: 8,
  },
  changeImageText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "500",
  },
  buttonContainer: {
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 16,
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
  successContainer: {
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: "hidden",
  },
  successGradient: {
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333333",
    marginTop: 16,
    marginBottom: 8,
  },
  successText: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333333",
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#ffffff",
  },
  updateButton: {
    backgroundColor: "#F3B62B",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  updateButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
  },
});