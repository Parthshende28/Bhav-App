import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Modal,
    TextInput,
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import {
    CheckCircle,
    XCircle,
    Eye,
    Filter,
    Search,
    ArrowLeft,
    Clock,
    User,
    FileText,
    AlertCircle
} from 'lucide-react-native';
import { router } from 'expo-router';
import { kycAPI } from '@/services/kyc';

interface KYCApplication {
    _id: string;
    userId: {
        _id: string;
        fullName: string;
        email: string;
        phone: string;
        role: string;
    };
    fullName: string;
    panNumber: string;
    aadharNumber: string;
    gstNumber?: string;
    address: string;
    panImage: string;
    aadharImage: string;
    selfieImage: string;
    status: 'pending' | 'approved' | 'rejected';
    verifiedBy?: {
        fullName: string;
    };
    verifiedAt?: string;
    rejectionReason?: string;
    submittedAt: string;
    createdAt: string;
}

export default function KYCManagementScreen() {
    const [applications, setApplications] = useState<KYCApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedApplication, setSelectedApplication] = useState<KYCApplication | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [rejectionModalVisible, setRejectionModalVisible] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        loadApplications();
    }, [statusFilter, currentPage]);

    const loadApplications = async (refresh = false) => {
        try {
            if (refresh) {
                setRefreshing(true);
                setCurrentPage(1);
            }

            const response = await kycAPI.getAllKYCApplications(
                statusFilter === 'all' ? undefined : statusFilter,
                refresh ? 1 : currentPage,
                10
            );

            if (response.success) {
                if (refresh || currentPage === 1) {
                    setApplications(response.kycApplications || []);
                } else {
                    setApplications(prev => [...prev, ...(response.kycApplications || [])]);
                }

                setHasMore(response.pagination ?
                    response.pagination.currentPage < response.pagination.totalPages : false);
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to load KYC applications');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleApprove = async (applicationId: string) => {
        try {
            const response = await kycAPI.approveKYC(applicationId);
            if (response.success) {
                Alert.alert('Success', 'KYC application approved successfully');
                loadApplications(true);
                setModalVisible(false);
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to approve KYC');
        }
    };

    const handleReject = async () => {
        if (!selectedApplication || !rejectionReason.trim()) {
            Alert.alert('Error', 'Please provide a rejection reason');
            return;
        }

        try {
            const response = await kycAPI.rejectKYC(selectedApplication._id, rejectionReason);
            if (response.success) {
                Alert.alert('Success', 'KYC application rejected successfully');
                loadApplications(true);
                setRejectionModalVisible(false);
                setRejectionReason('');
                setModalVisible(false);
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to reject KYC');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved':
                return '#4CAF50';
            case 'rejected':
                return '#F44336';
            case 'pending':
                return '#FFC107';
            default:
                return '#FFC107';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'approved':
                return <CheckCircle size={16} color="#4CAF50" />;
            case 'rejected':
                return <XCircle size={16} color="#F44336" />;
            case 'pending':
                return <Clock size={16} color="#FFC107" />;
            default:
                return <Clock size={16} color="#FFC107" />;
        }
    };

    const filteredApplications = applications.filter(app => {
        const matchesSearch = app.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.userId.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.panNumber.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

    const renderApplicationItem = ({ item }: { item: KYCApplication }) => (
        <TouchableOpacity
            style={styles.applicationCard}
            onPress={() => {
                setSelectedApplication(item);
                setModalVisible(true);
            }}
        >
            <View style={styles.cardHeader}>
                <View style={styles.userInfo}>
                    <User size={20} color="#666" />
                    <Text style={styles.userName}>{item.fullName}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                    {getStatusIcon(item.status)}
                    <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
                </View>
            </View>

            <View style={styles.cardDetails}>
                <Text style={styles.emailText}>{item.userId.email}</Text>
                <Text style={styles.phoneText}>{item.userId.phone}</Text>
                <Text style={styles.roleText}>{item.userId.role}</Text>
            </View>

            <View style={styles.cardFooter}>
                <Text style={styles.dateText}>
                    Submitted: {new Date(item.submittedAt).toLocaleDateString()}
                </Text>
                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={styles.viewButton}
                        onPress={() => {
                            setSelectedApplication(item);
                            setModalVisible(true);
                        }}
                    >
                        <Eye size={16} color="#F3B62B" />
                        <Text style={styles.viewButtonText}>View</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderDetailModal = () => (
        <Modal
            visible={modalVisible}
            animationType="slide"
            presentationStyle="pageSheet"
        >
            <SafeAreaView style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                        <ArrowLeft size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>KYC Details</Text>
                    <View style={{ width: 24 }} />
                </View>

                {selectedApplication && (
                    <ScrollView style={styles.modalContent}>
                        <View style={styles.detailSection}>
                            <Text style={styles.sectionTitle}>Personal Information</Text>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Full Name:</Text>
                                <Text style={styles.detailValue}>{selectedApplication.fullName}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Email:</Text>
                                <Text style={styles.detailValue}>{selectedApplication.userId.email}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Phone:</Text>
                                <Text style={styles.detailValue}>{selectedApplication.userId.phone}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Role:</Text>
                                <Text style={styles.detailValue}>{selectedApplication.userId.role}</Text>
                            </View>
                        </View>

                        <View style={styles.detailSection}>
                            <Text style={styles.sectionTitle}>Document Information</Text>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>PAN Number:</Text>
                                <Text style={styles.detailValue}>{selectedApplication.panNumber}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Aadhar Number:</Text>
                                <Text style={styles.detailValue}>{selectedApplication.aadharNumber}</Text>
                            </View>
                            {selectedApplication.gstNumber && (
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>GST Number:</Text>
                                    <Text style={styles.detailValue}>{selectedApplication.gstNumber}</Text>
                                </View>
                            )}
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Address:</Text>
                                <Text style={styles.detailValue}>{selectedApplication.address}</Text>
                            </View>
                        </View>

                        <View style={styles.detailSection}>
                            <Text style={styles.sectionTitle}>Documents</Text>
                            <View style={styles.documentGrid}>
                                <View style={styles.documentItem}>
                                    <Text style={styles.documentLabel}>PAN Card</Text>
                                    <Image
                                        source={{ uri: selectedApplication.panImage }}
                                        style={styles.documentImage}
                                        contentFit="cover"
                                    />
                                </View>
                                <View style={styles.documentItem}>
                                    <Text style={styles.documentLabel}>Aadhar Card</Text>
                                    <Image
                                        source={{ uri: selectedApplication.aadharImage }}
                                        style={styles.documentImage}
                                        contentFit="cover"
                                    />
                                </View>
                                <View style={styles.documentItem}>
                                    <Text style={styles.documentLabel}>Selfie</Text>
                                    <Image
                                        source={{ uri: selectedApplication.selfieImage }}
                                        style={styles.documentImage}
                                        contentFit="cover"
                                    />
                                </View>
                            </View>
                        </View>

                        {selectedApplication.status === 'rejected' && selectedApplication.rejectionReason && (
                            <View style={styles.detailSection}>
                                <Text style={styles.sectionTitle}>Rejection Reason</Text>
                                <Text style={styles.rejectionReason}>{selectedApplication.rejectionReason}</Text>
                            </View>
                        )}

                        {selectedApplication.status === 'pending' && (
                            <View style={styles.actionSection}>
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.approveButton]}
                                    onPress={() => handleApprove(selectedApplication._id)}
                                >
                                    <CheckCircle size={20} color="#fff" />
                                    <Text style={styles.actionButtonText}>Approve</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.rejectButton]}
                                    onPress={() => setRejectionModalVisible(true)}
                                >
                                    <XCircle size={20} color="#fff" />
                                    <Text style={styles.actionButtonText}>Reject</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </ScrollView>
                )}
            </SafeAreaView>
        </Modal>
    );

    const renderRejectionModal = () => (
        <Modal
            visible={rejectionModalVisible}
            animationType="slide"
            transparent={true}
        >
            <View style={styles.rejectionModalOverlay}>
                <View style={styles.rejectionModalContent}>
                    <Text style={styles.rejectionModalTitle}>Reject KYC Application</Text>
                    <Text style={styles.rejectionModalSubtitle}>
                        Please provide a reason for rejection:
                    </Text>
                    <TextInput
                        style={styles.rejectionInput}
                        placeholder="Enter rejection reason..."
                        value={rejectionReason}
                        onChangeText={setRejectionReason}
                        multiline
                        numberOfLines={4}
                    />
                    <View style={styles.rejectionModalActions}>
                        <TouchableOpacity
                            style={[styles.rejectionModalButton, styles.cancelButton]}
                            onPress={() => {
                                setRejectionModalVisible(false);
                                setRejectionReason('');
                            }}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.rejectionModalButton, styles.confirmButton]}
                            onPress={handleReject}
                        >
                            <Text style={styles.confirmButtonText}>Reject</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar style="dark" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#F3B62B" />
                    <Text style={styles.loadingText}>Loading KYC applications...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <ArrowLeft size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>KYC Management</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.searchContainer}>
                <View style={styles.searchBox}>
                    <Search size={20} color="#666" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by name, email, or PAN..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            <View style={styles.filterContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {['all', 'pending', 'approved', 'rejected'].map((status) => (
                        <TouchableOpacity
                            key={status}
                            style={[
                                styles.filterButton,
                                statusFilter === status && styles.filterButtonActive
                            ]}
                            onPress={() => setStatusFilter(status as any)}
                        >
                            <Text style={[
                                styles.filterButtonText,
                                statusFilter === status && styles.filterButtonTextActive
                            ]}>
                                {status.toUpperCase()}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <FlatList
                data={filteredApplications}
                renderItem={renderApplicationItem}
                keyExtractor={(item) => item._id}
                style={styles.list}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => loadApplications(true)}
                        colors={['#F3B62B']}
                    />
                }
                onEndReached={() => {
                    if (hasMore && !loading) {
                        setCurrentPage(prev => prev + 1);
                    }
                }}
                onEndReachedThreshold={0.1}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <FileText size={48} color="#ccc" />
                        <Text style={styles.emptyText}>No KYC applications found</Text>
                    </View>
                }
            />

            {renderDetailModal()}
            {renderRejectionModal()}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    searchContainer: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#fff',
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 16,
        color: '#333',
    },
    filterContainer: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    filterButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 8,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
    },
    filterButtonActive: {
        backgroundColor: '#F3B62B',
    },
    filterButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#666',
    },
    filterButtonTextActive: {
        color: '#fff',
    },
    list: {
        flex: 1,
    },
    applicationCard: {
        backgroundColor: '#fff',
        marginHorizontal: 20,
        marginVertical: 8,
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginLeft: 8,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#fff',
        marginLeft: 4,
    },
    cardDetails: {
        marginBottom: 12,
    },
    emailText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    phoneText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    roleText: {
        fontSize: 14,
        color: '#666',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dateText: {
        fontSize: 12,
        color: '#999',
    },
    actionButtons: {
        flexDirection: 'row',
    },
    viewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: '#FFF8E1',
    },
    viewButtonText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#F3B62B',
        marginLeft: 4,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
        marginTop: 16,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    modalContent: {
        flex: 1,
        padding: 20,
    },
    detailSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    detailLabel: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    detailValue: {
        fontSize: 14,
        color: '#333',
        flex: 1,
        textAlign: 'right',
    },
    documentGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    documentItem: {
        width: '48%',
        marginBottom: 12,
    },
    documentLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    documentImage: {
        width: '100%',
        height: 120,
        borderRadius: 8,
    },
    rejectionReason: {
        fontSize: 14,
        color: '#F44336',
        backgroundColor: '#FFEBEE',
        padding: 12,
        borderRadius: 8,
    },
    actionSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        marginHorizontal: 8,
    },
    approveButton: {
        backgroundColor: '#4CAF50',
    },
    rejectButton: {
        backgroundColor: '#F44336',
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    rejectionModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    rejectionModalContent: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        margin: 20,
        width: '90%',
    },
    rejectionModalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    rejectionModalSubtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
    },
    rejectionInput: {
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        color: '#333',
        textAlignVertical: 'top',
        minHeight: 80,
    },
    rejectionModalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    rejectionModalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        marginHorizontal: 8,
    },
    cancelButton: {
        backgroundColor: '#f5f5f5',
    },
    confirmButton: {
        backgroundColor: '#F44336',
    },
    cancelButtonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
}); 