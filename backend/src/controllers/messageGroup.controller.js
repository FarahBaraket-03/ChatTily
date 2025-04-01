import Chat from "../models/chat.model.js";
import MessageGroup from "../models/messageGroup.model.js";
import User from "../models/user.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io  } from "../lib/socket.js";
// Create a group chat
export const createGroupChat = async (req, res) => {
  try {
    const { name_group, members } = req.body;
    const admin = req.user._id;
  // Automatically include the admin in the members list
   const groupMembers = [...members, admin];
   console.log(groupMembers);
    if (!members || groupMembers.length < 2) {
      return res.status(400).json({ error: "A group chat must have at least 2 members" });
    }

    const newGroupChat = new Chat({
      name_group,
      members: [...members, admin], // Include the admin in the members list
      admin,
    });

    await newGroupChat.save();
    res.status(201).json(newGroupChat);
  } catch (error) {
    console.error("Error in createGroupChat: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get all group chats for the user
export const getGroupChats = async (req, res) => {
  try {
    const userId = req.user._id;

    const groupChats = await Chat.find({ members: userId })
      .populate("members", "-password")
      .populate("admin", "-password");

    res.status(200).json(groupChats);
  } catch (error) {
    console.error("Error in getGroupChats: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get messages for a group chat
export const getGroupMessages = async (req, res) => {
  try {
    const { chatId } = req.params;

    const messages = await MessageGroup.find({ chatId })
      .populate("senderId", "_id fullName profilePic")
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error in getGroupMessages: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Send a message to a group chat
export const sendGroupMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { text , image} = req.body;
    const senderId = req.user._id;

    let imageUrl;
        if (image) {
          // Upload base64 image to cloudinary
          const uploadResponse = await cloudinary.uploader.upload(image);
          imageUrl = uploadResponse.secure_url;
        }

    const newMessage = new MessageGroup({
      text,
      image : imageUrl,
      chatId,
      senderId,
    });

    await newMessage.save();

    // Notify all members of the group chat
    const chat = await Chat.findById(chatId);
    if (chat) {
      chat.members.forEach((member) => {
        const memberSocketId = getReceiverSocketId(member);
        if (memberSocketId) {
          io.to(memberSocketId).emit("newGroupMessage", newMessage);
        }
      });
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error in sendGroupMessage: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// leave the chat
export const leaveGroupChat = async (req, res) => {
  try {
    console.log(req.user); // Debugging: Check if req.user is populated
    const { id } = req.params;
    const userId = req.user._id;

    // Find the group chat
    const groupChat = await Chat.findById(id);
    if (!groupChat) {
      return res.status(404).json({ error: "Group chat not found" });
    }

    // Remove the user from the group chat members
    groupChat.members = groupChat.members.filter(
      (member) => member.toString() !== userId.toString()
    );

    // If no members are left, delete the group chat
    if (groupChat.members.length === 0) {
      await Chat.deleteOne({ _id: id }); // Corrected: Use { _id: id } instead of { id }
    } else {
      // If the user is the admin, assign a new admin (e.g., the first member)
      if (groupChat.admin.toString() === userId.toString()) {
        groupChat.admin = groupChat.members[0] || null; // Ensure members[0] exists
      }
      await groupChat.save();
    }

    res.status(200).json({ message: "Successfully left the group chat" });
  } catch (error) {
    console.error("Error in leaveGroupChat: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
// Add a member to a group chat
export const addMemberToGroup = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { memberId } = req.body;

    const groupChat = await Chat.findById(chatId);
    if (!groupChat) {
      return res.status(404).json({ error: "Group chat not found" });
    }

    // Check if the member is already in the group
    if (groupChat.members.includes(memberId)) {
      return res.status(400).json({ error: "Member is already in the group" });
    }

    // Add the new member to the group
    groupChat.members.push(memberId);
    await groupChat.save();

    res.status(200).json({ message: "Member added successfully", groupChat });
  } catch (error) {
    console.error("Error in addMemberToGroup: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }


};



// fetch non members in chat

export const getNonMembers = async (req, res) => {
  try {
    const { id: groupId } = req.params;

    // Find the group chat
    const groupChat = await Chat.findById(groupId);
    if (!groupChat) {
      return res.status(404).json({ error: "Group chat not found." });
    }

    // Find users who are not members of the group
    const nonMembers = await User.find({
      _id: { $nin: groupChat.members },
    }).select("-password");

    res.status(200).json(nonMembers);
  } catch (error) {
    console.error("Error in getNonMembers:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};


// Delete a group chat
export const deleteGroupChat = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Find the group chat
    const groupChat = await Chat.findById(id);
    if (!groupChat) {
      return res.status(404).json({ error: "Group chat not found" });
    }

    // Check if the user is the admin
    if (groupChat.admin.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Only the admin can delete the group chat" });
    }

    // Delete the group chat
    await Chat.deleteOne({ _id: id });

    res.status(200).json({ message: "Group chat deleted successfully" });
  } catch (error) {
    console.error("Error in deleteGroupChat: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteGroupMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const userId = req.user._id;

    const message = await MessageGroup.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    const chat = await Chat.findById(message.chatId);
    const isAdmin = chat.admin.toString() === userId.toString();
    
    if (message.senderId.toString() !== userId.toString() && !isAdmin) {
      return res.status(403).json({ error: "You can only delete your own messages or be admin" });
    }

    // Soft delete
    message.isDeleted = true;
    await message.save();

    chat.members.forEach((member) => {
      const memberSocketId = getReceiverSocketId(member);
      if (memberSocketId) {
        io.to(memberSocketId).emit("groupMessageUpdated", message);
      }
    });

    res.status(200).json(message);
  } catch (error) {
    console.error("Error in deleteGroupMessage: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};