import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
  Platform,
  AccessibilityProps,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { images } from "@/constants/images";
import { Image } from "expo-image";

type Metal = "Gold" | "Silver" | "Neutral";

interface MetalRateCardProps extends AccessibilityProps {
  title: string;
  subtitle?: string;
  value?: string | React.ReactNode;
  low?: string | number;
  high?: string | number;
  metal?: Metal;
  compact?: boolean; // compact layout for top row
  split?: boolean; // show two values side-by-side (eg. buy/sell)
  leftValue?: string | number; // used when split=true
  rightValue?: string | number; // used when split=true
  leftColor?: string;
  rightColor?: string;
  unit?: string;
  loading?: boolean;
  onPress?: () => void;
}

export const MetalRateCard: React.FC<MetalRateCardProps> = ({
  title,
  subtitle,
  value,
  low,
  high,
  metal = "Neutral",
  compact = false,
  split = false,
  leftValue,
  rightValue,
  leftColor,
  rightColor,
  unit,
  loading = false,
  onPress,
  accessibilityLabel,
}) => {
  const animated = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animated, {
      toValue: 1,
      duration: 420,
      useNativeDriver: true,
    }).start();
  }, []);

  const translateY = animated.interpolate({
    inputRange: [0, 1],
    outputRange: [8, 0],
  });

  // Theming based on metal
  const isGold = metal === "Gold";
  const isSilver = metal === "Silver";

  const gradientColors = isGold
    ? (["#FFF8E1", "#FFF3CD"] as const)
    : isSilver
    ? (["#F5F7FA", "#EEF1F5"] as const)
    : (["#FFFFFF", "#FAFAFA"] as const);

  const accent = isGold ? "#F3B62B" : isSilver ? "#BDBDBD" : "#194215ff";

  const imageSource = isGold ? images.goldCoins : isSilver ? images.silverBar : images.bhavLogo;

  const Container: any = Pressable; // always Pressable for consistent style handling

  return (
    <Animated.View style={[styles.wrap, { opacity: animated, transform: [{ translateY }] }]}>
      <Container
        onPress={onPress}
        disabled={!onPress}
        accessibilityLabel={accessibilityLabel || title}
        accessibilityRole="button"
        style={({ pressed }: any) => [
          styles.card,
          { shadowColor: accent },
          pressed ? styles.pressed : undefined,
        ]}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.cardGradient, compact && styles.cardGradientCompact]}
        >
          <View style={styles.rowTop}>
            <View style={styles.titleWrap}>
              <Text style={styles.title}>{title}</Text>
              {/* {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null} */}
            </View>

            {/* <Image source={imageSource} style={styles.icon} contentFit="contain" /> */}
          </View>

          {split ? (
            <View style={styles.splitRow}>
              <View style={styles.splitCol}>
                <Text style={[styles.splitValue, { color: (leftColor as string) || accent }]}>{leftValue ?? "-"}</Text>
                {/* {unit ? <Text style={styles.unitText}>Buy {unit}</Text> : null} */}
              </View>

              <View style={styles.splitCol}>
                <Text style={[styles.splitValue, { color: (rightColor as string) || accent }]}>{rightValue ?? "-"}</Text>
                {/* {unit ? <Text style={styles.unitText}>Sell {unit}</Text> : null} */}
              </View>
            </View>
          ) : (
            <View style={styles.valueRow}>
              <Text style={[styles.valueText, { color: accent }]}>
                {loading ? "Loading" : value}
              </Text>
              {/* {unit ? <Text style={styles.unitTextSmall}>{unit}</Text> : null} */}
            </View>
          )}

          {(low || high) && (
            <View style={styles.detailsContainer}>
              <Text style={styles.detailValue}>{low ?? "-"}  |  {high ?? "-"}</Text>
            </View>
          )}
        </LinearGradient>
      </Container>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginVertical: 1,
  },
  card: {
    borderRadius: 14,
    overflow: "hidden",
    elevation: 3,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    backgroundColor: "transparent",
    borderWidth: Platform.OS === "web" ? 1 : 1,
    borderColor: "#020202ff",
    borderStyle:"dashed"
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.998 }],
  },
  cardGradient: {
    padding: 14,
    paddingVertical: 12,
  },
  cardGradientCompact: {
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    marginBottom: 6,
  },
  titleWrap: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
    alignSelf: "center",
  },
  subtitle: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 22,
  },
  valueRow: {
    alignItems: "center",
  },
  valueText: {
    fontSize: 18,
    fontWeight: "800",
    marginTop: 2,
  },
  splitRow: {
    flexDirection: "row",
    justifyContent:"center",
    width: "100%",
  },
  splitCol: {
    alignItems: "center",
    flex: 1,
  },
  splitValue: {
    fontSize: 12,
    fontWeight: "900",
  },
  unitText: {
    fontSize: 12,
    color: "#777",
    marginTop: 2,
  },
  unitTextSmall: {
    fontSize: 12,
    color: "#777",
    marginTop: 6,
  },
  detailsContainer: {
    marginTop: 6,
  },
  detailValue: {
    color: "#666",
    fontSize: 9.2,
    textAlign: "center",
    lineHeight: 12,
    fontWeight: "600",
  },
});

export default MetalRateCard;
