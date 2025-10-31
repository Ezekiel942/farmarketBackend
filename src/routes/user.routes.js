const express = require("express");
const {
  getMe,
  getUsers,
  getUser,
  updateUser,
  updateProfileImage,
  deleteUser,
  setUserRole,
} = require("../controllers/user.controller");

const { isAuth, isAdmin } = require("../middlewares/auth");
const upload = require("../middlewares/multer");

const router = express.Router();

// Get all users (admin only)
router.get("/", isAuth, isAdmin, getUsers);
// This is CORRECT:

// Get logged-in user's info
router.get("/me", isAuth, getMe);

// Update profile image
router.patch("/me/profile/image", isAuth, upload.single("profileImage"), updateProfileImage);

// Get, update, or delete a specific user
router.get("/:id", isAuth, getUser);
router.put("/:id", isAuth, updateUser);
router.delete("/:id", isAuth, deleteUser);

// Set user role (admin only)
router.patch("/:id/role", isAuth, isAdmin, setUserRole);

module.exports = router;
