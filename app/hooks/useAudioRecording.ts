import { useState, useRef, useCallback } from 'react';
import type { AudioRecorder } from 'expo-audio';
import {
  requestMicrophonePermission,
  startRecording as startRec,
  stopRecording as stopRec,
} from '@/services/audio';
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
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    setRecordingState('stopping');

    try {
      const uri = await stopRec();
      setAudioUri(uri);
      return uri;
    } finally {
      recorderRef.current = null;
      setRecordingState('idle');
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (recordingState !== 'idle') return;

    setRecordingState('requesting_permission');
    const hasPermission = await requestMicrophonePermission();

    if (!hasPermission) {
      setRecordingState('idle');
      return;
    }

    try {
      setRecordingState('recording');
      const recorder = await startRec();
      recorderRef.current = recorder;

      timerRef.current = setTimeout(async () => {
        if (recorderRef.current) {
          await stopRecording();
        }
      }, MAX_RECORDING_DURATION_MS);
    } catch {
      setRecordingState('idle');
    }
  }, [recordingState, stopRecording]);

  return {
    isRecording: recordingState === 'recording',
    recordingState,
    startRecording,
    stopRecording,
    audioUri,
  };
}
