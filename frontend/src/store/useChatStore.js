import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  // The sendMessage action correctly updates the local state (optimistic update)
  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    if (!selectedUser) return toast.error("No user selected");
    
    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      // Immediately add the sent message (from the server response) to the local state
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  },

  // 💡 FIX: This function now correctly handles both incoming and outgoing messages 
  // for the currently selected conversation.
  subscribeToMessages: () => {
    const { selectedUser } = get();
    const socket = useAuthStore.getState().socket;
    const authUserId = useAuthStore.getState().authUser?._id;

    // Check if the prerequisites are met
    if (!selectedUser || !socket || !authUserId) return;
    
    // Use .off() first to prevent duplicate listeners if called multiple times 
    // without the proper cleanup in the component.
    socket.off("newMessage"); 

    socket.on("newMessage", (newMessage) => {
      // 1. Check if the message is from the selected user TO me (incoming)
      const isIncoming = 
        newMessage.senderId === selectedUser._id && newMessage.receiverId === authUserId;
      
      // 2. Check if the message is from me TO the selected user (outgoing)
      //    (This handles cases where the server broadcast is faster than the API response)
      const isOutgoing = 
        newMessage.senderId === authUserId && newMessage.receiverId === selectedUser._id;
      
      // Only add the message to the list if it belongs to the current chat
      if (isIncoming || isOutgoing) {
        set((state) => ({
          messages: [...state.messages, newMessage],
        }));
      }
      
      // OPTIONAL IMPROVEMENT: Update the users list for notifications/sorting
      // You could check if (isIncoming && newMessage.senderId !== selectedUser._id)
      // to display a notification for a message in a different chat.
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    // Crucially important for cleanup!
    if (socket) {
        socket.off("newMessage");
    }
  },

  setSelectedUser: (selectedUser) => {
    // Clear messages when switching users to prepare for the new chat history
    set({ selectedUser, messages: [] });
  },
}));