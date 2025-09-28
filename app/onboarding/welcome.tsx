import React, { useState, useRef } from 'react';
import { View, StyleSheet, Dimensions, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth-store';
import OnboardingScreen1 from './screen1';
import OnboardingScreen2 from './screen2';
import OnboardingScreen3 from './screen3';

const { width } = Dimensions.get('window');

export default function OnboardingWelcome() {
    const router = useRouter();
    const { setHasSeenOnboarding } = useAuthStore();
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    const onboardingScreens = [
        {
            id: 'screen1',
            component: OnboardingScreen1,
            props: {
                onNext: handleNext,
                onSkip: handleSkip,
            },
        },
        {
            id: 'screen2',
            component: OnboardingScreen2,
            props: {
                onNext: handleNext,
                onPrevious: handlePrevious,
                onSkip: handleSkip,
            },
        },
        {
            id: 'screen3',
            component: OnboardingScreen3,
            props: {
                onPrevious: handlePrevious,
                onGetStarted: handleGetStarted,
                onSkip: handleSkip,
            },
        },
    ];

    function handleNext() {
        if (currentIndex < onboardingScreens.length - 1) {
            const nextIndex = currentIndex + 1;
            setCurrentIndex(nextIndex);
            flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
        }
    }

    function handlePrevious() {
        if (currentIndex > 0) {
            const prevIndex = currentIndex - 1;
            setCurrentIndex(prevIndex);
            flatListRef.current?.scrollToIndex({ index: prevIndex, animated: true });
        }
    }

    function handleSkip() {
        setHasSeenOnboarding(true);
        router.replace('/auth/signup');
    }

    function handleGetStarted() {
        setHasSeenOnboarding(true);
        router.replace('/auth/signup');
    }

    function onViewableItemsChanged({ viewableItems }: any) {
        if (viewableItems.length > 0) {
            const index = viewableItems[0].index;
            setCurrentIndex(index);
        }
    }

    function renderScreen({ item }: { item: any }) {
        const ScreenComponent = item.component;
        return (
            <View style={styles.screenContainer}>
                <ScreenComponent {...item.props} />
            </View>
        );
    }

    function renderPageIndicator() {
        return (
            <View style={styles.pageIndicatorContainer}>
                {onboardingScreens.map((_, index) => (
                    <TouchableOpacity
                        key={index}
                        style={[
                            styles.pageIndicator,
                            currentIndex === index && styles.pageIndicatorActive,
                        ]}
                        onPress={() => {
                            setCurrentIndex(index);
                            flatListRef.current?.scrollToIndex({ index, animated: true });
                        }}
                    />
                ))}
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                ref={flatListRef}
                data={onboardingScreens}
                renderItem={renderScreen}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={{
                    itemVisiblePercentThreshold: 50,
                }}
                onScrollToIndexFailed={(info) => {
                    const wait = new Promise(resolve => setTimeout(resolve, 500));
                    wait.then(() => {
                        flatListRef.current?.scrollToIndex({
                            index: info.index,
                            animated: true
                        });
                    });
                }}
            />

            {renderPageIndicator()}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    screenContainer: {
        width,
        flex: 1,
    },
    pageIndicatorContainer: {
        position: 'absolute',
        bottom: 60,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    pageIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#D1D5DB',
        marginHorizontal: 4,
    },
    pageIndicatorActive: {
        backgroundColor: '#F3B62B',
        width: 24,
    },
});