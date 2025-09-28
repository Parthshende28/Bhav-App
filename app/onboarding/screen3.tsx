import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';

interface OnboardingScreenProps {
  onPrevious: () => void;
  onGetStarted: () => void;
  onSkip: () => void;
}

const OnboardingScreen3: React.FC<OnboardingScreenProps> = ({ onPrevious, onGetStarted, onSkip }) => {
  return (
    <LinearGradient
      colors={['#FFF8E1', '#FFECB3']}
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
            source={{ uri: 'https://via.placeholder.com/300x300?text=Start+Trading+Today' }}
            style={styles.image}
            contentFit="contain"
          />
        </View>

        {/* Text Content */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>Start Purchasing Today</Text>
          <Text style={styles.description}>
            Join thousands of users who trust Bhav for their precious metal transactions.
            Create your account and start your journey today!
          </Text>
        </View>

        {/* Navigation Buttons */}
        <View style={styles.buttonContainer}>
          <Text style={styles.previousButton} onPress={onPrevious}>
            Previous
          </Text>
          <Text style={styles.getStartedButton} onPress={onGetStarted}>
            Get Started
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
  previousButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6C757D',
    backgroundColor: 'white',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  getStartedButton: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#F3B62B',
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

export default OnboardingScreen3;