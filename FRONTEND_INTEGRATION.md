# Frontend Integration Guide - React TypeScript + shadcn/ui

Dokumentasi lengkap untuk integrasi frontend React TypeScript dengan backend WhatsApp Application Monitoring.

## 📋 Prerequisites

- React 18+
- TypeScript
- shadcn/ui
- Socket.IO Client
- Axios atau Fetch API

## 🚀 Setup Dependencies

```bash
# Install dependencies
npm install socket.io-client axios
npm install -D @types/socket.io-client

# Jika belum setup shadcn/ui
npx shadcn-ui@latest init
```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   └── RegisterForm.tsx
│   │   ├── whatsapp/
│   │   │   ├── QRCodeDisplay.tsx
│   │   │   ├── ChatList.tsx
│   │   │   ├── MessageList.tsx
│   │   │   └── SendMessageForm.tsx
│   │   └── ui/              # shadcn components
│   ├── lib/
│   │   ├── api.ts           # API client
│   │   ├── socket.ts        # Socket.IO client
│   │   └── types.ts         # TypeScript types
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useWhatsApp.ts
│   │   └── useMessages.ts
│   ├── context/
│   │   └── AuthContext.tsx
│   └── pages/
│       ├── Login.tsx
│       ├── Register.tsx
│       └── Dashboard.tsx
```

## 🔧 Configuration

### 1. Environment Variables

Buat file `.env`:

```env
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
```

## 📝 Implementation

### 1. TypeScript Types

**`src/lib/types.ts`**

```typescript
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
```

### 2. API Client

**`src/lib/api.ts`**

```typescript
import axios, { AxiosInstance } from 'axios';
import type {
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
  MessageHistory,
  Chat,
  Statistics,
} from './types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_URL}/api`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to requests
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle 401 errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Authentication
  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const { data } = await this.client.post<AuthResponse>('/auth/register', credentials);
    return data;
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { data } = await this.client.post<AuthResponse>('/auth/login', credentials);
    return data;
  }

  // Messages
  async getMessageHistory(chatId: string, limit = 50, before?: string): Promise<MessageHistory> {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (before) params.append('before', before);
    
    const { data } = await this.client.get<MessageHistory>(`/messages/${chatId}?${params}`);
    return data;
  }

  async getChats(limit = 100): Promise<{ chats: Chat[]; count: number }> {
    const { data } = await this.client.get(`/messages?limit=${limit}`);
    return data;
  }

  // Statistics
  async getStatistics(): Promise<Statistics> {
    const { data } = await this.client.get<Statistics>('/stats');
    return data;
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string; mongodb: string }> {
    const { data } = await this.client.get('/health');
    return data;
  }
}

export const api = new ApiClient();
```

### 3. Socket.IO Client

**`src/lib/socket.ts`**

```typescript
import { io, Socket } from 'socket.io-client';
import type { IncomingMessage, SendMessageData, MessageSentResponse, Chat } from './types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

export class SocketClient {
  private socket: Socket | null = null;
  private listeners: Map<string, Function[]> = new Map();

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

    this.socket.on('messagesHistory', (data: any) => {
      this.emit('messagesHistory', data);
    });

    this.socket.on('error', (error: { message: string }) => {
      this.emit('error', error);
    });
  }

  // Event emitter
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, ...args: any[]) {
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
```

### 4. Auth Context

**`src/context/AuthContext.tsx`**

```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { socketClient } from '@/lib/socket';
import type { User, LoginCredentials, RegisterCredentials } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load user from localStorage
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      // Connect socket
      socketClient.connect(storedToken);
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const response = await api.login(credentials);
    setToken(response.token);
    setUser(response.user);
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    // Connect socket
    socketClient.connect(response.token);
  };

  const register = async (credentials: RegisterCredentials) => {
    const response = await api.register(credentials);
    setToken(response.token);
    setUser(response.user);
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    // Connect socket
    socketClient.connect(response.token);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Disconnect socket
    socketClient.disconnect();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        isAuthenticated: !!token,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

### 5. Custom Hooks

**`src/hooks/useWhatsApp.ts`**

```typescript
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
```

**`src/hooks/useMessages.ts`**

```typescript
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
```

### 6. Components

**`src/components/auth/LoginForm.tsx`**

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>Login to your WhatsApp monitoring account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Login'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

**`src/components/whatsapp/QRCodeDisplay.tsx`**

```typescript
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

interface QRCodeDisplayProps {
  qrCode: string | null;
  isReady: boolean;
  error: string | null;
}

export function QRCodeDisplay({ qrCode, isReady, error }: QRCodeDisplayProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>WhatsApp Connection</CardTitle>
        <CardDescription>
          {isReady
            ? 'WhatsApp is connected and ready'
            : 'Scan QR code with your WhatsApp to connect'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isReady ? (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-lg font-semibold text-green-600">Connected!</p>
            <p className="text-sm text-muted-foreground mt-2">
              Your WhatsApp is connected and ready to use
            </p>
          </div>
        ) : qrCode ? (
          <div className="space-y-4">
            <img src={qrCode} alt="QR Code" className="w-64 h-64 mx-auto" />
            <p className="text-sm text-center text-muted-foreground">
              Open WhatsApp on your phone → Settings → Linked Devices → Link a Device
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Initializing WhatsApp client...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

**`src/components/whatsapp/ChatList.tsx`**

```typescript
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { RefreshCw } from 'lucide-react';
import type { Chat } from '@/lib/types';

interface ChatListProps {
  chats: Chat[];
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onRefresh: () => void;
}

export function ChatList({ chats, selectedChatId, onSelectChat, onRefresh }: ChatListProps) {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>Chats</CardTitle>
        <Button variant="ghost" size="icon" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-12rem)]">
          {chats.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No chats yet. Send a message to start!
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => onSelectChat(chat.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedChatId === chat.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold truncate">{chat.name}</p>
                        {chat.isGroup && (
                          <Badge variant="secondary" className="text-xs">
                            Group
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm truncate opacity-80">{chat.lastMessage}</p>
                    </div>
                    {chat.unreadCount > 0 && (
                      <Badge className="ml-2">{chat.unreadCount}</Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
```

Lanjut ke bagian berikutnya...
