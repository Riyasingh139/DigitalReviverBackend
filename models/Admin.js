const mongoose = require("mongoose");


const Admin = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "Username is required"], // Custom error message
    unique: true,
    trim: true, //  Removes extra spaces
    sparse: true, //  This allows multiple documents with `null` username
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
});

//  Prevent saving without a username
Admin.pre("save", function (next) {
  if (!this.username) {
    next(new Error("Username cannot be empty"));
  } else {
    next();
  }
});

module.exports = mongoose.model("Admin", Admin);
