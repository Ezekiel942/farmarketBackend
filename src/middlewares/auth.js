const User = require("../models/user.schema");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

exports.isAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
      .status(401)
      .json({
        message: "Not authorized, token missing"
      });
    }
    const token = authHeader.split(" ")[1];
    let decoded;
    
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      //console.error(error);
      return res
      .status(401)
      .json({
        message: 'Invalid or expired token'
      });
    };
    
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res
      .status(401)
      .json({ message: 'User not found '});
    }

    req.user = user;
    return next();
  } catch (err) {
    console.error(err);
    return res
    .status(500)
    .json({ message: "Internal Server Error" });
  }
};


exports.isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied, admin only" });
  }
  next();
};
