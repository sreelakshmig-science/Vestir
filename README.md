# Vestir — Cloth Try-On App (React Native / Expo)

UI/UX layer for the cloth try-on app. Built as a standalone Expo project so
it runs on its own right now, and drops into the "frontend" folder of your
MERN app later with minimal changes (see "Connecting to your MERN backend").

## Run it

```bash
npm install
npx expo start
```

Scan the QR code with the **Expo Go** app on your phone (easiest way to test
the camera screen — simulators can't access a real camera).

## Screens, and where they live

| Screen | File | Notes |
|---|---|---|
| Login | `src/screens/LoginScreen.js` | On success -> Home |
| Sign up | `src/screens/SignupScreen.js` | Name, Gmail, password, confirm. On success -> Instructions |
| Instructions | `src/screens/InstructionsScreen.js` | Shown once after signup; also reachable anytime from Home ("How it works") |
| Home | `src/screens/HomeScreen.js` | 2-column grid of dresses (photo, name, size); "+" button to upload |
| Upload | `src/screens/UploadDressScreen.js` | Take a photo or pick from library, add name/size/description |
| Dress detail | `src/screens/DressDetailScreen.js` | Opens on tapping a photo; shows description + Try-On button |
| Try-On | `src/screens/TryOnScreen.js` / `TryOnScreen.web.js` | Camera try-on; save to favourites |
| Favourites | `src/screens/FavouritesScreen.js` | Saved dresses, most-recently-saved first |

## How state currently works (no backend yet)

- `src/context/DressesContext.js` holds the dress list in memory (seeded from
  `src/data/mockDresses.js`), standing in for `GET/POST /api/dresses`.
  Uploading a dress on `UploadDressScreen` calls `addDress()`, which puts it
  straight into this shared list — that's why it shows up on Home immediately.
- `src/context/FavouritesContext.js` holds favourites in memory with React
  Context, standing in for `GET/POST/DELETE /api/favourites`.
- Login/Signup just simulate a network delay and navigate — no real auth yet.

## Uploading a photo

`UploadDressScreen` uses `expo-image-picker` to either take a new photo or
pick one from the phone's library, plus a form for name/size/description.
On web, the same calls open the browser's native camera/file picker instead
— same code, different underlying platform API, handled by Expo automatically.

Right now the picked image is only a local file URI held in memory — it is
**not uploaded anywhere yet**. Wiring it to a real backend means: send the
image as `multipart/form-data` (or to a signed cloud-storage URL) from
`handleSubmit` in `UploadDressScreen.js`, get back a permanent URL, and send
that URL + the form fields to `POST /api/dresses`.

This means the whole app is demoable today, before any backend exists.

## Try-on behavior

On web, the Try-On screen uses the 3D rigging and body-pose retargeting from
the `tryon` project. It starts with a skinned demo tee and accepts `.glb`
garments; humanoid arm bones let the garment deform as you move. Models without
recognized bones are fitted and placed rigidly. Uploaded models are normalized
to the shoulders or garment bounds, and the rear half is clipped at the camera
plane; orient a model's front toward +Z. Camera access requires localhost or
HTTPS, and the tracking models load from the network. iOS and Android keep the
existing camera reference overlay.

## Connecting to your MERN backend later

Three swaps, nothing else changes:

1. **DressesContext** — replace the `mockDresses` seed with a `fetch('/api/dresses')`
   call in a `useEffect`, and have `addDress` also `POST` to that same endpoint.
2. **FavouritesContext** — inside `addFavourite`/`removeFavourite`, add the
   matching `fetch('/api/favourites', { method: 'POST' | 'DELETE', ... })`
   call alongside the local state update.
3. **Login/SignupScreen** — replace the `setTimeout` with a real
   `fetch('/api/auth/login' | '/api/auth/signup', { method: 'POST', body: ... })`,
   and store the JWT it returns (e.g. with `expo-secure-store`) for future
   authenticated requests.

## Design decisions (for explaining this to someone)

- **Two type families, one job each**: a serif (`PlayfairDisplay`) for dress
  names/headings gives it a catalogue/editorial feel; a sans (`Inter`) handles
  all functional UI text (buttons, labels, inputs). Fonts aren't bundled in
  this pass — without linking them via `expo-font`, React Native just falls
  back to the system font, so the app still works, it just loses some of the
  editorial character until you add them.
- **Emerald as the one accent color**, used only for primary actions (Try-On,
  Log in, Sign up) — so the eye always knows where the one meaningful action
  on a screen is. Gold is used _only_ for the "saved" state, so save-related
  status stays visually distinct from calls-to-action.
- **Web Try-On uses pose landmarks** to track a 3D garment over the upper
  body. The native screen keeps a semi-transparent reference image overlay so
  the wearer can line themselves up.
