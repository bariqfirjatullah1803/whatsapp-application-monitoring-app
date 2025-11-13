import { useState, useEffect, useCallback } from "react";
import { socketClient } from "@/lib/socket";
import { api } from "@/lib/api";
import type { Message, IncomingMessage, MessageSentResponse } from "@/lib/types";

export function useMessages(chatId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load messages from API
  const loadMessages = useCallback(async () => {
    if (!chatId) return;

    setIsLoading(true);
    try {
      const data = await api.getMessageHistory(chatId);
      console.log("[LOAD MESSAGES]");
      setMessages(data.messages);
      setHasMore(data.hasMore);
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setIsLoading(false);
    }
  }, [chatId]);

  // Load more messages
  const loadMore = useCallback(async () => {
    console.log("[LOAD MORE MESSAGES]");
    if (!chatId || !hasMore || isLoading) return;

    const oldestMessage = messages[0];
    if (!oldestMessage) return;

    setIsLoading(true);
    try {
      const data = await api.getMessageHistory(
        chatId,
        50,
        oldestMessage.timestamp.toString()
      );
      // Deduplication: filter out messages that already exist
      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const newMessages = data.messages.filter((m) => !existingIds.has(m.id));
        return [...newMessages, ...prev];
      });
      setHasMore(data.hasMore);
    } catch (error) {
      console.error("Error loading more messages:", error);
    } finally {
      setIsLoading(false);
    }
  }, [chatId, messages, hasMore, isLoading]);

  // Listen for new messages
  useEffect(() => {
    const handleNewMessage = (...args: unknown[]) => {
      const msg = args[0] as IncomingMessage;
      console.log("[NEW MESSAGE]");
      // Only add if it's for current chat
      if (chatId && msg.number === chatId) {
        // Use messageId if available, otherwise generate unique ID
        const messageId = msg.messageId || `${msg.timestamp}-${Math.random().toString(36).substr(2, 9)}`;
        
        const newMessage: Message = {
          id: messageId,
          direction: "incoming",
          from: msg.from,
          to: msg.number,
          body: msg.body,
          timestamp: new Date(msg.timestamp * 1000),
          isGroup: msg.isGroup,
          chatName: msg.chatName,
          contactName: msg.from,
        };
        
        // Deduplication: check if message already exists
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === messageId);
          if (exists) {
            console.log("[DUPLICATE MESSAGE] Skipping duplicate message:", messageId);
            return prev;
          }
          return [...prev, newMessage];
        });
      }
    };

    const handleMessageSent = (...args: unknown[]) => {
      const response = args[0] as MessageSentResponse;
      // Add sent message to list
      if (chatId && response.to === chatId.replace("@c.us", "")) {
        const messageId = response.messageId || `sent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const newMessage: Message = {
          id: messageId,
          direction: "outgoing",
          from: "me",
          to: response.to,
          body: response.message,
          timestamp: new Date(),
          isGroup: false,
        };
        
        // Deduplication: check if message already exists
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === messageId);
          if (exists) {
            console.log("[DUPLICATE MESSAGE] Skipping duplicate message:", messageId);
            return prev;
          }
          return [...prev, newMessage];
        });
      }
    };

    socketClient.on("message", handleNewMessage);
    socketClient.on("messageSent", handleMessageSent);

    return () => {
      socketClient.off("message", handleNewMessage);
      socketClient.off("messageSent", handleMessageSent);
    };
  }, [chatId]);

  // Load messages when chatId changes
  useEffect(() => {
    if (chatId) {
      loadMessages();
    } else {
      setMessages([]);
    }
  }, [chatId, loadMessages]);

  return {
    messages,
    hasMore,
    isLoading,
    loadMore,
    reload: loadMessages,
  };
}
