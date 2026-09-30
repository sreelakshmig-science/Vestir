// MongoDB connection using Mongoose.
// Reads MONGODB_URI from backend/.env (loaded by dotenv in server.js).

const dns = require('dns');

// The network's DNS server (10.15.148.155) refuses the raw DNS queries sent by
// Node's c-ares resolver (querySrv/queryA ECONNREFUSED), which breaks the SRV
// lookup required by mongodb+srv:// URIs. The Windows resolver and public DNS
// answer the same queries fine, so point Node's resolver at public DNS.
// This only affects this process; the URI/credentials are unchanged.
dns.setServers(['1.1.1.1', '8.8.8.8']);

const mongoose = require('mongoose');

const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    console.error('MongoDB connection failed: MONGODB_URI is missing. Add it to backend/.env');
    return;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    // Server keeps running so the API (health check) still responds without a DB.
  }
};

module.exports = connectDB;
