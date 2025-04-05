import { useGroupChatStore } from "../store/useGroupChatStore";
import { useEffect, useRef, useState, useCallback } from "react";
import GroupChatHeader from "./GroupChatHeader";
import MessageInputGroup from "./MessageInputGroup";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";

const GroupChatContainer = () => {
  const {
    groupMessages,
    getGroupMessages,
    isGroupMessagesLoading,
    selectedGroupChat,
    deleteGroupMessage,
  } = useGroupChatStore();
  const { authUser, getUserById, socket } = useAuthStore();
  const messageEndRef = useRef(null);
  const [confirmingDelete, setConfirmingDelete] = useState(null);
  const [messagesWithDetails, setMessagesWithDetails] = useState([]);

  // Memoized delete handler
  const handleDelete = useCallback(async (messageId) => {
    setConfirmingDelete(null);
    await deleteGroupMessage(messageId);
  }, [deleteGroupMessage]);

  // Improved socket subscription management
  useEffect(() => {
    if (!selectedGroupChat || !socket) return;

    // Fetch messages when chat is selected
    getGroupMessages(selectedGroupChat._id);

    // Socket event handlers
    const handleNewMessage = (newMessage) => {
      if (newMessage.chatId === selectedGroupChat._id) {
        useGroupChatStore.setState(state => ({
          groupMessages: [...state.groupMessages, newMessage]
        }));
      }
    };

    const handleMessageDeleted = (deletedMessageId) => {
      useGroupChatStore.setState(state => ({
        groupMessages: state.groupMessages.filter(msg => msg._id !== deletedMessageId)
      }));
    };

    const handleMessageUpdated = (updatedMessage) => {
      useGroupChatStore.setState(state => ({
        groupMessages: state.groupMessages.map(msg => 
          msg._id === updatedMessage._id ? updatedMessage : msg
        )
      }));
    };

    // Subscribe to socket events
    socket.on("newGroupMessage", handleNewMessage);
    socket.on("groupMessageDeleted", handleMessageDeleted);
    socket.on("groupMessageUpdated", handleMessageUpdated);

    // Cleanup function
    return () => {
      socket.off("newGroupMessage", handleNewMessage);
      socket.off("groupMessageDeleted", handleMessageDeleted);
      socket.off("groupMessageUpdated", handleMessageUpdated);
    };
  }, [selectedGroupChat, socket, getGroupMessages]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [groupMessages]);

  // Memoized sender details fetcher
  const fetchSenderDetails = useCallback(async (message) => {
    if (typeof message.senderId === "string") {
      try {
        const sender = await getUserById(message.senderId);
        return { ...message, senderId: sender };
      } catch (error) {
        console.error("Failed to fetch sender details", error);
        return message;
      }
    }
    return message;
  }, [getUserById]);

  // Optimized sender details population
  useEffect(() => {
    if (groupMessages.length === 0) return;

    // Only process messages that need sender details
    const messagesNeedingDetails = groupMessages.filter(
      msg => typeof msg.senderId === "string"
    );

    if (messagesNeedingDetails.length > 0) {
      const fetchDetails = async () => {
        const updatedMessages = await Promise.all(
          messagesNeedingDetails.map(fetchSenderDetails)
        );
        
        // Merge with existing messages that already have details
        setMessagesWithDetails(prev => {
          const existingMessages = prev.filter(
            msg => typeof msg.senderId !== "string"
          );
          return [...existingMessages, ...updatedMessages]
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        });
      };

      fetchDetails();
    } else {
      // If all messages already have details, just update the array
      setMessagesWithDetails([...groupMessages]);
    }
  }, [groupMessages, fetchSenderDetails]);

  if (isGroupMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <GroupChatHeader />
        <MessageSkeleton />
        <MessageInputGroup />
      </div>
    );
  }

  if (!selectedGroupChat) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center">
        <p>Select a group chat to start messaging</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <GroupChatHeader />
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messagesWithDetails.map((message) => {
          const sender = message.senderId || {};
          const isCurrentUser = sender._id === authUser._id;

          return (
            <div
              key={message._id}
              className={`chat ${isCurrentUser ? "chat-end" : "chat-start"}`}
            >
              <div className="chat-image avatar">
                <div className="size-10 rounded-full border">
                  <img
                    src={sender.profilePic || "/avatar.png"}
                    alt="profile pic"
                  />
                </div>
              </div>
              <div className="chat-header mb-1">
                <span className="text-sm font-semibold">
                  {sender.fullName || "Unknown"}
                </span>
                <time className="text-xs opacity-50 ml-1">
                  {formatMessageTime(message.createdAt)}
                </time>
              </div>
              <div className="chat-bubble flex flex-col">
                {message.image && !message.isDeleted && (
                  <img 
                    src={message.image} 
                    alt="Attachment" 
                    className="sm:max-w-[200px] rounded-md mb-2" 
                  />
                )}
                {message.text && !message.isDeleted && <p>{message.text}</p>}
                {message.isDeleted && (
                  <p className="italic text-gray-500">Message deleted</p>
                )}
                {(message.senderId._id === authUser._id || 
                  selectedGroupChat?.admin === authUser._id) && 
                  !message.isDeleted && (
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
          );
        })}
        <div ref={messageEndRef} />
      </div>
      <MessageInputGroup />
    </div>
  );
};

export default GroupChatContainer;