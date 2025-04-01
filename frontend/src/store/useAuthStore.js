import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5001" : "/" ;



export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");
      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ authUser: res.data });
      toast.success("Account created successfully");
      get().connectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      toast.success("Logged in successfully");

      get().connectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      // Clear auth state immediately to prevent further actions
      set({ authUser: null, onlineUsers: [] });
      
      // Disconnect socket first to prevent any pending requests
      const { socket } = get();
      if (socket) {
        socket.disconnect();
        set({ socket: null });
      }
  
      // Then send logout request to server
      await axiosInstance.post("/auth/logout");
      
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
      // Even if logout fails, ensure clean state
      set({ authUser: null, socket: null, onlineUsers: [] });
      toast.error(error.response?.data?.message || "Logout failed");
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.log("error in update profile:", error);
      toast.error(error.response.data.message);
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  connectSocket: () => {
    const { authUser, socket } = get();
    if (!authUser || socket) return; // Avoid multiple connections
  
    const newSocket = io(BASE_URL, {
      query: { userId: authUser._id },
      reconnection: true, // Allow reconnection
      reconnectionAttempts: 5, // Retry a few times
      reconnectionDelay: 1000, // Retry delay
    });
  
    set({ socket: newSocket });
  
    newSocket.on("connect", () => {
      console.log("Connected to socket server");
    });
  
    newSocket.on("disconnect", () => {
      console.log("Disconnected from socket server");
    });
  
    newSocket.on("connect_error", (err) => {
      console.log("Socket connection error:", err);
      toast.error("Failed to connect to socket server");
    });
  
    newSocket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });
  },
  
  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      // Clean up all event listeners
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('getOnlineUsers');
      
      socket.disconnect();
      set({ socket: null });
      console.log("Socket disconnected");
    }
  },

getUserById: async (userId) => {
  try {
    const res = await axiosInstance.get(`/auth/user/${userId}`);
    return res.data;
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to fetch user");
    throw error;
  }
},


}));