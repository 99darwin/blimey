import { useEffect, useRef } from 'react';
import {
  Animated,
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '@/utils/constants';
import type { TranslationResult } from '@/utils/constants';

interface ResultCardProps {
  translation: TranslationResult;
  onPlayAudio: () => void;
}

export function ResultCard({ translation, onPlayAudio }: ResultCardProps) {
  const slideAnim = useRef(new Animated.Value(40)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    slideAnim.setValue(40);
    opacityAnim.setValue(0);

    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [translation, slideAnim, opacityAnim]);

  return (
    <Animated.View
      style={[
        styles.card,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
      accessibilityRole="summary"
      accessibilityLabel={`Translation: ${translation.translated}. Original: ${translation.original}. ${translation.context}`}
    >
      <View style={styles.translatedRow}>
        <Text style={styles.translatedText} numberOfLines={3}>
          {translation.translated}
        </Text>
        <Pressable
          onPress={onPlayAudio}
          style={styles.speakerButton}
          accessibilityRole="button"
          accessibilityLabel="Play translation audio"
        >
          <Text style={styles.speakerIcon}>{'\uD83D\uDD0A'}</Text>
        </Pressable>
      </View>

      <Text style={styles.originalText}>{translation.original}</Text>

      <Text style={styles.contextText}>{translation.context}</Text>

      {translation.literal_meaning &&
        translation.literal_meaning !== translation.translated && (
          <View style={styles.literalContainer}>
            <Text style={styles.literalLabel}>Literal meaning: </Text>
            <Text style={styles.literalText}>
              {translation.literal_meaning}
            </Text>
          </View>
        )}

      {translation.confidence === 'low' && (
        <View style={styles.confidenceBadge}>
          <Text style={styles.confidenceText}>
            Low confidence — take this one with a grain of salt
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.card,
    padding: SPACING * 2.5,
    marginHorizontal: SPACING * 2,
    ...SHADOWS.medium,
    borderWidth: 1,
    borderColor: COLORS.lightBorder,
  },
  translatedRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: SPACING,
  },
  translatedText: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.navy,
    flex: 1,
    marginRight: SPACING,
  },
  speakerButton: {
    padding: 10,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speakerIcon: {
    fontSize: 24,
  },
  originalText: {
    fontSize: 15,
    color: COLORS.mutedGray,
    marginBottom: SPACING * 1.5,
  },
  contextText: {
    fontSize: 14,
    color: COLORS.navy,
    lineHeight: 20,
    marginBottom: SPACING,
  },
  literalContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING,
  },
  literalLabel: {
    fontSize: 13,
    color: COLORS.mutedGray,
    fontStyle: 'italic',
  },
  literalText: {
    fontSize: 13,
    color: COLORS.mutedGray,
    fontStyle: 'italic',
    flex: 1,
  },
  confidenceBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING,
    paddingVertical: SPACING / 2,
    borderRadius: BORDER_RADIUS.chip,
  },
  confidenceText: {
    fontSize: 12,
    color: COLORS.mutedGray,
    textTransform: 'capitalize',
  },
});
