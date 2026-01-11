import React, { useEffect, useState } from "react";
import { View, StyleSheet, Animated, Easing, Platform, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useAuthStore, ADMIN_USERNAME } from "@/store/auth-store";
import { StatusBar } from "expo-status-bar";

export default function SplashScreen() {
  const router = useRouter();
  const [authState, setAuthState] = useState<{ isAuthenticated: boolean; user: any; hasSeenOnboarding: boolean; isInitializing: boolean } | null>(null);
  const [hasNavigated, setHasNavigated] = useState(false);

  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  // Get auth state in useEffect to avoid render-time state access
  useEffect(() => {
    const unsubscribe = useAuthStore.subscribe((state) => {
      setAuthState({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        hasSeenOnboarding: state.hasSeenOnboarding,
        isInitializing: state.isInitializing
      });
    });

    // Get initial state
    const initialState = useAuthStore.getState();
    setAuthState({
      isAuthenticated: initialState.isAuthenticated,
      user: initialState.user,
      hasSeenOnboarding: initialState.hasSeenOnboarding,
      isInitializing: initialState.isInitializing
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (authState === null || authState.isInitializing || hasNavigated) return; // Wait for auth state to be loaded or prevent multiple navigations

    console.log("Splash screen auth state:", authState.isAuthenticated, authState.user?.role, "hasSeenOnboarding:", authState.hasSeenOnboarding);

    // Animation sequence
    Animated.sequence([
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.5)),
        }),
      ]),
      Animated.delay(1000),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
        easing: Easing.in(Easing.ease),
      }),
    ]).start(() => {
      // Navigate based on authentication status, onboarding status, and user role
      if (authState?.user?.role) {
        // User is authenticated, go to dashboard
        setHasNavigated(true);
        router.push("/(app)/(tabs)/dashboard");
      } else if (!authState?.hasSeenOnboarding) {
        // User hasn't seen onboarding, show onboarding screens
        setHasNavigated(true);
        router.push("/onboarding/welcome");
      } else {
        // User has seen onboarding but not authenticated, go to login
        setHasNavigated(true);
        router.push("/auth/login");
      }
    });
  }, [authState, router, opacityAnim, scaleAnim, hasNavigated]);

  return (
    <LinearGradient
      colors={["#ffffff", "#fff9e6", "#fff5d6"]}
      style={styles.container}
    >
      <StatusBar style="dark" />
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Use Text instead of Image to avoid build errors */}
        <View style={styles.logoPlaceholder}>
          <Text style={styles.logoText}>Bhav App</Text>
        </View>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: "#F3B62B",
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
  },
});