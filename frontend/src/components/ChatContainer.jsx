import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useEffect, useRef, useState } from "react";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { formatMessageTime } from "../lib/utils";
import { axiosInstance } from "../lib/axios";

const ChatContainer = () => {
    const {
        messages,
        getMessages,
        isMessagesLoading,
        selectedUser,
        subscribeToMessages,
        unsubscribeFromMessages,
        sendMessage,
    } = useChatStore();

    const { authUser } = useAuthStore();
    const messageEndRef = useRef(null);
    const [showTranslateOptions, setShowTranslateOptions] = useState({});
    const [suggestedReplies, setSuggestedReplies] = useState({});
    const [loadingSuggestionFor, setLoadingSuggestionFor] = useState(null);
    const [translatedMessages, setTranslatedMessages] = useState({});
    const [selectedLanguages, setSelectedLanguages] = useState({});

    const [emotions, setEmotions] = useState({});
    const [emotionVisible, setEmotionVisible] = useState({});
    const [emotionLoading, setEmotionLoading] = useState({});

    const languageOptions = [
        { code: "English", label: "English" },
        { code: "Hindi", label: "हिंदी" },
        { code: "Spanish", label: "Español" },
        { code: "French", label: "Français" },
        { code: "German", label: "Deutsch" },
        { code: "Japanese", label: "日本語" },
        { code: "Chinese", label: "中文" },
    ];

    useEffect(() => {
        if (!selectedUser) return;
        getMessages(selectedUser._id);
        subscribeToMessages();
        return () => unsubscribeFromMessages();
    }, [selectedUser?._id]);

    useEffect(() => {
        if (messageEndRef.current && messages) {
            messageEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const handleSuggestReply = async (messageText, messageId) => {
        try {
            setLoadingSuggestionFor(messageId);
            const res = await axiosInstance.post("/messages/suggest-replies", {
                message: messageText,
            });
            setSuggestedReplies((prev) => ({
                ...prev,
                [messageId]: res.data.replies || [],
            }));
        } catch (err) {
            console.error("Error fetching AI suggestions:", err.response?.data || err.message);
        } finally {
            setLoadingSuggestionFor(null);
        }
    };

    const handleSendAiReply = async (text, messageId) => {
        await sendMessage({ text });
        setSuggestedReplies((prev) => {
            const updated = { ...prev };
            delete updated[messageId];
            return updated;
        });
    };

    const handleTranslate = async (messageId, text, lang) => {
        try {
            const res = await axiosInstance.post("/messages/translate", {
                text,
                targetLang: lang,
            });
            setTranslatedMessages((prev) => ({
                ...prev,
                [messageId]: res.data.translated,
            }));
        } catch (err) {
            console.error("Translation error:", err);
        }
    };

    const handleShowEmotion = async (messageId, text) => {
        if (emotions[messageId]) {
            setEmotionVisible((prev) => ({ ...prev, [messageId]: true }));
            return;
        }

        try {
            setEmotionLoading((prev) => ({ ...prev, [messageId]: true }));
            const res = await axiosInstance.post("/messages/detect-emotion", { text });
            setEmotions((prev) => ({ ...prev, [messageId]: res.data.emoji }));
            setEmotionVisible((prev) => ({ ...prev, [messageId]: true }));
        } catch (err) {
            console.error("Emotion detection failed:", err);
        } finally {
            setEmotionLoading((prev) => ({ ...prev, [messageId]: false }));
        }
    };

    if (isMessagesLoading || !selectedUser) {
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
                {messages.map((message) => {
                    const isMe = message.senderId === authUser._id;

                    return (
                        <div
                            key={message._id}
                            className={`chat ${isMe ? "chat-end" : "chat-start"}`}
                            ref={messageEndRef}
                        >
                            <div className="chat-image avatar">
                                <div className="size-10 rounded-full border">
                                    <img
                                        src={
                                            isMe
                                                ? authUser.profilePic || "/avatar.png"
                                                : selectedUser.profilePic || "/avatar.png"
                                        }
                                        alt="profile"
                                    />
                                </div>
                            </div>

                            <div className="chat-header mb-1">
                                <time className="text-xs opacity-50 ml-1">
                                    {formatMessageTime(message.createdAt)}
                                </time>
                            </div>

                            <div className="chat-bubble flex flex-col">
                                {message.image && (
                                    <img
                                        src={message.image}
                                        alt="Attachment"
                                        className="sm:max-w-[200px] rounded-md mb-2"
                                    />
                                )}
                                {message.text && <p>{message.text}</p>}

                                {/* 🌍 Translate */}
                                {/* 🌍 Translate Section */}
                                {!isMe && message.text && (
                                    <div className="flex flex-col mt-2 self-start gap-1">
                                        {!showTranslateOptions[message._id] ? (
                                            <button
                                                className="text-xs text-purple-600 self-end cursor-pointer"
                                                onClick={() =>
                                                    setShowTranslateOptions((prev) => ({
                                                        ...prev,
                                                        [message._id]: true,
                                                    }))
                                                }
                                            >
                                                🌍 Translate
                                            </button>
                                        ) : (
                                            <>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <label className="text-xs">Translate to:</label>
                                                    <select
                                                        className="text-xs border rounded px-1 py-0.5"
                                                        value={selectedLanguages[message._id] || "English"}
                                                        onChange={(e) =>
                                                            setSelectedLanguages((prev) => ({
                                                                ...prev,
                                                                [message._id]: e.target.value,
                                                            }))
                                                        }
                                                    >
                                                        {languageOptions.map((lang) => (
                                                            <option key={lang.code} value={lang.code}>
                                                                {lang.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <button
                                                        className="text-xs text-purple-500 cursor-pointer"
                                                        onClick={() =>
                                                            handleTranslate(
                                                                message._id,
                                                                message.text,
                                                                selectedLanguages[message._id] || "English"
                                                            )
                                                        }
                                                    >
                                                        Translate Now
                                                    </button>
                                                    <button
                                                        className="text-xs text-red-500 cursor-pointer"
                                                        onClick={() =>
                                                            setShowTranslateOptions((prev) => ({
                                                                ...prev,
                                                                [message._id]: false,
                                                            }))
                                                        }
                                                    >
                                                        ❌ Close
                                                    </button>
                                                </div>

                                                {translatedMessages[message._id] && (
                                                    <div className="text-xs italic text-gray-600 mt-1">
                                                        {translatedMessages[message._id]}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}


                                {/* 🔥 Emotion & 💡 Suggest Reply */}
                                {!isMe && message.text && (
                                    <div className="flex justify-end mt-2 flex-wrap gap-2">
                                        <button
                                            className="text-xs text-orange-500 cursor-pointer"
                                            onClick={() => handleShowEmotion(message._id, message.text)}
                                            disabled={emotionLoading[message._id]}
                                        >
                                            {emotionLoading[message._id]
                                                ? "Detecting..."
                                                : "🎭 Show Emotion"}
                                        </button>

                                        <button
                                            className="text-xs text-blue-500 cursor-pointer"
                                            onClick={() => handleSuggestReply(message.text, message._id)}
                                            disabled={loadingSuggestionFor === message._id}
                                        >
                                            {loadingSuggestionFor === message._id
                                                ? "Thinking..."
                                                : "💡 Suggest Reply"}
                                        </button>
                                    </div>
                                )}

                                {/* 🎭 Emotion Result */}
                                {emotionVisible[message._id] && emotions[message._id] && (
                                    <div className="mt-1 text-xl self-end">{emotions[message._id]}</div>
                                )}

                                {/* 💬 Suggested Replies */}
                                {suggestedReplies[message._id]?.length > 0 && (
                                    <div className="flex flex-col mt-2 gap-1">
                                        {suggestedReplies[message._id].map((reply, idx) => (
                                            <button
                                                key={idx}
                                                className="text-sm px-3 py-1.5 rounded-lg font-small 
    text-white bg-gradient-to-r from-indigo-500 to-purple-500 
    hover:from-indigo-600 hover:to-purple-600 
    active:scale-95 transition-all duration-200
    disabled:opacity-50 disabled:cursor-not-allowed text-left cursor-pointer"
                                                onClick={() => handleSendAiReply(reply, message._id)}
                                            >
                                                {reply}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <MessageInput />
        </div>
    );
};

export default ChatContainer;
