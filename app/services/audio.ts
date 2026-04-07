import {
  requestRecordingPermissionsAsync,
  createAudioPlayer,
  type AudioPlayer,
} from 'expo-audio';
import { MAX_RECORDING_DURATION_MS } from '@/utils/constants';

let currentPlayer: AudioPlayer | null = null;

export async function requestMicrophonePermission(): Promise<boolean> {
  const { granted } = await requestRecordingPermissionsAsync();
  return granted;
}

export async function playAudio(uri: string): Promise<void> {
  await cleanupPlayer();

  const player = createAudioPlayer(uri);
  currentPlayer = player;
  player.volume = 1.0;
  player.play();
}

export async function cleanupPlayer(): Promise<void> {
  if (currentPlayer) {
    currentPlayer.remove();
    currentPlayer = null;
  }
}

export { MAX_RECORDING_DURATION_MS };
