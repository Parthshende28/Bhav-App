import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';

interface OnboardingScreenProps {
  onNext: () => void;
  onPrevious?: () => void;
  onSkip: () => void;
}

const OnboardingScreen1: React.FC<OnboardingScreenProps> = ({ onNext, onSkip }) => {
  return (
    <LinearGradient
      colors={['#F8F9FA', '#E9ECEF']}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Skip Button */}
        <View style={styles.skipContainer}>
          <Text style={styles.skipText} onPress={onSkip}>
            Skip
          </Text>
        </View>

        {/* Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: 'https://via.placeholder.com/300x300?text=Welcome+to+Bhav' }}
            style={styles.image}
            contentFit="contain"
          />
        </View>

        {/* Text Content */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>Welcome to Bhav</Text>
          <Text style={styles.description}>
            Your trusted platform for buying and selling precious metals. Connect with verified dealers and sellers across India.
          </Text>
        </View>

        {/* Navigation Buttons */}
        <View style={styles.buttonContainer}>
          <View style={styles.placeholder} />
          <Text style={styles.nextButton} onPress={onNext}>
            Next
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  skipContainer: {
    alignItems: 'flex-end',
    marginBottom: 40,
  },
  skipText: {
    fontSize: 16,
    color: '#6C757D',
    fontWeight: '500',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 300,
    height: 300,
  },
  textContainer: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  placeholder: {
    width: 60,
  },
  nextButton: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F3B62B',
    backgroundColor: 'white',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default OnboardingScreen1;