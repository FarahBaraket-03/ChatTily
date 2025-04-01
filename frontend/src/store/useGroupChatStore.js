import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useGroupChatStore = create((set, get) => ({
  groupChats: [], // List of group chats
  selectedGroupChat: null, // Currently selected group chat
  groupMessages: [], // Messages for the selected group chat
  isGroupChatsLoading: false, // Loading state for fetching group chats
  isGroupMessagesLoading: false, // Loading state for fetching group messages
  nonMembers: [], // Users who are not members of the selected group chat
  isNonMembersLoading: false, // Loading state for fetching non-members

  // *Fetch group messages
  getGroupMessages: async (chatId) => {
    set({ isGroupMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/group/group/messages/${chatId}`);
      set({ groupMessages: res.data });
    } catch (error) {
      console.error("Failed to fetch group messages:", error);
    } finally {
      set({ isGroupMessagesLoading: false });
    }
  },

  //Fetch all group chats for the logged-in user
  fetchGroupChats: async () => {
    set({ isGroupChatsLoading: true });
    try {
      const res = await axiosInstance.get("/group/group");
      set({ groupChats: res.data });
    } catch (error) {
      console.error("Failed to fetch group chats:", error);
    } finally {
      set({ isGroupChatsLoading: false });
    }
  },

  // !Fetch messages for a specific group chat
  fetchGroupMessages: async (chatId) => {
    set({ isGroupMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/group/group/messages/${chatId}`);
      set({ groupMessages: res.data });
    } catch (error) {
      console.error("Failed to fetch group messages:", error);
    } finally {
      set({ isGroupMessagesLoading: false });
    }
  },

  // Send a message to a group chat
  sendGroupMessage: async (messageData) => {
    try {
      const { selectedGroupChat } = get(); // Access selectedGroupChat from the store's state
      if (!selectedGroupChat) {
        throw new Error("No group chat selected");
      }
      
      const res = await axiosInstance.post(`/group/group/send/${selectedGroupChat._id}`, {text: messageData.text,
        image: messageData.image,});


        // Emit the message to the group chat room
    const socket = useAuthStore.getState().socket;
    socket.emit("sendGroupMessage", {
      ...res.data,
      chatId: selectedGroupChat._id,
    });
      // set((state) => ({ groupMessages: [...state.groupMessages, res.data] }));
    } catch (error) {
      console.error("Failed to send group message:", error);
    }
  },

  // ~Create a new group chat
  createGroupChat: async (name_group, members) => {
    try {
      const res = await axiosInstance.post("/group/group", { name_group, members });
      set((state) => ({ groupChats: [...state.groupChats, res.data] }));
      return res.data;
    } catch (error) {
      console.error("Failed to create group chat:", error);
    }
  },

  // Subscribe to group messages
  subscribeToGroupMessages: () => {
    const socket = useAuthStore.getState().socket;
    const { selectedGroupChat } = get();

    if (!selectedGroupChat) return;

    socket.on("newGroupMessage", (newMessage) => {
      if (newMessage.chatId === selectedGroupChat._id) {
        set((state) => ({ groupMessages: [...state.groupMessages, newMessage] }));
      }
    });
    socket.on("groupMessageDeleted", (deletedMessageId) => {
      set((state) => ({
        groupMessages: state.groupMessages.filter((msg) => msg._id !== deletedMessageId),
      }));
    });
    socket.on("groupMessageUpdated", (updatedMessage) => {
      set((state) => ({
        groupMessages: state.groupMessages.map(msg =>
          msg._id === updatedMessage._id ? updatedMessage : msg
        ),
      }));
    });
  },

  //? Unsubscribe from group messages
  unsubscribeFromGroupMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) { // Add null check
      socket.off("newGroupMessage");
    }
  },

  // Set the currently selected group chat
  setSelectedGroupChat: (selectedGroupChat) => set({ selectedGroupChat }),

  // ^leave th Group
  leaveGroupChat: async () => {
    try {
      const { selectedGroupChat } = get();
  
      // Check if selectedGroupChat is defined
      if (!selectedGroupChat || !selectedGroupChat._id) {
        console.error("No group chat selected or invalid group chat.");
        return;
      }
  
      const id = selectedGroupChat._id;
      await axiosInstance.post(`/group/leave/${id}`);
  
      // Update the state
      set((state) => ({
        groupChats: state.groupChats.filter((group) => group._id !== id), // Use `id` instead of `chatId`
        selectedGroupChat: null,
        groupMessages: [],
      }));
    } catch (error) {
      console.error("Failed to leave group chat:", error);
    }
  },

  // add Members 
  addMemberToGroup: async (chatId, memberId) => {
    try {
      const res = await axiosInstance.post(`/group/add-member/${chatId}`, { memberId });
      set((state) => ({
        groupChats: state.groupChats.map((group) =>
          group._id === chatId ? { ...group, members: res.data.groupChat.members } : group
        ),
      }));
    } catch (error) {
      console.error("Failed to add member to group:", error);
    }
  },

    //& Fetch users who are not members of the selected group chat
    fetchNonMembers: async () => {
      const { selectedGroupChat } = get();
      if (!selectedGroupChat) return;
  
      set({ isNonMembersLoading: true });
      try {
        const res = await axiosInstance.get(`/group/group/non-members/${selectedGroupChat._id}`);
        set({ nonMembers: res.data });
      } catch (error) {
        console.error("Failed to fetch non-members:", error);
      } finally {
        set({ isNonMembersLoading: false });
      }
    },

    // Delete a group chat
  deleteGroupChat: async (chatId) => {
    try {
      await axiosInstance.delete(`/group/group/${chatId}`);
      set((state) => ({
        groupChats: state.groupChats.filter((group) => group._id !== chatId),
        selectedGroupChat: null, // Clear the selected group chat
        groupMessages: [], // Clear the group messages
      }));
    } catch (error) {
      console.error("Failed to delete group chat:", error);
    }
  },

  deleteGroupMessage: async (messageId) => {
    try {
      const res = await axiosInstance.patch(`/group/group/messages/${messageId}`, { isDeleted: true });
      set((state) => ({
        groupMessages: state.groupMessages.map(msg =>
          msg._id === messageId ? res.data : msg
        ),
      }));
    } catch (error) {
      console.error("Failed to delete group message:", error);
    }
  },
  
  // Clear the selected group chat and messages
  clearSelectedGroupChat: () => set({ selectedGroupChat: null, groupMessages: [] }),
}));