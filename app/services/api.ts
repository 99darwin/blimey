import { API_BASE_URL, APP_SECRET } from '@/utils/constants';
import { useSettingsStore } from '@/stores/settingsStore';

interface FetchOptions extends Omit<RequestInit, 'signal'> {
  timeout?: number;
}

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public isRateLimited: boolean = false,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiFetch(
  path: string,
  options: FetchOptions = {},
): Promise<Response> {
  const { timeout = 10_000, headers: customHeaders, ...rest } = options;

  const isPremium = useSettingsStore.getState().isPremium;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${APP_SECRET}`,
    ...(customHeaders as Record<string, string>),
  };

  if (isPremium) {
    // TODO: Replace with actual RevenueCat entitlement ID
    headers['X-Premium-Token'] = 'premium';
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...rest,
      headers,
      signal: controller.signal,
    });

    if (response.status === 429) {
      throw new ApiError(
        'You\'ve reached your translation limit. Upgrade to Blimey Pro for unlimited translations!',
        429,
        true,
      );
    }

    if (!response.ok) {
      throw new ApiError(
        'Something went wrong. Please try again.',
        response.status,
      );
    }

    return response;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('Request timed out. Please try again.', 408);
    }
    throw new ApiError('Unable to connect. Check your internet connection.', 0);
  } finally {
    clearTimeout(timeoutId);
  }
}

export { apiFetch, ApiError };
