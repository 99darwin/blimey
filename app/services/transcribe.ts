import * as FileSystem from 'expo-file-system';
import { API_BASE_URL, APP_SECRET, TIMEOUTS } from '@/utils/constants';
import { ApiError } from './api';

interface TranscribeResponse {
  text: string;
}

export async function transcribeAudio(audioUri: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.transcribe);

  try {
    const result = await FileSystem.uploadAsync(
      `${API_BASE_URL}/api/transcribe`,
      audioUri,
      {
        httpMethod: 'POST',
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        fieldName: 'file',
        mimeType: 'audio/m4a',
        headers: {
          Authorization: `Bearer ${APP_SECRET}`,
        },
      },
    );

    if (result.status === 429) {
      throw new ApiError(
        "You've reached your translation limit. Upgrade to Blimey Pro for unlimited translations!",
        429,
        true,
      );
    }

    if (result.status < 200 || result.status >= 300) {
      throw new ApiError('Could not transcribe audio. Please try again.', result.status);
    }

    const data = JSON.parse(result.body) as TranscribeResponse;
    return data.text;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError('Could not transcribe audio. Please try again.', 0);
  } finally {
    clearTimeout(timeoutId);
  }
}
