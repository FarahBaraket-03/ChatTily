import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore.js";

export const useFriendStore = create((set, get) => ({
  friends: [],
  friendRequests: [],
  isLoading: false,
  error: null,

  // Get all friends with proper loading state and error handling
  getAllFriends: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await axiosInstance.get(`/friend/friends`);
      const uniqueFriends = res.data.filter(
        (friend, index, self) => 
          index === self.findIndex(f => f._id === friend._id)
      );
      set({ friends: uniqueFriends, isLoading: false });
      return uniqueFriends;
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Failed to fetch friends";
      set({ error: errorMsg, isLoading: false });
      throw error;
    }
  },

  // Check if user is friend
  checkIfFriend: (friendId) => {
    return get().friends.some(friend => friend._id === friendId);
  },

  // Get friend requests with loading state
  getFriendRequests: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await axiosInstance.get(`/friend/friend-requests`);
      set({ friendRequests: res.data, isLoading: false });
      return res.data;
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Failed to fetch requests";
      set({ error: errorMsg, isLoading: false });
      throw error;
    }
  },

  // Send friend request with optimistic update
  sendFriendRequest: async (friendId) => {
    try {
      set({ isLoading: true });
      const res = await axiosInstance.post(`/friend/send-request`, { 
        receiverId: friendId 
      });
      toast.success("Friend request sent!");
      return res.data;
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Failed to send request";
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Accept friend request with state updates
  acceptFriendRequest: async (senderId) => {
    try {
      set({ isLoading: true });
      const res = await axiosInstance.post(`/friend/accept-request`, { 
        senderId,
      });
      
      // Update local state immediately
      set(state => ({
        friendRequests: state.friendRequests.filter(req => req._id !== senderId),
        friends: [...state.friends, res.data.newFriend], // assuming backend returns the new friend
        isLoading: false
      }));
      
      toast.success("Friend request accepted!");
      return res.data;
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Failed to accept request";
      toast.error(errorMsg);
      throw error;
    }
  },

  // Decline friend request
  declineFriendRequest: async (senderId) => {
    try {
      set({ isLoading: true });
      const res = await axiosInstance.post(`/friend/reject-request`, { 
        senderId,
      });
      
      // Update local state
      set(state => ({
        friendRequests: state.friendRequests.filter(req => req._id !== senderId),
        isLoading: false
      }));
      
      toast.success("Friend request declined");
      return res.data;
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Failed to decline request";
      toast.error(errorMsg);
      throw error;
    }
  },

  unfriend: async (friendId) => {
    try {
      set({ isLoading: true });
      const res = await axiosInstance.post(`/friend/unfriend`, { 
        friendId 
      });

      // Update local state immediately
      set(state => ({
        friends: state.friends.filter(friend => friend._id !== friendId),
        isLoading: false
      }));

      // Notify via socket
      const socket = useAuthStore.getState().socket;
      if (socket) {
        socket.emit("unfriend", {
          userId: useAuthStore.getState().authUser._id,
          friendId
        });
      }

      toast.success("Friend removed successfully");
      return res.data;
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Failed to remove friend";
      toast.error(errorMsg);
      throw error;
    }
  },

  setupSocketListeners: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
  
    // Clear existing listeners to prevent duplicates
    socket.off("unfriended");
    
    socket.on("unfriended", (data) => {
      set(state => ({
        friends: state.friends.filter(friend => friend._id !== data.friendId)
      }));
    });
  
    // Add listener for friend updates
    socket.on("friendUpdate", (updatedFriends) => {
      set({ friends: updatedFriends });
    });
  
    return () => {
      socket.off("unfriended");
      socket.off("friendUpdate");
    };
  }

}));