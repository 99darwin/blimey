import {
  requestRecordingPermissionsAsync,
  RecordingPresets,
  createAudioPlayer,
  AudioRecorder,
  type AudioPlayer,
} from 'expo-audio';
import { MAX_RECORDING_DURATION_MS } from '@/utils/constants';

let currentRecorder: AudioRecorder | null = null;
let currentPlayer: AudioPlayer | null = null;

export async function requestMicrophonePermission(): Promise<boolean> {
  const { granted } = await requestRecordingPermissionsAsync();
  return granted;
}

export async function startRecording(): Promise<AudioRecorder> {
  const recorder = new AudioRecorder(RecordingPresets.HIGH_QUALITY);
  await recorder.prepareToRecordAsync();
  recorder.record();
  currentRecorder = recorder;
  return recorder;
}

export async function stopRecording(): Promise<string | null> {
  if (!currentRecorder) return null;

  try {
    await currentRecorder.stop();
    const uri = currentRecorder.uri;
    return uri;
  } finally {
    currentRecorder = null;
  }
}

export async function playAudio(uri: string): Promise<void> {
  await cleanupPlayer();

  const player = createAudioPlayer(uri);
  currentPlayer = player;
  player.play();
}

export async function cleanupPlayer(): Promise<void> {
  if (currentPlayer) {
    currentPlayer.remove();
    currentPlayer = null;
  }
}

export { MAX_RECORDING_DURATION_MS };
