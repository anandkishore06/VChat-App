import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5001" : "https://vchatappl.onrender.com";

export const useAuthStore = create((set, get) => ({
    authUser: null,
    isSigningUp: false,
    isLoggingIn: false,
    isUpdatingProfile: false,
    isCheckingAuth: true,
    onlineUsers: [],
    socket: null,
    isTyping: {}, // { [userId]: true }

    checkAuth: async () => {
        try {
            const res = await axiosInstance.get("/auth/check");
            console.log("After profile:", res);

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
            await axiosInstance.post("/auth/logout");
            set({ authUser: null });
            toast.success("Logged out successfully");
            get().disconnectSocket();
        } catch (error) {
            toast.error(error.response.data.message);
        }
    },

    updateProfile: async (data) => {
        set({ isUpdatingProfile: true });
        try {
            const res = await axiosInstance.put("/auth/update-profile", data);
            console.log(res);

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

    sendTyping: () => {
        const { socket } = useAuthStore.getState();
        const { selectedUser } = get();
        if (socket && selectedUser) {
            socket.emit("typing", { to: selectedUser._id });
        }
    },

    sendStopTyping: () => {
        const { socket } = useAuthStore.getState();
        const { selectedUser } = get();
        if (socket && selectedUser) {
            socket.emit("stopTyping", { to: selectedUser._id });
        }
    },

    subscribeToTyping: () => {
        const { socket } = useAuthStore.getState();
        const { selectedUser } = get();
        if (!socket || !selectedUser) return;

        socket.on("typing", ({ from }) => {
            if (from === selectedUser._id) {
                set((state) => ({
                    isTyping: { ...state.isTyping, [from]: true }
                }));
            }
        });

        socket.on("stopTyping", ({ from }) => {
            if (from === selectedUser._id) {
                set((state) => ({
                    isTyping: { ...state.isTyping, [from]: false }
                }));
            }
        });
    },

    unsubscribeFromTyping: () => {
        const { socket } = useAuthStore.getState();
        if (!socket) return;
        socket.off("typing");
        socket.off("stopTyping");
    },

    disconnectSocket: () => {
        if (get().socket?.connected) get().socket.disconnect();
    },
}));