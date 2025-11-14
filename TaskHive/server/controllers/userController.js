// Import required packages and utilities
import ErrorHandler from "../middlewares/error.js"; // Custom error handling class
import { catchAsyncError } from "../middlewares/catchAsyncError.js"; // Wrapper for async functions
import { User } from "../models/userModels.js"; // User database model
import { sendEmail } from "../utils/sendEmail.js"; // Email sending utility
import twilio from "twilio"; // SMS service for phone verification
import mongoose from "mongoose"; // MongoDB database operations
import { sendToken } from "../utils/sendToken..js"; // JWT token utility for login
import crypto from "crypto"; // For secure token generation
// Function to register a new user account
export const register = catchAsyncError(async (req, res, next) => {
  try {
    // Get user input data from the request body
    const { name, email, password, phone, verificationMethod } = req.body;

    // Check if all required fields are provided
    if (!name || !email || !password || !phone || !verificationMethod) {
      return next(new ErrorHandler("All fields are required", 400));
    }

    // Function to check if phone number is valid UAE format
    function validatePhoneNumber(phone) {
      // Remove spaces and dashes from phone number
      const normalized = phone.replace(/\s|-/g, "");
      const uaeIntl = /^\+9715\d{8}$/; // International format: +971501234567
      const uaeLocal = /^05\d{8}$/; // Local format: 0501234567
      // Check if phone matches either format
      return uaeIntl.test(normalized) || uaeLocal.test(normalized);
    }

    // If phone number is invalid, send error
    if (!validatePhoneNumber(phone)) {
      return next(
        new ErrorHandler("Invalid phone number format for UAE.", 400)
      );
    }

    // Check if a verified user already exists with this email or phone
    const existingUser = await User.findOne({
      $or: [
        {
          email, // Check for same email
          accountVerified: true, // But only if account is verified
        },
        {
          phone, // Check for same phone
          accountVerified: true, // But only if account is verified
        },
      ],
    });

    // If verified user already exists, send error
    if (existingUser) {
      return next(
        new ErrorHandler(
          "User already exists with this email or phone number.",
          400
        )
      );
    }

    // Check how many unverified registration attempts exist with this email/phone
    const registrationAttemptByUser = await User.find({
      $or: [
        { phone, accountVerified: false }, // Unverified accounts with same phone
        { email, accountVerified: false }, // Unverified accounts with same email
      ],
    });
    // Prevent spam by limiting registration attempts
    if (registrationAttemptByUser.length > 3) {
      return next(
        new ErrorHandler(
          "Maximum registration attempts exceeded. Please try again later.",
          400
        )
      );
    }

    // Package user data for database
    const userData = { name, email, password, phone };

    // Create new user in database
    const user = await User.create(userData);

    // Generate a random verification code for this user
    const verificationCode = await user.generateVerificationCode();

    // Save the verification code to the user's record
    await user.save();
    // Send the verification code via SMS or email
    await sendVerificationCode(
      verificationMethod, // "sms" or "email"
      phone, // User's phone number
      email, // User's email address
      name, // User's name
      verificationCode, // The code to send
      res // Response object to send back to client
    );
  } catch (error) {
    // If any error occurs, pass it to error handling middleware
    next(error);
  }
});

// Helper function to send verification code via SMS or email
async function sendVerificationCode(
  verificationMethod, // Either "email" or "phone"
  phone, // User's phone number
  email, // User's email address
  name, // User's name
  verificationCode, // The code to send
  res // Response object to send back to client
) {
  try {
    // If user chose email verification
    if (verificationMethod === "email") {
      // Create HTML email template with the code
      const message = generateEmailTemplate(verificationCode);
      // Send the email
      sendEmail({ email, subject: "Verification Code", message });
      // Tell client email was sent successfully
      res.status(200).json({
        success: true,
        message: `Verification code sent to ${email} successfully.`,
      });
      // If user chose phone/SMS verification
    } else if (verificationMethod === "phone") {
      // Add spaces between digits for better readability (not used currently)
      const verificationCodeWithSpaces = verificationCode
        .toString()
        .split("")
        .join(" ");

      // Convert phone to international format if needed
      const toNumber = phone.startsWith("+")
        ? phone // Already has country code
        : phone.replace(/^0/, "+971"); // Add UAE country code (+971)

      // Create Twilio client with credentials from environment
      const client = twilio(
        process.env.TWILIO_SID, // Twilio account SID
        process.env.TWILIO_AUTH_TOKEN // Twilio auth token
      );
      // Send SMS with verification code
      await client.messages.create({
        body: `Your verification code is ${verificationCode}. Do not share this code with anyone.`,
        from: process.env.TWILIO_PHONE_NUMBER, // Your Twilio phone number
        to: toNumber, // User's phone number
      });

      // Tell client SMS was sent successfully
      res.status(200).json({
        success: true,
        message: `OTP SENT.`,
      });
    } else {
      // If verification method is neither email nor phone, send error
      return res.status(500).json({
        success: false,
        message: "Invalid verification method.",
      });
    }
  } catch (error) {
    // Log the error for debugging
    console.error(
      "Twilio verification code send failed:",
      error?.message || error
    );
    // Send error response to client
    return res.status(500).json({
      success: false,
      message: "Failed to send verification code. Please try again.",
    });
  }
}

// Function to create HTML email template for verification codes
function generateEmailTemplate(verificationCode) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
      <h2 style="color: #4CAF50; text-align: center;">Verification Code</h2>
      <p style="font-size: 16px; color: #333;">Dear User,</p>
      <p style="font-size: 16px; color: #333;">Your verification code is:</p>
      <div style="text-align: center; margin: 20px 0;">
        <span style="display: inline-block; font-size: 24px; font-weight: bold; color: #000; padding: 10px 20px; border: 1px solid #dc3545; border-radius: 5px; background-color: #dc3545;">
          ${verificationCode}
        </span>
      </div>
      <p style="font-size: 16px; color: #333;">Please use this code to verify your email address. The code will expire in 10 minutes.</p>
      <p style="font-size: 16px; color: #333;">If you did not request this, please ignore this email.</p>
      <footer style="margin-top: 20px; text-align: center; font-size: 14px; color: #999;">
        <p>Thank you,<br>Your Company Team</p>
        <p style="font-size: 12px; color: #aaa;">This is an automated message. Please do not reply to this email.</p>
      </footer>
    </div>
  `; // Return the complete HTML template with the verification code
}

// Function to verify the OTP code entered by user
export const verifyOtp = catchAsyncError(async (req, res, next) => {
  // Get user input from request
  const { email, otp, phone } = req.body;

  // Function to check if phone number is valid UAE format (same as in register)
  function validatePhoneNumber(phone) {
    // Remove spaces and dashes from phone number
    const normalized = phone.replace(/\s|-/g, "");
    const uaeIntl = /^\+9715\d{8}$/; // International format: +971501234567
    const uaeLocal = /^05\d{8}$/; // Local format: 0501234567
    // Check if phone matches either format
    return uaeIntl.test(normalized) || uaeLocal.test(normalized);
  }

  // If phone number is invalid, send error
  if (!validatePhoneNumber(phone)) {
    return next(new ErrorHandler("Invalid phone number format for UAE.", 400));
  }

  try {
    // Find all unverified user accounts with this email or phone
    // Sort by newest first (createdAt: -1)
    const userAllEntries = await User.find({
      $or: [
        { email, accountVerified: false }, // Unverified accounts with same email
        { phone, accountVerified: false }, // Unverified accounts with same phone
      ],
    }).sort({ createdAt: -1 });

    // If no unverified user found, send error
    if (!userAllEntries || userAllEntries.length === 0) {
      return next(new ErrorHandler("User not found.", 404));
    }

    let user;

    // If multiple unverified accounts exist with same email/phone
    if (userAllEntries.length > 1) {
      // Keep the newest account (first in sorted array)
      user = userAllEntries[0];

      // Delete all older duplicate unverified accounts
      await User.deleteMany({
        _id: { $ne: user._id }, // Don't delete the newest one
        $or: [
          { email, accountVerified: false }, // Delete older unverified with same email
          { phone, accountVerified: false }, // Delete older unverified with same phone
        ],
      });
    } else {
      // Only one unverified account found
      user = userAllEntries[0];
    }

    // Check if the entered OTP matches the stored verification code
    if (user.verificationCode !== Number(otp)) {
      return next(new ErrorHandler("Invalid verification code.", 400));
    }

    // Check if the verification code has expired
    const currentTime = Date.now(); // Current time in milliseconds
    const verificationCodeExpire = new Date( // Convert expiry time to milliseconds
      user.verificationCodeExpire
    ).getTime();
    console.log(currentTime); // Debug: log current time
    console.log(verificationCodeExpire); // Debug: log expiry time

    // If current time is past expiry time, code has expired
    if (currentTime > verificationCodeExpire) {
      return next(new ErrorHandler("Verification code has expired.", 400));
    }

    // Mark user as verified and clear verification data
    user.accountVerified = true; // User is now verified
    user.verificationCode = null; // Clear the verification code
    user.verificationCodeExpire = null; // Clear the expiry time

    // Save changes to database (only validate modified fields)
    await user.save({ validateModifiedOnly: true });

    // Send JWT token and success message to client
    sendToken(user, 200, "Account verified successfully", res);
  } catch (error) {
    // If any error occurs, send generic server error
    return next(new ErrorHandler("Internal Server Error", 500));
  }
});

// Function to log in an existing verified user
export const login = catchAsyncError(async (req, res, next) => {
  // Get email and password from request body
  const { email, password } = req.body;

  // Check if both email and password are provided
  if (!email || !password) {
    return next(new ErrorHandler("All fields are required", 400));
  }

  // Find verified user with this email and include password field
  // (password is excluded by default in the model)
  const user = await User.findOne({ email, accountVerified: true }).select(
    "+password"
  );
  // If no verified user found with this email
  if (!user) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }

  // Compare entered password with stored hashed password
  const isPasswordMatched = await user.comparePassword(password);

  // If passwords don't match
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }
  // Send JWT token and success message to client
  sendToken(user, 200, `User logged in successfully.`, res);
});

// Function to log out a user by clearing their JWT token
export const logout = catchAsyncError(async (req, res, next) => {
  res
    .status(200)
    .cookie("token", "", {
      // Clear the token cookie
      expires: new Date(Date.now()), // Set expiry to now (immediately expires)
      httpOnly: true, // Cookie can only be accessed by server
    })
    .json({
      success: true,
      message: "Logged out successfully",
    });
});

// Function to get current user's information (requires authentication)
export const getUser = catchAsyncError(async (req, res, next) => {
  // req.user is set by authentication middleware
  const user = req.user;

  // Send user data back to client
  res.status(200).json({
    success: true,
    user,
  });
});

// Function to send password reset email to user
export const forgotPassword = catchAsyncError(async (req, res, next) => {
  // Find verified user with the provided email
  const user = await User.findOne({
    email: req.body.email,
    accountVerified: true, // Only allow password reset for verified users
  });
  // If no verified user found with this email
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }
  // Generate a secure reset token for this user
  const resetToken = user.generateResetPasswordToken();

  // Save the reset token to user's record (skip validation to avoid password requirements)
  await user.save({ validateBeforeSave: false });

  // Create password reset URL with the token
  const resetPasswordUrl = `${process.env.FRONTEND_URL}/password/reset/${resetToken}`;

  // Create HTML email template for password reset
  const message = `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>Password Reset Request</h2>
      <p>Click the button below to reset your password:</p>
      <a href="${resetPasswordUrl}" style="display: inline-block; padding: 10px 20px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">
        Reset Password 
      </a>
      ${resetPasswordUrl}
      <p>If you didn't request this, please ignore this email.</p>
    </div>
  `;

  try {
    // Send password reset email
    sendEmail({
      email: user.email,
      subject: `Ecommerce Password Recovery`,
      message,
    });

    // Tell client email was sent successfully
    res.status(200).json({
      success: true,
      message: `Email sent to ${user.email} successfully`,
    });
  } catch (error) {
    // If email sending fails, clear the reset token from user record
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    // Send error to client
    return next(
      new ErrorHandler(
        error.message ? error.message : "Cannot send reset password token",
        500
      )
    );
  }
});

// Function to reset user's password using the reset token
export const resetPassword = catchAsyncError(async (req, res, next) => {
  // Hash the token from URL params to match stored token
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  console.log("Attempting to find user with token:", resetPasswordToken);

  // Find user with matching reset token that hasn't expired
  const user = await User.findOne({
    resetPasswordToken, // Token must match
    resetPasswordExpire: { $gt: Date.now() }, // Token must not be expired
  });

  // If no user found or token expired
  if (!user) {
    return next(new ErrorHandler("Reset token is invalid or has expired", 400));
  }

  // Check if both password and confirmation are provided
  if (!req.body.password || !req.body.confirmPassword) {
    return next(
      new ErrorHandler("Please provide new password and confirmation", 400)
    );
  }

  // Check if password and confirmation match
  if (req.body.password !== req.body.confirmPassword) {
    return next(new ErrorHandler("Passwords do not match", 400));
  }

  // Update user's password and clear reset token data
  user.password = req.body.password; // New password (will be hashed by pre-save middleware)
  user.resetPasswordToken = undefined; // Clear reset token
  user.resetPasswordExpire = undefined; // Clear reset expiry

  // Save changes to database
  await user.save();

  // Send JWT token and success message to client
  sendToken(user, 200, "Password reset successfully", res);
});

/*This is the largest file with all the main functionality:

User registration with OTP verification
Login/logout
Password reset
Email/SMS sending logic
*/
