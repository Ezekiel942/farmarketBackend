const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const dbURL = process.env.MONGO_URI;

const connectDB = async () => {
  try {
    // Added options for latest Mongoose versions
    await mongoose.connect(dbURL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB database is connected');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);

    // Don't exit immediately in dev, let nodemon log
    if (process.env.NODE_ENV === 'production') {
      process.exit(1); // exit only in production
    }
  }
};

// Optional: log Mongoose connection events
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected!');
});

module.exports = connectDB;
