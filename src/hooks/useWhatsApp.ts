import { useState, useEffect, useCallback } from 'react';
import { socketClient } from '@/lib/socket';
import type { IncomingMessage, Chat } from '@/lib/types';

export function useWhatsApp() {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // QR Code
    const handleQR = (qr: string) => {
      setQrCode(qr);
      setIsReady(false);
    };

    // Ready
    const handleReady = () => {
      setIsReady(true);
      setQrCode(null);
      setError(null);
    };

    // Connected
    const handleConnected = () => {
      setIsConnected(true);
    };

    // Disconnected
    const handleDisconnected = () => {
      setIsConnected(false);
    };

    // WhatsApp disconnected
    const handleWhatsAppDisconnected = (reason: string) => {
      setIsReady(false);
      setError(`WhatsApp disconnected: ${reason}`);
    };

    // Chats list
    const handleChatsList = (chatsList: Chat[]) => {
      setChats(chatsList);
    };

    // Error
    const handleError = (err: any) => {
      setError(err.message || 'An error occurred');
    };

    // Register listeners
    socketClient.on('qr', handleQR);
    socketClient.on('ready', handleReady);
    socketClient.on('connected', handleConnected);
    socketClient.on('disconnected', handleDisconnected);
    socketClient.on('whatsapp_disconnected', handleWhatsAppDisconnected);
    socketClient.on('chatsList', handleChatsList);
    socketClient.on('error', handleError);

    // Cleanup
    return () => {
      socketClient.off('qr', handleQR);
      socketClient.off('ready', handleReady);
      socketClient.off('connected', handleConnected);
      socketClient.off('disconnected', handleDisconnected);
      socketClient.off('whatsapp_disconnected', handleWhatsAppDisconnected);
      socketClient.off('chatsList', handleChatsList);
      socketClient.off('error', handleError);
    };
  }, []);

  const sendMessage = useCallback((number: string, message: string) => {
    socketClient.sendMessage({ number, message });
  }, []);

  const getChats = useCallback(() => {
    socketClient.getChats();
  }, []);

  const getMessages = useCallback((chatId: string, limit = 50, before?: string) => {
    socketClient.getMessages(chatId, limit, before);
  }, []);

  return {
    qrCode,
    isReady,
    isConnected,
    chats,
    error,
    sendMessage,
    getChats,
    getMessages,
  };
}

