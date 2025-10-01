import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Linking,
    Alert,
} from 'react-native';

const TermsLinks: React.FC = () => {
    const handleTermsPress = async () => {
        try {
            await Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/');
        } catch (error) {
            Alert.alert('Error', 'Unable to open Terms of Use. Please try again.');
        }
    };

    const handlePrivacyPress = async () => {
        try {
            await Linking.openURL('https://bhav.live/privacy-policy/');
        } catch (error) {
            Alert.alert('Error', 'Unable to open Privacy Policy. Please try again.');
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.divider} />

            <View style={styles.linksContainer}>
                <Text style={styles.text}>
                    By using this app, you agree to our{' '}
                    <TouchableOpacity onPress={handleTermsPress}>
                        <Text style={styles.link1}>Terms of Use</Text>
                    </TouchableOpacity>
                    {' '}and{' '}
                    <TouchableOpacity onPress={handlePrivacyPress}>
                        <Text style={styles.link1}>Privacy Policy</Text>
                    </TouchableOpacity>
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 20,
    },
    divider: {
        height: 1,
        backgroundColor: '#e0e0e0',
        marginBottom: 16,
    },
    linksContainer: {
        paddingHorizontal: 20,

    },
    text: {
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
    },
    link: {
        color: '#007AFF',
        textDecorationLine: 'underline',
        fontWeight: '500',
    },
    link1: {
        color: '#007AFF',
        textDecorationLine: 'underline',
        fontWeight: '500',
        marginBottom: -3,
        // marginHorizontal: 3,
    },
});

export default TermsLinks;
