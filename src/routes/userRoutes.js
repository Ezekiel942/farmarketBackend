const express = require("express");
const {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  setUserRole,
} = require("../controllers/user.controller");

const { isAuth, isAdmin } = require("../middleware/isAuth");

const router = express.Router();

router.get("/", isAuth, isAdmin, getUsers);
router.get("/:id", isAuth, getUser);
router.put("/:id", isAuth, updateUser);
router.delete("/:id", isAuth, isAdmin, deleteUser);
router.patch("/:id/role", isAuth, isAdmin, setUserRole);

module.exports = router;
