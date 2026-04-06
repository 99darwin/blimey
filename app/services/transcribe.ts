import { apiFetch } from './api';
import { TIMEOUTS } from '@/utils/constants';

interface TranscribeResponse {
  text: string;
}

export async function transcribeAudio(audioUri: string): Promise<string> {
  const formData = new FormData();

  formData.append('file', {
    uri: audioUri,
    type: 'audio/m4a',
    name: 'recording.m4a',
  } as unknown as Blob);

  const response = await apiFetch('/api/transcribe', {
    method: 'POST',
    body: formData,
    timeout: TIMEOUTS.transcribe,
  });

  const data = (await response.json()) as TranscribeResponse;
  return data.text;
}
