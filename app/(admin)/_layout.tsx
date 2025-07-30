import React, { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useAuthStore, ADMIN_USERNAME } from "@/store/auth-store";
import { useRouter } from "expo-router";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Menu } from "lucide-react-native";

export default function AdminLayout() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Move the redirect logic to useEffect to avoid setState during render
  useEffect(() => {
    const checkAuth = () => {
      // Only redirect if user is definitely not admin
      if (user && user.role !== "admin" && user.username !== ADMIN_USERNAME) {
        router.push("/auth/login");
      } else {
        setIsCheckingAuth(false);
      }
    };

    // Add a small delay to ensure user state is properly loaded
    const timer = setTimeout(checkAuth, 100);
    return () => clearTimeout(timer);
  }, [user, router]);

  const openDrawer = () => {
    router.push("/drawer");
  };

  // If still checking auth or user is not admin, render a loading state
  if (isCheckingAuth || (user && user.role !== "admin" && user.username !== ADMIN_USERNAME)) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Checking permissions...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack>
        <Stack.Screen
          name="dashboard"
          options={{
            headerTitle: "Admin Dashboard",
            headerShown: false,
            headerTintColor: "#1976D2",
            headerStyle: {
              backgroundColor: "#ffffff",
            },
          }}
        />
        <Stack.Screen
          name="users"
          options={{
            headerTitle: "User Management",
            headerShown: false,
            headerTintColor: "#1976D2",
            headerStyle: {
              backgroundColor: "#ffffff",
            },
          }}
        />
        <Stack.Screen
          name="kyc-management"
          options={{
            headerTitle: "KYC Management",
            headerShown: false,
            headerTintColor: "#1976D2",
            headerStyle: {
              backgroundColor: "#ffffff",
            },
          }}
        />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
  },
});