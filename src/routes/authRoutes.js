const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");

// Signup
router.post("/signup", authController.signup);

// Login
router.post("/login", authController.login);

// Get current user
router.get("/me", authController.protect, authController.getMe);

module.exports = router;
