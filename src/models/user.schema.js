const mongoose = require("mongoose");
const bcrypt = require('bcrypt');

const saltRounds = 11;

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['buyer', 'farmer', 'admin'],
      default: 'buyer'
    },
    farmName: {
      type: String,
      trim: true
    },
    farmLocation: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    profileImage: [{
      url: { type: String},
      publicId: {type: String}
    }],
    isVerified: {
      type: Boolean,
      default: false
    }
  }, {
    timestamps: true,
    versionKey: false
  }
);


userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  };
  try {
    const hashPassword = await bcrypt.hash(this.password, saltRounds);
    this.password = hashPassword;
    return next();
  } catch(error) {
    return next(error);
  }
});


userSchema.methods.comparePassword = function(password) {
  return bcrypt.compare(password, this.password);
}



module.exports = mongoose.model("User", userSchema);
