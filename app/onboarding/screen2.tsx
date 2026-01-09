import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';

interface OnboardingScreenProps {
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
}

const OnboardingScreen2: React.FC<OnboardingScreenProps> = ({ onNext, onPrevious, onSkip }) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/adaptive-icon.png')}
            style={styles.logo}
          />
        </View>

        {/* Image */}
        <Image
          source={require('@/assets/images/screen2.png')}
          style={styles.image}
          contentFit="contain"
        />

        {/* Page Indicators */}
        <View style={styles.pageIndicators}>
          <View style={styles.indicator} />
          <View style={[styles.indicator, styles.indicatorActive]} />
          <View style={styles.indicator} />
        </View>

        {/* Text Content */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>Your Jeweller, Always With You</Text>
          <Text style={styles.description}>
            View your jeweller's brand, profile, and products. The app shows only your jeweller's name.
          </Text>
        </View>

        {/* Navigation Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.previousButton} onPress={onPrevious}>
            <Text style={styles.previousButtonText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.nextButton} onPress={onNext}>
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  logo: {
    width: 150,
    height: 80,
  },
  image: {
    width: '100%',
    height: '50%',
    marginHorizontal: 'auto',
    marginBottom: 30,
  },
  pageIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 4,
  },
  indicatorActive: {
    backgroundColor: '#F3B62B',
    width: 24,
  },
  textContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#0d260d',
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  previousButton: {
    backgroundColor: '#0d260d',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    width: '40%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  previousButtonText: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  nextButton: {
    backgroundColor: '#F3B62B',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    width: '40%',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0d260d',
    textAlign: 'center',
  },
});

export default OnboardingScreen2;