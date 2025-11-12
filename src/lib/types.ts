// User types
export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
}

// Message types
export interface Message {
  id: string;
  direction: 'incoming' | 'outgoing';
  from: string;
  to: string;
  body: string;
  timestamp: Date;
  isGroup: boolean;
  chatName?: string;
  contactName?: string;
}

export interface Chat {
  id: string;
  name: string;
  isGroup: boolean;
  unreadCount: number;
  lastMessage: string;
  lastMessageAt?: Date;
}

export interface MessageHistory {
  chatId: string;
  messages: Message[];
  hasMore: boolean;
  count: number;
}

// Socket events
export interface IncomingMessage {
  from: string;
  number: string;
  body: string;
  timestamp: number;
  isGroup: boolean;
  chatName: string;
}

export interface SendMessageData {
  number: string;
  message: string;
}

export interface MessageSentResponse {
  success: boolean;
  to: string;
  message: string;
  messageId: string;
}

// Statistics
export interface Statistics {
  totalMessages: number;
  totalChats: number;
  incomingCount: number;
  outgoingCount: number;
  whatsappConnected: boolean;
}

