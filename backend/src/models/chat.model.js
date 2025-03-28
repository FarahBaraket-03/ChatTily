import mongoose from "mongoose";

const ChatSchema = new mongoose.Schema(
  {
    members:{
      type:[mongoose.Schema.Types.ObjectId],
      ref: "User",
      required: true,
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    name_group: {
      type: String,
    },
    
  },
  { timestamps: true }
);

const Chat = mongoose.model("Chat", ChatSchema);

export default Chat;