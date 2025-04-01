import mongoose from "mongoose";

const MessageGroupSchema = new mongoose.Schema(
  {
    text: {
      type: String,
    },
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    image: {
      type: String,
    },
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

const MessageGroup = mongoose.model("MessageGroup", MessageGroupSchema);

export default MessageGroup;