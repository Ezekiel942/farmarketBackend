const mongoose = require("mongoose");
const app = require("./app");
require("dotenv").config(); // load .env

// Load variables
const PORT = process.env.PORT || 3000;
const MONGO_URI =
  process.env.NODE_ENV === "test"
    ? process.env.MONGO_TEST_URI
    : process.env.MONGO_URI;

// Connect to MongoDB
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");

    app.listen(PORT, () => {
      console.log(`Server running on ${process.env.BASE_URL}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });
