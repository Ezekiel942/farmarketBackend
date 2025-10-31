const dotenv = require('dotenv');
const app = require('./app');
const connectDB = require('./config/db');

// Load environment variables from .env
dotenv.config();

// Set the port from .env or default to 5000
const port = process.env.PORT || 5000;

// Connect to MongoDB and start the server
connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error('Failed to connect to MongoDB:', error.message);
    process.exit(1);
  });
