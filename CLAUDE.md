# CLAUDE.md — Blimey App

## Project Overview

Blimey is an Expo (React Native) iOS app that translates British English ↔ American English slang and terminology using voice or text input. It's a single-screen, single-purpose app designed for viral distribution.

Read `SPEC.md` for the full product spec before writing any code.

## Tech Decisions (Do Not Deviate)

### Mobile App (Expo)
- **Expo managed workflow** with Expo Router (file-based routing)
- **TypeScript** everywhere — strict mode, no `any`
- **Zustand** for state management (no Redux, no Context API for global state)
- **expo-av** for audio recording and audio playback
- **react-native-google-mobile-ads** for AdMob integration
- **react-native-purchases** (RevenueCat) for in-app purchases
- **AsyncStorage** for local preferences

### Backend Proxy (Railway)
- **Hono** web framework (lightweight, TypeScript-native)
- **OpenAI SDK** (`openai` npm package) for all API calls
- **OpenAI Whisper API** for speech-to-text
- **OpenAI GPT-4o-mini** for translation (JSON mode)
- **OpenAI gpt-4o-mini-tts** for text-to-speech
- **In-memory rate limiting** (no Redis, no database)
- **Railway** for hosting (auto-deploy from GitHub)

### Key Principle
The mobile app **never** talks to OpenAI directly. All LLM/STT/TTS calls go through the backend proxy. The OpenAI API key lives exclusively on Railway.

## Architecture Rules

### API Calls (Mobile → Proxy)
- The app calls 3 proxy endpoints: `/api/transcribe`, `/api/translate`, `/api/speak`
- Every request includes `Authorization: Bearer <APP_SECRET>` header
- Create a shared HTTP client in `services/api.ts` that sets the base URL and auth header
- All API calls must have try/catch with user-friendly error handling (toast, not crash)
- Handle 429 (rate limited) responses gracefully — show PaywallModal
- Set reasonable timeouts (15s for transcribe, 10s for translate, 12s for speak — account for proxy hop)
- TTS endpoint returns audio bytes — write to temp file, play via expo-av

### API Calls (Proxy → OpenAI)
- Use the official `openai` npm package — don't hand-roll HTTP calls
- System prompt for translation lives server-side in `routes/translate.ts` (not in the mobile app)
- Use `response_format: { type: "json_object" }` with 4o-mini
- Validate response shape server-side before returning to client
- TTS: stream the audio response back to the client (don't buffer the whole file)

### State Management
- `translationStore.ts` (Zustand): current translation result, loading state, error state, translation history (last 50, premium only)
- `settingsStore.ts` (Zustand): direction (UK_TO_US | US_TO_UK), dialect, premium status
- Persist settings store to AsyncStorage via Zustand middleware

### Rate Limiting
- **Server-side** (primary): in-memory Map keyed by IP, 5 req/min and 50/day for free tier
- **Client-side** (UX only): when proxy returns 429, show PaywallModal with upgrade CTA
- Premium users: app sends RevenueCat entitlement ID in `X-Premium-Token` header; proxy validates and applies higher limits
- Don't trust client-side limits for security — they're just for UX responsiveness

### Audio Recording
- Use `expo-av` Audio.Recording API
- Record as m4a (iOS default) — Whisper accepts this format
- Max recording duration: 30 seconds (auto-stop with warning)
- Clean up recording objects after use (memory management)
- Handle microphone permission request gracefully (first-launch flow)

### LLM Integration (Server-Side)
- System prompt lives in `server/src/routes/translate.ts` — built dynamically from direction + dialect params
- Always request JSON output from 4o-mini (use `response_format: { type: "json_object" }`)
- Validate response shape server-side before returning to client
- Model: `gpt-4o-mini` for translation (text in, text out)
- Model: `gpt-4o-mini-tts` for TTS (text in, audio out)
- Max tokens: 300 (translations are short)
- The mobile app never sees the system prompt or raw LLM output

### TTS Integration (Server-Side)
- Server calls OpenAI's `gpt-4o-mini-tts` via `/v1/audio/speech` endpoint
- Voice: experiment with "coral", "alloy", "nova" — pick one that sounds natural for the target dialect
- Response format: mp3 (smallest file size for short phrases)
- Stream the audio response through the proxy back to the client
- Client writes audio to temp file via `expo-av`, then plays via Audio.Sound
- Auto-play after translation completes; user can tap 🔊 to replay
- For UK→US: use an American-sounding voice. For US→UK: use... well, they're all American, so just play the text. Consider this a known limitation.

## UI/UX Rules

### Layout
- Single screen app. One screen. Do not create navigation stacks, tab bars, or multi-screen flows.
- White/off-white background (`#FAFAFA`)
- Content centered vertically with the mic button as the primary focal point
- Result card appears above the mic button when a translation exists

### Components
- `MicButton`: Large (80px diameter), circular, animated. Navy blue idle, red when recording. Subtle pulse animation when idle. Sound wave animation when recording.
- `ResultCard`: Rounded corners (16px), slight elevation/shadow. Shows: translated phrase (large, bold), original phrase (smaller, muted), context (body text), speaker icon for TTS playback.
- `DirectionToggle`: Horizontal pill with flag emojis. Tap to flip. Animate the arrow on flip.
- `DialectPicker`: Horizontal scrollable pill/chip selector below the direction toggle. "General" selected by default. Non-General options gated to premium (show lock icon).
- `TypeInput`: Tapping "type instead" opens a bottom sheet or modal with a text input and send button.
- `PaywallModal`: Clean modal. Show what premium includes. Single CTA button. Dismissible.

### Design System
- Colors: white (`#FAFAFA`), navy (`#1B2A4A`), red accent (`#CF142B`), muted gray (`#6B7280`), light border (`#E5E7EB`)
- Font: system font (don't import custom fonts — keep bundle small)
- Spacing: 8px grid
- Border radius: 12-16px for cards, full round for buttons
- No dark mode

### Animations
- Use React Native's `Animated` API or `react-native-reanimated` if needed
- Mic button: subtle scale pulse when idle (1.0 → 1.05 → 1.0, 2s loop)
- Mic button recording: faster pulse + red color transition
- Result card: slide up + fade in from bottom (300ms, ease-out)
- Direction toggle: arrow rotates 180° on flip

### Ads
- Banner ad: fixed at bottom of screen, 320x50, always visible for free users
- Interstitial: show after every 5th translation (track count in translationStore)
- Hide all ads for premium users
- Use test ad unit IDs during development

## File Structure

Follow the structure defined in SPEC.md exactly. Do not add unnecessary files, folders, or abstraction layers.

## Code Style

- Functional components only (no class components)
- Named exports for components, default export for screens
- Hooks for all side effects
- No inline styles for anything reused — use StyleSheet.create()
- Inline styles are fine for one-off layout tweaks
- Comments only where behavior is non-obvious (not on every line)
- No console.log in committed code (use a proper logger or remove)

## Build Order

Build in this exact sequence:

1. **Backend proxy first** — scaffold Hono app, implement 3 routes, deploy to Railway, verify with curl
2. **Mobile app skeleton** — Expo Router, single screen, direction toggle, mic button (non-functional)
3. **Audio recording** — expo-av integration, mic permission flow
4. **Core translation flow** — wire up transcribe → translate → display result (end-to-end)
5. **TTS playback** — wire up speak endpoint, auto-play, replay button
6. **Rate limiting** — server-side enforcement, client-side 429 handling, PaywallModal
7. **Ads** — AdMob banner + interstitial integration
8. **Premium/IAP** — RevenueCat integration, premium header in API calls
9. **Polish** — animations, error states, loading states, edge cases
10. **EAS Build** — production build, TestFlight submission

This is a monorepo with two deploy targets. The proxy is a 15-minute job; the mobile app is the bulk of the work.

## Testing

- Don't write tests. This is a weekend project. Ship it.
- Do manually test: recording → transcription → translation → display → TTS flow
- Test rate limiting (set limit to 2 temporarily to verify modal triggers)
- Test on physical device (audio recording doesn't work in simulators reliably)

## Build & Deploy

### Mobile App
- Use EAS Build for dev builds (required for native modules)
- `eas.json` should have `development`, `preview`, and `production` profiles
- iOS only for v1 — don't configure Android
- App icon: simple Union Jack / Stars and Stripes mashup (or just the app name in bold navy text on white — keep it clean)
- Splash screen: white with app name centered

### Backend Proxy
- Railway auto-deploys from the `server/` directory on push to `main`
- Include a `Dockerfile` (Node 20 alpine, multi-stage build)
- Health check endpoint: `GET /api/health` → `{ ok: true }`
- Deploy the proxy FIRST and verify it works before building the mobile app against it

## Security Notes

- **OpenAI API key** lives exclusively on Railway as an env var. It never touches the client.
- **APP_SECRET** is a shared secret between the app and proxy. Yes, it's in the client bundle and extractable. But an attacker now gets access to a rate-limited, logged proxy — not a raw OpenAI key.
- If abuse is detected: rotate APP_SECRET (requires app update), ban IPs server-side, or add Apple App Attest as a future enhancement.
- Do not log or store user audio beyond the immediate API call.
- Do not collect any PII.
- Set a hard spending cap on the OpenAI account as a backstop.

## Common Pitfalls (Save Yourself a Subagent Cycle)

### Mobile App
1. `expo-av` recording requires explicit permission request — handle this on first mic tap, not app load
2. The audio file from expo-av needs to be sent as multipart/form-data to the proxy — use FormData, not JSON
3. TTS audio comes back as binary — use `responseType: 'arraybuffer'`, write to temp file via `FileSystem.writeAsStringAsync` with base64 encoding, then play with `expo-av`
4. AdMob test ads require specific test device IDs on physical devices
5. RevenueCat needs app-specific setup in App Store Connect BEFORE testing purchases
6. EAS Build can take 15-30 min for the first build — start this early while iterating in Expo Go on non-native features
7. Handle 429 responses from the proxy as a rate limit → show PaywallModal, not a generic error

### Backend Proxy
1. Whisper API expects multipart/form-data with the audio file — the proxy must forward the file stream, not re-encode it
2. Use `response_format: { type: "json_object" }` with 4o-mini to guarantee valid JSON — don't rely on prompt instructions alone
3. Stream the TTS audio response back to the client — don't buffer the whole mp3 in memory
4. Railway hobby plan has cold starts (~1-2s) — the first request after idle will be slow. Add a keep-alive ping if this matters.
5. In-memory rate limit state resets on deploy — acceptable for v1, but be aware during rapid redeploys
6. Set a hard spending cap on the OpenAI account as a backstop against proxy abuse
