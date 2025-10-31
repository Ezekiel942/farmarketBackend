// src/index.js
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const app = require('./app'); // import the app (express instance)

// Load env vars
dotenv.config();

// Connect to DB then start server
(async () => {
  await connectDB();

  const PORT = process.env.PORT || 5000;
  const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });

  // Graceful shutdown handlers
  const shutdown = async (signal) => {
    console.log(`Received ${signal}. Closing server...`);
    server.close(async (err) => {
      if (err) {
        console.error('Error closing server:', err);
        process.exit(1);
      }
      try {
        const mongoose = require('mongoose');
        await mongoose.connection.close(false);
        console.log('MongoDB connection closed.');
      } catch (e) {
        // ignore
      }
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
})();
