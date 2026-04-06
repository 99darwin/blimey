import { useEffect, useRef, useCallback } from 'react';
import {
  Animated,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Text,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, SHADOWS, SPACING } from '@/utils/constants';

interface MicButtonProps {
  onPressIn: () => void;
  onPressOut: () => void;
  isRecording: boolean;
  isProcessing: boolean;
}

export function MicButton({
  onPressIn,
  onPressOut,
  isRecording,
  isProcessing,
}: MicButtonProps) {
  const colorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(colorAnim, {
      toValue: isRecording ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isRecording, colorAnim]);

  const backgroundColor = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.navy, COLORS.red],
  });

  const label = isProcessing
    ? 'Translating...'
    : isRecording
      ? 'Listening...'
      : 'Hold to speak';

  const handlePressIn = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPressIn();
  }, [onPressIn]);

  const handlePressOut = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPressOut();
  }, [onPressOut]);

  return (
    <Pressable
      onPressIn={isProcessing ? undefined : handlePressIn}
      onPressOut={isProcessing ? undefined : handlePressOut}
      disabled={isProcessing}
      accessibilityRole="button"
      accessibilityLabel={isProcessing ? 'Translating' : isRecording ? 'Recording, release to stop' : 'Hold to record speech for translation'}
      accessibilityState={{ disabled: isProcessing, busy: isProcessing || isRecording }}
      style={styles.wrapper}
    >
      <Animated.View style={[styles.button, { backgroundColor }]}>
        {isProcessing ? (
          <ActivityIndicator size="large" color={COLORS.white} />
        ) : (
          <Text style={styles.icon}>{isRecording ? '...' : '\uD83C\uDFA4'}</Text>
        )}
      </Animated.View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const BUTTON_SIZE = 80;

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.large,
  },
  icon: {
    fontSize: 32,
  },
  label: {
    marginTop: SPACING * 1.5,
    fontSize: 14,
    color: COLORS.mutedGray,
  },
});
