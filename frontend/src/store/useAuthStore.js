import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

// This is the correct base URL setup
const BASE_URL = "http://localhost:5001"

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  isSearchingProfile: false,
  isFollowingUser: false,
  isFetchingAddRequests: false,
  isBlockingUser: false,
  isUnblockingUser: false,
  isCheckingBlockStatus: false, // New state for checking block status
  onlineUsers: [],
  socket: null,

  // Check auth and connect socket if logged in
  checkAuth: async () => {
    set({ isCheckingAuth: true });
    try {
      const res = await axiosInstance.get("/auth/check");
      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      // ✅ EXPECTED CASE: user not logged in
      if (error.response?.status === 401) {
        set({ authUser: null });
        return;
      }
  
      // ❌ Unexpected error
      console.error("Unexpected auth error:", error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },
  

  // Sign Up
  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      // API used: POST /auth/signup (correct)
      const res = await axiosInstance.post("/auth/signup", data);
      set({ authUser: res.data });
      toast.success("Account created successfully");
      get().connectSocket();
    } catch (error) {
      toast.error(error.response?.data?.message || "Signup failed");
    } finally {
      set({ isSigningUp: false });
    }
  },

  // Login
  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      // API used: POST /auth/login (correct)
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      toast.success("Logged in successfully");
      get().connectSocket();
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      set({ isLoggingIn: false });
    }
  },

  // Logout
  logout: async () => {
    try {
      // API used: POST /auth/logout (correct)
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch (error) {
      toast.error(error.response?.data?.message || "Logout failed");
    }
  },

  // Update Profile
  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      // API used: PUT /auth/update-profile (correct)
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.log("Error in update profile:", error);
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  // Search Profile by ID
  searchProfile: async (_id) => {
    set({ isSearchingProfile: true });
    try {
      // API used: GET /auth/searchProfile (correct)
      const res = await axiosInstance.get("/auth/searchProfile", { params: { _id } });
      const foundUser = res.data;
      // Note: The toast message is now more generic as the server message already indicates success/failure status within the data.
      return foundUser;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to search profile");
      return null;
    } finally {
      set({ isSearchingProfile: false });
    }
  },

  // Send contact request
  addRequest: async (targetUserId) => {
    set({ isFollowingUser: true });
    try {
      // API used: POST /auth/addRequest/:_id (correct)
      const res = await axiosInstance.post(`/auth/addRequest/${targetUserId}`);
      toast.success(res.data.message || "Request sent successfully");
      // Update local state to reflect request sent
      set((state) => ({
        authUser: {
          ...state.authUser,
          youRequseted: [...(state.authUser.youRequseted || []), targetUserId],
        },
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send contact request");
    } finally {
      set({ isFollowingUser: false });
    }
  },

  // Fetch all incoming add requests
  getAllAddRequest: async () => {
    set({ isFetchingAddRequests: true });
    try {
      // API used: GET /auth/getAllAddRequest (correct)
      const res = await axiosInstance.get("/auth/getAllAddRequest");
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch requests");
      return [];
    } finally {
      set({ isFetchingAddRequests: false });
    }
  },

  // Add user as contact (Accept request)
  addUser: async (userId) => {
    try {
      const { authUser } = get();
      // API used: POST /auth/addUser/:userId (correct)
      const res = await axiosInstance.post(`/auth/addUser/${userId}`);
      toast.success(res.data.message || "User added successfully");
      
      // FIX: Correctly update state to reflect the server's action (add contact, remove from requests)
      if (authUser) {
        set((state) => ({
          authUser: {
            ...state.authUser,
            // 1. Add to contacts
            contact: [...(state.authUser.contact || []).filter(id => id !== userId), userId],
            // 2. Remove from addRequesting (requests SENT to me)
            addRequesting: (state.authUser.addRequesting || []).filter(id => id.toString() !== userId.toString()),
            // 3. Remove from youRequseted (requests I SENT to them - though usually not needed here, better to keep state consistent)
            youRequseted: (state.authUser.youRequseted || []).filter(id => id.toString() !== userId.toString()),
          },
        }));
      }
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add user");
      return false;
    }
  },

  // (1) Block user
  blockUser: async (userId) => {
    set({ isBlockingUser: true });
    try {
      if (!userId) {
        toast.error("User ID is required to block");
        return;
      }
      // API used: POST /auth/block/:userId (correct)
      const res = await axiosInstance.post(`/auth/block/${userId}`);
      toast.success(res.data.message || "User blocked successfully");
      set((state) => ({
        authUser: {
          ...state.authUser,
          myblockedList: [...(state.authUser.myblockedList || []).filter(id => id !== userId), userId],
        },
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to block user");
    } finally {
      set({ isBlockingUser: false });
    }
  },

  // (2) Unblock user
  unblockUser: async (userId) => {
    set({ isUnblockingUser: true });
    try {
      // API used: DELETE /auth/unblock/:userId (correct)
      const res = await axiosInstance.delete(`/auth/unblock/${userId}`);
      toast.success(res.data.message || "User unblocked successfully");
      set((state) => ({
        authUser: {
          ...state.authUser,
          myblockedList: (state.authUser.myblockedList || []).filter(id => id !== userId),
        },
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to unblock user");
    } finally {
      set({ isUnblockingUser: false });
    }
  },
  
  // (3) Check if user is blocked - NEW ACTION
  checkIfUserBlocked: async (userId) => {
    set({ isCheckingBlockStatus: true });
    try {
      // API used: GET /auth/block/check (correct)
      const res = await axiosInstance.get("/auth/block/check", { params: { userId } });
      return res.data.isBlocked; // returns boolean
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to check block status");
      return false;
    } finally {
      set({ isCheckingBlockStatus: false });
    }
  },
  
  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;

    const socket = io(BASE_URL, { query: { userId: authUser._id } });
    socket.connect();
    set({ socket });
    socket.on("getOnlineUsers", (userIds) => set({ onlineUsers: userIds }));
  },

  // Disconnect socket
  disconnectSocket: () => {
    if (get().socket?.connected) get().socket.disconnect();
  },
}));