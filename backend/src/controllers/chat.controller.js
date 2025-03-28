
import Message from "../models/message.model.js";

import cloudinary from "../lib/cloudinary.js";

import Chat from "../models/chat.model.js";
import User from "../models/user.model.js";

// Create a group chat
export const createGroupChat = async (req, res) => {
  try {
    const { members, name_group } = req.body;
    console.log(name_group)
    const adminId = req.user._id; // The user creating the group is the admin

    // Ensure the admin is included in the members list
    if (!members.includes(adminId)) {
      members.push(adminId);
    }

    const newGroupChat = new Chat({
      members,
      adminId,
      name_group,
    });

    await newGroupChat.save();

    res.status(201).json(newGroupChat);
  } catch (error) {
    console.error("Error in createGroupChat: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get all chats for a user (including group chats)
export const getUserChats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find all chats where the user is a member
    const chats = await Chat.find({ members: userId }).populate("members", "-password");

    res.status(200).json(chats);
  } catch (error) {
    console.error("Error in getUserChats: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};