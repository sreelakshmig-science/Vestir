# Vestir — Cloth Try-On App (React Native / Expo)

UI and virtual try-on application for clothing, built with React Native and Expo for web and mobile. The Express backend provides authentication, a MongoDB dress catalog, per-user favourites, Cloudinary image uploads, and an optional Hunyuan3D-2 generation proxy.

## Getting Started

### 1. Prerequisites
- **Node.js** and npm (Node.js v18 or newer recommended)
- **MongoDB Community Server**, installed and running locally, or a reachable MongoDB deployment
- A **Cloudinary** account for image uploads
- **Hunyuan3D-2** Gradio server on `http://127.0.0.1:8080` (optional; see [Hunyuan3D-2 Installation](#3-hunyuan3d-2-installation-windows-portable))

### 2. Configure the API URL and backend

Create or update the `.env` file in the **repository root**. Expo reads the `EXPO_PUBLIC_API_URL` variable from this file:

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

Use `http://localhost:3000` when the web app and backend run on the same computer. For a physical phone, replace `localhost` with the computer's reachable LAN IP, for example `http://192.168.1.5:3000`. The example address is only an example; use the actual IP of the computer running the backend. Keep the phone and computer on the same network, and allow backend traffic through the computer's firewall. Restart Expo after changing this value. Do not commit `.env` files.

Install MongoDB Community Server from the [official download page](https://www.mongodb.com/try/download/community), then start the MongoDB service. The backend defaults to `mongodb://127.0.0.1:27017/vestir`; MongoDB must be running for database-backed routes to work.

Create `backend/.env` for backend credentials and optional connection overrides:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Optional: defaults to the local MongoDB URL shown above.
# MONGODB_URI=mongodb://127.0.0.1:27017/vestir

# Optional: defaults to http://127.0.0.1:8080.
# HUNYUAN_URL=http://127.0.0.1:8080
```

Cloudinary credentials are required for image uploads. `MONGODB_URI` is optional when using the local default. `HUNYUAN_URL` is optional and is only needed when the Hunyuan3D-2 server uses a different address. Never commit backend credentials.

From the repository root, install backend dependencies and start the server:

```bash
cd backend
npm install
npm start
```

The backend listens on `http://localhost:3000`. Keep this terminal running.

### 3. Hunyuan3D-2 Installation (Windows Portable)

Vestir uses **Hunyuan3D-2** to reconstruct 3D garments (`.glb`) from 2D images. On Windows, the easiest and recommended way to install and run the Hunyuan3D-2 server without setting up complex Python/CUDA environments is using the portable release package by [YanWenKun/Hunyuan3D-2-WinPortable](https://github.com/YanWenKun/Hunyuan3D-2-WinPortable/tree/main).

#### System Requirements
- **OS**: Windows 10 / 11 (64-bit)
- **GPU**: NVIDIA GPU with CUDA support (RTX 3060/4060 or higher recommended)
  - **VRAM**: 6GB–8GB+ minimum (or use low VRAM mode); 12GB+ recommended for full textured generation
- **RAM**: 24GB+ system RAM recommended
- **Storage**: ~25–30GB free disk space (SSD recommended)

#### Installation & Startup Steps
1. **Download the Portable Release**:
   - Visit the [YanWenKun/Hunyuan3D-2-WinPortable](https://github.com/YanWenKun/Hunyuan3D-2-WinPortable/tree/main) repository and head to its [Releases](https://github.com/YanWenKun/Hunyuan3D-2-WinPortable/releases) page.
   - Download the multi-part 7z/zip archive matching your CUDA setup.
   - Extract the archive using [7-Zip](https://www.7-zip.org/) to a directory path without spaces or non-ASCII characters (e.g., `D:\Hunyuan3D-2-WinPortable`).

2. **Initialize Environment**:
   - Open the extracted folder and run:
     ```bat
     0-initialize.bat
     ```
   - This sets up the embedded Python and CUDA runtime.

3. **Install Texture Generation Dependencies** *(Optional / Recommended)*:
   - Run:
     ```bat
     1-compile-install-texture-gen.bat
     ```
   - This compiles rasterizers and dependencies for textured mesh reconstruction.

4. **Download Model Weights**:
   - Run:
     ```bat
     2-download-models.bat
     ```
   - This downloads the official Hunyuan3D-2 model weights from Hugging Face / ModelScope.

5. **Start the Hunyuan3D-2 Server**:
   - Run:
     ```bat
     3-start.bat
     ```
   - *(For low VRAM systems with 6–8GB VRAM)*: Run `run-very_low_vram.bat` instead.
   - Wait until the console displays that the server is running on:
     ```text
     Running on local URL: http://127.0.0.1:8080
     ```

> **Note**: Vestir's Express backend connects to `http://127.0.0.1:8080` by default. If your Hunyuan server is running on a different port or host, set `HUNYUAN_URL=http://<host>:<port>` in `backend/.env`.

### 4. Run the Frontend

Open a **new terminal at the repository root** and install frontend dependencies:

```bash
npm install
```

Run the web app:

```bash
npm run web
```

Open `http://localhost:8081` in your browser. Browser camera access requires `localhost` or HTTPS.

For Android or other Expo Go mobile testing, run this at the repository root:

```bash
npx expo start
```

Scan the QR code with the **Expo Go** app. Make sure the root `.env` uses the computer's reachable LAN IP for a physical phone, not `localhost`.

---

## Screens & Architecture

| Screen | File | Description |
|---|---|---|
| **Login** | `src/screens/LoginScreen.js` | Signs in with the backend and opens Home after the JWT is stored |
| **Sign up** | `src/screens/SignupScreen.js` | Creates an account; successful signup returns to Login |
| **Instructions** | `src/screens/InstructionsScreen.js` | "How it works" onboarding guide |
| **Home** | `src/screens/HomeScreen.js` | Backend dress catalog with garment upload and custom web 3D-generation actions |
| **Upload** | `src/screens/UploadDressScreen.js` | Selects or captures an image, uploads it to Cloudinary, then saves the dress |
| **Dress Detail** | `src/screens/DressDetailScreen.js` | Garment details, favourite toggle, and "Try it on" action |
| **Try-On (Web)** | `src/screens/TryOnScreen.web.js` | Browser camera, pose/model display controls, and the Hunyuan3D generation client |
| **Try-On (Native)** | `src/screens/TryOnScreen.js` | Mobile camera view with a reference image overlay |
| **Favourites** | `src/screens/FavouritesScreen.js` | Authenticated user's saved items with removal and detail navigation |

---

## Try-On and Hunyuan3D-2

The web and native applications use different try-on implementations:

- **Web:** `TryOnScreen.web.js` contains the browser camera and 3D model experience, including pose tracking and model adjustment controls. The Hunyuan client removes an image background in the browser and sends the image to the backend proxy at `POST /api/hunyuan/generate`. The proxy requires a separately running Hunyuan3D-2 Gradio server; check it with `GET /api/hunyuan/status`. Generation can take several minutes and depends on that external service and its hardware.
- **Native Android:** `TryOnScreen.js` opens the camera and displays the selected garment as a reference image overlay. It is not the web pose-tracked 3D pipeline and does not generate a 3D garment through Hunyuan3D.

The frontend/backend authentication, catalogue, favourites, and image-upload integration does not itself implement AI try-on. Hunyuan3D generation is a separate optional web flow; its availability depends on the backend proxy and Gradio service.

---

## Backend Integration

The API base URL is `EXPO_PUBLIC_API_URL` from the **repository-root** `.env` file. Routes below are relative to that URL. Dress and favourite routes are at the root; they do not use an `/api` prefix.

### Authentication

- `POST /signup` accepts `{ "name", "email", "password" }`. A successful signup returns a message, not a token; sign in afterward.
- `POST /login` accepts `{ "email", "password" }` and returns the JWT in the `token` field.
- Native platforms store the JWT with Expo SecureStore. Web stores it in `localStorage`; JavaScript-accessible storage has an XSS exposure risk.
- Send the token on protected requests using `Authorization: Bearer <token>`.
- Protected routes are `GET /profile`, `GET /favourites`, `POST /favourites`, and `DELETE /favourites/:id`.

### Dress Catalog and Favourites

- The catalog is loaded from MongoDB with `GET /dresses`; each document uses its MongoDB `_id` as its dress ID.
- Create a dress with `POST /dresses`, update with `PUT /dresses/:id`, and delete with `DELETE /dresses/:id`.
- Favourites are stored per authenticated user. `POST /favourites` accepts the MongoDB dress ID in `{ "dress": "<dress_id>" }`. `GET /favourites` returns favourite records with the dress populated.
- `DELETE /favourites/:id` takes the **favourite record's** MongoDB `_id`, not the dress `_id`.

### Image Uploads

The frontend sends the selected image to `POST /upload` as `multipart/form-data` with the file field named `image`. The upload response contains the Cloudinary URL in `image`. The frontend then sends that URL and the dress fields to `POST /dresses`; the saved dress response contains its MongoDB `_id`.

### API Route Reference

| Method | Route | Purpose |
|---|---|---|
| `POST` | `/signup` | Register a user |
| `POST` | `/login` | Sign in and receive a JWT |
| `GET` | `/profile` | Read the authenticated user's profile |
| `GET` | `/dresses` | List catalog dresses |
| `GET` | `/dresses/:id` | Read one dress |
| `POST` | `/dresses` | Create a dress |
| `PUT` | `/dresses/:id` | Update a dress |
| `DELETE` | `/dresses/:id` | Delete a dress |
| `POST` | `/favourites` | Save a dress for the authenticated user |
| `GET` | `/favourites` | List the authenticated user's favourites |
| `DELETE` | `/favourites/:id` | Delete a favourite record |
| `POST` | `/upload` | Upload an image to Cloudinary |
| `GET` | `/api/hunyuan/status` | Check Hunyuan3D service availability |
| `POST` | `/api/hunyuan/generate` | Request a 3D garment from Hunyuan3D |

---

## Design System

- **Typography**: Theme tokens specify Playfair Display for headings and garment names, and Inter for body text and controls. If these font files are not bundled, React Native falls back to platform fonts.
- **Color Palette**: Ink (`#14171C`), bone (`#F1EFE9`), white cards, clay accents, emerald (`#1F5C46`) for primary actions, and gold (`#C9A227`) for saved favourites.
