import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useState } from "react";
import { axiosInstance } from "../lib/axios";

const ChatHeader = () => {
    const { selectedUser, setSelectedUser } = useChatStore();
    const { onlineUsers } = useAuthStore();
    const [summary, setSummary] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSummarize = async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.post(`/messages/summary/${selectedUser._id}`);
            setSummary(res.data.summary);
        } catch (err) {
            console.error("Failed to summarize chat", err);
            alert("Summary failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-2.5 border-b border-base-300">
            <div className="flex items-center justify-between flex-wrap gap-2">
                {/* Left: Avatar & Name */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="avatar">
                        <div className="size-10 rounded-full relative">
                            <img
                                src={selectedUser.profilePic || "/avatar.png"}
                                alt={selectedUser.fullName}
                            />
                        </div>
                    </div>
                    <div className="truncate">
                        <h3 className="font-medium truncate">{selectedUser.fullName}</h3>
                        <p className="text-sm text-base-content/70 truncate">
                            {onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
                        </p>
                    </div>
                </div>

                {/* Right: Buttons */}
                <div className="flex items-center gap-2 flex-shrink-0">


                    <button
                        onClick={handleSummarize}
                        disabled={loading}
                        className="px-3 py-1.5 text-xs rounded-lg font-small 
                            text-white bg-gradient-to-r from-indigo-500 to-purple-500 
                            hover:from-indigo-600 hover:to-purple-600 
                            active:scale-95 transition-all duration-200
                            disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <span className="flex items-center gap-1">
                                <span className="animate-pulse">🧠</span> Summarizing...
                            </span>
                        ) : (
                            "🧠 Smart Summary"
                        )}
                    </button>
                </div>
            </div>

            {/* Summary output */}
            {summary && (
                <div className="mt-2 bg-base-200 p-3 rounded relative text-sm whitespace-pre-wrap shadow-md">
                    <button
                        onClick={() => setSummary("")}
                        className="absolute top-1 right-2 text-base-content/60 hover:text-base-content transition"
                    >
                        ✖
                    </button>
                    {summary}
                </div>
            )}
        </div>
    );
};

export default ChatHeader;
