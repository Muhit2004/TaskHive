// Import required packages
import mongoose from "mongoose"; // MongoDB object modeling
import bcrypt from "bcrypt"; // Password hashing/encryption
import jwt from "jsonwebtoken"; // Create JWT tokens for authentication
import crypto from "crypto"; // Generate secure random tokens

// Define the structure of user data in the database
const userSchema = mongoose.Schema({
  name: String, // User's full name
  email: String, // User's email address
  password: {
    type: String, // Password field
    minLength: [8, "Password should be greater than 8 characters."], // Minimum length validation
    maxLength: [32, "Password cannot have more than 32 characters."], // Maximum length validation
    select: false, // Don't return password in queries (security)
  },
  phone: String, // User's phone number
  accountVerified: { type: Boolean, default: false }, // Is account verified? Default: No
  verificationCode: Number, // 5-digit OTP code
  verificationCodeExpire: Date, // When the OTP expires
  resetPasswordToken: String, // Hashed password reset token
  resetPasswordExpire: Date, // When reset token expires
  createdAt: { type: Date, default: Date.now }, // Account creation timestamp
});

// Automatically hash password before saving to database
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next(); // If password wasn't changed, skip hashing
  }
  this.password = await bcrypt.hash(this.password, 10); // Hash password with salt rounds 10
});

// Compare entered password with hashed password for login
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password); // Returns true if passwords match
};

// Generate 5-digit verification code for email/SMS verification
userSchema.methods.generateVerificationCode = function () {
  function generateRandomFiveDigitNumber() {
    const firstDigit = Math.floor(Math.random() * 9) + 1; // First digit 1-9 (no leading zero)
    const remainingDigits = Math.floor(Math.random() * 10000) // Generate 4 more digits
      .toString()
      .padStart(4, 0); // Pad with zeros if needed

    return parseInt(firstDigit + remainingDigits); // Combine to make 5-digit number
  }

  const verificationCode = generateRandomFiveDigitNumber();

  this.verificationCode = verificationCode; // Save code to user document
  this.verificationCodeExpire = Date.now() + 10 * 60 * 1000; // Code expires in 10 minutes

  return verificationCode; // Return code to send via email/SMS
};

// Generate JWT token for user authentication (login/registration)
userSchema.methods.generateToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET_KEY, {
    // Create token with user ID
    expiresIn: process.env.JWT_EXPIRE, // Token expires after configured time (e.g., 7 days)
  });
};

// Generate secure token for password reset functionality
userSchema.methods.generateResetPasswordToken = function () {
  // Generate random token (this goes in email to user)
  const resetToken = crypto.randomBytes(32).toString("hex");

  // Hash token and store in database (for security)
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Set token expire time (10 minutes)
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return resetToken; // Return original token to send in email
};

// Create User model from schema - this creates the "users" collection in MongoDB
export const User = mongoose.model("User", userSchema);
