import React, { useState } from "react";
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
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { authAPI } from "@/services/api";

export default function ForgotPasswordScreen() {
    const router = useRouter();

    // Form states
    const [email, setEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // UI states
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState("");

    // Password validation states
    const [passwordValidation, setPasswordValidation] = useState({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false,
    });

    // Validate password strength
    const validatePassword = (password: string) => {
        setPasswordValidation({
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /\d/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
        });
    };

    const handleNewPasswordChange = (text: string) => {
        setNewPassword(text);
        validatePassword(text);
    };

    const validateForm = () => {
        if (!email.trim()) {
            setError("Please enter your email address");
            return false;
        }

        if (!newPassword.trim()) {
            setError("Please enter a new password");
            return false;
        }

        if (!confirmPassword.trim()) {
            setError("Please confirm your new password");
            return false;
        }

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            return false;
        }

        // Check if all password requirements are met
        const allValid = Object.values(passwordValidation).every(Boolean);
        if (!allValid) {
            setError("Please ensure your password meets all requirements");
            return false;
        }

        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            if (Platform.OS !== "web") {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            }
            return;
        }

        setError("");
        setIsLoading(true);

        try {
            const response = await authAPI.forgotPassword(email, newPassword, confirmPassword);

            if (response.data.message) {
                setIsSuccess(true);
                if (Platform.OS !== "web") {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }

                // Redirect to login after 2 seconds
                setTimeout(() => {
                    router.push("/auth/login");
                }, 2000);
            }
        } catch (error: any) {
            console.error("Forgot password error:", error);

            let errorMessage = "Failed to update password. Please try again.";
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

    if (isSuccess) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <StatusBar style="dark" />
                <View style={styles.successContainer}>
                    <CheckCircle size={80} color="#43A047" />
                    <Text style={styles.successTitle}>Password Updated!</Text>
                    <Text style={styles.successMessage}>
                        Your password has been successfully updated. You can now login with your new password.
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
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
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => router.back()}
                        >
                            <ArrowLeft size={24} color="#333" />
                        </TouchableOpacity>

                        <Text style={styles.title}>Reset Password</Text>
                        <Text style={styles.subtitle}>
                            Enter your email and create a new password
                        </Text>

                        {error ? <Text style={styles.errorText}>{error}</Text> : null}

                        <View style={styles.formContainer}>
                            {/* Email Input */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Email Address</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your email"
                                    placeholderTextColor="#9e9e9e"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                            </View>

                            {/* New Password Input */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>New Password</Text>
                                <View style={styles.passwordContainer}>
                                    <TextInput
                                        style={styles.passwordInput}
                                        placeholder="Enter new password"
                                        placeholderTextColor="#9e9e9e"
                                        value={newPassword}
                                        onChangeText={handleNewPasswordChange}
                                        secureTextEntry={!showNewPassword}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />
                                    <TouchableOpacity
                                        onPress={() => setShowNewPassword(!showNewPassword)}
                                        style={styles.eyeButton}
                                    >
                                        {showNewPassword ? (
                                            <EyeOff size={20} color="#666" />
                                        ) : (
                                            <Eye size={20} color="#666" />
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Confirm Password Input */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Confirm New Password</Text>
                                <View style={styles.passwordContainer}>
                                    <TextInput
                                        style={styles.passwordInput}
                                        placeholder="Confirm new password"
                                        placeholderTextColor="#9e9e9e"
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        secureTextEntry={!showConfirmPassword}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />
                                    <TouchableOpacity
                                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                        style={styles.eyeButton}
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff size={20} color="#666" />
                                        ) : (
                                            <Eye size={20} color="#666" />
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Password Requirements */}
                            <View style={styles.requirementsContainer}>
                                <Text style={styles.requirementsTitle}>Password Requirements:</Text>
                                <View style={styles.requirementItem}>
                                    <View style={[styles.requirementDot, passwordValidation.length && styles.requirementMet]} />
                                    <Text style={[styles.requirementText, passwordValidation.length && styles.requirementMetText]}>
                                        At least 8 characters long
                                    </Text>
                                </View>
                                <View style={styles.requirementItem}>
                                    <View style={[styles.requirementDot, passwordValidation.uppercase && styles.requirementMet]} />
                                    <Text style={[styles.requirementText, passwordValidation.uppercase && styles.requirementMetText]}>
                                        One uppercase letter
                                    </Text>
                                </View>
                                <View style={styles.requirementItem}>
                                    <View style={[styles.requirementDot, passwordValidation.lowercase && styles.requirementMet]} />
                                    <Text style={[styles.requirementText, passwordValidation.lowercase && styles.requirementMetText]}>
                                        One lowercase letter
                                    </Text>
                                </View>
                                <View style={styles.requirementItem}>
                                    <View style={[styles.requirementDot, passwordValidation.number && styles.requirementMet]} />
                                    <Text style={[styles.requirementText, passwordValidation.number && styles.requirementMetText]}>
                                        One number
                                    </Text>
                                </View>
                                <View style={styles.requirementItem}>
                                    <View style={[styles.requirementDot, passwordValidation.special && styles.requirementMet]} />
                                    <Text style={[styles.requirementText, passwordValidation.special && styles.requirementMetText]}>
                                        One special character
                                    </Text>
                                </View>
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={handleSubmit}
                            disabled={isLoading}
                            style={[
                                styles.buttonContainer,
                                isLoading && styles.buttonDisabled
                            ]}
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
                                    <Text style={styles.buttonText}>Update Password</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.backToLoginButton}
                            onPress={() => router.push("/auth/login")}
                        >
                            <Text style={styles.backToLoginText}>Back to Login</Text>
                        </TouchableOpacity>
                    </View>
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
        marginBottom: 32,
    },
    errorText: {
        color: "#ff3b30",
        marginBottom: 16,
        fontSize: 14,
        textAlign: "center",
    },
    formContainer: {
        marginBottom: 32,
    },
    inputContainer: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333333",
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: "#e0e0e0",
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 16,
        fontSize: 16,
        color: "#333333",
        backgroundColor: "#f9f9f9",
    },
    passwordContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#e0e0e0",
        borderRadius: 12,
        backgroundColor: "#f9f9f9",
    },
    passwordInput: {
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 16,
        fontSize: 16,
        color: "#333333",
    },
    eyeButton: {
        padding: 16,
    },
    requirementsContainer: {
        backgroundColor: "#f8f9fa",
        borderRadius: 12,
        padding: 16,
        marginTop: 16,
    },
    requirementsTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "#333333",
        marginBottom: 12,
    },
    requirementItem: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    requirementDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#e0e0e0",
        marginRight: 12,
    },
    requirementMet: {
        backgroundColor: "#43A047",
    },
    requirementText: {
        fontSize: 14,
        color: "#666666",
    },
    requirementMetText: {
        color: "#43A047",
        fontWeight: "500",
    },
    buttonContainer: {
        borderRadius: 12,
        overflow: "hidden",
        elevation: 3,
        shadowColor: "#F3B62B",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        marginBottom: 16,
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
    backToLoginButton: {
        alignItems: "center",
        paddingVertical: 16,
    },
    backToLoginText: {
        fontSize: 16,
        color: "#F3B62B",
        fontWeight: "600",
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
}); 