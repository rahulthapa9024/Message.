import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";
import mongoose from "mongoose";
import nodemailer from "nodemailer";

// ===== In-memory OTP store (For production, use Redis/DB) =====
const otpStore = new Map();

const isValidPassword = (pw) => typeof pw === "string" && pw.length >= 6;

// ===== Signup =====
export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (!isValidPassword(password)) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }
    if (await User.findOne({ email })) {
      return res.status(400).json({ message: "Email already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt(10));
    const user = new User({ fullName, email, password: hashedPassword });
    generateToken(user._id, res);
    await user.save();
    res.status(201).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ===== Login =====
export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    generateToken(user._id, res);
    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
    });
  } catch {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ===== Logout =====
export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ===== Update Profile =====
export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body;
    const userId = req.user._id;
    if (!profilePic) {
      return res.status(400).json({ message: "Profile pic is required" });
    }
    const uploadResponse = await cloudinary.uploader.upload(profilePic);
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: uploadResponse.secure_url },
      { new: true }
    );
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// ===== Check Auth =====
export const checkAuth = (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ===== Search Profile =====
export const searchProfile = async (req, res) => {
  try {
    const { _id } = req.query;
    if (!_id) return res.status(400).json({ message: "User ID is required" });
    if (req.user._id.toString() === _id) {
      return res.status(400).json({ message: "Cannot search the same user" });
    }
    const me = await User.findById(req.user._id);
    const user = await User.findById(_id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    const isContact = me.contact?.includes(_id);
    const isInAddRequesting = me.addRequesting?.includes(_id);
    const isInYouRequested = me.youRequseted?.includes(_id);
    let canSendRequest = !(isContact || isInAddRequesting || isInYouRequested);
    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
      canSendRequest,
      status: canSendRequest
        ? "Can send add request"
        : "Cannot send add request - already exists in contacts or requests",
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ===== Add Contact Request =====
export const addRequest = async (req, res) => {
  try {
    const { _id: targetUserId } = req.params;
    const currentUserId = req.user._id;
    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({ message: "Invalid target user ID" });
    }
    if (currentUserId.toString() === targetUserId) {
      return res.status(400).json({ message: "You cannot send request to yourself" });
    }
    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(targetUserId);
    if (!currentUser || !targetUser)
      return res.status(404).json({ message: "User not found" });
    if (currentUser.contact && currentUser.contact.includes(targetUserId)) {
      return res.status(400).json({ message: "User already in contacts" });
    }
    if (targetUser.contactRequest && targetUser.contactRequest.includes(currentUserId.toString())) {
      return res.status(400).json({ message: "Request already sent" });
    }
    await User.findByIdAndUpdate(targetUserId, {
      $addToSet: { contactRequest: currentUserId, addRequesting: currentUserId },
    });
    await User.findByIdAndUpdate(currentUserId, {
      $addToSet: { youRequseted: targetUserId },
    });
    return res.status(200).json({ message: "Contact request sent successfully" });
  } catch {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// ===== Get User By ID =====
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid User ID" });
    }
    const user = await User.findById(id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ===== Add User to Contacts =====
export const addUser = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID to add" });
    }
    if (currentUserId.toString() === userId) {
      return res.status(400).json({ message: "You cannot add yourself" });
    }
    const currentUser = await User.findById(currentUserId);
    const userToAdd = await User.findById(userId);
    if (!currentUser || !userToAdd)
      return res.status(404).json({ message: "User not found" });
    if (!currentUser.addRequesting.includes(userId)) {
      return res.status(400).json({ message: "No pending request from this user" });
    }
    currentUser.contact = currentUser.contact || [];
    userToAdd.contact = userToAdd.contact || [];
    if (!currentUser.contact.includes(userId)) {
      currentUser.contact.push(userId);
    }
    if (!userToAdd.contact.includes(currentUserId.toString())) {
      userToAdd.contact.push(currentUserId.toString());
    }
    currentUser.addRequesting = currentUser.addRequesting.filter(id => id.toString() !== userId);
    currentUser.youRequseted = currentUser.youRequseted.filter(id => id.toString() !== userId);
    userToAdd.youRequseted = userToAdd.youRequseted.filter(id => id.toString() !== currentUserId.toString());
    await currentUser.save();
    await userToAdd.save();
    return res.status(200).json({ message: "User added to contacts successfully" });
  } catch {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// ===== Get All Add Requests =====
export const getAllAddRequest = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const currentUser = await User.findById(currentUserId).select("addRequesting");
    if (!currentUser) return res.status(404).json({ message: "User not found" });
    if (!currentUser.addRequesting || currentUser.addRequesting.length === 0) {
      return res.status(200).json([]);
    }
    const requests = await User.find({ _id: { $in: currentUser.addRequesting } }).select("_id email fullName profilePic");
    return res.status(200).json(requests);
  } catch {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// ===== Add to Blocked List =====
export const addToMyBlockedList = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    if (currentUserId.toString() === userId) {
      return res.status(400).json({ message: "You cannot block yourself" });
    }
    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(userId);
    if (!targetUser) return res.status(404).json({ message: "User not found" });
    if (currentUser.myblockedList.includes(userId)) {
      return res.status(400).json({ message: "User already blocked" });
    }
    currentUser.myblockedList.push(userId);
    await currentUser.save();
    res.status(200).json({ message: "User added to blocked list successfully" });
  } catch {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ===== Remove from Blocked List =====
export const removeFromMyBlockedList = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    const currentUser = await User.findById(currentUserId);
    if (!currentUser.myblockedList.includes(userId)) {
      return res.status(400).json({ message: "User not in blocked list" });
    }
    currentUser.myblockedList = currentUser.myblockedList.filter((id) => id.toString() !== userId);
    await currentUser.save();
    res.status(200).json({ message: "User removed from blocked list" });
  } catch {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ===== Check If User Blocked =====
export const checkIfUserBlocked = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ message: "User ID to check is required" });
    }
    const currentUser = await User.findById(currentUserId).select("myblockedList");
    if (!currentUser || !currentUser.myblockedList) {
      return res.status(200).json({ isBlocked: false });
    }
    const isBlocked = currentUser.myblockedList.some((blockedUserId) => blockedUserId.toString() === userId);
    return res.status(200).json({ isBlocked });
  } catch {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// ===== Send OTP =====
export const sendOtp = async (req, res) => {
  const { email } = req.body;
  try {
    if (!email) return res.status(400).json({ message: "Email is required" });
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(email, { otp, expires: Date.now() + 10 * 60 * 1000 });
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    const mailOptions = {
      from: `"Your App Name" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP code is: ${otp}`,
    };
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "OTP sent successfully" });
  } catch {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ===== Verify OTP =====
export const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  try {
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }
    const record = otpStore.get(email);
    if (!record) return res.status(400).json({ message: "No OTP sent to this email" });
    if (record.expires < Date.now()) {
      otpStore.delete(email);
      return res.status(400).json({ message: "OTP expired" });
    }
    if (record.otp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }
    otpStore.delete(email); // Remove OTP after successful verification
    return res.status(200).json({ success: true, message: "OTP verified" });
  } catch {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ===== Change Password (OTP verified) =====
export const changePassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ message: "Email and new password are required" });
    }
    if (!isValidPassword(newPassword)) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    user.password = await bcrypt.hash(newPassword, await bcrypt.genSalt(10));
    await user.save();
    res.status(200).json({ message: "Password changed successfully", success: true });
  } catch {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export { otpStore };