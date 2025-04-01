import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  createGroupChat,
  getGroupChats,
  sendGroupMessage,
  getGroupMessages,
  leaveGroupChat,
  addMemberToGroup,
  getNonMembers,
  deleteGroupChat,
  deleteGroupMessage,
} from "../controllers/messageGroup.controller.js";

const router = express.Router();

// Group chat routes
router.post("/group", protectRoute, createGroupChat); // Create a group chat
router.get("/group", protectRoute, getGroupChats); // Get all group chats for the user
router.get("/group/messages/:chatId", protectRoute, getGroupMessages); // Get messages for a group chat
router.post("/group/send/:chatId", protectRoute, sendGroupMessage); // Send a message to a group chat
router.post("/leave/:id", protectRoute, leaveGroupChat); // Leave a group chat
router.post("/add-member/:chatId", protectRoute, addMemberToGroup); // Add a member to a group chat
router.get("/group/non-members/:id", protectRoute, getNonMembers); // Fetch non-members
router.delete("/group/:id", protectRoute, deleteGroupChat); // Delete a group chat
router.patch("/group/messages/:id", protectRoute, deleteGroupMessage);
export default router;