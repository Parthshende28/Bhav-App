import { Stack } from "expo-router";

export default function OnboardingLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="welcome" options={{ animation: "fade" }} />
            <Stack.Screen name="screen1" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="screen2" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="screen3" options={{ animation: "slide_from_right" }} />
        </Stack>
    );
}
