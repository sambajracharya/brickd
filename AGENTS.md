# Brick'd — context for AI coding agents

Read this before changing anything. It captures decisions and hard-won
gotchas that aren't obvious from the code alone. (This file is the
cross-tool convention — Claude Code, Codex and others read it.)

## What this is

A React Native (Expo) app that helps men find foods supporting healthy
testosterone, scored from public USDA lab data. Ships two ways: Expo Go
during development, and an installable PWA at https://brickdd.netlify.app
(how the owner actually uses it on iPhone, since native iOS needs a paid
Apple account).

**Expo SDK 54.** Read https://docs.expo.dev/versions/v54.0.0/ before
writing code — pinned deliberately, because the owner's Expo Go supports
SDK 54 and newer SDKs refuse to open.

## The non-negotiable principle: never invent a number

This app's whole positioning is honesty about weak evidence. Several
design decisions exist only to protect that, and they must not be
"optimised" away:

- **Score weights are ranked by evidence strength** (zinc 30 > vitamin D
  25 > protein 20 > magnesium 15 > selenium 10). An earlier version had
  selenium tied with magnesium while the research notes called selenium
  "Limited" — a self-contradiction a critic would spot instantly.
- **Points cap at sufficiency.** Oysters carry ~8× the zinc target and
  still earn only the zinc cap, because extra zinc does nothing for a
  sufficient person. The cap *is* the evidence.
- **Warning flags never subtract from the score.** They're facts shown
  beside it ("52.1g added sugar per 100g"). A penalty would mean
  inventing math — "−12 for sugar" is a number no study supports.
- **No claims of store inventory.** No public API exposes it for the
  stores the app finds, so the store screen shows the user's own list
  and gaps instead. The one honest store signal is cuisine, inferred
  from the store's *name*.
- The in-app "How the score works" screen renders from the live SCORING
  and RESEARCH_NOTES constants, so it can never drift from reality.

## Architecture

```
App.js                     navigation shell; 5 tab stacks share detailScreenOptions
src/api/       usda.js     search + scoring + flags (SCORING, RESEARCH_NOTES)
               openfoodfacts.js  barcode lookup
               stores.js   Overpass (OpenStreetMap) + cuisine detection
               ocr.js      OCR.space (swappable — see below)
               supabase.js client (null when env vars missing)
src/lib/       receipt.js  receipt parsing + catalog matching + cartGaps
               history.js  scan history (per-identity)
               scopedStorage.js  per-user AsyncStorage keys
src/store/     auth, favorites, theme, shoppingChecks  (React contexts)
src/data/      curatedFoods.js  69 foods, real USDA values
src/screens/   one per tab + detail screens
pwa/ + scripts/build-pwa.js   PWA assets and build
```

## Gotchas that cost real time — don't rediscover these

1. **Netlify strips `node_modules` folders.** Expo exports icon fonts to
   `assets/node_modules/@expo/vector-icons/...`, so they 404 in
   production and every icon renders as a tofu square. `build-pwa.js`
   relocates them to `assets/vendor/` and rewrites references. Works on
   localhost either way, so it only shows up once deployed.
2. **Supabase's redirect allowlist silently rejects custom schemes**
   (`exp://`) and doesn't support wildcards inside IPs. Unmatched
   redirects fall back to Site URL, which looks like a broken app. This
   is why Google sign-in works on the hosted PWA but was painful in Expo
   Go.
3. **USDA's `/food/{id}` full format 500s for some Foundation foods**
   (e.g. canned tuna). Use `format=abridged`, which parses nutrients by
   `number` (string) rather than `id`.
4. **Open Food Facts normalises every `*_100g` value to grams**, even
   minerals. zinc_100g 0.005 means 5mg. Getting this wrong silently
   scores every product near zero.
5. **`upsert` needs an UPDATE row-level-security policy.** Postgres
   requires one for `ON CONFLICT DO UPDATE`; without it favourites sync
   fails silently on a second device.
6. **Search must not sort purely by score** — that floats jerky and
   protein powder above chicken breast. Rank by relevance, score is the
   tiebreaker. See the filter/rank/clean block in `usda.js`.
7. **Per-identity storage is a security requirement, not a nicety.**
   Receipt history and searches leaked between users on a shared device
   before `scopedStorage.js`. Guest data transfers to a new account only
   via an explicit sign-up claim — never on arbitrary sign-in.
8. **In-flight search responses must be dropped when stale**, or a slow
   earlier query overwrites a newer one (very reachable on weak store
   signal). `HomeScreen` guards this with a request id.

## Environment

`.env.local` (gitignored, never commit) holds:
`EXPO_PUBLIC_USDA_API_KEY`, `EXPO_PUBLIC_SUPABASE_URL`,
`EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_OCR_SPACE_KEY`.
All are free tiers. The Supabase key is the *publishable* one — safe to
ship, protected by RLS. There is no secret key in this project.

Backend: one `favorites` table with select/insert/update/delete policies
scoped to `auth.uid() = user_id`, plus a `delete_user()` SECURITY DEFINER
function (`search_path = ''`) granted only to `authenticated`.

## Workflows

```bash
npx expo start --lan     # phone via Expo Go (IP changes often; regenerate the QR)
npm run web              # browser dev
npm run build:pwa        # production build into dist/
```
Deploy: drag `dist/` onto the **brickdd site → Deploys tab** in Netlify.
Never use app.netlify.com/drop — it creates a new site and a new URL,
which breaks the Supabase redirect config.

A GitHub Action pings Supabase twice weekly so the free project doesn't
pause after 7 idle days.

## State of the project

Feature-complete and in daily use as a PWA. Verified: RLS holds against
forged JWTs and anonymous writes, OAuth open-redirect blocked, offline
degrades gracefully, receipt matching passes a 60-line audit.

Known remaining work:
- Native barcode path was refactored into `BarcodeScanner.js` but only
  the web variant has been tested end-to-end.
- Session tokens sit in plaintext AsyncStorage; move to
  `expo-secure-store` when doing a native build.
- No length/range constraints on the `favorites` table.
- App Store submission: needs the $99 Apple account, an EAS build, and
  screenshots. Listing copy is written — see `docs/store-listing.md`.
