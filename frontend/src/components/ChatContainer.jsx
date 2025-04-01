import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef ,useState} from "react";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    deleteMessage,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  const [confirmingDelete, setConfirmingDelete] = useState(null);

  const handleDelete = async (messageId) => {
    setConfirmingDelete(null);
    await deleteMessage(messageId);
  };

  useEffect(() => {
    getMessages(selectedUser._id);

    subscribeToMessages();

    return () => unsubscribeFromMessages();
  }, [selectedUser._id, getMessages, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message._id}
            className={`chat ${message.senderId === authUser._id ? "chat-end" : "chat-start"}`}
            ref={messageEndRef}
          >
            <div className=" chat-image avatar">
              <div className="size-10 rounded-full border">
                <img
                  src={
                    message.senderId === authUser._id
                      ? authUser.profilePic || "/avatar.png"
                      : selectedUser.profilePic || "/avatar.png"
                  }
                  alt="profile pic"
                />
              </div>
            </div>
            <div className="chat-header mb-1">
              <time className="text-xs opacity-50 ml-1">
                {formatMessageTime(message.createdAt)}
              </time>
            </div>
            <div className="chat-bubble flex flex-col">
      {message.image && !message.isDeleted && (
        <img src={message.image} alt="Attachment" className="sm:max-w-[200px] rounded-md mb-2" />
      )}
      {message.text && !message.isDeleted && <p>{message.text}</p>}
      {message.isDeleted && <p className="italic text-gray-500">Message deleted</p>}
      {message.senderId === authUser._id && !message.isDeleted && (
        <div className="self-end">
          <button 
            onClick={() => setConfirmingDelete(message._id)}
            className="text-xs text-red-500 mt-1"
          >
            Delete
          </button>
          {confirmingDelete === message._id && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div role="alert" className="alert bg-base-100 shadow-lg max-w-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-error shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h3 className="font-bold">delete this message</h3>
                <div className="text-sm">Are you sure you want to delete this message? This action cannot be undone.</div>
              </div>
              <div className="flex gap-2">
                <button 
                  className="btn btn-sm"
                  onClick={() => setConfirmingDelete(null)}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-sm btn-error"
                  onClick={() => handleDelete(message._id)}
                >
                  confirm
                </button>
              </div>
            </div>
          </div>
          )}
        </div>
      )}
    </div>
          </div>
        ))}
      </div>

      <MessageInput />
    </div>
  );
};
export default ChatContainer;
