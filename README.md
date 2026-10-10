# Vestir — Cloth Try-On App (React Native / Expo)

UI/UX and 3D Virtual Try-On layer for the Vestir clothing try-on app. Built with React Native and Expo (supporting web and mobile) with an integrated Express.js backend for authentication, dress catalog management, Cloudinary image storage, and Hunyuan3D-2 AI 3D garment generation.

## Getting Started

### 1. Prerequisites
- **Node.js** (v18+ recommended)
- **MongoDB** running locally (`mongodb://127.0.0.1:27017/vestir`)
- **Hunyuan3D-2** Gradio server on `http://127.0.0.1:8080` (optional, for local AI 3D garment generation — see [Hunyuan3D-2 Installation](#2-hunyuan3d-2-installation-windows-portable) below)

### 2. Hunyuan3D-2 Installation (Windows Portable)

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

> **Note**: Vestir's Express backend connects to `http://127.0.0.1:8080` by default. If your Hunyuan server is running on a different port or host, specify `HUNYUAN_URL=http://<host>:<port>` in `backend/.env`.

### 3. Run the Backend
```bash
cd backend
npm install
npm start
```
The backend server runs on `http://localhost:3000`.

### 4. Run the Frontend
```bash
npm install
npm run web
```
Open `http://localhost:8081` in your browser. (Camera access requires `localhost` or HTTPS).

For mobile testing:
```bash
npx expo start
```
Scan the QR code with the **Expo Go** app on your phone.

---

## Screens & Architecture

| Screen | File | Description |
|---|---|---|
| **Login** | `src/screens/LoginScreen.js` | User authentication (on success -> Home) |
| **Sign up** | `src/screens/SignupScreen.js` | User registration (on success -> Instructions) |
| **Instructions** | `src/screens/InstructionsScreen.js` | "How it works" onboarding guide |
| **Home** | `src/screens/HomeScreen.js` | 2-column dress catalog with " Create 3D Garment" and "+" upload actions |
| **Upload** | `src/screens/UploadDressScreen.js` | Take/pick a photo, add name/size/description, upload to Cloudinary/catalog |
| **Dress Detail** | `src/screens/DressDetailScreen.js` | Garment overview with one-tap "Try it on" |
| **Try-On (Web)** | `src/screens/TryOnScreen.web.js` | Live webcam virtual try-on with pose estimation & AI 3D generation |
| **Try-On (Native)** | `src/screens/TryOnScreen.js` | Mobile camera reference overlay try-on |
| **Favourites** | `src/screens/FavouritesScreen.js` | Saved items list with removal & quick navigation |

---

## 3D Virtual Try-On & AI Pipeline

### 1. Live Pose Retargeting
- Utilizes Google MediaPipe Pose Landmarker for real-time 33-point body tracking.
- Garments with humanoid skeletal rigs track arm and shoulder movements in real time.
- Garments without rigs fall back to adaptive rigid torso placement.
- Models are normalized to shoulder width, with depth clipping to keep the fit natural against the camera plane.
- Fine-tune positioning in real-time with Size, Vertical (Y), and Depth (Z) adjustment controls.

### 2. Hunyuan3D-2 AI Garment Generation
- **In-Browser Background Removal**: Integrated `@imgly/background-removal` isolates garments automatically from any photo before 3D reconstruction.
- **Image-to-3D Generation**: Isolated garment images are sent via the Express backend proxy (`POST /api/hunyuan/generate`) to the local Hunyuan3D-2 Gradio instance, streaming generation progress and returning a fitted `.glb` binary.
- **Windows Portable Engine**: Hosted locally on Windows via [YanWenKun/Hunyuan3D-2-WinPortable](https://github.com/YanWenKun/Hunyuan3D-2-WinPortable/tree/main) on `http://127.0.0.1:8080`.
- **One-Tap Try-On**: Generate 3D garments directly from catalog dresses, upload photos from your device, or load pre-existing `.glb` 3D models.
- **Clean Camera Experience**: Webcam virtual try-on operates exclusively on real 3D garments (no synthetic demo tees). When no model is loaded, the camera feed stays clean and ready for generation or upload.

---

## State & Backend Integration

- **Authentication**: JWT token-based auth with bcrypt password hashing (`/signup`, `/login`, `/profile`).
- **Dress Catalog**: MongoDB storage with Mongoose (`/api/dresses`).
- **Favourites**: Persistent user favourites with duplicate protection (`/api/favourites`).
- **Cloudinary Storage**: High-resolution garment photo uploads (`/upload`).
- **Hunyuan3D Proxy**: Bridges frontend requests to Gradio AI server (`/api/hunyuan/status`, `/api/hunyuan/generate`).

---

## Design System

- **Typography**: Editorial serif (`PlayfairDisplay`) for garment titles and headings; clean functional sans (`Inter`) for controls and labels.
- **Color Palette**: Curated dark ink (`#14171C`), warm bone (`#F7F5F0`), slate clay accents, vivid emerald (`#1E824C`) for primary CTAs, and gold (`#D4AF37`) for saved favourites.
