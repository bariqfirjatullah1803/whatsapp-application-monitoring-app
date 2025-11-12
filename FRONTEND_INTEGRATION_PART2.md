# Frontend Integration Guide - Part 2

## Components (Lanjutan)

### **`src/components/whatsapp/MessageList.tsx`**

```typescript
import { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import type { Message } from '@/lib/types';
import { format } from 'date-fns';

interface MessageListProps {
  messages: Message[];
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  chatName?: string;
}

export function MessageList({
  messages,
  hasMore,
  isLoading,
  onLoadMore,
  chatName,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle>{chatName || 'Select a chat'}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-[calc(100vh-16rem)] px-4" ref={scrollRef}>
          {hasMore && (
            <div className="text-center py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={onLoadMore}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load more'
                )}
              </Button>
            </div>
          )}

          <div className="space-y-4 py-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No messages yet
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.direction === 'outgoing' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      message.direction === 'outgoing'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {message.direction === 'incoming' && message.contactName && (
                      <p className="text-xs font-semibold mb-1 opacity-80">
                        {message.contactName}
                      </p>
                    )}
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.body}
                    </p>
                    <p className="text-xs opacity-70 mt-1">
                      {format(new Date(message.timestamp), 'HH:mm')}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
```

### **`src/components/whatsapp/SendMessageForm.tsx`**

```typescript
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';

interface SendMessageFormProps {
  onSend: (number: string, message: string) => void;
  selectedChatId?: string | null;
  isReady: boolean;
}

export function SendMessageForm({ onSend, selectedChatId, isReady }: SendMessageFormProps) {
  const [number, setNumber] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const targetNumber = selectedChatId
      ? selectedChatId.replace('@c.us', '').replace('@g.us', '')
      : number;

    if (!targetNumber) return;

    onSend(targetNumber, message);
    setMessage('');
    if (!selectedChatId) setNumber('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {!selectedChatId && (
            <Input
              placeholder="Phone number (e.g., 628123456789)"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              required
              disabled={!isReady}
            />
          )}

          <div className="flex gap-2">
            <Textarea
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="min-h-[60px] resize-none"
              disabled={!isReady}
            />
            <Button
              type="submit"
              size="icon"
              className="h-[60px] w-[60px]"
              disabled={!isReady || !message.trim()}
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>

          {!isReady && (
            <p className="text-sm text-muted-foreground">
              WhatsApp is not connected. Please scan QR code first.
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
```

### **`src/components/whatsapp/Statistics.tsx`**

```typescript
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import type { Statistics as StatsType } from '@/lib/types';
import { MessageSquare, Users, ArrowDown, ArrowUp, Wifi } from 'lucide-react';

export function Statistics() {
  const [stats, setStats] = useState<StatsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const data = await api.getStatistics();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !stats) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalMessages}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Chats</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalChats}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Incoming</CardTitle>
          <ArrowDown className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.incomingCount}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Outgoing</CardTitle>
          <ArrowUp className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.outgoingCount}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Connection</CardTitle>
          <Wifi
            className={`h-4 w-4 ${
              stats.whatsappConnected ? 'text-green-600' : 'text-red-600'
            }`}
          />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.whatsappConnected ? 'Online' : 'Offline'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

## Pages

### **`src/pages/Login.tsx`**

```typescript
import { Link } from 'react-router-dom';
import { LoginForm } from '@/components/auth/LoginForm';

export function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">WhatsApp Monitoring</h1>
          <p className="text-muted-foreground mt-2">
            Monitor and manage your WhatsApp messages
          </p>
        </div>

        <LoginForm />

        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
```

### **`src/pages/Register.tsx`**

```typescript
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await register({ name, email, password });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Create Account</h1>
          <p className="text-muted-foreground mt-2">
            Start monitoring your WhatsApp messages
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Register</CardTitle>
            <CardDescription>Create your account to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

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
                  minLength={6}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Creating account...' : 'Register'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}
```

### **`src/pages/Dashboard.tsx`**

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useWhatsApp } from '@/hooks/useWhatsApp';
import { useMessages } from '@/hooks/useMessages';
import { Button } from '@/components/ui/button';
import { QRCodeDisplay } from '@/components/whatsapp/QRCodeDisplay';
import { ChatList } from '@/components/whatsapp/ChatList';
import { MessageList } from '@/components/whatsapp/MessageList';
import { SendMessageForm } from '@/components/whatsapp/SendMessageForm';
import { Statistics } from '@/components/whatsapp/Statistics';
import { LogOut } from 'lucide-react';

export function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  const {
    qrCode,
    isReady,
    isConnected,
    chats,
    error,
    sendMessage,
    getChats,
  } = useWhatsApp();

  const { messages, hasMore, isLoading, loadMore } = useMessages(selectedChatId);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSendMessage = (number: string, message: string) => {
    sendMessage(number, message);
  };

  const selectedChat = chats.find((c) => c.id === selectedChatId);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">WhatsApp Monitoring</h1>
            <p className="text-sm text-muted-foreground">Welcome, {user?.name}</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Statistics */}
        <Statistics />

        {/* WhatsApp Connection Status */}
        {!isReady && (
          <QRCodeDisplay qrCode={qrCode} isReady={isReady} error={error} />
        )}

        {/* Chat Interface */}
        {isReady && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chat List */}
            <div className="lg:col-span-1">
              <ChatList
                chats={chats}
                selectedChatId={selectedChatId}
                onSelectChat={setSelectedChatId}
                onRefresh={getChats}
              />
            </div>

            {/* Messages */}
            <div className="lg:col-span-2 space-y-4">
              <MessageList
                messages={messages}
                hasMore={hasMore}
                isLoading={isLoading}
                onLoadMore={loadMore}
                chatName={selectedChat?.name}
              />

              <SendMessageForm
                onSend={handleSendMessage}
                selectedChatId={selectedChatId}
                isReady={isReady}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
```

## App Setup

### **`src/App.tsx`**

```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { LoginPage } from '@/pages/Login';
import { RegisterPage } from '@/pages/Register';
import { DashboardPage } from '@/pages/Dashboard';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
```

### **`src/main.tsx`**

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

## Additional Dependencies

```bash
# Install additional packages
npm install react-router-dom date-fns lucide-react

# Install types
npm install -D @types/react-router-dom
```

## shadcn/ui Components to Install

```bash
# Install required shadcn components
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add scroll-area
```

## Testing

### 1. Start Backend

```bash
cd backend
npm start
```

### 2. Start Frontend

```bash
cd frontend
npm run dev
```

### 3. Test Flow

1. Register user di `/register`
2. Login di `/login`
3. Dashboard akan otomatis connect Socket.IO
4. Scan QR code yang muncul
5. Setelah connected, bisa send/receive messages

## 🎯 Key Features

- ✅ **Authentication** - Login/Register dengan JWT
- ✅ **Real-time** - Socket.IO untuk real-time messages
- ✅ **QR Code** - Display QR code untuk WhatsApp connection
- ✅ **Chat List** - List semua chats dengan unread count
- ✅ **Messages** - Display messages dengan pagination
- ✅ **Send Message** - Send message ke contact atau group
- ✅ **Statistics** - Display statistics dashboard
- ✅ **Responsive** - Mobile-friendly design
- ✅ **TypeScript** - Full type safety
- ✅ **shadcn/ui** - Beautiful UI components

## 📱 Screenshots Flow

1. **Login Page** → User login
2. **Dashboard** → Show QR code jika belum connected
3. **Scan QR** → User scan dengan WhatsApp
4. **Connected** → Show chat list dan message interface
5. **Send/Receive** → Real-time messaging

Selamat mengimplementasikan! 🚀
