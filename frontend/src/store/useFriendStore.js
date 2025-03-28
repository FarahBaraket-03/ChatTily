import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";

export const useFriendStore = create((set, get) => ({
  friends: [],
  friendRequests: [],

  getAllFriends: async () => {
    try {
      const res = await axiosInstance.get(`/friend/friends`);
      set({ friends: res.data });
      console.log(res.data);
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch friends");
      throw error;
    }
  },

  checkIfFriend: (friendId) => {
    return get().friends.some(friend => friend.id === friendId);
  },

  sendFriendRequest: async (friendId) => {
    try {
      const res = await axiosInstance.post(`/friend/send-request`, { receiverId:friendId });
      toast.success("Friend request sent!");
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send request");
      throw error;
    }
  },
  acceptFriendRequest: async () => {
    //function
  },
  declineFriendRequest: async () => {
    //2 function
  },
}));
