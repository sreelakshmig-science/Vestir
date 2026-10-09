# Vestir Backend

The backend API for **Vestir**, a clothing try-on application. It handles user authentication, dress management, favourites, Cloudinary image uploads, and proxying 3D garment generation to Hunyuan3D-2.

## Tech Stack

* **Node.js** — JavaScript runtime
* **Express.js** — REST API framework
* **MongoDB** — Database
* **Mongoose** — MongoDB object modeling
* **JWT** — Authentication
* **bcrypt** — Password hashing
* **Cloudinary** — Image storage
* **Multer** — Image upload handling
* **@gradio/client** — Interface for Hunyuan3D-2 Gradio server

## Features

* User signup and login with JWT authentication
* User profile retrieval
* Dress catalog creation, retrieval, updating, and deletion
* Favourite dress management
* High-res image uploads to Cloudinary
* Hunyuan3D-2 AI 3D garment generation proxy (`/api/hunyuan/generate`)
* Health check for Hunyuan3D server (`/api/hunyuan/status`)

## Prerequisites

* Node.js and npm
* MongoDB running locally or via Atlas
* A Cloudinary account for garment image uploads
* *(Optional)* Local Hunyuan3D-2 Gradio server running on `http://127.0.0.1:8080` (or configured via `HUNYUAN_URL`)

## Getting Started

### 1. Install dependencies

Open a terminal inside the `backend` folder and run:

```bash
npm install
```

### 2. Configure environment variables

Create a `.env` file in the `backend` folder:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Optional: override Hunyuan3D server URL (defaults to http://127.0.0.1:8080)
# HUNYUAN_URL=http://127.0.0.1:8080
```

Never commit your `.env` file to GitHub.

### 3. Start MongoDB

Make sure your local MongoDB server is running. The backend connects to:

```text
mongodb://127.0.0.1:27017/vestir
```

### 4. Start the server

For development:

```bash
npm run dev
```

Or start the server normally:

```bash
npm start
```

The server runs on:

```text
http://localhost:3000
```

## API Documentation

See [API.md](./API.md) for endpoint details, request formats, and example responses.

## Project Structure

```text
backend/
├── middleware/
│   └── authMiddleware.js
├── models/
│   ├── Dress.js
│   ├── Favourite.js
│   └── User.js
├── routes/
│   ├── dressRoutes.js
│   ├── favouriteRoutes.js
│   ├── hunyuanRoutes.js
│   ├── uploadRoutes.js
│   └── userRoutes.js
├── utils/
│   └── cloudinary.js
├── .env                 # Local secrets; do not commit
├── .gitignore
├── API.md               # API endpoint documentation
├── package.json
├── package-lock.json
└── server.js
```