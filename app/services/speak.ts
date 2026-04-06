import { apiFetch } from './api';
import { TIMEOUTS } from '@/utils/constants';
import * as FileSystem from 'expo-file-system';

export async function speakText(text: string, direction?: string): Promise<string> {
  const response = await apiFetch('/api/speak', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text, direction }),
    timeout: TIMEOUTS.speak,
  });

  const arrayBuffer = await response.arrayBuffer();
  const base64 = arrayBufferToBase64(arrayBuffer);

  const tempUri = `${FileSystem.cacheDirectory}blimey_tts_${Date.now()}.mp3`;

  await FileSystem.writeAsStringAsync(tempUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return tempUri;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
