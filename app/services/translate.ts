import { apiFetch } from './api';
import { TIMEOUTS } from '@/utils/constants';
import type { TranslationDirection, Dialect, TranslationResult } from '@/utils/constants';

interface TranslateRequest {
  text: string;
  direction: TranslationDirection;
  dialect: Dialect;
}

export async function translateText(
  request: TranslateRequest,
): Promise<TranslationResult> {
  const response = await apiFetch('/api/translate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...request,
      dialect: request.dialect.toLowerCase(),
    }),
    timeout: TIMEOUTS.translate,
  });

  const data = (await response.json()) as TranslationResult;
  return data;
}
