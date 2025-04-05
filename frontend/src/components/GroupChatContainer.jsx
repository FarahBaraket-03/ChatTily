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
    clearSelectedGroupChat,
  } = useGroupChatStore();
  const { authUser, getUserById, socket } = useAuthStore();
  const messageEndRef = useRef(null);
  const [confirmingDelete, setConfirmingDelete] = useState(null);
  const [messagesWithDetails, setMessagesWithDetails] = useState([]);
  const socketListenersAdded = useRef(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const prevChatId = useRef(null);

  // Clear state when unmounting
  useEffect(() => {
    return () => {
      clearSelectedGroupChat();
    };
  }, [clearSelectedGroupChat]);

  const handleDelete = useCallback(async (messageId) => {
    setConfirmingDelete(null);
    await deleteGroupMessage(messageId);
  }, [deleteGroupMessage]);

  // Improved message fetching with chat switching handling
  const fetchMessages = useCallback(async (chatId) => {
    try {
      setInitialLoadComplete(false);
      await getGroupMessages(chatId);
      setInitialLoadComplete(true);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      setInitialLoadComplete(true);
    }
  }, [getGroupMessages]);

  // Handle chat switching and message loading
  useEffect(() => {
    if (!selectedGroupChat) return;
    
    const currentChatId = selectedGroupChat._id;
    if (prevChatId.current === currentChatId) return;

    // Clear previous messages when switching chats
    setMessagesWithDetails([]);
    prevChatId.current = currentChatId;

    fetchMessages(currentChatId);
  }, [selectedGroupChat, fetchMessages]);

  // Socket and message management
  useEffect(() => {
    if (!selectedGroupChat || !socket) return;

    const handleNewMessage = (newMessage) => {
      if (newMessage.chatId === selectedGroupChat._id) {
        useGroupChatStore.setState(state => ({
          groupMessages: [...state.groupMessages, newMessage]
        }));
      }
    };

    if (!socketListenersAdded.current) {
      socket.on("newGroupMessage", handleNewMessage);
      socketListenersAdded.current = true;
    }

    return () => {
      if (socket && socketListenersAdded.current) {
        socket.off("newGroupMessage", handleNewMessage);
        socketListenersAdded.current = false;
      }
    };
  }, [selectedGroupChat, socket]);

  // Improved scroll handling with chat switching
  useEffect(() => {
    if (!initialLoadComplete || !messageEndRef.current) return;
    
    const scrollToBottom = () => {
      try {
        // Reset scroll position first
        messageEndRef.current?.scrollIntoView();
        // Then smooth scroll
        setTimeout(() => {
          messageEndRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "end"
          });
        }, 50);
      } catch (error) {
        console.warn("Scroll error:", error);
        messageEndRef.current?.scrollIntoView();
      }
    };

    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [groupMessages, initialLoadComplete]);

  // Sender details population with caching
  const fetchSenderDetails = useCallback(async (message) => {
    if (typeof message.senderId === "string") {
      try {
        return { ...message, senderId: await getUserById(message.senderId) };
      } catch (error) {
        console.error("Failed to fetch sender:", error);
        return message;
      }
    }
    return message;
  }, [getUserById]);

  useEffect(() => {
    if (!groupMessages.length) {
      setMessagesWithDetails([]);
      return;
    }

    const updateMessages = async () => {
      const needsDetails = groupMessages.filter(msg => 
        typeof msg.senderId === "string" && 
        !messagesWithDetails.some(m => m._id === msg._id)
      );

      if (!needsDetails.length) {
        // Use existing details if no new messages need fetching
        const updatedMessages = groupMessages.map(msg => {
          const existing = messagesWithDetails.find(m => m._id === msg._id);
          return existing || msg;
        });
        setMessagesWithDetails(updatedMessages);
        return;
      }

      const updated = await Promise.all(needsDetails.map(fetchSenderDetails));
      setMessagesWithDetails(prev => {
        const existing = prev.filter(p => 
          !groupMessages.some(gm => gm._id === p._id)
        );
        return [...existing, ...updated, ...groupMessages.filter(gm => 
          typeof gm.senderId !== "string"
        )].sort((a, b) => 
          new Date(a.createdAt) - new Date(b.createdAt)
        );
      });
    };

    updateMessages();
  }, [groupMessages, fetchSenderDetails, messagesWithDetails]);

  if (isGroupMessagesLoading && !initialLoadComplete) {
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
        <div 
          ref={messageEndRef} 
          style={{ height: '1px', width: '100%' }}
        />
      </div>
      <MessageInputGroup />
    </div>
  );
};

export default GroupChatContainer;