import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import { showSuccessToast, showErrorToast } from "../lib/toast";
import { io } from "socket.io-client";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5001" : "/";

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
      console.log("Error in checkAuth:", error);
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
      showSuccessToast("Account created successfully");
      get().connectSocket();
    } catch (error) {
      showErrorToast(error.response.data.message);
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      showSuccessToast("Logged in successfully");

      get().connectSocket();
    } catch (error) {
      showErrorToast(error.response.data.message);
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      showSuccessToast("Logged out successfully");
      get().disconnectSocket();
    } catch (error) {
      showErrorToast(error.response.data.message);
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
    } catch (error) {
      console.log("error in update profile:", error);
      
      // More robust error handling
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log("Error response data:", error.response.data);
        console.log("Error response status:", error.response.status);
        return Promise.reject(error); // Propagate the error to the component
      } else if (error.request) {
        // The request was made but no response was received
        console.log("Error request:", error.request);
        return Promise.reject(error); // Propagate the error to the component
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log("Error message:", error.message);
        return Promise.reject(error); // Propagate the error to the component
      }
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  updatePrivateKey: async (privateKey) => {
    try {
      const res = await axiosInstance.put("/users/private-key", { privateKey });
      set({ authUser: res.data });
      showSuccessToast("Private key updated successfully");
      return res.data;
    } catch (error) {
      showErrorToast(error.response?.data?.message || "Error updating private key");
      throw error;
    }
  },
  
  generateNewPrivateKey: async () => {
    try {
      const res = await axiosInstance.post("/users/generate-private-key");
      set({ authUser: res.data });
      showSuccessToast("New private key generated successfully");
      return res.data;
    } catch (error) {
      showErrorToast(error.response?.data?.message || "Error generating new private key");
      throw error;
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;

    const socket = io(BASE_URL, {
      query: {
        userId: authUser._id,
      },
    });
    socket.connect();

    set({ socket: socket });

    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });
  },
  disconnectSocket: () => {
    if (get().socket?.connected) get().socket.disconnect();
  },
}));
