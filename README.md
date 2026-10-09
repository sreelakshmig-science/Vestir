# Vestir — Cloth Try-On App (React Native / Expo)

UI/UX and 3D Virtual Try-On layer for the Vestir clothing try-on app. Built with React Native and Expo (supporting web and mobile) with an integrated Express.js backend for authentication, dress catalog management, Cloudinary image storage, and Hunyuan3D-2 AI 3D garment generation.

## Getting Started

### 1. Prerequisites
- **Node.js** (v18+ recommended)
- **MongoDB** running locally (`mongodb://127.0.0.1:27017/vestir`)
- **Hunyuan3D-2** Gradio server (optional, for local AI 3D garment generation on `http://127.0.0.1:8080`)

### 2. Run the Backend
```bash
cd backend
npm install
npm start
```
The backend server runs on `http://localhost:3000`.

### 3. Run the Frontend
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
