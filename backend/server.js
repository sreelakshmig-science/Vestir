// Vestir backend entry point.
// Loads env vars, sets up middleware, defines the health-check route,
// starts the Express server, then connects to MongoDB.

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// ---- Middleware ----
app.use(cors());          // allow the Vestir frontend (Expo / web) to call this API
app.use(express.json());  // parse JSON request bodies

// ---- Routes ----
// Health check: GET /api/health
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Vestir API is running',
  });
});

// ---- Start the server, then connect to MongoDB ----
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectDB();
});
