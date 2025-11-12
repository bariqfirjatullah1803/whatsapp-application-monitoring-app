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

