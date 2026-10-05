# ARCHITECTURE REPORT: REAL-TIME 3D VIRTUAL CLOTHING TRY-ON SYSTEM

**Project:** Vestir (React Native / Expo / Web 3D Try-On)  
**Author:** Senior CV, React Native, 3D Graphics & AI/ML Engineer  
**Date:** October 5, 2026  
**Phase:** Phase 0 — Comprehensive Project Analysis  

---

## 1. CURRENT PROJECT ANALYSIS

### 1.1 Summary of Existing Codebase
- **Framework:** Expo SDK `~52.0.0` (Managed Workflow)
- **React Native Version:** `0.76.9`
- **React / React DOM:** `18.3.1`
- **Web Support:** `react-native-web` `~0.19.13`, `@expo/metro-runtime` `~4.0.1`
- **Target Platform Identification:** Primary target is **React Native Web** (`expo start --web`), while preserving Expo compatibility for cross-platform expansion.
- **Camera Implementation:** `expo-camera` (`CameraView`) in `src/screens/TryOnScreen.js`. Uses static front camera permissions.
- **Existing Pose Detection:** **NONE**. `TryOnScreen.js` uses a static 2D semi-transparent `<Image>` overlay (`opacity: 0.45`, `top: 12%`, `left: 20%`) lined up against user's view.
- **Existing 3D Implementation:** `three` (`^0.186.1`) is in `package.json`. GLB model files exist in `assets/models/clothing/` (`blazer.glb`, `rust_shirt.glb`, `slip_dress.glb`, `wrap_dress.glb`). However, `src/components/Garment3D` is an **empty directory** with zero rendering code implemented.
- **Existing Hunyuan3D Integration:** **NONE**. No backend API service, client SDK, or image-to-3D generation pipeline exists.
- **Empty / Placeholder Modules:** `src/components/Garment3D` (empty), `src/components/TryOnControls` (empty).

---

## 2. TARGET PLATFORM & CRITICAL ARCHITECTURE CHOICE

Following the **Critical Architecture Rule**, we explicitly evaluate the target platform:

- **Target Selected:** **Option A — React Native Web**
  - **Pipeline:** Browser Webcam (`HTMLVideoElement` / `navigator.mediaDevices.getUserMedia`) $\rightarrow$ MediaPipe Pose Landmarker (WASM) $\rightarrow$ Pose Processor / One-Euro Smoother $\rightarrow$ Coordinate Mapper $\rightarrow$ Three.js WebGL Canvas $\rightarrow$ 3D GLB Garment Fit.
  - **Rationale:** React Native Web allows zero-latency direct memory access between the HTML5 video feed, MediaPipe WebAssembly pose inference engine, and the Three.js WebGL canvas context. This eliminates costly JavaScript bridge serialization (e.g. base64 camera frame transfers) present in native React Native webview/bridge implementations, achieving true 30-60 FPS real-time performance.

---

## 3. PROPOSED SYSTEM ARCHITECTURE

```
                      +------------------------------------------+
                      |               USER CAMERA                |
                      |   (Browser HTML5 Video Stream / Webcam)  |
                      +--------------------+---------------------+
                                           |
                                           v
                      +--------------------+---------------------+
                      |         MEDIAPIPE POSE LANDMARKER        |
                      |   (Real-Time Body Landmark Detection)    |
                      +--------------------+---------------------+
                                           |
                                           v
                      +--------------------+---------------------+
                      |          POSE PROCESSOR & SMOOTHER       |
                      |   (One-Euro Filter / Landmark Extract)   |
                      +--------------------+---------------------+
                                           |
                                           v
                      +--------------------+---------------------+
                      |      COORDINATE MAPPER & FIT ENGINE      |
                      | (2D Screen -> 3D World Transformation)   |
                      +--------------------+---------------------+
                                           |
                                           v
                      +--------------------+---------------------+
                      |         THREE.JS 3D RENDERER             |
                      |   (WebGL Scene + GLB Garment Mesh)       |
                      +------------------------------------------+
```

### Modular Layer Architecture
1. **Vision Layer (`src/vision/`)**:
   - `PoseTracker`: Wraps MediaPipe Pose Landmarker for real-time video frame processing.
   - `PoseProcessor`: Extracts key landmarks (shoulders, hips, elbows, wrists, nose) and computes metrics (shoulder center, shoulder width, torso center, torso height, tilt, orientation).
   - `PoseSmoother`: Implements a 1 Euro Filter (or adaptive exponential moving average) to eliminate jitter while preserving motion responsiveness.
2. **Try-On / Fitting Layer (`src/tryon/`)**:
   - `CoordinateMapper`: Converts 2D normalized camera coordinates to 3D Three.js world space coordinates using perspective camera matrices and depth estimation heuristics.
   - `ClothingFitter`: Computes dynamic 3D scale, 3D translation (X, Y, Z depth offset), and 3D rotation (Yaw, Pitch, Roll) based on body geometry.
   - `VirtualTryOnEngine`: Coordinates the execution loop between camera ticks, pose detection, smoothing, transform computation, and 3D rendering update.
3. **Graphics Layer (`src/components/Garment3D/`)**:
   - `ClothingModel`: Handles GLB loading via `GLTFLoader`, material assignments, lighting, mesh centering, and matrix transforms.
   - `ModelViewer`: WebGL canvas overlay rendering the 3D scene cleanly on top of the live video feed.
4. **AI Generation Layer (`src/services/` & `backend/`)**:
   - `HunyuanApi`: Client service for requesting 3D model generation from single garment images.
   - `backend/app.py`: Python FastAPI server interfacing with Hunyuan3D-2.1 to generate GLB assets asynchronously.

---

## 4. STRATEGIES BY DOMAIN

### 4.1 Camera Strategy
- Use browser native `navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } })` for web, wrapped inside a cross-platform React Native Web Camera component.
- Ensure proper lifecycle cleanup (`stream.getTracks().forEach(track => track.stop())`) on unmount to prevent camera lock and memory leaks.
- Support video mirror transformation (`transform: [{ scaleX: -1 }]`) so camera preview acts naturally as a mirror.

### 4.2 Pose Tracking Strategy
- Deploy `@mediapipe/tasks-vision` (PoseLandmarker in `IMAGE` or `VIDEO` mode).
- Extract 33 pose landmarks at high speed via WebAssembly.
- Calculate:
  - **Shoulder Center**: $\frac{L_{shoulder} + R_{shoulder}}{2}$
  - **Shoulder Width**: $\|L_{shoulder} - R_{shoulder}\|$
  - **Torso Center**: $\frac{L_{shoulder} + R_{shoulder} + L_{hip} + R_{hip}}{4}$
  - **Torso Height**: $\| \text{Shoulder Center} - \text{Hip Center} \|$
  - **Body Roll/Tilt Angle**: $\arctan2(R_{shoulder}.y - L_{shoulder}.y, R_{shoulder}.x - L_{shoulder}.x)$
  - **Body Yaw (Orientation)**: Z-depth difference between left and right shoulders.

### 4.3 Pose Smoothing Strategy
- Implement the **One Euro Filter** (`OneEuroFilter.js`) for positional coordinates $(x, y, z)$ and body metrics.
- Tunable parameters:
  - `minCutoff` ($f_c$): Controls jitter suppression when stationary (e.g. 1.0 Hz).
  - `beta` ($\beta$): Controls lag reduction during fast movements (e.g. 0.007).
  - `dCutoff`: Derivative cutoff frequency (e.g. 1.0 Hz).

### 4.4 3D Rendering Strategy
- Use standard `three` (`^0.186.1`) WebGLRenderer rendering onto an HTML5 canvas over the camera feed.
- Load GLB assets using `GLTFLoader`.
- Set up standard perspective camera matching video aspect ratio and estimated FOV ($\approx 60^\circ$).
- Apply lighting: Ambient Light (intensity 1.2), Directional Light (intensity 1.5, position `[0, 10, 10]`), and Soft Hemispheric Light.
- Center model bounding box at origin $(0, 0, 0)$ upon load, normalized to reference dimensions ($1.0$ unit shoulder width).

### 4.5 Hunyuan3D Strategy & Backend Architecture
- **Inference Reality:** Hunyuan3D-2.1 requires high VRAM GPU environment ($\ge 16\text{GB}$ VRAM, PyTorch, CUDA) and cannot run directly inside React Native client.
- **Backend Architecture:**
  - Python FastAPI service hosted in `backend/`.
  - Endpoint `POST /api/generate-3d`: Takes input image, executes Hunyuan3D mesh generation pipeline, exports compressed GLB file.
  - Returns URL to generated GLB file (`/outputs/<id>.glb`).
  - Mobile/Web client falls back seamlessly to pre-built GLB models if backend is unreachable or during MVP mode.

---

## 5. DEPENDENCY CHANGES & COMPATIBILITY ANALYSIS

### Required Packages to Install
1. `@mediapipe/tasks-vision` (WebAssembly Pose Landmarker for Web platform)

### Audit of Existing Dependencies
- `three` (`^0.186.1`): Installed and compatible.
- `react-native-web` (`~0.19.13`): Installed and compatible.
- `expo-camera` (`~16.0.0`): Installed; fallback for native devices, superseded by direct HTML5 stream on React Native Web for low latency.

---

## 6. DATA FLOW SPECIFICATION

```
1. Video Frame (HTML5 Video Element)
       │
       ▼
2. MediaPipe PoseLandmarker.detectForVideo(video, timestamp)
       │
       ▼
3. Raw Landmarks Array [x, y, z, visibility]
       │
       ▼
4. PoseProcessor (Compute shoulderCenter, shoulderWidth, torsoHeight, orientation)
       │
       ▼
5. PoseSmoother (OneEuroFilter applied to values)
       │
       ▼
6. CoordinateMapper (Normalized [0,1] space -> Three.js Scene Coordinates [X, Y, Z])
       │
       ▼
7. ClothingFitter (Calculate scale multiplier, rotation Euler angles, Z depth offset)
       │
       ▼
8. Three.js Scene Update (GarmentMesh.position, rotation, scale updated per frame)
       │
       ▼
9. WebGL Render Frame Output (Overlay on video canvas at 60 FPS)
```

---

## 7. TESTING & QUALITY GATE STRATEGY

### Unit & Integration Tests
- **PoseProcessor Tests:** Validate shoulder center calculation, shoulder width distance formulas, roll angle calculations.
- **OneEuroFilter Tests:** Test jitter reduction on noisy synthetic landmark sequences.
- **CoordinateMapper Tests:** Test edge cases (screen bounds, center origin, scaling factors).
- **GLB Model Loader Tests:** Verify mesh loading, error handling for corrupted assets, metadata application.

### Manual Verification Scenarios (Phase 17 Verification)
- **TEST A (Standing Straight):** Garment aligns perfectly with shoulders and torso.
- **TEST B/C (Horizontal Movement):** Garment follows body seamlessly across frame.
- **TEST D/E (Depth Movement):** Moving closer scales garment up; moving back scales garment down.
- **TEST F/G (Rotation):** Turning body rotates 3D mesh in sync with torso yaw/pitch.
- **TEST H (Arm Lift):** Garment stays anchored to torso without unnatural stretching.
- **TEST I (User Leaves Camera):** Garment hides gracefully when pose confidence drops below threshold.
- **TEST J (Permission Denied):** Clear user notification and option to re-grant permission.

---

## 8. RISKS & MITIGATION PLAN

| Risk | Impact | Mitigation Strategy |
|---|---|---|
| **Pose Jitter** | High | Implement One Euro Filter on landmark coordinates before computing transform matrices. |
| **Latency in Inference** | High | Run pose detection in non-blocking requestAnimationFrame loop; decouple render loop from inference loop. |
| **WebGL Context Loss** | Medium | Handle `webglcontextlost` events on canvas and gracefully recreate scene. |
| **3D Garment Misalignment** | High | Normalize all 3D GLB models to standard bounding box reference scales (shoulder width = 1.0 unit). |
| **Hunyuan3D Backend Unavailability** | Medium | Maintain curated library of offline GLB models in `assets/models/clothing/`. |

---

## 9. CONCLUSION & ARCHITECTURAL CONSISTENCY

The architecture is internally consistent, production-viable, and tailored to the existing Expo React Native Web stack. We are ready to proceed to **Phase 1 (Camera Implementation)** upon review.
