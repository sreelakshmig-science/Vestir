# Vestir Backend

The backend API for **Vestir**, a clothing try-on application. It handles user authentication, dress management, favourites, and image uploads.

## Tech Stack

* **Node.js** — JavaScript runtime
* **Express.js** — REST API framework
* **MongoDB** — Database
* **Mongoose** — MongoDB object modeling
* **JWT** — Authentication
* **bcrypt** — Password hashing
* **Cloudinary** — Image storage
* **Multer** — Image upload handling

## Features

* User signup and login
* JWT-based authentication
* User profile retrieval
* Dress creation, retrieval, updating, and deletion
* Favourite dress management
* Image uploads to Cloudinary
* MongoDB storage for user and dress data

## Prerequisites

Install the following before running the backend:

* Node.js and npm
* MongoDB
* A Cloudinary account for image uploads

## Getting Started

### 1. Install dependencies

Open a terminal inside the `backend` folder and run:

```bash
npm install
```

### 2. Configure environment variables

Create a `.env` file in the `backend` folder with your Cloudinary credentials:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Replace the placeholder values with your own Cloudinary credentials. Never commit your `.env` file to GitHub.

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
├── models/
├── routes/
├── utils/
├── .env                 # Local secrets; do not commit
├── .gitignore
├── API.md               # API endpoint documentation
├── package.json
├── package-lock.json
└── server.js
```

## Notes

* MongoDB stores application data.
* Cloudinary stores uploaded images, while their secure URLs are saved in MongoDB.
* Keep credentials private and ensure `.env` is excluded from version control.