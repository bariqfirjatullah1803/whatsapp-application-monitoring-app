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

