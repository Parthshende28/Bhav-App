import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons as Icon, Feather as Icon2 } from "@expo/vector-icons";

interface SubscriptionStatusProps {
    subscriptionStatus: 'active' | 'expired' | 'cancelled' | 'expiring_soon';
    subscriptionEndDate?: string;
    daysLeft?: number;
    onRenewPress?: () => void;
}

const SubscriptionStatus: React.FC<SubscriptionStatusProps> = ({
    subscriptionStatus,
    subscriptionEndDate,
    daysLeft,
    onRenewPress
}) => {
    const getStatusConfig = () => {
        switch (subscriptionStatus) {
            case 'active':
                return {
                    Icon2 : "check-circle",
                    color: '#4CAF50',
                    backgroundColor: '#E8F5E9',
                    text: 'Active',
                    message: `Expires in ${daysLeft} days`
                };
            case 'expiring_soon':
                return {
                    Icon2: "alert-circle",
                    color: '#FF9800',
                    backgroundColor: '#FFF3E0',
                    text: 'Expiring Soon',
                    message: `Expires in ${daysLeft} days`
                };
            case 'expired':
                return {
                    Icon2: "x-circle",
                    color: '#F44336',
                    backgroundColor: '#FFEBEE',
                    text: 'Expired',
                    message: 'Subscription has expired'
                };
            case 'cancelled':
                return {
                    Icon2: "x-circle",
                    color: '#9E9E9E',
                    backgroundColor: '#F5F5F5',
                    text: 'Cancelled',
                    message: 'Subscription was cancelled'
                };
            default:
                return {
                    Icon2: "clock",
                    color: '#9E9E9E',
                    backgroundColor: '#F5F5F5',
                    text: 'No Subscription',
                    message: 'No active subscription'
                };
        }
    };

    const config = getStatusConfig();
    const IconComponent = Icon2;

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <View style={styles.container}>
            <View style={[styles.statusCard, { backgroundColor: config.backgroundColor }]}>
                <View style={styles.statusHeader}>
                    <View style={styles.statusInfo}>
                        <IconComponent size={20} color={config.color} />
                        <Text style={[styles.statusText, { color: config.color }]}>
                            {config.text}
                        </Text>
                    </View>
                    {subscriptionStatus === 'expired' && onRenewPress && (
                        <TouchableOpacity style={styles.renewButton} onPress={onRenewPress}>
                            <Text style={styles.renewButtonText}>Renew</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <Text style={styles.messageText}>{config.message}</Text>

                {subscriptionEndDate && subscriptionStatus !== 'cancelled' && (
                    <Text style={styles.dateText}>
                        {subscriptionStatus === 'expired' ? 'Expired on' : 'Expires on'}: {formatDate(subscriptionEndDate)}
                    </Text>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '90%',
    },
    statusCard: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    statusHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    statusInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusText: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    renewButton: {
        backgroundColor: '#F3B62B',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    renewButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    messageText: {
        fontSize: 14,
        color: '#666666',
        marginBottom: 4,
    },
    dateText: {
        fontSize: 12,
        color: '#999999',
    },
});

export default SubscriptionStatus;