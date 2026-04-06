export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

export const APP_SECRET = process.env.EXPO_PUBLIC_APP_SECRET ?? '';

export const ADMOB_BANNER_ID =
  process.env.EXPO_PUBLIC_ADMOB_BANNER_ID ?? 'ca-app-pub-3940256099942544/2934735716';

export const ADMOB_INTERSTITIAL_ID =
  process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID ?? 'ca-app-pub-3940256099942544/4411468910';

export const REVENUECAT_API_KEY =
  process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ?? '';

export const COLORS = {
  white: '#FAFAFA',
  surface: '#FFFFFF',
  navy: '#1B2A4A',
  red: '#CF142B',
  mutedGray: '#6B7280',
  lightBorder: '#E5E7EB',
  background: '#FAFAFA',
} as const;

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
} as const;

export const SPACING = 8;

export const BORDER_RADIUS = {
  card: 16,
  button: 999,
  chip: 12,
} as const;

export const TIMEOUTS = {
  transcribe: 15_000,
  translate: 10_000,
  speak: 12_000,
} as const;

export const MAX_RECORDING_DURATION_MS = 30_000;

export const INTERSTITIAL_INTERVAL = 5;

export const MAX_HISTORY_SIZE = 50;

export type TranslationDirection = 'UK_TO_US' | 'US_TO_UK';

export const UK_DIALECTS = [
  'General',
  'London',
  'Scouse',
  'Northern',
  'Scottish',
  'Welsh',
  'Cockney',
] as const;

export const US_DIALECTS = [
  'General',
  'Southern',
  'New England',
  'Midwest',
  'NYC',
] as const;

export type UKDialect = (typeof UK_DIALECTS)[number];
export type USDialect = (typeof US_DIALECTS)[number];
export type Dialect = UKDialect | USDialect;

export interface TranslationResult {
  original: string;
  translated: string;
  context: string;
  literal_meaning: string;
  confidence: 'high' | 'medium' | 'low';
}
