const User = require("../models/user.schema");
const jwt = require("jsonwebtoken");

//const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES = process.env.JWT_EXPIRES || '1h';

const jwtSecret = () => {
  return process.env.JWT_SECRET;
};


const generateToken = (id, role) => {
  //const JWT_SECRET = process.env.JWT_SECRET;
  return jwt.sign({ id, role }, jwtSecret(), { expiresIn: JWT_EXPIRES });
};



exports.signup = async (req, res) => {
  const { firstName, lastName, email, password, confirmPassword } = req.body;
  if (!firstName) { return res.status(400).json({ message: 'firstName is required' })};
  if (!lastName) { return res.status(400).json({ message: 'lastName is required' })};
  if (!email) { return res.status(400).json({ message: 'email is required' })};
  if (!password) { return res.status(400).json({ message: 'password is required' })};
  if (password.length < 6) { return res.status(400).json({ message: ''})};
  if (password !== confirmPassword) { return res.status(400).json({ message: 'passwords do not match' })};
  try {
    
    const normalizedEmail = String(email).trim().toLowerCase()
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const user = new User({
      firstName,
      lastName,
      email: normalizedEmail,
      password
    });
    
    await user.save();
    const token = generateToken(user._id, user.role);

    const userData = await User.findById(user._id).select('-password');
    return res
    .status(201)
    .json({ 
      message: 'User successfully created',
      token,
      user: userData
      });
  } catch (error) {
    console.error(error)
    if (error && error.code == 11000) {
      return res
      .status(409)
      .json({
        message: 'User already exists'
      });
    };
    return res
    .status(500)
    .json({ message: 'Internal Server Error' });
  }
};



exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email) { return res.status(400).json({ message: 'Email is required' })};
  if (!password) { return res.status(400).json({ message: 'Password is required' })};

  try {

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) return res.status(400).json({ message: "Invalid email/password" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email/password" });

    const token = generateToken(user._id, user.role);
    const userData = await User.findById(user._id).select('-password');
    return res
    .status(200)
    .json({ 
      message: 'User logged in succesfully',
      token, 
      user: userData
     });
  } catch (error) {
    console.error(error)
    return res
    .status(500)
    .json({ message: 'Internal Server Error' });
  }
};


