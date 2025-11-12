import { useState, useEffect, useCallback } from 'react';
import { socketClient } from '@/lib/socket';
import { api } from '@/lib/api';
import type { Message, IncomingMessage } from '@/lib/types';

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
      setMessages(data.messages);
      setHasMore(data.hasMore);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [chatId]);

  // Load more messages
  const loadMore = useCallback(async () => {
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
      setMessages((prev) => [...data.messages, ...prev]);
      setHasMore(data.hasMore);
    } catch (error) {
      console.error('Error loading more messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [chatId, messages, hasMore, isLoading]);

  // Listen for new messages
  useEffect(() => {
    const handleNewMessage = (msg: IncomingMessage) => {
      // Only add if it's for current chat
      if (chatId && msg.number === chatId) {
        const newMessage: Message = {
          id: `${Date.now()}`,
          direction: 'incoming',
          from: msg.from,
          to: msg.number,
          body: msg.body,
          timestamp: new Date(msg.timestamp * 1000),
          isGroup: msg.isGroup,
          chatName: msg.chatName,
          contactName: msg.from,
        };
        setMessages((prev) => [...prev, newMessage]);
      }
    };

    const handleMessageSent = (response: any) => {
      // Add sent message to list
      if (chatId && response.to === chatId.replace('@c.us', '')) {
        const newMessage: Message = {
          id: response.messageId,
          direction: 'outgoing',
          from: 'me',
          to: response.to,
          body: response.message,
          timestamp: new Date(),
          isGroup: false,
        };
        setMessages((prev) => [...prev, newMessage]);
      }
    };

    socketClient.on('message', handleNewMessage);
    socketClient.on('messageSent', handleMessageSent);

    return () => {
      socketClient.off('message', handleNewMessage);
      socketClient.off('messageSent', handleMessageSent);
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

