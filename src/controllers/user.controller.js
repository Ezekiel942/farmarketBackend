const mongoose = require('mongoose');
const User = require("../models/user.schema");



exports.getMe = async(req, res) => {
  return res
  .status(200)
  .json({ user: req.user });
};


// List all users (admin only)
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json({
      message: 'All users retrieved successfully',
      data: users
  });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Fetch a single user
exports.getUser = async (req, res) => {
  const userId = req.params.id;
  if (!userId) {
    return res
    .status(400)
    .json({ message: 'User id not provided' });
  };

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res
    .status(400)
    .json({ message: 'Invalid user id' });
  }
  try {
    const user = await User.findById(userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    return res
    .status(200)
    .json({ data: user });

    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  const userId = req.params.id;
  const { firstName, lastName, email, password, phone, farmName, farmLocation } = req.body;

  if (!userId) {
    return res
    .status(400)
    .json({ message: 'User id not provided' });
  };

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res
    .status(400)
    .json({ message: 'Invalid user id' });
  }
  try {
  
    const user = await User.findById(userId).select('+password');

    if (!user) return res.status(404).json({ message: "User not found" });
    if (firstName) { user.firstName = firstName };
    if (lastName) { user.lastName = lastName };
    if (email) { user.email = email };
    if (phone) { user.phone = phone };
    if (farmName) { user.farmName = farmName };
    if (farmLocation) { user.farmLocation = farmLocation};
    if (password) { user.password = password };
    

    await user.save();
    const userData = await User.findById(userId).select('-password');
    return res
    .status(200)
    .json({
      message: "User updated successfully",
      data: userData
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};


// Delete user
exports.deleteUser = async (req, res) => {
  const userId = req.params.id;
  if (!userId) {
    return res
    .status(400)
    .json({ message: 'User id not provided' });
  };

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res
    .status(400)
    .json({ message: 'Invalid user id' });
  }
  try {
    const user = await User.findByIdAndDelete(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    return res
    .status(200)
    .json({
      message: "User deleted successfully",
      data: user
    });
  } catch (err) {
    console.error(err);
    if (err && err.code == 11000) {
      return res
      .status(409
      .json({
        message: 'User already exists'
      })
      )
    }
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};


// Set role
exports.setUserRole = async (req, res) => {
  const userId = req.params.id;
  const { role } = req.body;
  
  if (!userId) {
    return res
    .status(400)
    .json({ message: 'User id not provided' });
  };

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res
    .status(400)
    .json({ message: 'Invalid user id' });
  }

  if (!["buyer", "farmer"].includes(role)) {
    return res.status(400).json({ message: "Incorrect role: You can either be a Farmer or a Buyer" });
  }
  
  try {
    
    const user = await User.findById(userId).select('-password');
    if (!user) return res.status(404).json({ message: "User not found" });

    user.role = role;
    await user.save();

    return res.json({
      message: "Role updated successfully",
      data: user
    });
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};
