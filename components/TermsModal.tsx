import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Platform,
    Linking,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon, Feather as Icon2 } from "@expo/vector-icons";

interface TermsModalProps {
    visible: boolean;
    onClose: () => void;
    onAgree: () => void;
    title?: string;
}

const TermsModal: React.FC<TermsModalProps> = ({
    visible,
    onClose,
    onAgree,
    title = "Privacy Policy"
}) => {
    const [privacyChecked, setPrivacyChecked] = useState(false);

    // Only privacy policy checkbox needed
    const isAgreementComplete = privacyChecked;

    const handlePrivacyPress = async () => {
        try {
            await Linking.openURL('https://bhav.live/privacy-policy/');
        } catch (error) {
            Alert.alert('Error', 'Unable to open Privacy Policy. Please try again.');
        }
    };

    const handleAgree = () => {
        if (isAgreementComplete) {
            onAgree();
            // Reset checkbox for next use
            setPrivacyChecked(false);
        }
    };

    const handleCancel = () => {
        onClose();
        // Reset checkbox for next use
        setPrivacyChecked(false);
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={handleCancel}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <SafeAreaView style={styles.modalContent}>
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.title}>{title}</Text>
                            <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
                                <Icon2 name="x" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>

                        {/* Content */}
                        <View style={styles.content}>
                            <Text style={styles.description}>
                                Please review and accept our privacy policy to continue.
                            </Text>

                            {/* Privacy Policy checkbox */}
                            <View style={styles.checkboxContainer}>
                                <TouchableOpacity
                                    style={styles.checkboxRow}
                                    onPress={() => setPrivacyChecked(!privacyChecked)}
                                >
                                    <View style={[styles.checkbox, privacyChecked && styles.checkboxChecked]}>
                                        {privacyChecked && <Icon2 name="check" size={16} color="white" />}
                                    </View>
                                    <Text style={styles.checkboxLabel}>
                                        I agree to the{' '}
                                        <Text style={styles.linkText} onPress={handlePrivacyPress}>
                                            Privacy Policy
                                        </Text>
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Buttons */}
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={[styles.button, styles.cancelButton]}
                                onPress={handleCancel}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.button,
                                    styles.agreeButton,
                                    !isAgreementComplete && styles.disabledButton
                                ]}
                                onPress={handleAgree}
                                disabled={!isAgreementComplete}
                            >
                                <Text style={[
                                    styles.agreeButtonText,
                                    !isAgreementComplete && styles.disabledButtonText
                                ]}>
                                    Agree
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </SafeAreaView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '90%',
        maxWidth: 400,
        backgroundColor: 'white',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 8,
    },
    modalContent: {
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
    },
    closeButton: {
        padding: 4,
    },
    content: {
        marginBottom: 24,
    },
    description: {
        fontSize: 16,
        color: '#666',
        lineHeight: 22,
        marginBottom: 20,
    },
    checkboxContainer: {
        gap: 16,
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderWidth: 2,
        borderColor: '#ddd',
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 2,
    },
    checkboxChecked: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    checkboxLabel: {
        fontSize: 16,
        color: '#333',
        flex: 1,
        lineHeight: 22,
    },
    linkText: {
        color: '#007AFF',
        textDecorationLine: 'underline',
        fontWeight: '500',
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#f5f5f5',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
    agreeButton: {
        backgroundColor: '#007AFF',
    },
    agreeButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
    disabledButton: {
        backgroundColor: '#ccc',
    },
    disabledButtonText: {
        color: '#999',
    },
});

export default TermsModal;