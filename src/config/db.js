const mongoose = require('mongoose');
const dotenv = require('dotenv');


dotenv.config();

const dbURL = process.env.MONGO_URL
const connectDB = async () => {
    await mongoose.connect(dbURL)
    .then(() => {
        console.log('MongoDB database is connected')
    })
    .catch((error) => {
        console.log('Error connecting to MongoDB database', error)
        process.exit(1)
    })
};


module.exports = connectDB;