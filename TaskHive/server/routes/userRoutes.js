import express from "express";
import {
  register,
  verifyOtp,
  login,
  logout,
  getUser,
  forgotPassword,
  resetPassword,
} from "../controllers/userController.js";
import { isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

router.post("/register", register);

router.post("/otp-verification", verifyOtp);
router.post("/login", login);
router.get("/logout", isAuthenticated, logout);
router.get("/me", isAuthenticated, getUser);

router.post("/password/forgot", forgotPassword);

router.put("/password/reset/:token", resetPassword);

export default router;

/*1. POST /register → Create account
2. POST /otp-verification → Verify account  
3. POST /login → Get JWT token
4. GET /me → Access protected content (with token)
5. POST /logout → End session*/
