import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { colors } from "../theme/colors";
import { entryRow, radius, spacing } from "../theme/tokens";

const PULSE_DURATION_MS = 1100;

/** DESIGN-SYSTEM.md §5 Skeleton row: same 64px geometry as the real row, opacity pulses 1→0.5→1. */
export function SkeletonRow() {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.5,
          duration: PULSE_DURATION_MS / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: PULSE_DURATION_MS / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View style={[styles.row, { opacity }]} testID="skeleton-row">
      <View style={styles.thumbnail} />
      <View style={styles.textStack}>
        <View style={styles.line1} />
        <View style={styles.line2} />
      </View>
      <View style={styles.rightSlot} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    height: entryRow.height,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
  },
  thumbnail: {
    width: entryRow.thumbnailSize,
    height: entryRow.thumbnailSize,
    borderRadius: radius.control,
    backgroundColor: colors.sunk,
  },
  textStack: {
    flex: 1,
    gap: spacing.xs,
  },
  line1: {
    width: 96,
    height: 14,
    borderRadius: radius.control,
    backgroundColor: colors.sunk,
  },
  line2: {
    width: 64,
    height: 11,
    borderRadius: radius.control,
    backgroundColor: colors.sunk,
  },
  rightSlot: {
    width: 60,
    height: 20,
    borderRadius: radius.control,
    backgroundColor: colors.sunk,
  },
});
