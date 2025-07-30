import React, { useState, useCallback, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Linking, Platform, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useAuthStore } from "@/store/auth-store";
import { Bell, X, Check, User, Mail, Phone, MapPin, Gift, Award, UserCheck, IndianRupee, Clock, Package, ThumbsUp, Menu, ThumbsDown, ShoppingBag } from "lucide-react-native";
import { router, useFocusEffect } from "expo-router";

export default function NotificationsScreen() {
  const {
    user,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    refreshNotifications,
  } = useAuthStore();

  const [refreshing, setRefreshing] = useState(false);

  // Refresh notifications when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user && user.id) {
        refreshNotifications();
      }
    }, [user, refreshNotifications])
  );

  // When setting notifications, map them as follows:
  const mappedNotifications = notifications.map((n: any) => ({
    ...n,
    id: n._id ? n._id.toString() : n.id,
    timestamp: n.timestamp || (n.createdAt ? new Date(n.createdAt).getTime() : Date.now()),
  }));



  // Filter notifications - show all notifications to all users except notification with id '1' which is admin-only
  const userNotifications = user ? mappedNotifications.filter(notification => {
    // Admin can see all notifications including the one with id '1'
    if (user?.role === 'admin') {
      return true;
    }

    // For non-admin users, exclude notification with id '1'
    if (notification.id === '1') {
      return false;
    }

    // Show all other notifications to all users
    return (
      !notification.recipientId || // Global notifications
      notification.recipientId.toString() === user.id || // User-specific notifications
      notification.recipientId.toString() === user._id || // Also check _id
      notification.type === 'system' || // System notifications
      notification.type === 'alert' // Alert notifications
    );
  }) : [];



  // Calculate unread count from filtered notifications
  const unreadNotificationsCount = userNotifications.filter(n => !n.read).length;

  // Debug logging (commented out to avoid performance issues)
  // console.log('Home Notifications Debug:', {
  //   totalNotifications: notifications.length,
  //   mappedNotifications: mappedNotifications.length,
  //   userNotifications: userNotifications.length,
  //   unreadCount: unreadNotificationsCount,
  //   userRole: user?.role,
  //   userId: user?.id,
  //   user_id: user?._id
  // });

  // Pull to refresh function
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshNotifications();
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshNotifications]);

  // Helper to format timestamp
  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hr ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  // Notification icon by type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "seller_signup": return <User size={20} color="#43A047" />; // Green for sellers
      case "customer_signup": return <User size={20} color="#1976D2" />; // Blue for customers
      case "user_deletion": return <X size={20} color="#E53935" />;
      case "transaction": return <IndianRupee size={20} color="#F3B62B" />;
      case "system": return <Award size={20} color="#43A047" />;
      case "alert": return <Bell size={20} color="#E53935" />;
      case "referral": return <Gift size={20} color="#F3B62B" />;
      case "contact_request": return <User size={20} color="#1976D2" />;
      case "role_change": return <UserCheck size={20} color="#5C6BC0" />;
      case "payment_success": return <Check size={20} color="#43A047" />;
      case "buy_request": return <ShoppingBag size={20} color="#F3B62B" />;
      case 'buy_request_accepted':
        return <ThumbsUp size={20} color="#4CAF50" />;
      case 'buy_request_declined':
        return <ThumbsDown size={20} color="#E53935" />;
      default:
        return <Bell size={20} color="#333333" />;
    }
  };

  // Render notification details based on type
  const renderNotificationDetails = (item: any) => {
    // Contact Request
    if (item.type === "contact_request" && item.data?.customer) {
      const customer = item.data.customer;
      return (
        <View style={styles.detailsBox}>
          <Text style={styles.detailsTitle}>User Details:</Text>
          <View style={styles.detailRow}>
            <User size={16} color="#666" style={styles.detailIcon} />
            <Text style={styles.detailText}>{customer.name}</Text>
          </View>
          <View style={styles.detailRow}>
            <Mail size={16} color="#666" style={styles.detailIcon} />
            <Text style={styles.detailText}>{customer.email}</Text>
          </View>
          {customer.phone && (
            <View style={styles.detailRow}>
              <Phone size={16} color="#666" style={styles.detailIcon} />
              <Text style={styles.detailText}>{customer.phone}</Text>
            </View>
          )}
          {customer.city && (
            <View style={styles.detailRow}>
              <MapPin size={16} color="#666" style={styles.detailIcon} />
              <Text style={styles.detailText}>{customer.city}</Text>
            </View>
          )}
          <View style={styles.actionRow}>
            {customer.phone && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => Linking.openURL(`tel:${customer.phone}`)}
              >
                <Phone size={18} color="#fff" />
                <Text style={styles.actionButtonText}>Call</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => Linking.openURL(`mailto:${customer.email}`)}
            >
              <Mail size={18} color="#fff" />
              <Text style={styles.actionButtonText}>Email</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // Buy Request Accepted
    if (item.type === "buy_request" && item.data?.product && item.data?.seller) {
      const product = item.data.product;
      const seller = item.data.seller;
      return (
        <View style={styles.detailsBox}>
          <View style={styles.detailRow}>
            <Package size={16} color="#666" style={styles.detailIcon} />
            <Text style={styles.detailLabel}>Product:</Text>
            <Text style={styles.detailText}>{product.productName}</Text>
          </View>
          <Text style={[styles.detailsTitle, { marginTop: 8 }]}>Seller Contact Details:</Text>
          {seller.phone && (
            <View style={styles.detailRow}>
              <Phone size={16} color="#666" style={styles.detailIcon} />
              <Text style={styles.detailText}>{seller.phone}</Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Mail size={16} color="#666" style={styles.detailIcon} />
            <Text style={styles.detailText}>{seller.email}</Text>
          </View>
          <View style={styles.actionRow}>
            {seller.phone && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => Linking.openURL(`tel:${seller.phone}`)}
              >
                <Phone size={18} color="#fff" />
                <Text style={styles.actionButtonText}>Call</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => Linking.openURL(`mailto:${seller.email}`)}
            >
              <Mail size={18} color="#fff" />
              <Text style={styles.actionButtonText}>Email</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // Default: no extra details
    return null;
  };


  const openDrawer = () => {
    router.push("/drawer");
  };

  // const toggleNotifications = () => {
  //     if (Platform.OS !== "web") {
  //       Haptics.selectionAsync();
  //     }
  //     setShowNotifications(!showNotifications);
  //   };

  const isSeller = user?.role === 'seller';
  const isCustomer = user?.role === 'customer';
  const isAdmin = user?.role === 'admin';

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>

      <View style={styles.header}>
        <TouchableOpacity
          onPress={openDrawer}
          style={styles.menuButton}
        >
          <Menu size={24} color="#333333" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Notification</Text>
        </View>

        <TouchableOpacity
          onPress={async () => {
            try {
              await markAllNotificationsAsRead();
            } catch (error) {
              console.error('Error marking all notifications as read:', error);
            }
          }}
          style={styles.markAllReadButton}
        >
          <Check size={22} color="#1976D2" />
          {/* <Text style={styles.markAllReadText}>Mark all as read</Text> */}
          {unreadNotificationsCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>{unreadNotificationsCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>


      {/* <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>

      </View> */}


      {(isSeller || isCustomer) && (
        <FlatList
          data={userNotifications}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#1976D2"]}
              tintColor="#1976D2"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Bell size={48} color="#e0e0e0" />
              <Text style={styles.emptyText}>No notifications yet</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.notificationCard,
                !item.read && styles.unreadNotification,
              ]}
              onPress={async () => {
                try {
                  await markNotificationAsRead(item.id);
                } catch (error) {
                  console.error('Error marking notification as read:', error);
                }
              }}
              activeOpacity={0.9}
            >
              <View style={styles.notificationHeader}>
                <View style={styles.iconContainer}>{getNotificationIcon(item.type)}</View>
                <View style={styles.titleContainer}>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.time}>{formatTimestamp(item.timestamp)}</Text>
                </View>
                {!item.read && <View style={styles.unreadDot} />}
              </View>
              <Text style={styles.message}>{item.message}</Text>
              {renderNotificationDetails(item)}
            </TouchableOpacity>
          )}
        />
      )}


      {isAdmin && (
        <FlatList
          data={userNotifications}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#1976D2"]}
              tintColor="#1976D2"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Bell size={48} color="#e0e0e0" />
              <Text style={styles.emptyText}>No notifications yet</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.notificationCard,
                !item.read && styles.unreadNotification,
              ]}
              onPress={async () => {
                try {
                  await markNotificationAsRead(item.id);
                } catch (error) {
                  console.error('Error marking notification as read:', error);
                }
              }}
              activeOpacity={0.9}
            >
              <View style={styles.notificationHeader}>
                <View style={styles.iconContainer}>{getNotificationIcon(item.type)}</View>
                <View style={styles.titleContainer}>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.time}>{formatTimestamp(item.timestamp)}</Text>
                </View>
                {!item.read && <View style={styles.unreadDot} />}
              </View>
              <Text style={styles.message}>{item.message}</Text>
              {renderNotificationDetails(item)}
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginLeft: -6,
  },
  markAllReadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end"
  },
  markAllReadText: { color: "#1976D2", marginLeft: 4, fontSize: 14 },
  listContent: { padding: 20 },
  notificationCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  unreadNotification: { backgroundColor: "#E3F2FD" },
  notificationHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8, position: "relative" },
  iconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", marginRight: 12 },
  titleContainer: { flex: 1 },
  title: { fontSize: 16, fontWeight: "600", color: "#333" },
  time: { fontSize: 12, color: "#9e9e9e", marginTop: 2 },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#1976D2", position: "absolute", top: 0, right: 0 },
  message: { fontSize: 14, color: "#666", marginBottom: 4 },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 40 },
  emptyText: { fontSize: 16, color: "#9e9e9e", marginTop: 16 },
  // Details styles
  detailsBox: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    marginBottom: 4,
  },
  detailsTitle: {
    fontWeight: "bold",
    color: "#333",
    marginBottom: 6,
    fontSize: 14,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  detailIcon: {
    marginRight: 8,
  },
  detailLabel: {
    fontWeight: "bold",
    color: "#333",
    marginRight: 4,
    fontSize: 14,
  },
  detailText: {
    fontSize: 14,
    color: "#666",
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginTop: 10,
    gap: 10,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1976D2",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginRight: 10,
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 6,
    fontSize: 15,
  },

  menuButton: {
    // padding: 5,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
  },
  notificationButton: {
    padding: 8,
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#E53935",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationBadgeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "bold",
  },
});