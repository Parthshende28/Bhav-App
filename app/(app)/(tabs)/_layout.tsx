import React from "react";
import { Tabs } from "expo-router";
import { Platform, View, StyleSheet, TouchableOpacity } from "react-native";
import { BlurView } from "expo-blur";
import { Home, TrendingUp, Calculator, Phone, CreditCard, Menu, Users, Newspaper, User, Bell } from "lucide-react-native";
import { useAuthStore } from "@/store/auth-store";
import { useRouter } from "expo-router";

export default function TabsLayout() {
  const { user } = useAuthStore();
  const isSeller = user?.role === "seller";
  const isCustomer = user?.role === "customer";
  const isAdmin = user?.role === "admin";
  const router = useRouter();

  const openDrawer = () => {
    router.push("/drawer");
  };

  return (

    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#F3B62B",
        tabBarInactiveTintColor: "#9e9e9e",
        tabBarStyle: {
          borderTopWidth: 0,
          elevation: 0,
          // height: 60,
          backgroundColor: Platform.OS === "ios" ? "transparent" : "#ffffff",
          position: "absolute",
        },
        tabBarBackground: () => (
          Platform.OS === "ios" ? (
            <BlurView
              tint="light"
              intensity={80}
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: "#ffffff" }]} />
          )
        ),
        tabBarLabelStyle: {
          fontWeight: "500",
          fontSize: 12,
        },
        headerShown: false,
        headerStyle: {
          backgroundColor: "#ffffff",
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: "#f0f0f0",
        },
        headerTintColor: "#333333",
        headerTitleStyle: {
          fontWeight: "600",
        },
        headerLeft: () => (
          <TouchableOpacity
            onPress={openDrawer}
            style={{
              padding: 12,
              marginLeft: 8,
            }}
          >
            <Menu size={24} color="#333333" />
          </TouchableOpacity>
        ),
      }}
    >

      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          // headerShown: true,
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconContainer : null}>
              <Home size={22} color={color} />
            </View>
          ),
        }}
      />



      <Tabs.Screen
        name="rates"
        options={{
          title: "Live Rates",
          // headerShown: true,
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconContainer : null}>
              <TrendingUp size={22} color={color} />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="home"
        options={{
          title: "Notifications",
          // headerShown: true,
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconContainer : null}>
              <Bell size={22} color={color} />
            </View>
          ),
        }}
      />

      {/* {(isCustomer && !isSeller && !isAdmin) && (
        <Tabs.Screen
          name="dealers"
          options={{
            title: "Dealers",
            // headerShown: true,
            tabBarIcon: ({ color, focused }) => (
              <View style={focused ? styles.activeIconContainer : null}>
                <Users size={22} color={color} />
              </View>
            ),
          }}
        />
      )} */}

      {/* <Tabs.Screen
        name="transaction"
        options={{
          title: "Transaction",
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconContainer : null}>
              <CreditCard size={22} color={color} />
            </View>
          ),
        }}
      /> */}



      {/* <Tabs.Screen
        name="calculator"
        options={{
          title: "Calculator",
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconContainer : null}>
              <Calculator size={22} color={color} />
            </View>
          ),
        }}
      /> */}

      {/* <Tabs.Screen
        name="contact"
        options={{
          title: "Contact",
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconContainer : null}>
              <Phone size={22} color={color} />
            </View>
          ),
        }}
      /> */}


    </Tabs>

  );
}

const styles = StyleSheet.create({

  activeIconContainer: {
    backgroundColor: "rgba(212, 175, 55, 0.15)",
    borderRadius: 8,
    padding: 6,
  },
});