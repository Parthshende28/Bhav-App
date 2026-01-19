import React, { useEffect, useRef } from "react";
import { router, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AppState, AppStateStatus } from "react-native";
import { useAuthStore } from "@/store/auth-store";

// Component to handle notification refresh
function NotificationRefresher() {
  const { user, isAuthenticated, refreshNotifications } = useAuthStore();
  const intervalRef = useRef<number | null>(null);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    // Only set up refresh if user is authenticated
    if (isAuthenticated && user) {
      // Initial refresh
      refreshNotifications();

      // Set up periodic refresh every 30 seconds
      intervalRef.current = setInterval(() => {
        refreshNotifications();
      }, 30000); // 30 seconds

      // Listen for app state changes
      const handleAppStateChange = (nextAppState: AppStateStatus) => {
        if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
          // App has come to the foreground
          refreshNotifications();
        }
        appState.current = nextAppState;
      };

      const subscription = AppState.addEventListener('change', handleAppStateChange);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        subscription?.remove();
      };
    }
  }, [isAuthenticated, user, refreshNotifications]);

  return null; // This component doesn't render anything
}

export default function AppLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <NotificationRefresher />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="live-rates"
          options={{
            headerTitle: "Live Rates",
            headerTintColor: "#333333",
            headerStyle: {
              backgroundColor: "#ffffff",
            },
          }}
        />

        {/* changes made for connect to different sellers */}
        <Stack.Screen
          name="connect_to_seller"
          options={{
            headerTitle: "Connect to Seller",
            headerShown: false,
            headerTintColor: "#333333",
            headerStyle: {
              backgroundColor: "#ffffff",
            },
          }}
        />

        {/* <Stack.Screen
          name="transaction"
          options={{
            headerTitle: "Transaction",
            headerTintColor: "#333333",
            headerStyle: {
              backgroundColor: "#ffffff",
            },
          }}
        /> */}
        {/* <Stack.Screen
          name="connections"
          options={{
            headerTitle: "Connections",
            headerTintColor: "#333333",
            headerStyle: {
              backgroundColor: "#ffffff",
            },
          }}
        /> */}
        {/* <Stack.Screen
          name="contact"
          options={{
            headerTitle: "Contact Us",
            headerShown: false,
            headerTintColor: "#333333",
            headerStyle: {
              backgroundColor: "#ffffff",
            },
          }}
        /> */}
        <Stack.Screen
          name="kyc"
          options={{
            headerTitle: "KYC",
            headerShown: false,
            headerTintColor: "#333333",
            headerStyle: {
              backgroundColor: "#ffffff",
            },
          }}
        />
        <Stack.Screen
          name="profile"
          options={{
            headerTitle: "My Profile",
            headerShown: false,
            headerTintColor: "#333333",
            headerStyle: {
              backgroundColor: "#ffffff",
            },
          }}
        />
        <Stack.Screen
          name="history"
          options={{
            headerTitle: "History",
            headerShown: false,
            headerTintColor: "#333333",
            headerStyle: {
              backgroundColor: "#ffffff",
            },
          }}
        />
        <Stack.Screen
          name="share"
          options={{
            headerTitle: "Share App",
            headerTintColor: "#333333",
            headerShown: false,
            headerStyle: {
              backgroundColor: "#ffffff",
            },
          }}
        />
        <Stack.Screen
          name="customers"
          options={{
            headerTitle: "My Users",
            headerShown: false,
            headerTintColor: "#333333",
            headerStyle: {
              backgroundColor: "#ffffff",
            },
          }}
        />
        <Stack.Screen
          name="inventory"
          options={{
            headerTitle: "Manage Inventory",
            headerShown: false,
            headerBackTitle: "Back",
            headerTintColor: "#333333",
            headerStyle: {
              backgroundColor: "#ffffff",
            },
          }}
        />
        <Stack.Screen
          name="seller-profile/[id]"
          options={{
            headerTitle: "Seller Profile",
            headerShown: false,
            headerTintColor: "#333333",
            headerStyle: {
              backgroundColor: "#ffffff",
            },
          }}
        />
        <Stack.Screen
          name="seller-data"
          options={{
            headerTitle: "Seller Profile",
            headerShown: false,
            headerTintColor: "#333333",
            headerStyle: {
              backgroundColor: "#ffffff",
            },
          }}
        />
      </Stack>
    </>
  );
}