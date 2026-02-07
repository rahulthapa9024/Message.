import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js"; // Your configured Cloudinary instance
import { getReceiverSocketId, io } from "../lib/socket.js"; // Your Socket.io integration

// --- 1. Get Users for Sidebar (Contacts) ---

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    // Find the logged-in user and get their contacts
    const loggedInUser = await User.findById(loggedInUserId).select("contact");

    if (!loggedInUser || !loggedInUser.contact || loggedInUser.contact.length === 0) {
      // If no contacts, return empty array
      return res.status(200).json([]);
    }

    // Find all users whose _id is in the loggedInUser's contact array
    const contacts = await User.find({ _id: { $in: loggedInUser.contact } }).select("-password");

    res.status(200).json(contacts);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// --- 2. Get Messages for a Specific Chat ---

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    // Find messages where (I am sender AND they are receiver) OR (They are sender AND I am receiver)
    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    }).sort({ createdAt: 1 }); // Sort by creation time to get chronological order

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// --- 3. Send Message (Handles Text, Image, and Video Uploads) ---

export const sendMessage = async (req, res) => {
  try {
    // 1. Destructure fields from the request body
    // Expecting text, base64 image string, and/or base64 video string
    const { text, image, video } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    let videoUrl;

    // 2. Handle Image Upload (if image data is present)
    if (image) {
      // Upload base64 image/file path to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image, {
        folder: "chat-images", // Optional: Specify a dedicated folder
      });
      imageUrl = uploadResponse.secure_url;
    }

    // 3. Handle Video Upload (if video data is present)
    if (video) {
      // Upload base64 video/file path to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(video, {
        resource_type: "video", // CRITICAL: Tells Cloudinary to process it as a video
        folder: "chat-videos",  // Optional: Specify a dedicated folder
      });
      videoUrl = uploadResponse.secure_url;
    }

    // 4. Create a new Message instance
    const newMessage = new Message({
      senderId,
      receiverId,
      text: text || undefined, // Only save text if it exists
      image: imageUrl,
      video: videoUrl,
    });

    // 5. Save the message to the database
    await newMessage.save();

    // 6. Real-time communication using Socket.io
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      // Send the new message to the receiver in real-time
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    // 7. Respond to the client
    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};