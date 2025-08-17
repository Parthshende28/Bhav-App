import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    RefreshControl,
    Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import {
    ArrowLeft,
    Clock,
    CheckCircle,
    XCircle,
    TrendingUp,
    TrendingDown,
    Package,
    ShoppingCart,
    Menu,
    Users,
    BarChart2,
    IndianRupee,
    Mail,
    Phone,
    MapPin,
    User,
    Info
} from "lucide-react-native";
import { useAuthStore, BuyRequest } from "@/store/auth-store";

export default function HistoryScreen() {
    const router = useRouter();
    const {
        user,
        getBuyRequestsForSeller,
        getInventoryItemsForSellerAPI,
        getUserById,
        buyRequests,
        setBuyRequests,
        inventoryItems,
    } = useAuthStore();

    const isAdmin = user?.role === 'admin';
    const isCustomer = user?.role === 'customer';
    const isSeller = user?.role === 'seller';

    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'accepted' | 'declined'>('all');
    const [selectedType, setSelectedType] = useState<'all' | 'buy' | 'sell'>('all');
    const [requestDetails, setRequestDetails] = useState<{ [key: string]: { product: any, customer: any } }>({});

    // Calculate counts for statistics
    const acceptedCount = buyRequests.filter(req => req.status === 'accepted').length;
    const declinedCount = buyRequests.filter(req => req.status === 'declined').length;
    const pendingCount = buyRequests.filter(req => req.status === 'pending').length;

    // Filter requests based on selection
    const filteredRequests = buyRequests.filter(request => {
        const statusMatch = selectedStatus === 'all' || request.status === selectedStatus;
        const typeMatch = selectedType === 'all' || request.requestType === selectedType;
        return statusMatch && typeMatch;
    });

    // Fetch buy requests for the current user (same as dashboard)
    const fetchRequests = async () => {
        if (user) {
            try {
                let result;
                if (user.role === 'seller') {
                    result = await useAuthStore.getState().getSellerRequestsAPI();
                } else {
                    result = await useAuthStore.getState().getCustomerRequestsAPI();
                }

                if (result.success && result.requests) {
                    // Convert backend format to frontend format and extract populated data
                    const convertedRequests = result.requests
                        .filter((req: any) => req && req._id)
                        .map((req: any) => {
                            const converted = {
                                id: req._id ? req._id.toString() : req.id,
                                itemId: req.itemId && typeof req.itemId === 'object' ? (req.itemId._id ? req.itemId._id.toString() : req.itemId.id) : req.itemId,
                                customerId: req.customerId && typeof req.customerId === 'object' ? (req.customerId._id ? req.customerId._id.toString() : req.customerId.id) : req.customerId,
                                sellerId: req.sellerId && typeof req.sellerId === 'object' ? (req.sellerId._id ? req.sellerId._id.toString() : req.sellerId.id) : req.sellerId,
                                status: req.status,
                                createdAt: req.createdAt ? new Date(req.createdAt).getTime() : Date.now(),
                                updatedAt: req.updatedAt ? new Date(req.updatedAt).getTime() : Date.now(),
                                requestType: req.requestType,
                                capturedAmount: req.capturedAmount,
                                capturedAt: req.capturedAt,
                                quantity: req.quantity,
                                message: req.message
                            };

                            return converted;
                        });

                    // Update global state
                    setBuyRequests(convertedRequests);

                    // Cache all the details in one go
                    const detailsToCache: { [key: string]: { product: any, customer: any } } = {};

                    result.requests
                        .filter((req: any) => req && req._id)
                        .forEach((req: any) => {
                            const requestId = req._id ? req._id.toString() : req.id;

                            if (req.customerId && typeof req.customerId === 'object') {
                                const customerData = {
                                    id: req.customerId._id ? req.customerId._id.toString() : req.customerId.id,
                                    fullName: req.customerId.fullName,
                                    name: req.customerId.fullName,
                                    email: req.customerId.email,
                                    phone: req.customerId.phone,
                                    city: req.customerId.city,
                                    state: req.customerId.state
                                };

                                detailsToCache[requestId] = {
                                    ...detailsToCache[requestId],
                                    customer: customerData
                                };
                            }

                            if (req.itemId && typeof req.itemId === 'object') {
                                const productData = {
                                    id: req.itemId._id ? req.itemId._id.toString() : req.itemId.id,
                                    productName: req.itemId.productName,
                                    productType: req.itemId.productType,
                                    buyPremium: req.itemId.buyPremium,
                                    sellPremium: req.itemId.sellPremium,
                                    capturedAmount: req.capturedAmount,
                                    capturedAt: req.capturedAt
                                };

                                detailsToCache[requestId] = {
                                    ...detailsToCache[requestId],
                                    product: productData
                                };
                            }
                        });

                    // Update all details at once
                    setRequestDetails(detailsToCache);
                } else {
                    setBuyRequests([]);
                }
            } catch (error) {
                console.error('Error fetching requests:', error);
                setBuyRequests([]);
            }
        }
        setIsLoading(false);
    };

    // Initial fetch
    useEffect(() => {
        fetchRequests();
    }, [user]);

    // Add focus effect to refresh data when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            if (user) {
                fetchRequests();
            }
        }, [user])
    );

    const onRefresh = async () => {
        setIsRefreshing(true);
        await fetchRequests();
        setIsRefreshing(false);
    };

    // Format timestamp to readable date/time
    const formatTimestamp = (timestamp: number) => {
        const now = Date.now();
        const diff = now - timestamp;

        if (diff < 60000) return "Just now";
        if (diff < 3600000) {
            const minutes = Math.floor(diff / 60000);
            return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
        }
        if (diff < 86400000) {
            const hours = Math.floor(diff / 3600000);
            return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
        }
        if (diff < 604800000) {
            const days = Math.floor(diff / 86400000);
            return `${days} ${days === 1 ? "day" : "days"} ago`;
        }

        const date = new Date(timestamp);
        return date.toLocaleDateString();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return '#FFA500';
            case 'accepted': return '#4CAF50';
            case 'declined': return '#F44336';
            default: return '#666666';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending': return <Clock size={16} color="#FFA500" />;
            case 'accepted': return <CheckCircle size={16} color="#4CAF50" />;
            case 'declined': return <XCircle size={16} color="#F44336" />;
            default: return <Clock size={16} color="#666666" />;
        }
    };

    const getTypeIcon = (type: string) => {
        return type === 'buy'
            ? <ShoppingCart size={16} color="#2196F3" />
            : <Package size={16} color="#FF9800" />;
    };

    const formatAmount = (amount: number) => {
        return `₹${amount.toLocaleString('en-IN')}`;
    };

    const renderFilterButton = (
        label: string,
        value: string,
        isSelected: boolean,
        onPress: () => void
    ) => (
        <TouchableOpacity
            style={[styles.filterButton, isSelected && styles.filterButtonActive]}
            onPress={onPress}
        >
            <Text style={[styles.filterButtonText, isSelected && styles.filterButtonTextActive]}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    const renderRequestCard = (request: BuyRequest) => {
        const details = requestDetails[request.id];
        const isBuyRequest = request.requestType === 'buy';
        const isSellRequest = request.requestType === 'sell';

        // If we have cached details, use them
        if (details && details.product && details.customer) {
            const { product, customer } = details;

            return (
                <View key={request.id} style={styles.requestCard}>
                    <View style={styles.requestHeader}>
                        <View style={styles.requestTypeContainer}>
                            {getTypeIcon(request.requestType || 'buy')}
                            <Text style={styles.requestType}>
                                {(request.requestType || 'buy').charAt(0).toUpperCase() + (request.requestType || 'buy').slice(1)} Request
                            </Text>
                        </View>
                        <View style={styles.statusContainer}>
                            {getStatusIcon(request.status)}
                            <Text style={[styles.statusText, { color: getStatusColor(request.status) }]}>
                                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.requestDetails}>
                        <Text style={styles.productName}>{product.productName}</Text>
                        <Text style={styles.productType}>{product.productType}</Text>

                        <View style={styles.requestInfo}>
                            <Text style={styles.amount}>{formatAmount(product.capturedAmount)}</Text>
                            <Text style={styles.quantity}>Qty: {request.quantity || 'N/A'}</Text>
                        </View>

                        {user?.role === 'customer' ? (
                            <View style={styles.counterpartyInfo}>
                                <Text style={styles.counterpartyLabel}>Seller:</Text>
                                <Text style={styles.counterpartyName}>
                                    {request.sellerId || 'Unknown'}
                                </Text>
                            </View>
                        ) : (
                            <View style={styles.counterpartyInfo}>
                                <Text style={styles.counterpartyLabel}>Customer:</Text>
                                <Text style={styles.counterpartyName}>{customer.fullName || customer.name}</Text>
                            </View>
                        )}

                        {request.message && (
                            <Text style={styles.message}>"{request.message}"</Text>
                        )}

                        <View style={styles.timestamps}>
                            <Text style={styles.timestamp}>
                                Sent: {formatTimestamp(request.createdAt)}
                            </Text>
                            {request.updatedAt && request.status !== 'pending' && (
                                <Text style={styles.timestamp}>
                                    {request.status === 'accepted' ? 'Accepted' : 'Declined'}: {formatTimestamp(request.updatedAt)}
                                </Text>
                            )}
                        </View>
                    </View>
                </View>
            );
        }

        // If details are not available yet, show a loading state with basic request info
        return (
            <View key={request.id} style={styles.requestCard}>
                <View style={styles.requestHeader}>
                    <View style={styles.requestTypeContainer}>
                        {getTypeIcon(request.requestType || 'buy')}
                        <Text style={styles.requestType}>
                            {(request.requestType || 'buy').charAt(0).toUpperCase() + (request.requestType || 'buy').slice(1)} Request
                        </Text>
                    </View>
                    <View style={styles.statusContainer}>
                        {getStatusIcon(request.status)}
                        <Text style={[styles.statusText, { color: getStatusColor(request.status) }]}>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </Text>
                    </View>
                </View>

                <View style={styles.requestDetails}>
                    <View style={styles.requestDetailRow}>
                        <Text style={styles.requestDetailLabel}>Request ID:</Text>
                        <Text style={styles.requestDetailValue}>{request.id}</Text>
                    </View>

                    <View style={styles.requestDetailRow}>
                        <Clock size={16} color="#666666" style={styles.requestDetailIcon} />
                        <Text style={styles.requestDetailLabel}>Status:</Text>
                        <Text style={styles.requestDetailValue}>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </Text>
                    </View>

                    <View style={styles.timestamps}>
                        <Text style={styles.timestamp}>
                            Sent: {formatTimestamp(request.createdAt)}
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <StatusBar style="dark" />
                <ActivityIndicator size="large" color="#F3B62B" />
                <Text style={styles.loadingText}>Loading your request history...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
            <StatusBar style="dark" />
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => router.push("/drawer")}
                    >
                        <Menu size={24} color="#333333" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Request History</Text>
                    <View style={styles.headerRight} />
                </View>

                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <TrendingUp size={20} color="#4CAF50" />
                        <Text style={styles.statNumber}>{acceptedCount}</Text>
                        <Text style={styles.statLabel}>Accepted</Text>
                    </View>
                    <View style={styles.statCard}>
                        <TrendingDown size={20} color="#F44336" />
                        <Text style={styles.statNumber}>{declinedCount}</Text>
                        <Text style={styles.statLabel}>Declined</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Clock size={20} color="#FFA500" />
                        <Text style={styles.statNumber}>{pendingCount}</Text>
                        <Text style={styles.statLabel}>Pending</Text>
                    </View>
                </View>

                <View style={styles.filtersContainer}>
                    <Text style={styles.filtersTitle}>Filter by Status:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.filtersRow}>
                            {renderFilterButton('All', 'all', selectedStatus === 'all', () => setSelectedStatus('all'))}
                            {renderFilterButton('Pending', 'pending', selectedStatus === 'pending', () => setSelectedStatus('pending'))}
                            {renderFilterButton('Accepted', 'accepted', selectedStatus === 'accepted', () => setSelectedStatus('accepted'))}
                            {renderFilterButton('Declined', 'declined', selectedStatus === 'declined', () => setSelectedStatus('declined'))}
                        </View>
                    </ScrollView>
                </View>

                <View style={styles.filtersContainer}>
                    <Text style={styles.filtersTitle}>Filter by Type:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.filtersRow}>
                            {renderFilterButton('All', 'all', selectedType === 'all', () => setSelectedType('all'))}
                            {renderFilterButton('Buy', 'buy', selectedType === 'buy', () => setSelectedType('buy'))}
                            {renderFilterButton('Sell', 'sell', selectedType === 'sell', () => setSelectedType('sell'))}
                        </View>
                    </ScrollView>
                </View>

                <ScrollView
                    style={styles.requestsContainer}
                    refreshControl={
                        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
                    }
                >
                    {filteredRequests.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Clock size={48} color="#ccc" />
                            <Text style={styles.emptyStateTitle}>No requests found</Text>
                            <Text style={styles.emptyStateSubtitle}>
                                {selectedStatus !== 'all' || selectedType !== 'all'
                                    ? 'Try adjusting your filters'
                                    : 'You haven\'t made any requests yet'
                                }
                            </Text>
                        </View>
                    ) : (
                        filteredRequests.map(renderRequestCard)
                    )}
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#ffffff",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#ffffff",
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: "#666666",
    },
    container: {
        flex: 1,
        backgroundColor: "#ffffff",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    backButton: {
        padding: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#333333",
    },
    headerRight: {
        width: 40,
    },
    statsContainer: {
        flexDirection: "row",
        paddingHorizontal: 24,
        marginBottom: 24,
    },
    statCard: {
        flex: 1,
        alignItems: "center",
        backgroundColor: "#f9f9f9",
        padding: 16,
        marginHorizontal: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#e0e0e0",
    },
    statNumber: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#333333",
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        color: "#666666",
        marginTop: 4,
    },
    filtersContainer: {
        paddingHorizontal: 24,
        marginBottom: 16,
    },
    filtersTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "#333333",
        marginBottom: 8,
    },
    filtersRow: {
        flexDirection: "row",
    },
    filterButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 8,
        borderRadius: 20,
        backgroundColor: "#f0f0f0",
        borderWidth: 1,
        borderColor: "#e0e0e0",
    },
    filterButtonActive: {
        backgroundColor: "#F3B62B",
        borderColor: "#F3B62B",
    },
    filterButtonText: {
        fontSize: 14,
        color: "#666666",
    },
    filterButtonTextActive: {
        color: "#ffffff",
        fontWeight: "600",
    },
    requestsContainer: {
        flex: 1,
        paddingHorizontal: 24,
    },
    requestCard: {
        backgroundColor: "#ffffff",
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#e0e0e0",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    requestHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    requestTypeContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    requestType: {
        fontSize: 14,
        fontWeight: "600",
        color: "#333333",
        marginLeft: 6,
    },
    statusContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    statusText: {
        fontSize: 12,
        fontWeight: "600",
        marginLeft: 4,
    },
    requestDetails: {
        gap: 8,
    },
    productName: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#333333",
    },
    productType: {
        fontSize: 14,
        color: "#666666",
    },
    requestInfo: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 8,
    },
    amount: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#F3B62B",
    },
    quantity: {
        fontSize: 14,
        color: "#666666",
    },
    counterpartyInfo: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 8,
    },
    counterpartyLabel: {
        fontSize: 14,
        color: "#666666",
        marginRight: 8,
    },
    counterpartyName: {
        fontSize: 14,
        fontWeight: "600",
        color: "#333333",
    },
    message: {
        fontSize: 14,
        color: "#666666",
        fontStyle: "italic",
        marginTop: 8,
    },
    timestamps: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: "#e0e0e0",
    },
    timestamp: {
        fontSize: 12,
        color: "#999999",
        marginBottom: 4,
    },
    emptyState: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 60,
    },
    emptyStateTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#666666",
        marginTop: 16,
        marginBottom: 8,
    },
    emptyStateSubtitle: {
        fontSize: 14,
        color: "#999999",
        textAlign: "center",
    },
    loadMoreContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 20,
    },
    loadMoreText: {
        fontSize: 14,
        color: "#666666",
        marginLeft: 8,
    },
    requestDetailIcon: {
        marginRight: 8,
    },
    requestDetailRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 4,
    },
    requestDetailLabel: {
        fontSize: 14,
        color: "#666666",
        marginRight: 8,
    },
    requestDetailValue: {
        fontSize: 14,
        fontWeight: "600",
        color: "#333333",
    },
});
