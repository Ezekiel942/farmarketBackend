const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const dbURL = process.env.MONGO_URI;

const connectDB = async () => {
  try {
    await mongoose.connect(dbURL);
    console.log('MongoDB database is connected');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
