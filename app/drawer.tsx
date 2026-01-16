import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { MaterialCommunityIcons as Icon, Feather as Icon2 } from "@expo/vector-icons"; 
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import { useAuthStore, ADMIN_USERNAME } from "@/store/auth-store";

const { width } = Dimensions.get("window");
const DRAWER_WIDTH = Math.min(width * 0.85, 350);

export default function DrawerScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const isSeller = user?.role === "seller";
  const isAdmin = user?.role === "admin" || user?.username === ADMIN_USERNAME;

  const handleNavigation = (route: string) => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
    router.push(route as any);
  };

  const handleLogout = () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    logout();
    router.push("/auth/login");
  };

  const closeDrawer = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar style="dark" />
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.closeArea}
          onPress={closeDrawer}
          activeOpacity={0.7}
        >
          <View style={styles.drawerContent}>
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeDrawer}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="close" size={24} color="#333333" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Menu</Text>
            </View>

            <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false}>
              {isAdmin ? (
                // Admin Menu Items
                <>
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => handleNavigation("/(app)/(tabs)/dashboard")}
                  >
                    <View style={styles.menuIconContainer}>
                      <Icon name="home" size={22} color="#333333" />
                    </View>
                    <Text style={styles.menuText}>Dashboard</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => handleNavigation("/(admin)/users")}
                  >
                    <View style={styles.menuIconContainer}>
                      <Icon name="account-multiple" size={22} color="#333333" />
                    </View>
                    <Text style={styles.menuText}>User Management</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => handleNavigation("/(admin)/kyc-management")}
                  >
                    <View style={styles.menuIconContainer}>
                      <Icon name="chart-bar" size={22} color="#333333" />
                    </View>
                    <Text style={styles.menuText}>KYC Management</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => handleNavigation("/(app)/live-rates")}
                  >
                    <View style={styles.menuIconContainer}>
                      <Icon name="trending-up" size={22} color="#333333" />
                    </View>
                    <Text style={styles.menuText}>Live Rates</Text>
                  </TouchableOpacity>

                  {/* <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => handleNavigation("/(app)/transaction")}
                  >
                    <View style={styles.menuIconContainer}>
                      <CreditCard size={22} color="#333333" />
                    </View>
                    <Text style={styles.menuText}>Transaction</Text>
                  </TouchableOpacity> */}

                  {/* <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => handleNavigation("/(app)/connections")}
                  >
                    <View style={styles.menuIconContainer}>
                      <Map size={22} color="#333333" />
                    </View>
                    <Text style={styles.menuText}>Connections</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => handleNavigation("/(app)/contact")}
                  >
                    <View style={styles.menuIconContainer}>
                      <Phone size={22} color="#333333" />
                    </View>
                    <Text style={styles.menuText}>Contact Us</Text>
                  </TouchableOpacity> */}

                  {/* <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => handleNavigation("/calculator")}
                  >
                    <View style={styles.menuIconContainer}>
                      <Calculator size={22} color="#333333" />
                    </View>
                    <Text style={styles.menuText}>TDS Calculator</Text>
                  </TouchableOpacity> */}

                  {/* <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => handleNavigation("/(app)/kyc")}
                  >
                    <View style={styles.menuIconContainer}>
                      <FileText size={22} color="#333333" />
                    </View>
                    <Text style={styles.menuText}>KYC</Text>
                  </TouchableOpacity> */}

                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => handleNavigation("/(app)/profile")}
                  >
                    <View style={styles.menuIconContainer}>
                      <Icon2 name="user" size={22} color="#333333" />
                    </View>
                    <Text style={styles.menuText}>My Profile</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => handleNavigation("/(app)/share")}
                  >
                    <View style={styles.menuIconContainer}>
                      <Icon2 name="share-2" size={22} color="#333333" />
                    </View>
                    <Text style={styles.menuText}>Share App</Text>
                  </TouchableOpacity>
                </>
              ) : isSeller ? (
                // Seller Menu Items
                <>
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => handleNavigation("/(app)/(tabs)/dashboard")}
                  >
                    <View style={styles.menuIconContainer}>
                      <Icon name="home" size={22} color="#333333" />
                    </View>
                    <Text style={styles.menuText}>Dashboard</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => handleNavigation("/(app)/live-rates")}
                  >
                    <View style={styles.menuIconContainer}>
                      <Icon name="trending-up" size={22} color="#333333" />
                    </View>
                    <Text style={styles.menuText}>Live Rates</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => handleNavigation("/(app)/connect_to_seller")}
                  >
                    <View style={styles.menuIconContainer}>
                      <Icon2 name="users" size={22} color="#333333" />
                    </View>
                    <Text style={styles.menuText}>Connect to Seller</Text>
                  </TouchableOpacity>

                  {/* <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => handleNavigation("/(app)/connections")}
                  >
                    <View style={styles.menuIconContainer}>
                      <Map size={22} color="#333333" />
                    </View>
                    <Text style={styles.menuText}>Connections</Text>
                  </TouchableOpacity> */}

                  {/* <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => handleNavigation("/(app)/customers")}
                  >
                    <View style={styles.menuIconContainer}>
                      <Icon2 name="user"sIcon size={22} color="#333333" />
                    </View>
                    <Text style={styles.menuText}>Customers</Text>
                  </TouchableOpacity> */}

                  {/* <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => handleNavigation("/(app)/add-rates")}
                  >
                    <View style={styles.menuIconContainer}>
                      <TrendingUp size={22} color="#333333" />
                    </View>
                    <Text style={styles.menuText}>Add Rates</Text>
                  </TouchableOpacity> */}

                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => handleNavigation("/(app)/inventory")}
                  >
                    <View style={styles.menuIconContainer}>
                      <Icon2 name="package" size={22} color="#333333" />
                    </View>
                    <Text style={styles.menuText}>Manage Inventory</Text>
                  </TouchableOpacity>

                  {/* <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => handleNavigation("/contact")}
                  >
                    <View style={styles.menuIconContainer}>
                      <Phone size={22} color="#333333" />
                    </View>
                    <Text style={styles.menuText}>Contact Us</Text>
                  </TouchableOpacity> */}

                  {/* <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => handleNavigation("/calculator")}
                  >
                    <View style={styles.menuIconContainer}>
                      <Calculator size={22} color="#333333" />
                    </View>
                    <Text style={styles.menuText}>TDS Calculator</Text>
                  </TouchableOpacity> */}

                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => handleNavigation("/(app)/kyc")}
                  >
                    <View style={styles.menuIconContainer}>
                      <Icon2 name="file-text" size={22} color="#333333" />
                    </View>
                    <Text style={styles.menuText}>KYC</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => handleNavigation("/(app)/profile")}
                  >
                    <View style={styles.menuIconContainer}>
                      <Icon2 name="user" size={22} color="#333333" />
                    </View>
                    <Text style={styles.menuText}>My Profile</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => handleNavigation("/(app)/history")}
                  >
                    <View style={styles.menuIconContainer}>
                      <Icon name="history" size={22} color="#333333" />
                    </View>
                    <Text style={styles.menuText}>History</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => handleNavigation("/(app)/share")}
                  >
                    <View style={styles.menuIconContainer}>
                      <Icon2 name="share-2" size={22} color="#333333" />
                    </View>
                    <Text style={styles.menuText}>Share App</Text>
                  </TouchableOpacity>
                </>
              ) : (
                // Regular User Menu Items
                <>
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => handleNavigation("/(app)/(tabs)/dashboard")}
                  >
                    <View style={styles.menuIconContainer}>
                      <Icon name="home" size={22} color="#333333" />
                    </View>
                    <Text style={styles.menuText}>Dashboard</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => handleNavigation("/(app)/live-rates")}
                  >
                    <View style={styles.menuIconContainer}>
                      <Icon name="trending-up" size={22} color="#333333" />
                    </View>
                    <Text style={styles.menuText}>Live Rates</Text>
                  </TouchableOpacity>

                  {/* <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => handleNavigation("/sellers")}
                  >
                    <View style={styles.menuIconContainer}>
                      <Icon2 name="user"sIcon size={22} color="#333333" />
                    </View>
                    <Text style={styles.menuText}>Sellers</Text>
                  </TouchableOpacity> */}

                  {/* <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => handleNavigation("/contact")}
                  >
                    <View style={styles.menuIconContainer}>
                      <Phone size={22} color="#333333" />
                    </View>
                    <Text style={styles.menuText}>Contact Us</Text>
                  </TouchableOpacity> */}

                  {/* <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => handleNavigation("/calculator")}
                  >
                    <View style={styles.menuIconContainer}>
                      <Calculator size={22} color="#333333" />
                    </View>
                    <Text style={styles.menuText}>TDS Calculator</Text>
                  </TouchableOpacity> */}

                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => handleNavigation("/(app)/kyc")}
                  >
                    <View style={styles.menuIconContainer}>
                      <Icon2 name="file-text" size={22} color="#333333" />
                    </View>
                    <Text style={styles.menuText}>KYC</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => handleNavigation("/(app)/profile")}
                  >
                    <View style={styles.menuIconContainer}>
                      <Icon2 name="user" size={22} color="#333333" />
                    </View>
                    <Text style={styles.menuText}>My Profile</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => handleNavigation("/(app)/history")}
                  >
                    <View style={styles.menuIconContainer}>
                      <Icon2 name="user" size={22} color="#333333" />
                    </View>
                    <Text style={styles.menuText}>History</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => handleNavigation("/(app)/share")}
                  >
                    <View style={styles.menuIconContainer}>
                      <Icon2 name="share-2" size={22} color="#333333" />
                    </View>
                    <Text style={styles.menuText}>Share App</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>

            {/* Logout Button - Added at the bottom for all user types */}
            <View style={styles.logoutContainer}>
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
              >
                <View style={styles.menuIconContainer}>
                  <Icon name="logout" size={22} color="#D32F2F" />
                </View>
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  closeArea: {
    flex: 1,
    flexDirection: "row",
  },
  drawerContent: {
    width: DRAWER_WIDTH,
    backgroundColor: "#ffffff",
    height: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    paddingBottom: 20,
    display: "flex",
    flexDirection: "column",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  closeButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333333",
  },
  menuScroll: {
    flex: 1,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  menuIconContainer: {
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  menuText: {
    fontSize: 16,
    color: "#333333",
    marginLeft: 12,
  },
  logoutContainer: {
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    paddingTop: 8,
    marginTop: 8,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  logoutText: {
    fontSize: 16,
    color: "#D32F2F",
    fontWeight: "500",
    marginLeft: 12,
  },
});