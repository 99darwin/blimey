import { useState, useRef, useCallback } from 'react';
import { Alert, Linking } from 'react-native';
import { useAudioRecorder, RecordingPresets, setAudioModeAsync } from 'expo-audio';
import { requestMicrophonePermission } from '@/services/audio';
import { MAX_RECORDING_DURATION_MS } from '@/utils/constants';

type RecordingState =
  | 'idle'
  | 'requesting_permission'
  | 'recording'
  | 'stopping';

interface UseAudioRecordingReturn {
  isRecording: boolean;
  recordingState: RecordingState;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
  audioUri: string | null;
}

export function useAudioRecording(): UseAudioRecordingReturn {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPromiseRef = useRef<Promise<void> | null>(null);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    if (startPromiseRef.current) {
      try {
        await startPromiseRef.current;
      } catch {
        // ignore
      }
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    setRecordingState('stopping');

    try {
      await recorder.stop();
      const uri = recorder.uri;
      setAudioUri(uri);
      return uri;
    } catch {
      return null;
    } finally {
      setRecordingState('idle');
    }
  }, [recorder]);

  const startRecording = useCallback(async () => {
    if (recordingState !== 'idle' || startPromiseRef.current) return;

    const startPromise = (async () => {
      const hasPermission = await requestMicrophonePermission();
      if (!hasPermission) {
        setRecordingState('idle');
        Alert.alert(
          'Microphone Access Needed',
          'Blimey needs microphone access to translate speech. Enable it in Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ],
        );
        return;
      }

      try {
        // Re-assert recording-capable session in case TTS playback flipped it.
        await setAudioModeAsync({
          playsInSilentMode: true,
          allowsRecording: true,
        });
        await recorder.prepareToRecordAsync();
        recorder.record();
        setRecordingState('recording');

        timerRef.current = setTimeout(() => {
          stopRecording();
        }, MAX_RECORDING_DURATION_MS);
      } catch (err) {
        setRecordingState('idle');
        const message = err instanceof Error ? err.message : 'Unknown error';
        Alert.alert('Recording Failed', message);
      }
    })();

    startPromiseRef.current = startPromise;
    try {
      await startPromise;
    } finally {
      startPromiseRef.current = null;
    }
  }, [recorder, recordingState, stopRecording]);

  return {
    isRecording: recordingState === 'recording',
    recordingState,
    startRecording,
    stopRecording,
    audioUri,
  };
}
