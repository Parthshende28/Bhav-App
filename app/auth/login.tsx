import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { Link, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Mail, Lock, Eye, EyeOff } from "lucide-react-native";
import { images } from "@/constants/images";
import { useAuthStore } from '@/store/auth-store';


export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const result = await login(email, password);

      if (result.success) {
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        // ✅ Navigate based on role if available, otherwise just go to customer dashboard
        const role = result.user?.role;
        if (role) {
          router.replace("/(app)/(tabs)/dashboard");
        } else {
          router.replace("/(app)/(tabs)/rates");
        }
      } else {
        setError(result.error || "Invalid email or password");
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Login failed. Please try again.");
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <View style={styles.logoContainer}>
          <Image
            source={images.logo}
            style={styles.logo}
            contentFit="contain"
          />
          <Text style={styles.logoText}>Bhav App</Text>
        </View>

        <Text style={styles.welcomeText}>Welcome Back</Text>
        <Text style={styles.subtitle}>
          Sign in to continue trading bullion
        </Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={[styles.inputContainer, focusedField === "email" && styles.inputContainerFocused]}>
          <Mail size={20} color="#F3B62B" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor="#9e9e9e"
            value={email}
            onChangeText={setEmail}
            onFocus={() => setFocusedField("email")}
            onBlur={() => setFocusedField(null)}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={[styles.inputContainer,
        focusedField === "password" && styles.inputContainerFocused,
        ]}>
          <Lock size={20} color="#F3B62B" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#9e9e9e"
            value={password}
            onChangeText={setPassword}
            onFocus={() => setFocusedField("password")}
            onBlur={() => setFocusedField(null)}
            secureTextEntry={!showPassword}
            keyboardType="default"
            autoCapitalize="none"
          />
          <TouchableOpacity
            onPress={togglePasswordVisibility}
            style={styles.eyeIcon}
          >
            {showPassword ? (
              <EyeOff size={20} color="#9e9e9e" />
            ) : (
              <Eye size={20} color="#9e9e9e" />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.forgotPasswordRow}>
          <TouchableOpacity style={styles.forgotPasswordContainer} onPress={() => router.push("/auth/forgotpassword")}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleLogin}
          disabled={isLoading}
          style={styles.buttonContainer}
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
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>Don't have an account? </Text>
          <Link href="/auth/signup" asChild>
            <TouchableOpacity>
              <Text style={styles.signupLink}>Sign Up</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
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
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#ffffff",
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
  },
  logoText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#F3B62B",
    marginTop: 8,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333333",
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
  inputContainerFocused: {
    borderColor: "#F3B62B", // Change border color when focused
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 56,
    color: "#333333",
  },
  eyeIcon: {
    padding: 8,
  },
  forgotPasswordRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginBottom: 24,
  },
  forgotPasswordContainer: {
    padding: 4,
    cursor: "pointer",
  },
  forgotPasswordText: {
    color: "#F3B62B",
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
    cursor: "pointer",
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
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  signupText: {
    color: "#666666",
  },
  signupLink: {
    fontWeight: "600",
    color: "#F3B62B",
    cursor: "pointer",
  },
});