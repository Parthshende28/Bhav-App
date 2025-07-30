import React, { useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useAuthStore } from "@/store/auth-store";
import { useRouter } from "expo-router";

export default function LogoutScreen() {
  const { logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const performLogout = async () => {
      // Add a small delay to show the loading indicator
      await new Promise(resolve => setTimeout(resolve, 500));
      logout();
      router.push("/auth/login");
    };

    performLogout();
  }, [logout, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#F3B62B" />
      <Text style={styles.text}>Logging out...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: "#666666",
  },
});