import { useEffect, useRef, useCallback } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
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
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(colorAnim, {
      toValue: isRecording ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isRecording, colorAnim]);

  useEffect(() => {
    if (!isRecording) {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 1400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [isRecording, pulseAnim]);

  const backgroundColor = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.navy, COLORS.red],
  });

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.8],
  });
  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 0],
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
      <View style={styles.buttonContainer}>
        {isRecording && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.pulse,
              {
                opacity: pulseOpacity,
                transform: [{ scale: pulseScale }],
              },
            ]}
          />
        )}
      <Animated.View style={[styles.button, { backgroundColor }]}>
        {isProcessing ? (
          <ActivityIndicator size="large" color={COLORS.white} />
        ) : (
          <Text style={styles.icon}>{isRecording ? '...' : '\uD83C\uDFA4'}</Text>
        )}
      </Animated.View>
      </View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const BUTTON_SIZE = 80;

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  buttonContainer: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulse: {
    position: 'absolute',
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: COLORS.mutedGray,
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
