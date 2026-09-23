const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root health & status endpoint
app.get('/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  res.json({
    status: dbState === 1 ? 'healthy' : 'degraded',
    server: 'running',
    port: PORT,
    database: {
      status: dbStatusMap[dbState] || 'unknown',
      host: mongoose.connection.host || null,
      name: mongoose.connection.name || null
    },
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Import the API router, which mounts every available route module.
const apiRoutes = require('./routes');

// Use routes
app.use('/api', apiRoutes);

// 404 handler. Omitting a path keeps this compatible with Express 5.
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

let server;

const startServer = async () => {
  try {
    await connectDB();
    server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Health check available at http://localhost:${PORT}/health`);
      console.log(`API Base URL at http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error(`Server startup halted due to MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  if (server) server.close();
  await mongoose.disconnect();
  process.exit(0);
});

startServer();

