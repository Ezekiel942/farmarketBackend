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
const upload = require('../middlewares/multer');

const router = express.Router();

router.get("/", isAuth, isAdmin, getUsers);
router.get("/me", isAuth, getMe);
router.patch("/me/profile/image", isAuth, upload.single('profileImage'), updateProfileImage);
router.get("/:id", isAuth, getUser);
router.put("/:id", isAuth, updateUser);
router.delete("/:id", isAuth, deleteUser);
router.patch("/:id/role", isAuth, isAdmin, setUserRole);

module.exports = router;
