import { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, BORDER_RADIUS } from '@/utils/constants';
import { useTranslationStore } from '@/stores/translationStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAudioRecording } from '@/hooks/useAudioRecording';
import { useRateLimit } from '@/hooks/useRateLimit';
import { usePremium } from '@/hooks/usePremium';
import { transcribeAudio } from '@/services/transcribe';
import { translateText } from '@/services/translate';
import { speakText } from '@/services/speak';
import { playAudio } from '@/services/audio';
import { ApiError } from '@/services/api';
import { DirectionToggle } from '@/components/DirectionToggle';
import { DialectPicker } from '@/components/DialectPicker';
import { MicButton } from '@/components/MicButton';
import { ResultCard } from '@/components/ResultCard';
import { TypeInput } from '@/components/TypeInput';
import { PaywallModal } from '@/components/PaywallModal';

export default function HomeScreen() {
  const [showTypeInput, setShowTypeInput] = useState(false);
  const [ttsUri, setTtsUri] = useState<string | null>(null);

  const currentTranslation = useTranslationStore((s) => s.currentTranslation);
  const isLoading = useTranslationStore((s) => s.isLoading);
  const error = useTranslationStore((s) => s.error);
  const setTranslation = useTranslationStore((s) => s.setTranslation);
  const setLoading = useTranslationStore((s) => s.setLoading);
  const setError = useTranslationStore((s) => s.setError);
  const incrementCount = useTranslationStore((s) => s.incrementCount);
  const addToHistory = useTranslationStore((s) => s.addToHistory);

  const direction = useSettingsStore((s) => s.direction);
  const dialect = useSettingsStore((s) => s.dialect);
  const isPremium = useSettingsStore((s) => s.isPremium);

  const { isRecording, startRecording, stopRecording } = useAudioRecording();
  const { showPaywall, dismissPaywall, handleRateLimitError } = useRateLimit();
  const { purchasePremium, restorePurchases } = usePremium();

  const handleTranslateFlow = useCallback(
    async (text: string) => {
      try {
        setLoading(true);
        setError(null);

        const translation = await translateText({
          text,
          direction,
          dialect,
        });

        setTranslation(translation);
        incrementCount();

        if (isPremium) {
          addToHistory(translation);
        }

        // Auto-play TTS
        try {
          const audioUri = await speakText(translation.translated, direction);
          setTtsUri(audioUri);
          await playAudio(audioUri);
        } catch {
          // TTS failure is non-critical; translation still shows
        }
      } catch (err) {
        if (err instanceof ApiError && err.isRateLimited) {
          handleRateLimitError();
        } else {
          const message =
            err instanceof ApiError
              ? err.message
              : 'Something went wrong. Please try again.';
          setError(message);
          Alert.alert('Oops', message);
        }
      } finally {
        setLoading(false);
      }
    },
    [
      direction,
      dialect,
      isPremium,
      setLoading,
      setError,
      setTranslation,
      incrementCount,
      addToHistory,
      handleRateLimitError,
    ],
  );

  const handleRecordStart = useCallback(() => {
    startRecording();
  }, [startRecording]);

  const handleRecordStop = useCallback(async () => {
    const uri = await stopRecording();
    if (!uri) return;

    try {
      setLoading(true);
      const transcribedText = await transcribeAudio(uri);
      await handleTranslateFlow(transcribedText);
    } catch (err) {
      if (err instanceof ApiError && err.isRateLimited) {
        handleRateLimitError();
      } else {
        const message =
          err instanceof ApiError
            ? err.message
            : 'Could not transcribe audio. Please try again.';
        setError(message);
        setLoading(false);
        Alert.alert('Oops', message);
      }
    }
  }, [stopRecording, handleTranslateFlow, setLoading, setError, handleRateLimitError]);

  const handleTextSubmit = useCallback(
    (text: string) => {
      handleTranslateFlow(text);
    },
    [handleTranslateFlow],
  );

  const handlePlayAudio = useCallback(async () => {
    if (ttsUri) {
      try {
        await playAudio(ttsUri);
      } catch {
        // Playback failure is non-critical
      }
    } else if (currentTranslation) {
      try {
        const uri = await speakText(currentTranslation.translated, direction);
        setTtsUri(uri);
        await playAudio(uri);
      } catch {
        // TTS failure is non-critical
      }
    }
  }, [ttsUri, currentTranslation, direction]);

  const handleLockedDialectPress = useCallback(() => {
    handleRateLimitError();
  }, [handleRateLimitError]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        {/* Header: Direction + Dialect */}
        <View style={styles.header}>
          <DirectionToggle />
          <View style={styles.dialectWrapper}>
            <DialectPicker onLockedDialectPress={handleLockedDialectPress} />
          </View>
        </View>

        {/* Result Card */}
        <View style={styles.resultArea}>
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.navy} />
              <Text style={styles.loadingText}>Translating...</Text>
            </View>
          )}
          {!isLoading && currentTranslation && (
            <ResultCard
              translation={currentTranslation}
              onPlayAudio={handlePlayAudio}
            />
          )}
          {!isLoading && error && !currentTranslation && (
            <Text style={styles.errorText}>{error}</Text>
          )}
        </View>

        {/* Mic + Type */}
        <View style={styles.micArea}>
          <MicButton
            onPressIn={handleRecordStart}
            onPressOut={handleRecordStop}
            isRecording={isRecording}
            isProcessing={isLoading}
          />
          <Pressable
            onPress={() => setShowTypeInput(true)}
            style={styles.typeInput}
            accessibilityRole="button"
            accessibilityLabel="Type a phrase instead of speaking"
          >
            <Text style={styles.typeInputPlaceholder}>Or type a phrase...</Text>
          </Pressable>
        </View>

        {/* Ad Banner Placeholder */}
        {!isPremium && (
          <View style={styles.adBanner} accessibilityLabel="Advertisement" accessibilityRole="none">
            <Text style={styles.adBannerText}>Ad Space</Text>
          </View>
        )}
      </View>

      {/* Modals */}
      <TypeInput
        visible={showTypeInput}
        onDismiss={() => setShowTypeInput(false)}
        onSubmit={handleTextSubmit}
        isLoading={isLoading}
      />

      <PaywallModal
        visible={showPaywall}
        onDismiss={dismissPaywall}
        onPurchase={purchasePremium}
        onRestore={restorePurchases}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
  },
  header: {
    paddingTop: SPACING * 2,
    gap: SPACING * 1.5,
  },
  dialectWrapper: {
    marginTop: SPACING / 2,
  },
  resultArea: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: SPACING * 2,
  },
  loadingContainer: {
    alignItems: 'center',
    gap: SPACING * 1.5,
  },
  loadingText: {
    fontSize: 15,
    color: COLORS.mutedGray,
  },
  errorText: {
    textAlign: 'center',
    color: COLORS.red,
    fontSize: 14,
    paddingHorizontal: SPACING * 3,
  },
  micArea: {
    alignItems: 'center',
    paddingBottom: SPACING * 3,
  },
  typeInput: {
    alignSelf: 'stretch',
    marginTop: SPACING * 2,
    marginHorizontal: SPACING * 2,
    paddingVertical: SPACING * 1.5,
    paddingHorizontal: SPACING * 2,
    borderWidth: 1,
    borderColor: COLORS.lightBorder,
    borderRadius: BORDER_RADIUS.chip,
    backgroundColor: COLORS.surface,
  },
  typeInputPlaceholder: {
    fontSize: 15,
    color: COLORS.mutedGray,
  },
  adBanner: {
    height: 50,
    backgroundColor: COLORS.lightBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: SPACING * 2,
    marginBottom: SPACING,
    borderRadius: SPACING,
  },
  adBannerText: {
    fontSize: 12,
    color: COLORS.mutedGray,
  },
});
