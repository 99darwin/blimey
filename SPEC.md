# Blimey — UK ↔ US English Translator

## Overview

A dead-simple mobile app that translates British English slang/terminology to American English (and vice versa). Built for virality, not longevity. The thesis: millions of UK expats, tourists, and Americans who watch too much Love Island need this exact thing. Film the marketing content (real people struggling at grocery stores, hardware stores, restaurants), post it, and let the app ride the wave.

## Core User Flow

1. Open app → single screen, no onboarding, no signup
2. Tap the mic button (center of screen) and speak naturally
   - OR tap a keyboard icon to type
3. App transcribes speech → sends to LLM → returns translation with cultural context
4. Result displays on screen with:
   - The original phrase (what you said)
   - The translated phrase (what to say instead)
   - Brief cultural context (1 sentence, e.g., "In the US, 'pastry' usually means a baked good — ask for 'pie crust' instead")
5. Translation auto-plays via gpt-4o-mini-tts in a natural voice; tap 🔊 to replay

## Direction Toggle

- Prominent toggle at top of screen: 🇬🇧 → 🇺🇸 or 🇺🇸 → 🇬🇧
- Default: UK → US (primary use case)
- Regional dialect selector (dropdown/pill selector below the toggle):
  - **UK side**: General, London, Scouse, Northern, Scottish, Welsh, Cockney
  - **US side**: General, Southern, New England, Midwest, NYC
- Regional selection affects how the LLM interprets input and frames output

## Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | Expo (React Native) managed workflow | Claude Code proficiency, fast iteration |
| Backend Proxy | Node.js (Hono) on Railway | Protects OpenAI keys, server-side rate limiting |
| Audio Recording | `expo-av` | Record audio for STT |
| Speech-to-Text | OpenAI Whisper API (via proxy) | $0.006/min, reliable, language-aware |
| Translation LLM | OpenAI GPT-4o-mini (via proxy) | $0.15/$0.60 per MTok — 5x cheaper than Haiku, one vendor |
| Text-to-Speech | OpenAI `gpt-4o-mini-tts` (via proxy) | ~$0.015/min, natural voices, way better than on-device |
| Ads | Google AdMob (`react-native-google-mobile-ads`) | Industry standard, easy integration |
| In-App Purchases | RevenueCat | Handles iOS/Android IAP, receipt validation |
| State Management | Zustand | Lightweight, minimal boilerplate |
| Async Storage | `@react-native-async-storage/async-storage` | Preferences, local cache |
| Build/Deploy | EAS Build + EAS Submit | Required for native modules (AdMob) |

## API Flow (per voice query)

```
[User speaks] → expo-av records audio
  → Audio POST to backend proxy /api/transcribe (auth via app secret)
    → Proxy forwards to OpenAI Whisper API (STT) — $0.006/min
  → Transcribed text POST to backend proxy /api/translate
    → Proxy forwards to GPT-4o-mini (translation) — $0.15/$0.60 per MTok
  → Translation result displayed on screen
  → Translated phrase POST to backend proxy /api/speak
    → Proxy forwards to gpt-4o-mini-tts (TTS) — ~$0.015/min
  → Audio response plays automatically (user can also tap 🔊 to replay)
```

For typed input, skip step 1-2 — go straight to /api/translate. TTS still fires for the response.

**All-OpenAI stack**: one API key lives on Railway, never touches the client. Rate limiting
and abuse protection happen server-side.

## LLM System Prompt (GPT-4o-mini)

```
You are a British-American English translator. You translate slang, idioms, 
terminology, and colloquialisms between UK and American English.

Direction: {{direction}} (e.g., "UK_TO_US" or "US_TO_UK")
Regional dialect: {{dialect}} (e.g., "scouse", "general", "southern")

Rules:
- Respond ONLY with valid JSON. No markdown, no preamble.
- If the input is already in the target dialect or isn't slang, still provide 
  the equivalent and note that it's universally understood.
- Keep cultural context to 1 sentence max.
- If you detect the user is speaking in the wrong direction (e.g., American 
  English but direction is UK→US), gently note this and translate anyway.

Response format:
{
  "original": "the exact phrase the user said",
  "translated": "the equivalent phrase in the target dialect",
  "context": "brief cultural explanation",
  "literal_meaning": "what a native speaker of the target dialect would think you meant (if different/funny)",
  "confidence": "high" | "medium" | "low"
}

Example (UK → US):
Input: "I need to find pastry for my pie"
Output: {
  "original": "I need to find pastry for my pie",
  "translated": "I need to find pie crust for my pie",
  "context": "In the US, 'pastry' refers to sweet baked goods like croissants and danishes — pie crust is sold separately in the baking aisle.",
  "literal_meaning": "A store clerk would send you to the bakery section",
  "confidence": "high"
}
```

## Backend Proxy (Railway)

A minimal Node.js service that sits between the app and OpenAI. Its only job is to hold the
OpenAI API key and forward requests. No database, no user accounts, no state.

### Stack
- **Runtime**: Node.js
- **Framework**: Hono (lightweight, fast, ~14KB)
- **Hosting**: Railway (auto-deploy from GitHub, $5/mo hobby plan is plenty)
- **Auth**: shared app secret in `Authorization: Bearer <APP_SECRET>` header

### Routes

```
POST /api/transcribe
  - Accepts: multipart/form-data (audio file)
  - Forwards to: OpenAI /v1/audio/transcriptions (Whisper)
  - Returns: { text: "transcribed text" }

POST /api/translate  
  - Accepts: { text: string, direction: string, dialect: string }
  - Builds system prompt, forwards to: OpenAI /v1/chat/completions (gpt-4o-mini)
  - Returns: translation JSON object

POST /api/speak
  - Accepts: { text: string, voice?: string }
  - Forwards to: OpenAI /v1/audio/speech (gpt-4o-mini-tts)
  - Returns: audio/mpeg binary stream

GET /api/health
  - Returns: { ok: true } (for Railway health checks)
```

### Server-Side Rate Limiting
- Rate limit by IP using an in-memory store (no Redis needed at this scale)
- Free tier: 5 requests/min per IP, 50/day per IP
- Premium: higher limits (app sends RevenueCat entitlement ID in header, proxy validates)
- Return 429 with `Retry-After` header when limited

### Security
- `APP_SECRET` env var on Railway — shared secret the app uses to authenticate
- The secret is still in the client bundle, but an attacker now gets access to YOUR proxy (rate-limited, logged) instead of directly to OpenAI (unlimited, unmonitored)
- Can rotate the secret with an app update if compromised
- CORS restricted to the app's bundle ID (nice-to-have, not critical for native app)
- Log request counts per IP for abuse monitoring

### Environment Variables (Railway)
```
OPENAI_API_KEY=sk-...          # The real key — never leaves the server
APP_SECRET=blimey_v1_...       # Shared secret for app ↔ proxy auth
PORT=3000                       # Railway sets this automatically
```

### Deployment
- Single `Dockerfile` or Railway Nixpack auto-detect
- Auto-deploy on push to `main`
- Estimated cost: $5/mo Railway hobby plan (generous for this traffic profile)
- Cold start: ~1-2s on hobby plan; acceptable for a non-realtime app

## Monetization
- 5 translations per day (tracked via AsyncStorage with date key)
- Banner ad at bottom of screen (persistent)
- Interstitial ad every 5th translation

### Premium ("Blimey Pro") — $1.99/month or $3.99 lifetime
- Unlimited translations
- No ads
- Access to all regional dialects (free tier gets General only)
- Conversation history (last 50 translations, stored locally)

### Cost Model (back of napkin)
- Whisper STT: $0.006/min → ~$0.003 per avg query (30 sec)
- 4o-mini text: ~$0.00005 per query (tiny prompt/response at $0.15/$0.60 per MTok)
- gpt-4o-mini-tts: ~$0.001 per query (~4 sec translated phrase)
- **Total per voice query: ~$0.004**
- **Total per text query: ~$0.001** (4o-mini + TTS, no Whisper)
- At 100K users × 3 queries/day avg = 300K queries/day → ~$600-1200/day API cost
- AdMob banner eCPM: ~$1-3 → need volume to offset
- Real monetization is premium conversions + virality window
- **All OpenAI**: one API key on Railway, one billing dashboard, set one spending cap
- **Railway**: ~$5/mo hobby plan (negligible)

### Ad Placement
- Bottom banner ad (320x50) — always visible on free tier
- Interstitial (full screen) — after every 5th translation on free tier
- No ads on premium tier

## UI/UX Spec

### Single Screen Layout

```
┌─────────────────────────────────┐
│  [🇬🇧 → 🇺🇸 toggle]              │
│  [Regional: General ▼]          │
│                                 │
│                                 │
│   ┌─────────────────────────┐   │
│   │                         │   │
│   │   Translation Result    │   │
│   │   Card (appears after   │   │
│   │   query)                │   │
│   │                         │   │
│   │   "pie crust" 🔊        │   │
│   │   ─────────────────     │   │
│   │   context text          │   │
│   │                         │   │
│   └─────────────────────────┘   │
│                                 │
│                                 │
│         ┌───────────┐           │
│         │           │           │
│         │  🎤 TAP   │           │
│         │           │           │
│         └───────────┘           │
│         [⌨️ type instead]       │
│                                 │
│  ┌───────────────────────────┐  │
│  │     Banner Ad (free)      │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

### Design Direction
- Clean white/off-white background
- Mic button: large, circular, bold accent color (Union Jack blue or red)
- Result card: slight shadow/elevation, rounded corners
- Typography: one clean sans-serif, nothing fancy
- Flag emojis for the direction toggle — instantly recognizable
- Minimal color palette: white, navy, one accent
- Feel: clean, trustworthy, slightly playful — NOT over-designed

### Interaction States
- **Idle**: Mic button pulsing subtly, "Tap to speak" label
- **Recording**: Mic button turns red, animated sound wave visualization
- **Processing**: Button shows spinner, "Translating..." label
- **Result**: Card animates in from bottom, mic button returns to idle
- **Error**: Brief toast notification, auto-dismiss
- **Rate Limited**: Modal explaining limit, CTA to upgrade

## App Store Metadata

- **Name**: Blimey — UK ↔ US Translator
- **Subtitle**: What Americans actually call it
- **Category**: Reference (or Entertainment)
- **Keywords**: british, american, english, translator, slang, uk, expat, cockney, dialect
- **Screenshots**: Show the translation flow with funny examples
  - "boot" → "trunk"
  - "chemist" → "pharmacy"  
  - "taking the piss" → "messing with you"
  - "quid" → "bucks"

## Viral Marketing Plan

1. Film FIL at grocery store asking for "pastry" (real footage > staged)
2. Post to TikTok/Reels: "My British father-in-law can't buy groceries in America, so I built an app"
3. App must be approved and live BEFORE posting content
4. Cross-post to r/britishproblems, r/expats, Farcaster
5. Have a few UK→US creator friends ready to duet/stitch
6. Consider a launch-day promo: first 48 hours = unlimited free (remove rate limit, eat the API cost as CAC)

## File Structure

```
blimey/
├── app/                         # Expo mobile app
│   ├── app/
│   │   ├── _layout.tsx            # Root layout (Expo Router)
│   │   ├── index.tsx              # Main (only) screen
│   │   └── +not-found.tsx
│   ├── components/
│   │   ├── MicButton.tsx          # Animated mic button
│   │   ├── ResultCard.tsx         # Translation result display
│   │   ├── DirectionToggle.tsx    # UK↔US flag toggle
│   │   ├── DialectPicker.tsx      # Regional dialect selector
│   │   ├── TypeInput.tsx          # Text input modal/overlay
│   │   └── PaywallModal.tsx       # Premium upgrade prompt
│   ├── services/
│   │   ├── api.ts                 # HTTP client for backend proxy (base URL, auth header)
│   │   ├── transcribe.ts         # POST /api/transcribe wrapper
│   │   ├── translate.ts          # POST /api/translate wrapper
│   │   ├── speak.ts              # POST /api/speak wrapper (returns audio)
│   │   └── audio.ts              # expo-av recording helpers
│   ├── stores/
│   │   ├── translationStore.ts    # Zustand store (current translation, history)
│   │   └── settingsStore.ts       # Direction, dialect, premium status
│   ├── hooks/
│   │   ├── useRateLimit.ts        # Client-side rate limit UX (shows paywall on 429)
│   │   ├── usePremium.ts          # RevenueCat subscription status
│   │   └── useAudioRecording.ts   # Recording state machine
│   ├── utils/
│   │   └── constants.ts           # API base URL, rate limits, ad unit IDs
│   ├── assets/                    # App icon, splash screen
│   ├── app.json                   # Expo config
│   ├── eas.json                   # EAS Build config
│   ├── .env                       # EXPO_PUBLIC_ vars (gitignored)
│   └── package.json
│
├── server/                      # Backend proxy (Railway)
│   ├── src/
│   │   ├── index.ts               # Hono app entry point
│   │   ├── routes/
│   │   │   ├── transcribe.ts      # POST /api/transcribe → Whisper
│   │   │   ├── translate.ts       # POST /api/translate → GPT-4o-mini
│   │   │   └── speak.ts           # POST /api/speak → gpt-4o-mini-tts
│   │   ├── middleware/
│   │   │   ├── auth.ts            # APP_SECRET validation
│   │   │   └── rateLimit.ts       # IP-based rate limiting
│   │   └── lib/
│   │       └── openai.ts          # OpenAI client (API key lives here)
│   ├── Dockerfile                 # Railway deployment
│   ├── package.json
│   └── tsconfig.json
│
└── README.md
```

## Environment Variables

### Mobile App (.env)
```
EXPO_PUBLIC_API_BASE_URL=https://blimey-api.up.railway.app  # Backend proxy URL
EXPO_PUBLIC_APP_SECRET=blimey_v1_...                         # Shared auth secret
EXPO_PUBLIC_ADMOB_BANNER_ID=ca-app-pub-xxx
EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID=ca-app-pub-xxx
EXPO_PUBLIC_REVENUECAT_API_KEY=appl_xxx
```

### Backend (Railway env vars)
```
OPENAI_API_KEY=sk-...          # Real OpenAI key — never leaves the server
APP_SECRET=blimey_v1_...       # Must match the app's EXPO_PUBLIC_APP_SECRET
PORT=3000                       # Railway sets this
```

> **Security note**: `EXPO_PUBLIC_APP_SECRET` is still in the client bundle and extractable.
> But the attacker now hits your rate-limited, logged proxy instead of OpenAI directly.
> You can rotate the secret, ban IPs, or add Apple App Attest later if abuse is a problem.
> This is a massive improvement over raw API key exposure for ~30 min of extra work.

## Out of Scope (v1)

- User accounts / auth (beyond shared app secret)
- Database / persistent server-side state
- Android (iOS first, Android if it takes off)
- Offline mode
- Conversation history sync
- Sharing translations to social
- Dark mode (white bg is the brand)
- Apple App Attest / DeviceCheck (add later if abuse is a problem)

## Success Metrics

- App Store approval in < 3 days
- 10K+ downloads in first week (if content hits)
- < $500 total API spend in first month
- At least break even on Apple Developer fee ($99) + API costs
- One good story to tell
