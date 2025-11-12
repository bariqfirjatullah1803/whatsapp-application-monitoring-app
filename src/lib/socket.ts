import { io, Socket } from 'socket.io-client';
import type { IncomingMessage, SendMessageData, MessageSentResponse, Chat } from './types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

type EventCallback = (...args: unknown[]) => void;

export class SocketClient {
  private socket: Socket | null = null;
  private listeners: Map<string, EventCallback[]> = new Map();

  connect(token: string) {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.setupEventHandlers();
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
    }
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.emit('connected');
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.emit('disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.emit('error', error);
    });

    // WhatsApp events
    this.socket.on('qr', (qrCode: string) => {
      this.emit('qr', qrCode);
    });

    this.socket.on('ready', (data: { message: string }) => {
      this.emit('ready', data);
    });

    this.socket.on('authenticated', () => {
      this.emit('authenticated');
    });

    this.socket.on('auth_failure', (msg: string) => {
      this.emit('auth_failure', msg);
    });

    this.socket.on('disconnected', (reason: string) => {
      this.emit('whatsapp_disconnected', reason);
    });

    this.socket.on('message', (message: IncomingMessage) => {
      this.emit('message', message);
    });

    this.socket.on('messageSent', (response: MessageSentResponse) => {
      this.emit('messageSent', response);
    });

    this.socket.on('chatsList', (chats: Chat[]) => {
      this.emit('chatsList', chats);
    });

    this.socket.on('messagesHistory', (data: unknown) => {
      this.emit('messagesHistory', data);
    });

    this.socket.on('error', (error: { message: string }) => {
      this.emit('error', error);
    });
  }

  // Event emitter
  on(event: string, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: EventCallback) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, ...args: unknown[]) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(...args));
    }
  }

  // WhatsApp actions
  sendMessage(data: SendMessageData) {
    if (!this.socket?.connected) {
      throw new Error('Socket not connected');
    }
    this.socket.emit('sendMessage', data);
  }

  getChats() {
    if (!this.socket?.connected) {
      throw new Error('Socket not connected');
    }
    this.socket.emit('getChats');
  }

  getMessages(chatId: string, limit = 50, before?: string) {
    if (!this.socket?.connected) {
      throw new Error('Socket not connected');
    }
    this.socket.emit('getMessages', { chatId, limit, before });
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const socketClient = new SocketClient();

