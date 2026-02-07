import express from "express";
import {
  checkAuth,
  login,
  logout,
  signup,
  updateProfile,
  addRequest,
  searchProfile,
  getUserById,
  addUser,
  getAllAddRequest,
  addToMyBlockedList,
  removeFromMyBlockedList,
  checkIfUserBlocked,
  changePassword,
  sendOtp,
  verifyOtp            // <-- include this line!
} from "../controllers/auth.controller.js";

import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// Auth flow
router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.put("/update-profile", protectRoute, updateProfile);
router.get("/check", protectRoute, checkAuth);
router.patch("/changePassword", changePassword);          // No protectRoute for password reset (OTP flow)
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);                    // <-- new OTP verify route

// Search and contact requests
router.get("/searchProfile", protectRoute, searchProfile);
router.post("/addRequest/:_id", protectRoute, addRequest);
router.get("/getUserById/:id", protectRoute, getUserById);
router.post("/addUser/:userId", protectRoute, addUser);
router.get("/getAllAddRequest", protectRoute, getAllAddRequest);

// Blocked list routes
router.post("/block/:userId", protectRoute, addToMyBlockedList);
router.delete("/unblock/:userId", protectRoute, removeFromMyBlockedList);
router.get("/block/check", protectRoute, checkIfUserBlocked);

export default router;
