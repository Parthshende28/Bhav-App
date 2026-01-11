import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from './api';
import { userAPI, requestAPI, notificationAPI } from '@/services/api';
import systemIP from '../services/ip.js';

// Reserved admin username - this is the username that only admin can use
export const ADMIN_USERNAME = "vipin_bullion";

// Maximum number of sellers a customer can add via referral codes
export const MAX_SELLER_REFERRALS = 15;

export interface User {
  id: string;
  _id?: string;
  name?: string;
  fullName?: string;
  email: string;
  role: 'admin' | 'seller' | 'customer' | 'buyer' | 'seller_pending';
  city: string | undefined;
  state: string | undefined;
  phone?: string;
  address?: string;
  profileImage?: string;
  isPremium: boolean;
  premiumPlan?: string;
  subscriptionStatus: "active" | "expired" | "cancelled";
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  sellerPlan?: string;
  sellerVerified: any;
  brandName?: string;
  about?: string;
  whatsappNumber?: string;
  instagramHandle?: string;
  location?: string;
  catalogueImages?: string[];
  referralCode?: string;
  sellerId?: string;
  catalogue: ReactNode;
  referredBy?: string;
  referralCount: number;
  referralEarnings: number;
  enteredSellerReferrals?: string[]; // Added to track connected sellers
  // Request tracking fields
  totalBuyRequests?: number;
  totalSellRequests?: number;
  totalRequestsAccepted?: number;
  totalRequestsDeclined?: number;
  buyRequestCount: number;
  isActive: boolean;
  createdAt: number | string;
  username?: string;
  brandImage?: string;
  isEmailVerified?: boolean;
  updatedAt?: number;
}


// Define a type for the mock user that includes password
interface MockUser extends User {
  isPremium: any;
  city: any;
  state: any;
  sellerTier: any;
  isEmailVerified: any;
  username: any;
  password: string;
  premiumPlan?: string; // Added to fix compile error
  sellerVerified: any; // Changed to required to match User interface
  updatedAt?: number; // Added to fix compile error for updatedAt
  // Ensure all User fields are properly typed
  about?: string;
  address?: string;
  brandName?: string;
  whatsappNumber?: string;
  instagramHandle?: string;
  location?: string;
  catalogueImages?: string[];
}


// Define notification interface
export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  type: 'user_signup' | 'seller_signup' | 'customer_signup' | 'transaction' | 'system' | 'alert' | 'user_deletion' | 'email_verification' | 'contact_request' | 'referral' | 'role_change' | 'payment_success' | 'rate_interest' | 'buy_request' | 'buy_request_accepted' | 'buy_request_declined' | 'sell_request' | 'sell_request_accepted' | 'sell_request_declined';
  recipientId?: string; // ID of the user this notification is for (null/undefined for all/admin)
  data?: any;
}


// Define referral code interface
export interface ReferralCode {
  id: string;
  code: string;
  createdAt: number;
  expiresAt: number;
  isUsed: boolean;
  usedBy?: string; // User ID who used this code
  usedAt?: number; // When the code was used
}


// Define seller referral interface
export interface SellerReferral {
  id: string;
  customerId: string;
  sellerId: string;
  referralCode: string;
  addedAt: number;
}


// Define contacted seller interface
export interface ContactedSeller {
  sellerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerCity?: string;
  customerState?: string;
  timestamp: number;
}

// // Define metal rate interface
// export interface MetalRate {
//   id: string;
//   sellerId: string;
//   metalType: 'gold' | 'silver';
//   weight: string;
//   weightUnit: 'g' | 'kg';
//   rate: number;
//   image?: string;
//   createdAt: number;
//   updatedAt: number;
// }


// Define rate interest interface
export interface RateInterest {
  id: string;
  rateId: string;
  customerId: string;
  sellerId: string;
  timestamp: number;
}

// Define inventory item interface
export interface InventoryItem {
  _id?: string;
  image: any;
  isBuyPremiumEnabled: boolean;
  isSellPremiumEnabled: boolean;
  productType: string;
  sellPremium: any;
  buyPremium: any;
  id: string;
  sellerId: string;
  productName: string;
  description?: string;
  price: number;
  quantity: number;
  isVisible: boolean;
  createdAt: number;
  updatedAt: number;
}

// Define buy request interface
export interface BuyRequest {
  id: string;
  itemId: string;
  customerId: string;
  sellerId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: number;
  updatedAt: number;
  requestType?: 'buy' | 'sell';
  capturedAmount?: number;
  capturedAt?: string;
  quantity?: string;
  message?: string;
}


// Add this interface in auth-store.ts
export interface BuyRequestStatus {
  [requestId: string]: {
    status: 'accepted' | 'declined';
    timestamp: number;
  };
}


export type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  hasSeenOnboarding: boolean;
  adminUsernameRegistered: boolean;
  users: MockUser[];
  notifications: Notification[];
  unreadNotificationsCount: number;
  contactedDealers: string[]; // Array of dealer IDs that the user has contacted
  contactedSellerDetails: ContactedSeller[]; // Array of detailed contact records
  isPremiumUser: boolean; // Added isPremiumUser to the state
  referralCodes: ReferralCode[]; // Added referral codes array
  sellerReferrals: SellerReferral[]; // Added seller referrals array
  rateInterests: RateInterest[]; // Added rate interests array
  inventoryItems: InventoryItem[]; // Added inventory items array
  buyRequests: BuyRequest[]; // Added buy requests array
  buyRequestStatuses: BuyRequestStatus;
  selectedSeller?: User | null;
  setSelectedSeller: (seller: User | null) => void;
  setHasSeenOnboarding: (seen: boolean) => void;
  setBuyRequests: (requests: BuyRequest[]) => void; // Added setter for buy requests
  setSellerReferrals: (referrals: SellerReferral[]) => void; // Added setter for seller referrals
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; token?: string; user?: User }>;
  signup: (userData: Partial<User>, password: string) => Promise<{ success: boolean; error?: string; userId?: string; message?: string }>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  deleteUser: (userId: string) => Promise<{ success: boolean; error?: string }>;
  isAdminUsername: (username: string) => boolean;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAllNotifications: () => void;
  getUserByEmail: (email: string) => MockUser | undefined;
  getUserById: (id: string) => User | undefined;
  contactDealer: (dealerId: string) => Promise<void>;
  getNotificationsForUser: (userId: string) => Notification[];
  getUnreadNotificationsCountForUser: (userId: string) => number;
  generateReferralCode: () => string;
  getReferralStats: () => { total: number; active: number; used: number };
  applyReferralCode: (code: string, userId: string) => Promise<{ success: boolean; error?: string }>;
  getSellerCount: () => number;
  getCustomerCount: () => number;
  getContactedSellerDetails: () => ContactedSeller[];
  getCustomersForSeller: (sellerId: string) => ContactedSeller[];

  // Buy request functions
  createBuyRequest: (itemId: string, customerId: string, sellerId: string) => Promise<{ success: boolean; error?: string; requestId?: string }>;
  acceptBuyRequest: (requestId: string) => Promise<{ success: boolean; error?: string }>;
  declineBuyRequest: (requestId: string) => Promise<{ success: boolean; error?: string }>;
  getBuyRequestsForSeller: (sellerId: string) => BuyRequest[];
  getBuyRequestsForCustomer: (customerId: string) => BuyRequest[];
  getAllBuyRequests: () => BuyRequest[];
  getBuyRequestById: (requestId: string) => BuyRequest | undefined;
  // Buy request limit functions
  getUserBuyRequestCount: (userId: string) => number;
  hasReachedBuyRequestLimit: (userId: string) => boolean;
  incrementUserBuyRequestCount: (userId: string) => Promise<{ success: boolean; error?: string }>;
  resetUserBuyRequestCount: (userId: string) => Promise<{ success: boolean; error?: string }>;
  // Seller referral code functions
  generateSellerReferralCode: (sellerId: string) => Promise<{ success: boolean; error?: string; code?: string }>;
  getSellerByReferralCode: (code: string) => User | undefined;
  addSellerReferral: (customerId: string, sellerId: string, referralCode: string) => Promise<{ success: boolean; error?: string }>;
  getSellerReferralsForCustomer: (customerId: string) => SellerReferral[];
  hasReachedSellerReferralLimit: (customerId: string) => boolean;
  removeSellerReferral: (referralId: string) => Promise<{ success: boolean; error?: string }>;

  setBuyRequestStatus: (requestId: string, status: 'accepted' | 'declined') => void;
  getBuyRequestStatus: (requestId: string) => 'accepted' | 'declined' | null;
  getUsers: () => Promise<{ success: boolean; error?: string }>;
  // Inventory API functions
  addInventoryItemAPI: (item: any) => Promise<{ success: boolean; error?: string; item?: any }>;
  getInventoryItemsForSellerAPI: (sellerId: string) => Promise<{ success: boolean; error?: string; items?: any[] }>;
  getAllInventoryItems: () => InventoryItem[];
  updateInventoryItem: (item: Partial<InventoryItem> & { id: string }) => Promise<{ success: boolean; error?: string }>;
  updateInventoryItemAPI: (id: string, updateData: any) => Promise<{ success: boolean; error?: string; item?: any }>;
  deleteInventoryItemAPI: (id: string) => Promise<{ success: boolean; error?: string }>;
  toggleInventoryItemVisibilityAPI: (id: string) => Promise<{ success: boolean; error?: string; item?: any }>;
  getPublicInventoryForSellerAPI: (sellerId: string) => Promise<{ success: boolean; error?: string; items?: any[] }>;

  // Request API functions
  createRequestAPI: (itemId: string, requestType: 'buy' | 'sell', quantity: string, message: string, capturedAmount: number) => Promise<{ success: boolean; error?: string; request?: any }>;
  getSellerRequestsAPI: (status?: string) => Promise<{ success: boolean; error?: string; requests?: any[] }>;
  getCustomerRequestsAPI: (status?: string) => Promise<{ success: boolean; error?: string; requests?: any[] }>;
  acceptRequestAPI: (requestId: string) => Promise<{ success: boolean; error?: string; request?: any }>;
  declineRequestAPI: (requestId: string) => Promise<{ success: boolean; error?: string; request?: any }>;

  setInventoryItems: (items: InventoryItem[]) => void;

  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  refreshUserProfile: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  fetchSellerData: (sellerId: string) => Promise<{ success: boolean; seller?: User; error?: string }>;
}


// Initial mock user data for testing
const initialMockUsers: MockUser[] = [];

// Initial notifications
const initialNotifications: Notification[] = [
  {
    id: '1',
    title: 'Welcome to Admin Dashboard',
    message: 'Welcome to Bhav admin dashboard. You can manage users, view analytics, and monitor transactions here.',
    timestamp: Date.now() - 3600000, // 1 hour ago
    read: false,
    type: 'system',
  },
  {
    id: '2',
    title: 'System Update',
    message: 'The system has been updated to version 1.2.0 with new features and improvements.',
    timestamp: Date.now() - 86400000, // 1 day ago
    read: false,
    type: 'system',
  }
];

// Initial referral codes
const initialReferralCodes: ReferralCode[] = [];

// Initial seller referrals
const initialSellerReferrals: SellerReferral[] = [];

// Initial rate interests
const initialRateInterests: RateInterest[] = [];

// Initial inventory items
const initialInventoryItems: InventoryItem[] = [];

// Initial buy requests
const initialBuyRequests: BuyRequest[] = [];

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      token: null,
      hasSeenOnboarding: false,
      adminUsernameRegistered: true, // Set to true since we now have a pre-defined admin
      users: initialMockUsers, // Initialize with mock users
      notifications: initialNotifications, // Initialize with mock notifications
      unreadNotificationsCount: initialNotifications.filter(n => !n.read).length,
      contactedDealers: [], // Initialize with empty array
      contactedSellerDetails: [], // Initialize with empty array for detailed contact records
      isPremiumUser: false, // Initialize isPremiumUser as false
      referralCodes: initialReferralCodes, // Initialize with empty array
      sellerReferrals: initialSellerReferrals, // Initialize with empty array
      rateInterests: initialRateInterests, // Initialize with empty array
      inventoryItems: initialInventoryItems, // Initialize with mock inventory items
      buyRequests: initialBuyRequests, // Initialize with empty array
      buyRequestStatuses: {} as BuyRequestStatus,
      selectedSeller: null,
      setSelectedSeller: (seller: User | null) => set({ selectedSeller: seller }),
      setHasSeenOnboarding: (seen: boolean) => set({ hasSeenOnboarding: seen }),
      setBuyRequests: (requests: BuyRequest[]) => set({ buyRequests: requests }),

      isAdminUsername: (username: string) => {
        return username === ADMIN_USERNAME;
      },

      getUserByEmail: (email: string) => {
        return get().users.find(u => u.email === email);
      },

      getUserById: (id: string) => {
        const user = get().users.find(u => u.id === id);
        if (user) {
          // Return user without password
          const { password, ...userWithoutPassword } = user;
          return userWithoutPassword;
        }
        return undefined;
      },


      // fetching users from backend database
      getUsersFromDB: async () => {
        try {
          const response = await API.get("/auth/all-users"); // Update if your route differs
          set({ users: response.data.users });
        } catch (error) {
          console.error("Failed to fetch users from DB", error);
        }
      },

      // login from backend database
      login: async (email, password) => {
        try {
          // console.log("Login attempt for:", email);
          const response = await fetch(`https://bhav-backend-0b70.onrender.com/api/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });

          const responseText = await response.text();

          if (!response.ok) {
            // If response is not ok, try to parse error message from response
            let errorMessage = 'Login failed';
            try {
              const errorData = JSON.parse(responseText);
              errorMessage = errorData?.message || errorMessage;
            } catch (parseError) {
              // If JSON parsing fails, use the raw text (might be HTML error page)
              errorMessage = responseText || errorMessage;
            }
            
            // Replace technical error messages with user-friendly ones
            if (errorMessage.toLowerCase().includes('suspended') || 
                errorMessage.toLowerCase().includes('service suspended')) {
              errorMessage = 'Contact owner';
            }
            
            // console.log("Login failed:", errorMessage);
            return {
              success: false,
              error: errorMessage,
            };
          }

          const data = JSON.parse(responseText);

          // console.log("Login successful for user:", data.user?.id, data.user?.role);

          // console.log("Login successful for user:", data.user?.id, data.user?.role);

          // Set user data and authentication state
          set({
            user: {
              ...data.user,
              id: data.user._id || data.user.id, // Always set id to _id if present
              _id: data.user._id || data.user.id,
            },
            isAuthenticated: true,
            token: data.token,
            isPremiumUser: !!data.user?.isPremium,
          });

          // --- Save token to AsyncStorage for axios interceptor ---
          if (data.token) {
            await AsyncStorage.setItem(
              'auth-storage',
              JSON.stringify({ state: { token: data.token } })
            );
            // console.log('Saved token to AsyncStorage:', data.token);
          }
          // --------------------------------------------------------

          // Fetch notifications from backend after successful login
          try {
            const notifRes = await notificationAPI.getUserNotifications();
            if (notifRes.data && notifRes.data.notifications) {
              const mappedNotifications = notifRes.data.notifications.map((n: any) => ({
                ...n,
                id: n._id ? n._id.toString() : n.id,
                timestamp: n.timestamp || (n.createdAt ? new Date(n.createdAt).getTime() : Date.now()),
              }));

              // Calculate unread count for current user
              const unreadCount = mappedNotifications.filter((n: any) =>
                !n.read &&
                (!n.recipientId || n.recipientId === data.user._id || n.recipientId === data.user.id)
              ).length;

              set({
                notifications: mappedNotifications,
                unreadNotificationsCount: unreadCount
              });
            }
          } catch (notifError) {
            console.error('Error fetching notifications after login:', notifError);
            // Don't fail login if notifications fail to load
          }
          return {
            success: true,
            token: data.token,
            user: data.user
          };
        } catch (error) {
          console.error('Login API error:', error);
          return {
            success: false,
            error: 'Login failed. Please try again.',
          };
        }
      },

      // signup from backend database
      signup: async (userData, password) => {
        try {
          const response = await fetch(`https://bhav-backend-0b70.onrender.com/api/auth/signup`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ...userData, password }),
          });

          const data = await response.json();

          if (!response.ok) {
            return {
              success: false,
              error: data?.message || 'Signup failed',
            };
          }

          return {
            success: true,
            message: data?.message || 'Signup successful',
            userId: data?.userId,
          };
        } catch (error) {
          console.error('Signup API error:', error);
          return {
            success: false,
            error: 'Signup failed. Please try again.',
          };
        }
      },

      logout: () => {
        console.log("Logout called");
        set({
          user: null,
          isAuthenticated: false,
          token: null,
          isPremiumUser: false, // Reset isPremiumUser on logout
          contactedDealers: [], // Reset contacted dealers on logout
          contactedSellerDetails: [], // Reset contacted seller details on logout
        });
      },

      updateUser: async (userData: Partial<User>) => {
        let success = true;
        let error = undefined;

        try {
          // Get the current user
          const currentUser = get().user;

          // First, update the profile in the backend
          if (currentUser) {
            try {
              const response = await userAPI.updateProfile(userData);

              if (response.data?.success) {
                const responseUserData = response.data.user as any;
                // Update local state with the response from backend
                const updatedUser = {
                  ...currentUser,
                  ...responseUserData,
                  id: responseUserData._id || responseUserData.id,
                  _id: responseUserData._id || responseUserData.id,
                };

                // Update users array as well
                const updatedUsers = get().users.map(u => {
                  if (u.id === currentUser.id) {
                    return { ...u, ...responseUserData, id: responseUserData._id || responseUserData.id };
                  }
                  return u;
                });

                set({
                  user: updatedUser,
                  users: updatedUsers,
                  isPremiumUser: !!responseUserData?.isPremium || !!currentUser.isPremium,
                });

                return { success: true };
              } else {
                throw new Error(response.data?.message || 'Failed to update profile');
              }
            } catch (apiError: any) {
              console.error("API Error updating user:", apiError);
              return {
                success: false,
                error: apiError.response?.data?.message || apiError.message || "Failed to update profile"
              };
            }
          }

          // Fallback to local state update if no current user
          const updatedUserData = {
            ...userData,
            updatedAt: Date.now()
          };

          // Check if this is a role change from customer to seller
          const userId = (userData as any).id || (currentUser ? currentUser.id : '');
          const userToUpdate = get().users.find(u => u.id === userId);
          const isRoleChangeToSeller = userToUpdate &&
            userToUpdate.role === 'customer' &&
            (userData as any).role === 'seller';

          // Update users array
          const updatedUsers = get().users.map((u: MockUser) => {
            if (u.id === userId) {
              // If role is changing to seller and no referral code exists, generate one
              if (isRoleChangeToSeller && !u.referralCode) {
                const brandInitials = (userData as any).brandName || u.brandName
                  ? (((userData as any).brandName || u.brandName) ? ((userData as any).brandName || u.brandName)!.split(' ').map(word => word[0]).join('').toUpperCase().substring(0, 3) : (u?.name ?? '').substring(0, 3).toUpperCase())
                  : (u?.name ?? '').substring(0, 3).toUpperCase();

                const userInitials = u.username.substring(0, 4).toUpperCase();
                (updatedUserData as any).referralCode = `${brandInitials}${u.id}${userInitials}`;
              }

              return { ...u, ...updatedUserData } as MockUser;
            }
            return u;
          });

          // Update the user in the state if it's the current user
          if (currentUser && (userId === currentUser.id || !(userData as any).id)) {
            const updatedUser = {
              ...currentUser,
              ...updatedUserData
            } as User;

            set({
              user: updatedUser,
              users: updatedUsers,
              isPremiumUser: !!(updatedUserData as any).isPremium || !!currentUser.isPremium,
            });
          } else {
            set({ users: updatedUsers });
          }

          // If this is a role change from customer to seller, create a notification
          if (isRoleChangeToSeller && userToUpdate) {
            await get().addNotification({
              title: "User Role Changed",
              message: `${userToUpdate.fullName || userToUpdate.name} has upgraded from customer to seller.`,
              type: "role_change",
              data: {
                user: {
                  id: userToUpdate.id,
                  name: userToUpdate.fullName || userToUpdate.name,
                  email: userToUpdate.email,
                  role: 'seller',
                  city: userToUpdate.city,
                  state: userToUpdate.state,
                  phone: userToUpdate.phone,
                  brandName: userData.brandName || userToUpdate.brandName
                },
                previousRole: 'customer',
                newRole: 'seller'
              }
            });
          }

        } catch (err: any) {
          console.error("Error updating user:", err);
          success = false;
          error = "Failed to update user profile";
        }

        return { success, error };
      },

      deleteUser: async (userId) => {
        // Check if user exists
        const userToDelete = get().users.find(u => u.id === userId);

        if (!userToDelete) {
          return {
            success: false,
            error: "User not found."
          };
        }

        // Check if trying to delete admin user
        if (userToDelete.role === 'admin') {
          return {
            success: false,
            error: "Admin users cannot be deleted."
          };
        }

        // Check if trying to delete currently logged in user
        if (get().user?.id === userId) {
          return {
            success: false,
            error: "Cannot delete your own account while logged in."
          };
        }

        try {
          // Make API call to delete user from backend
          const response = await API.delete(`/auth/users/${userId}`);

          if (response.status === 200) {
            // Remove user from users array
            const updatedUsers = get().users.filter(u => u.id !== userId);
            set({ users: updatedUsers });

            // Create notification about user deletion
            if (userToDelete.role === 'customer' && userToDelete.enteredSellerReferrals && userToDelete.enteredSellerReferrals.length > 0) {
              // If customer, only notify connected sellers
              for (const sellerId of userToDelete.enteredSellerReferrals) {
                await get().addNotification({
                  recipientId: sellerId,
                  title: `Customer Deleted`,
                  message: `${userToDelete.fullName} has been removed from the system.`,
                  type: 'user_deletion',
                  data: {
                    user: {
                      id: userToDelete.id,
                      name: userToDelete.fullName,
                      email: userToDelete.email,
                      role: userToDelete.role
                    }
                  }
                });
              }
            } else if (userToDelete.role !== 'customer') {
              // For non-customers (sellers/admins), send global notification
              await get().addNotification({
                title: `User Deleted`,
                message: `${userToDelete.fullName} (${userToDelete.role}) has been removed from the system.`,
                type: 'user_deletion',
                data: {
                  user: {
                    id: userToDelete.id,
                    name: userToDelete.fullName,
                    email: userToDelete.email,
                    role: userToDelete.role
                  }
                }
              });
            }

            return { success: true };
          } else {
            return {
              success: false,
              error: "Failed to delete user from server."
            };
          }
        } catch (error) {
          console.error("Error deleting user:", error);
          return {
            success: false,
            error: "Failed to delete user from database."
          };
        }
      },

      // Notification functions
      addNotification: async (notification) => {
        try {


          // Call backend API to create notification
          const response = await notificationAPI.createNotification({
            recipientId: notification.recipientId,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            data: notification.data || {},
            isGlobal: !notification.recipientId,
            isAdminOnly: false,
            priority: 'medium'
          });

          if (response.data && response.data.success) {

            // Refresh notifications from backend
            await get().refreshNotifications();
          } else {
            console.error('Failed to create notification on backend:', response.data);
          }
        } catch (error) {
          console.error('Error creating notification on backend:', error);
          // Fallback to local state only if backend fails
          const newNotification: Notification = {
            ...notification,
            id: Date.now().toString(),
            timestamp: Date.now(),
            read: false,
          };

          set((state) => {
            const updatedNotifications = [newNotification, ...state.notifications];

            // Only increment unread count if notification is for current user or has no recipient (global)
            const shouldIncrementUnread =
              !newNotification.recipientId || // Global notification
              (state.user && newNotification.recipientId === state.user.id); // For current user



            return {
              notifications: updatedNotifications,
              unreadNotificationsCount: shouldIncrementUnread
                ? state.unreadNotificationsCount + 1
                : state.unreadNotificationsCount
            };
          });
        }
      },

      markNotificationAsRead: async (id) => {
        try {
          // Call backend API to mark notification as read
          await notificationAPI.markNotificationAsRead(id);

          // Update local state
          set((state) => {
            const updatedNotifications = state.notifications.map(notification =>
              notification.id === id ? { ...notification, read: true } : notification
            );

            // Only count unread notifications for current user or global ones
            const unreadCount = updatedNotifications.filter(n =>
              !n.read &&
              (!n.recipientId || (state.user && n.recipientId === state.user.id))
            ).length;

            return {
              notifications: updatedNotifications,
              unreadNotificationsCount: unreadCount
            };
          });
        } catch (error) {
          console.error('Error marking notification as read:', error);
          // Still update local state even if API call fails
          set((state) => {
            const updatedNotifications = state.notifications.map(notification =>
              notification.id === id ? { ...notification, read: true } : notification
            );

            const unreadCount = updatedNotifications.filter(n =>
              !n.read &&
              (!n.recipientId || (state.user && n.recipientId === state.user.id))
            ).length;

            return {
              notifications: updatedNotifications,
              unreadNotificationsCount: unreadCount
            };
          });
        }
      },

      markAllNotificationsAsRead: async () => {
        try {
          // Call backend API to mark all notifications as read
          await notificationAPI.markAllNotificationsAsRead();

          // Update local state
          set((state) => {
            // Only mark notifications for current user or global ones as read
            const updatedNotifications = state.notifications.map(notification => {
              if (!notification.recipientId || (state.user && notification.recipientId === state.user.id)) {
                return { ...notification, read: true };
              }
              return notification;
            });

            return {
              notifications: updatedNotifications,
              unreadNotificationsCount: 0
            };
          });
        } catch (error) {
          console.error('Error marking all notifications as read:', error);
          // Still update local state even if API call fails
          set((state) => {
            const updatedNotifications = state.notifications.map(notification => {
              if (!notification.recipientId || (state.user && notification.recipientId === state.user.id)) {
                return { ...notification, read: true };
              }
              return notification;
            });

            return {
              notifications: updatedNotifications,
              unreadNotificationsCount: 0
            };
          });
        }
      },

      deleteNotification: async (id) => {
        try {
          // Call backend API to delete notification
          await notificationAPI.deleteNotification(id);
          
          set((state) => {
            const updatedNotifications = state.notifications.filter(
              notification => notification.id !== id
            );

            // Recalculate unread count for current user
            const unreadCount = updatedNotifications.filter(n =>
              !n.read &&
              (!n.recipientId || (state.user && n.recipientId === state.user.id))
            ).length;

            return {
              notifications: updatedNotifications,
              unreadNotificationsCount: unreadCount
            };
          });
        } catch (error) {
          console.error('Error deleting notification:', error);
          // Optimistically update local state or show error? 
          // Let's optimistic update to keep UI responsive, but maybe we should revert on error?
          // For now, let's just update local state anyway as per previous implementation logic
          set((state) => {
            const updatedNotifications = state.notifications.filter(
              notification => notification.id !== id
            );

            const unreadCount = updatedNotifications.filter(n =>
              !n.read &&
              (!n.recipientId || (state.user && n.recipientId === state.user.id))
            ).length;

            return {
              notifications: updatedNotifications,
              unreadNotificationsCount: unreadCount
            };
          });
        }
      },

      clearAllNotifications: () => {
        set({
          notifications: [],
          unreadNotificationsCount: 0
        });
      },

      // Get notifications for a specific user
      getNotificationsForUser: (userId) => {
        return get().notifications.filter(n =>
          !n.recipientId || // Global notifications
          n.recipientId === userId // User-specific notifications
        );
      },

      // Get unread notifications count for a specific user
      getUnreadNotificationsCountForUser: (userId) => {
        return get().notifications.filter(n =>
          !n.read &&
          (!n.recipientId || n.recipientId === userId)
        ).length;
      },

      // Get contacted seller details
      getContactedSellerDetails: () => {
        return get().contactedSellerDetails;
      },

      // Get customers for a specific seller
      getCustomersForSeller: (sellerId) => {
        return get().contactedSellerDetails.filter(contact =>
          contact.sellerId === sellerId
        );
      },

      // Dealer contact function
      contactDealer: async (dealerId: string) => {
        const currentUser = get().user;
        if (!currentUser) return;

        // Get dealer information
        const dealer = get().users.find(u => u.id === dealerId);
        if (!dealer) return;

        // Create a new contact record
        const newContact: ContactedSeller = {
          sellerId: dealerId,
          customerName: currentUser.fullName || currentUser.name || '',
          customerEmail: currentUser.email,
          customerPhone: currentUser.phone,
          customerCity: currentUser.city,
          customerState: currentUser.state,
          timestamp: Date.now()
        };

        // Send notification to the seller
        await get().addNotification({
          title: "New Customer Inquiry",
          message: `${currentUser.fullName || currentUser.name} is interested in your products and has requested your contact details.`,
          type: "contact_request",
          recipientId: dealerId, // This notification is for the seller
          data: {
            customer: {
              id: currentUser.id,
              name: currentUser.fullName || currentUser.name,
              email: currentUser.email,
              phone: currentUser.phone,
              city: currentUser.city,
              state: currentUser.state,
              address: currentUser.address
            },
            dealer: {
              id: dealer.id,
              name: dealer.fullName || dealer.name,
              email: dealer.email,
              brandName: dealer.brandName,
              phone: dealer.phone
            }
          }
        });

        // Send notification to admin
        await get().addNotification({
          title: "New Dealer Contact",
          message: `${currentUser.fullName || currentUser.name} contacted ${dealer.fullName || dealer.name}.`,
          type: "contact_request",
          data: {
            customer: {
              id: currentUser.id,
              name: currentUser.fullName || currentUser.name,
              email: currentUser.email,
              phone: currentUser.phone,
              city: currentUser.city,
              state: currentUser.state,
              address: currentUser.address
            },
            dealer: {
              id: dealer.id,
              name: dealer.fullName || dealer.name,
              email: dealer.email,
              brandName: dealer.brandName,
              phone: dealer.phone
            }
          }
        });

        // Update state
        set((state) => {
          // Add dealer to contacted dealers list if not already contacted
          if (!state.contactedDealers.includes(dealerId)) {
            return {
              contactedDealers: [...state.contactedDealers, dealerId],
              contactedSellerDetails: [...state.contactedSellerDetails, newContact]
            };
          }
          return state;
        });
      },

      // Referral code functions
      generateReferralCode: () => {
        // Generate a random 8-character alphanumeric code
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
          code += characters.charAt(Math.floor(Math.random() * characters.length));
        }

        // Create a new referral code object
        const newReferralCode: ReferralCode = {
          id: Date.now().toString(),
          code,
          createdAt: Date.now(),
          expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days expiry
          isUsed: false
        };

        // Add to referral codes array
        set((state) => ({
          referralCodes: [...state.referralCodes, newReferralCode]
        }));

        return code;
      },

      // Get referral stats
      getReferralStats: () => {
        const referralCodes = get().referralCodes;
        const now = Date.now();

        return {
          total: referralCodes.length,
          active: referralCodes.filter(code => !code.isUsed && code.expiresAt > now).length,
          used: referralCodes.filter(code => code.isUsed).length
        };
      },

      // Apply referral code
      applyReferralCode: async (code, userId) => {
        const referralCodes = get().referralCodes;
        const now = Date.now();

        // Find the referral code
        const referralCode = referralCodes.find(rc => rc.code === code);

        // Check if code exists
        if (!referralCode) {
          return {
            success: false,
            error: "Invalid referral code."
          };
        }

        // Check if code is already used
        if (referralCode.isUsed) {
          return {
            success: false,
            error: "This referral code has already been used."
          };
        }

        // Check if code is expired
        if (referralCode.expiresAt < now) {
          return {
            success: false,
            error: "This referral code has expired."
          };
        }

        // Get the user
        const user = get().users.find(u => u.id === userId);
        if (!user) {
          return {
            success: false,
            error: "User not found."
          };
        }

        // Mark code as used
        const updatedReferralCodes = referralCodes.map(rc => {
          if (rc.id === referralCode.id) {
            return {
              ...rc,
              isUsed: true,
              usedBy: userId,
              usedAt: now
            };
          }
          return rc;
        });

        // Update user to premium
        const updatedUsers = get().users.map(u => {
          if (u.id === userId) {
            return {
              ...u,
              isPremium: true,
              premiumPlan: "Referral Premium"
            };
          }
          return u;
        });

        // Update current user if it's the same user
        if (get().user?.id === userId) {
          const { password, ...userWithoutPassword } = user;
          set({
            user: {
              ...userWithoutPassword,
              isPremium: true,
              premiumPlan: "Referral Premium"
            },
            isPremiumUser: true
          });
        }

        // Update state
        set({
          referralCodes: updatedReferralCodes,
          users: updatedUsers
        });

        // Add notification about referral code usage
        await get().addNotification({
          title: "Referral Code Used",
          message: `${user.fullName || user.name} used referral code ${code} and gained premium access.`,
          type: "referral",
          data: {
            user: {
              id: user.id,
              name: user.fullName || user.name,
              email: user.email
            },
            referralCode: code
          }
        });

        return { success: true };
      },

      // Get seller count
      getSellerCount: () => {
        return get().users.filter(user => user.role === 'seller').length;
      },

      // Get customer count
      getCustomerCount: () => {
        return get().users.filter(user => user.role === 'customer' || user.role === 'buyer').length;
      },

      // getAllInventoryItems: () => {
      //   return get().inventoryItems;
      // },

      // Buy request functions
      createBuyRequest: async (itemId, customerId, sellerId) => {
        try {
          // Check if this request already exists
          const existingRequest = get().buyRequests.find(
            request => request.itemId === itemId &&
              request.customerId === customerId &&
              request.status === 'pending'
          );

          if (existingRequest) {
            return {
              success: false,
              error: "You already have a pending request for this item."
            };
          }

          // Check if user has reached the buy request limit
          const user = get().users.find(u => u.id === customerId);
          if (!user) {
            return {
              success: false,
              error: "User not found."
            };
          }

          // Request limits removed - users can make unlimited requests

          const newRequest: BuyRequest = {
            id: Date.now().toString(),
            itemId,
            customerId,
            sellerId,
            status: 'pending',
            createdAt: Date.now(),
            updatedAt: Date.now()
          };

          set((state) => ({
            buyRequests: [...state.buyRequests, newRequest]
          }));

          // Increment the user's buy request count if they're not premium
          if (!user.isPremium) {
            await get().incrementUserBuyRequestCount(customerId);
          }

          // Get customer and item details
          const customer = get().getUserById(customerId);
          const item = get().inventoryItems.find(i => i.id === itemId);
          const seller = get().getUserById(sellerId);

          if (customer && item && seller) {
            // Send notification to seller
            await get().addNotification({
              title: "New Request",
              message: `${customer.fullName || customer.name} has requested ${item.productName}.`,
              type: "buy_request",
              recipientId: itemId,
              data: {
                requestId: newRequest.id,
                customer: {
                  id: customer.id,
                  name: customer.fullName || customer.name,
                  email: customer.email,
                  phone: customer.phone,
                  city: customer.city,
                  state: customer.state
                },
                item: {
                  id: item.id,
                  productName: item.productName,
                  sellPremium: item.sellPremium,
                  buyPremium: item.buyPremium
                },
                seller: {
                  id: seller.id,
                  name: seller.fullName || seller.name,
                  brandName: seller.brandName
                }
              }
            });
          }

          return { success: true, requestId: newRequest.id };
        } catch (error) {
          console.error("Error creating buy request:", error);
          return {
            success: false,
            error: "Failed to create buy request."
          };
        }
      },

      acceptBuyRequest: async (requestId) => {
        try {
          const request = get().buyRequests.find(r => r.id === requestId);

          if (!request) {
            return { success: false, error: "Buy request not found." };
          }

          if (request.status !== 'pending') {
            return { success: false, error: "This request has already been processed." };
          }

          // Update the request status
          set((state) => ({
            buyRequests: state.buyRequests.map(r =>
              r.id === requestId
                ? { ...r, status: 'accepted' as const, respondedAt: Date.now() }
                : r
            )
          }));

          // Set the persistent status
          get().setBuyRequestStatus(requestId, 'accepted');

          // Get customer, item, and seller details
          const customer = get().getUserById(request.customerId);
          const item = get().inventoryItems.find(i => i.id === request.itemId);
          const seller = get().getUserById(request.sellerId);

          if (customer && item && seller) {
            // Send notification to customer
            await get().addNotification({
              title: "Request Accepted",
              message: `${seller.brandName || seller.fullName || seller.name} has accepted your request to ${request.requestType === 'buy' ? 'buy' : 'sell'} ${item.productName}.`,
              type: request.requestType === 'buy' ? "buy_request_accepted" : "sell_request_accepted",
              recipientId: customer.id,
              data: {
                requestId: request.id,
                customer: {
                  id: customer.id,
                  name: customer.fullName || customer.name
                },
                item: {
                  id: item.id,
                  productName: item.productName
                },
                seller: {
                  id: seller.id,
                  name: seller.fullName || seller.name,
                  brandName: seller.brandName
                }
              }
            });
          }

          return { success: true };
        } catch (error) {
          console.error("Error accepting buy request:", error);
          return { success: false, error: "Failed to accept buy request." };
        }
      },

      declineBuyRequest: async (requestId) => {
        try {
          const request = get().buyRequests.find(r => r.id === requestId);

          if (!request) {
            return { success: false, error: "Buy request not found." };
          }

          if (request.status !== 'pending') {
            return { success: false, error: "This request has already been processed." };
          }

          // Update the request status
          set((state) => ({
            buyRequests: state.buyRequests.map(r =>
              r.id === requestId
                ? { ...r, status: 'declined' as const, respondedAt: Date.now() }
                : r
            )
          }));

          // Set the persistent status
          get().setBuyRequestStatus(requestId, 'declined');

          // Get customer, item, and seller details
          const customer = get().getUserById(request.customerId);
          const item = get().inventoryItems.find(i => i.id === request.itemId);
          const seller = get().getUserById(request.sellerId);

          if (customer && item && seller) {
            // Send notification to customer
            await get().addNotification({
              title: "Request Declined",
              message: `${seller.brandName || seller.fullName || seller.name} has declined your request to ${request.requestType === 'buy' ? 'buy' : 'sell'} ${item.productName}.`,
              type: request.requestType === 'buy' ? "buy_request_declined" : "sell_request_declined",
              recipientId: customer.id,
              data: {
                requestId: request.id,
                customer: {
                  id: customer.id,
                  name: customer.fullName || customer.name
                },
                item: {
                  id: item.id,
                  productName: item.productName
                },
                seller: {
                  id: seller.id,
                  name: seller.fullName || seller.name,
                  brandName: seller.brandName
                }
              }
            });
          }

          return { success: true };
        } catch (error) {
          console.error("Error declining buy request:", error);
          return { success: false, error: "Failed to decline buy request." };
        }
      },

      getBuyRequestsForSeller: (sellerId) => {
        return get().buyRequests.filter(request => request.sellerId === sellerId);
      },

      getBuyRequestsForCustomer: (customerId) => {
        return get().buyRequests.filter(request => request.customerId === customerId);
      },

      getAllBuyRequests: () => {
        return get().buyRequests;
      },

      getBuyRequestById: (requestId) => {
        return get().buyRequests.find(request => request.id === requestId);
      },

      // Buy request limit functions
      getUserBuyRequestCount: (userId) => {
        const user = get().users.find(u => u.id === userId);
        return user?.buyRequestCount || 0;
      },

      hasReachedBuyRequestLimit: (userId) => {
        // Always return false since we removed request limits
        return false;
      },

      incrementUserBuyRequestCount: async (userId) => {
        try {
          set((state) => {
            const updatedUsers = state.users.map(u => {
              if (u.id === userId) {
                const currentCount = u.buyRequestCount || 0;
                return {
                  ...u,
                  buyRequestCount: currentCount + 1
                };
              }
              return u;
            });

            // Also update the current user if it's the same user
            if (state.user && state.user.id === userId) {
              return {
                users: updatedUsers,
                user: {
                  ...state.user,
                  buyRequestCount: (state.user.buyRequestCount || 0) + 1
                }
              };
            }

            return { users: updatedUsers };
          });

          return { success: true };
        } catch (error) {
          console.error("Error incrementing buy request count:", error);
          return {
            success: false,
            error: "Failed to update buy request count."
          };
        }
      },

      resetUserBuyRequestCount: async (userId) => {
        try {
          set((state) => {
            const updatedUsers = state.users.map(u => {
              if (u.id === userId) {
                return {
                  ...u,
                  buyRequestCount: 0
                };
              }
              return u;
            });

            // Also update the current user if it's the same user
            if (state.user && state.user.id === userId) {
              return {
                users: updatedUsers,
                user: {
                  ...state.user,
                  buyRequestCount: 0
                }
              };
            }

            return { users: updatedUsers };
          });

          return { success: true };
        } catch (error) {
          console.error("Error resetting buy request count:", error);
          return {
            success: false,
            error: "Failed to reset buy request count."
          };
        }
      },

      // Seller referral code functions
      generateSellerReferralCode: async (sellerId) => {
        try {
          const seller = get().users.find(u => u.id === sellerId);

          if (!seller) {
            return {
              success: false,
              error: "Seller not found."
            };
          }

          // Check if seller already has a referral code
          if (seller.referralCode) {
            return {
              success: true,
              code: seller.referralCode
            };
          }

          // Generate a 6-digit alphanumeric referral code
          const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
          let referralCode = '';

          // Generate 6 random characters
          for (let i = 0; i < 4; i++) {
            referralCode += characters.charAt(Math.floor(Math.random() * characters.length));
          }

          // Ensure uniqueness by checking existing codes
          let isUnique = false;
          while (!isUnique) {
            const existingUser = get().users.find(u => u.referralCode === referralCode);
            if (!existingUser) {
              isUnique = true;
            } else {
              // Generate a new code if duplicate found
              referralCode = '';
              for (let i = 0; i < 4; i++) {
                referralCode += characters.charAt(Math.floor(Math.random() * characters.length));
              }
            }
          }

          // Update the seller with the new referral code
          set((state) => {
            const updatedUsers = state.users.map(u => {
              if (u.id === sellerId) {
                return {
                  ...u,
                  referralCode
                };
              }
              return u;
            });

            // Also update the current user if it's the same user
            if (state.user && state.user.id === sellerId) {
              return {
                users: updatedUsers,
                user: {
                  ...state.user,
                  referralCode
                }
              };
            }


            return { users: updatedUsers };
          });

          return { success: true, code: referralCode };
        } catch (error) {
          console.error("Error generating seller referral code:", error);
          return {

            success: false,
            error: "Failed to generate referral code."
          };
        }
      },

      getSellerByReferralCode: (code) => {
        const seller = get().users.find(u => u.role === 'seller' && u.phone === code);

        if (seller) {
          // Return seller without password
          const { password, ...sellerWithoutPassword } = seller;
          return sellerWithoutPassword;
        }

        return undefined;
      },

      addSellerReferral: async (customerId, sellerId, referralCode) => {
        try {
          // Check if customer exists
          const customer = get().users.find(u => u.id === customerId);
          if (!customer) {
            return {
              success: false,
              error: "Customer not found."
            };
          }

          // Check if seller exists
          const seller = get().users.find(u => u.id === sellerId);
          if (!seller) {
            return {
              success: false,
              error: "Seller not found."
            };
          }

          // Check if the customer has already added the maximum number of sellers
          if (get().hasReachedSellerReferralLimit(customerId)) {
            return {
              success: false,
              error: `You have reached the maximum limit of ${MAX_SELLER_REFERRALS} sellers. Please remove one to add another.`
            };
          }

          // Create new seller referral
          const newReferral: SellerReferral = {
            id: Date.now().toString(),
            customerId,
            sellerId,
            referralCode,
            addedAt: Date.now()
          };

          // Add to seller referrals array
          set((state) => ({
            sellerReferrals: [...state.sellerReferrals, newReferral]
          }));

          // Add notification for seller
          await get().addNotification({
            title: "New Referral Connection",
            message: `${customer.fullName || customer.name} has added you as a seller using your referral code.`,
            type: "referral",
            recipientId: sellerId,
            data: {
              customer: {
                id: customer.id,
                name: customer.fullName || customer.name,
                email: customer.email
              },
              referralCode
            }
          });

          return { success: true };
        } catch (error) {
          console.error("Error adding seller referral:", error);
          return {
            success: false,
            error: "Failed to add seller referral."
          };
        }
      },

      getSellerReferralsForCustomer: (customerId) => {
        return get().sellerReferrals.filter(ref => ref.customerId === customerId);
      },

      hasReachedSellerReferralLimit: (customerId) => {
        const referrals = get().sellerReferrals.filter(ref => ref.customerId === customerId);
        return referrals.length >= MAX_SELLER_REFERRALS;
      },

      removeSellerReferral: async (referralId) => {
        try {
          set((state) => ({
            sellerReferrals: state.sellerReferrals.filter(ref => ref.id !== referralId)
          }));

          return { success: true };
        } catch (error) {
          console.error("Error removing seller referral:", error);
          return {
            success: false,
            error: "Failed to remove seller referral."
          };
        }
      },

      // Buy request status functions
      setBuyRequestStatus: (requestId: string, status: 'accepted' | 'declined') => {
        set((state) => ({
          buyRequestStatuses: {
            ...state.buyRequestStatuses,
            [requestId]: {
              status,
              timestamp: Date.now()
            }
          }
        }));
      },

      getBuyRequestStatus: (requestId: string) => {
        const statusData = get().buyRequestStatuses[requestId];
        return statusData ? statusData.status : null;
      },

      getUsers: async () => {
        try {
          const response = await API.get("/auth/all-users");
          // Convert backend user format to frontend format
          const convertedUsers = response.data.users.map((user: any) => ({
            id: user._id || user.id,
            _id: user._id,
            name: user.fullName || user.name,
            fullName: user.fullName || user.name,
            email: user.email,
            role: user.role,
            city: user.city,
            state: user.state,
            phone: user.phone,
            username: user.username,
            isEmailVerified: user.isEmailVerified || false,
            sellerTier: user.sellerTier,
            sellerVerified: user.sellerVerified,
            createdAt: user.createdAt,
            isPremium: user.isPremium,
            buyRequestCount: user.buyRequestCount || 0,
            isActive: user.isActive !== false,
            catalogue: undefined,
            password: '', // Mock password for compatibility
            premiumPlan: user.premiumPlan,
            brandImage: user.brandImage,
            sellerPlan: user.sellerPlan,
            updatedAt: user.updatedAt,
            // Add missing seller fields
            about: user.about,
            address: user.address,
            brandName: user.brandName,
            whatsappNumber: user.whatsappNumber,
            instagramHandle: user.instagramHandle,
            location: user.location,
            enteredSellerReferrals: user.sellerReferrals || [],
            catalogueImages: user.catalogueImages || []
          }));
          set({ users: convertedUsers });
          return { success: true };
        } catch (error) {
          console.error("Error fetching users:", error);
          return { success: false, error: "Failed to fetch users." };
        }
      },

      // Inventory API functions
      addInventoryItemAPI: async (item) => {
        try {
          const response = await API.post("/inventory", item);
          return { success: true, item: response.data.item };
        } catch (error: any) {
          console.error("Error adding inventory item:", error);
          return {
            success: false,
            error: error.response?.data?.message || "Failed to add inventory item."
          };
        }
      },

      getInventoryItemsForSellerAPI: async (sellerId) => {
        // Ensure sellerId is a valid string (like in login)
        const validSellerId = typeof sellerId === 'string' && sellerId.length > 0 ? sellerId : undefined;
        if (!validSellerId) {
          return {
            success: false,
            error: 'Invalid sellerId provided.'
          };
        }
        try {
          const response = await API.get(`/inventory/seller/${validSellerId}`);
          return { success: true, items: response.data.items };
        } catch (error: any) {
          console.error("Error fetching inventory items:", error);
          return {
            success: false,
            error: error.response?.data?.message || "Failed to fetch inventory items."
          };
        }
      },

      getAllInventoryItems: () => {
        return get().inventoryItems;
      },

      updateInventoryItem: async (item) => {
        try {
          const response = await API.put(`/inventory/${item.id}`, {
            productName: item.productName,
            productType: item.productType,
            buyPremium: item.buyPremium,
            sellPremium: item.sellPremium,
            isBuyPremiumEnabled: item.isBuyPremiumEnabled,
            isSellPremiumEnabled: item.isSellPremiumEnabled,
            isVisible: item.isVisible
          });

          if (response.status === 200) {
            // Update local state
            set((state) => ({
              inventoryItems: state.inventoryItems.map(i =>
                i.id === item.id ? { ...i, ...item, updatedAt: Date.now() } : i
              )
            }));
            return { success: true };
          } else {
            return { success: false, error: "Failed to update inventory item" };
          }
        } catch (error: any) {
          console.error("Error updating inventory item:", error);
          return {
            success: false,
            error: error.response?.data?.message || "Failed to update inventory item."
          };
        }
      },

      updateInventoryItemAPI: async (id, updateData) => {
        try {
          const response = await API.put(`/inventory/${id}`, updateData);
          return { success: true, item: response.data.item };
        } catch (error: any) {
          console.error("Error updating inventory item:", error);
          return {
            success: false,
            error: error.response?.data?.message || "Failed to update inventory item."
          };
        }
      },

      deleteInventoryItemAPI: async (id) => {
        try {
          await API.delete(`/inventory/${id}`);
          return { success: true };
        } catch (error: any) {
          console.error("Error deleting inventory item:", error);
          return {
            success: false,
            error: error.response?.data?.message || "Failed to delete inventory item."
          };
        }
      },

      toggleInventoryItemVisibilityAPI: async (id) => {
        try {
          const response = await API.patch(`/inventory/${id}/toggle-visibility`);
          return { success: true, item: response.data.item };
        } catch (error: any) {
          console.error("Error toggling inventory item visibility:", error);
          return {
            success: false,
            error: error.response?.data?.message || "Failed to toggle inventory item visibility."
          };
        }
      },

      // Request API functions
      createRequestAPI: async (itemId, requestType, quantity, message, capturedAmount) => {
        try {
          const currentUser = get().user;
          if (!currentUser) {
            return {
              success: false,
              error: "User not authenticated."
            };
          }

          // Validate required parameters
          if (!itemId) {
            return {
              success: false,
              error: "Item ID is required."
            };
          }

          if (!requestType || !['buy', 'sell'].includes(requestType)) {
            return {
              success: false,
              error: "Valid request type (buy or sell) is required."
            };
          }

          if (!capturedAmount || isNaN(capturedAmount) || capturedAmount <= 0) {
            return {
              success: false,
              error: "Valid captured amount is required."
            };
          }

          console.log('📝 Creating request with data:', {
            itemId,
            requestType,
            quantity,
            message,
            capturedAmount
          });

          // Call backend API to create request
          const response = await requestAPI.createRequest({ itemId, requestType, quantity, message, capturedAmount });
          if (!response.data || !response.data.success) {
            return {
              success: false,
              error: response.data?.message || "Failed to create request."
            };
          }

          // Optionally update local buyRequests state if needed
          // Fetch latest notifications from backend
          const notifRes = await notificationAPI.getUserNotifications();
          if (notifRes.data && notifRes.data.notifications) {
            const mappedNotifications = notifRes.data.notifications.map((n: any) => ({
              ...n,
              id: n._id ? n._id.toString() : n.id,
              timestamp: n.timestamp || (n.createdAt ? new Date(n.createdAt).getTime() : Date.now()),
            }));

            // Calculate unread count for current user
            const currentUser = get().user;
            const unreadCount = mappedNotifications.filter((n: any) =>
              !n.read &&
              (!n.recipientId || (currentUser && n.recipientId === currentUser.id))
            ).length;

            set({
              notifications: mappedNotifications,
              unreadNotificationsCount: unreadCount
            });
          }

          return { success: true, request: response.data.request };
        } catch (error: any) {
          console.error("Error creating request:", error);

          // Handle specific error cases
          if (error.response?.status === 400) {
            return {
              success: false,
              error: error.response?.data?.message || "Invalid request data. Please check your information."
            };
          } else if (error.response?.status === 401) {
            return {
              success: false,
              error: "Authentication failed. Please log in again."
            };
          } else if (error.response?.status === 404) {
            return {
              success: false,
              error: "Item not found. Please try again."
            };
          } else if (error.response?.status === 500) {
            return {
              success: false,
              error: "Server error. Please try again later."
            };
          } else if (error.code === 'NETWORK_ERROR') {
            return {
              success: false,
              error: "Network error. Please check your internet connection."
            };
          } else {
            return {
              success: false,
              error: error.response?.data?.message || error.message || "Failed to create request."
            };
          }
        }
      },

      getSellerRequestsAPI: async (status) => {
        try {
          const response = await requestAPI.getSellerRequests(status);
          if (!response.data || !response.data.success) {
            return {
              success: false,
              error: response.data?.message || "Failed to fetch seller requests."
            };
          }
          return { success: true, requests: response.data.requests };
        } catch (error) {
          console.error("Error fetching seller requests:", error);
          return { success: false, error: "Failed to fetch seller requests." };
        }
      },

      getCustomerRequestsAPI: async (status) => {
        try {
          const response = await requestAPI.getCustomerRequests(status);
          if (!response.data || !response.data.success) {
            return {
              success: false,
              error: response.data?.message || "Failed to fetch customer requests."
            };
          }
          return { success: true, requests: response.data.requests };
        } catch (error) {
          console.error("Error fetching customer requests:", error);
          return { success: false, error: "Failed to fetch customer requests." };
        }
      },

      acceptRequestAPI: async (requestId) => {
        try {
          const response = await requestAPI.acceptRequest(requestId);
          if (!response.data || !response.data.success) {
            return {
              success: false,
              error: response.data?.message || "Failed to accept request."
            };
          }
          // Fetch latest notifications from backend
          const notifRes = await notificationAPI.getUserNotifications();
          if (notifRes.data && notifRes.data.notifications) {
            const mappedNotifications = notifRes.data.notifications.map((n: any) => ({
              ...n,
              id: n._id ? n._id.toString() : n.id,
              timestamp: n.timestamp || (n.createdAt ? new Date(n.createdAt).getTime() : Date.now()),
            }));

            // Calculate unread count for current user
            const currentUser = get().user;
            const unreadCount = mappedNotifications.filter((n: any) =>
              !n.read &&
              (!n.recipientId || (currentUser && n.recipientId === currentUser.id))
            ).length;

            set({
              notifications: mappedNotifications,
              unreadNotificationsCount: unreadCount
            });
          }
          return { success: true, request: response.data.request };
        } catch (error) {
          console.error("Error accepting request:", error);
          return { success: false, error: "Failed to accept request." };
        }
      },

      declineRequestAPI: async (requestId) => {
        try {
          const response = await requestAPI.declineRequest(requestId);
          if (!response.data || !response.data.success) {
            return {
              success: false,
              error: response.data?.message || "Failed to decline request."
            };
          }
          // Fetch latest notifications from backend
          const notifRes = await notificationAPI.getUserNotifications();
          if (notifRes.data && notifRes.data.notifications) {
            const mappedNotifications = notifRes.data.notifications.map((n: any) => ({
              ...n,
              id: n._id ? n._id.toString() : n.id,
              timestamp: n.timestamp || (n.createdAt ? new Date(n.createdAt).getTime() : Date.now()),
            }));

            // Calculate unread count for current user
            const currentUser = get().user;
            const unreadCount = mappedNotifications.filter((n: any) =>
              !n.read &&
              (!n.recipientId || (currentUser && n.recipientId === currentUser.id))
            ).length;

            set({
              notifications: mappedNotifications,
              unreadNotificationsCount: unreadCount
            });
          }
          return { success: true, request: response.data.request };
        } catch (error) {
          console.error("Error declining request:", error);
          return { success: false, error: "Failed to decline request." };
        }
      },

      setInventoryItems: (items: InventoryItem[]) => {
        set({ inventoryItems: items });
      },

      setSellerReferrals: (referrals: SellerReferral[]) => {
        set({ sellerReferrals: referrals });
      },

      getPublicInventoryForSellerAPI: async (sellerId) => {
        try {
          const response = await API.get(`/inventory/public/${sellerId}`);
          return { success: true, items: response.data.items };
        } catch (error: any) {
          console.error("Error fetching public inventory items:", error);
          return {
            success: false,
            error: error.response?.data?.message || "Failed to fetch public inventory items."
          };
        }
      },

      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      refreshUserProfile: async () => {
        try {
          const res = await userAPI.getProfile();
          if (res.data?.user) {
            set({ user: res.data.user, isAuthenticated: true });

            // Also refresh notifications
            await get().refreshNotifications();
          }
        } catch (e) {
          set({ user: null, isAuthenticated: false });
        }
      },
      refreshNotifications: async () => {
        try {
          const notifRes = await notificationAPI.getUserNotifications();

          if (notifRes.data && notifRes.data.notifications) {
            const mappedNotifications = notifRes.data.notifications.map((n: any) => ({
              ...n,
              id: n._id ? n._id.toString() : n.id,
              timestamp: n.timestamp || (n.createdAt ? new Date(n.createdAt).getTime() : Date.now()),
            }));

            // Calculate unread count for current user
            const currentUser = get().user;
            const unreadCount = mappedNotifications.filter((n: any) =>
              !n.read &&
              (!n.recipientId ||
                (currentUser && (n.recipientId === currentUser.id || n.recipientId === currentUser._id)))
            ).length;

            set({
              notifications: mappedNotifications,
              unreadNotificationsCount: unreadCount
            });
          } else {
            console.log('No notifications data received:', notifRes);
          }
        } catch (error) {
          console.error('Error refreshing notifications:', error);
        }
      },

      // Function to fetch seller data by ID from backend
      fetchSellerData: async (sellerId: string) => {
        try {
          const response = await userAPI.getSellerById(sellerId);
          if (response.data?.success && response.data.seller) {
            const sellerData = {
              ...response.data.seller,
              id: response.data.seller._id || response.data.seller.id,
              _id: response.data.seller._id || response.data.seller.id,
            };
            return { success: true, seller: sellerData };
          } else {
            return { success: false, error: 'Seller not found' };
          }
        } catch (error: any) {
          console.error('Error fetching seller data:', error);
          return { success: false, error: error.message || 'Failed to fetch seller data' };
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: {
        getItem: async (name) => {
          const item = await AsyncStorage.getItem(name);
          return item ? JSON.parse(item) : null;
        },
        setItem: async (name, value) => await AsyncStorage.setItem(name, JSON.stringify(value)),
        removeItem: async (name) => await AsyncStorage.removeItem(name),
      }
    }
  )
);


// clear cache func
const clearAsyncStorage = async () => {
  try {
    await AsyncStorage.clear();
    console.log('AsyncStorage cleared');
  } catch (e) {
    console.error('Failed to clear AsyncStorage.', e);
  }
};

// clearAsyncStorage(); // Clear AsyncStorage on startup for testing purposes