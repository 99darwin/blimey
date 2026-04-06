import { useRef, useEffect } from 'react';
import { Animated, Pressable, Text, StyleSheet, View } from 'react-native';
import { useSettingsStore } from '@/stores/settingsStore';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '@/utils/constants';

export function DirectionToggle() {
  const direction = useSettingsStore((s) => s.direction);
  const toggleDirection = useSettingsStore((s) => s.toggleDirection);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const isUkToUs = direction === 'UK_TO_US';

  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: isUkToUs ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isUkToUs, rotateAnim]);

  const arrowRotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <Pressable
      onPress={toggleDirection}
      style={styles.container}
      accessibilityRole="button"
      accessibilityLabel={`Translation direction: ${isUkToUs ? 'British to American' : 'American to British'}. Tap to switch.`}
    >
      <View style={styles.pill}>
        <Text style={styles.flag}>{'\uD83C\uDDEC\uD83C\uDDE7'}</Text>
        <Animated.Text
          style={[styles.arrow, { transform: [{ rotate: arrowRotation }] }]}
        >
          {'\u2192'}
        </Animated.Text>
        <Text style={styles.flag}>{'\uD83C\uDDFA\uD83C\uDDF8'}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING * 2.5,
    paddingVertical: SPACING * 1.5,
    borderRadius: BORDER_RADIUS.button,
    borderWidth: 1,
    borderColor: COLORS.lightBorder,
    gap: SPACING * 1.5,
    ...SHADOWS.small,
  },
  flag: {
    fontSize: 28,
  },
  arrow: {
    fontSize: 20,
    color: COLORS.navy,
    fontWeight: '600',
  },
});
