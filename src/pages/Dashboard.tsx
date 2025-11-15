import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  EllipsisVertical,
  FileText,
  Phone,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Video,
  LogOut,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useWhatsApp } from "@/hooks/useWhatsApp";
import { useMessages } from "@/hooks/useMessages";
import { Button } from "@/components/ui/button";
import { QRCodeDisplay } from "@/components/whatsapp/QRCodeDisplay";
import { MessageList } from "@/components/whatsapp/MessageList";
import { SendMessageForm } from "@/components/whatsapp/SendMessageForm";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { Chat } from "@/lib/types";

const formatHandle = (id: string) => {
  if (!id) {
    return "-";
  }

  const [number] = id.split("@");
  return number ?? id;
};

const getInitials = (name: string) => {
  if (!name) {
    return "?";
  }

  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0]!.charAt(0).toUpperCase();
  }

  return (
    (parts[0]?.charAt(0) ?? "") + (parts[parts.length - 1]?.charAt(0) ?? "")
  ).toUpperCase();
};

const formatRelativeTime = (timestamp?: Date) => {
  if (!timestamp) {
    return "";
  }

  const diffMs = Date.now() - timestamp.getTime();
  const diffMinutes = Math.round(diffMs / 60000);

  if (diffMinutes < 1) {
    return "baru";
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}m`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}j`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}h`;
};

type ConversationItemProps = {
  conversation: Chat;
  isActive: boolean;
  onSelect: (conversationId: string) => void;
};

const ConversationItem = ({
  conversation,
  isActive,
  onSelect,
}: ConversationItemProps) => {
  const initials = getInitials(conversation.name);
  const handle = formatHandle(conversation.id);
  const lastActivity = formatRelativeTime(conversation.lastMessageAt);

  return (
    <button
      type="button"
      className="flex w-full items-start gap-3 rounded-xl border border-transparent bg-transparent p-3 text-left text-sm transition hover:bg-muted/70 focus-visible:border-ring focus-visible:outline-none"
      data-state={isActive ? "active" : undefined}
      onClick={() => onSelect(conversation.id)}
    >
      <Avatar className="size-10 shrink-0 bg-primary/10 font-semibold text-primary">
        {initials}
      </Avatar>
      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold text-foreground">{conversation.name}</p>
          {lastActivity ? (
            <span className="text-xs text-muted-foreground">{lastActivity}</span>
          ) : null}
        </div>
        <p className="line-clamp-1 text-xs text-muted-foreground">
          {conversation.lastMessage || "Belum ada pesan"}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{handle}</span>
          {conversation.isGroup ? (
            <Badge
              variant="outline"
              className="border-emerald-500/40 text-emerald-600"
            >
              Grup
            </Badge>
          ) : null}
          {conversation.unreadCount > 0 ? (
            <Badge className="ml-auto bg-primary text-primary-foreground text-[10px]">
              {conversation.unreadCount}
            </Badge>
          ) : null}
        </div>
      </div>
    </button>
  );
};

export function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");


  const { qrCode, isReady, isConnected, chats, error, sendMessage, getChats } =
    useWhatsApp();

  const { messages, hasMore, isLoading, loadMore } =
    useMessages(selectedChatId);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleSendMessage = useCallback(
    (number: string, message: string) => {
      sendMessage(number, message);
    },
    [sendMessage]
  );

  const selectedChat = chats.find((c) => c.id === selectedChatId);

  const filteredConversations = useMemo(() => {
    if (!searchTerm.trim()) {
      return chats;
    }

    const term = searchTerm.toLowerCase();
    return chats.filter(
      (conversation) =>
        conversation.name.toLowerCase().includes(term) ||
        formatHandle(conversation.id).toLowerCase().includes(term)
    );
  }, [chats, searchTerm]);

  const totalUnread = useMemo(
    () =>
      chats.reduce(
        (total, conversation) => total + (conversation.unreadCount ?? 0),
        0
      ),
    [chats]
  );

  const connectionStatus = isReady ? "ready" : isConnected ? "connecting" : "error";

  return (
    <main className="flex h-screen w-full overflow-hidden bg-linear-to-br from-background via-background to-muted/40 p-6">
      <section className="flex w-full flex-1 gap-6 overflow-hidden">
        {/* Chat List Sidebar */}
        <Card className="flex h-full w-full max-w-sm flex-col overflow-hidden border-border/60 shadow-lg shadow-primary/5">
          <CardHeader className="space-y-4 pb-0">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <CardTitle className="text-lg">Daftar percakapan</CardTitle>
                <CardDescription>
                  Kelola inbound messages dan kelompokkan berdasarkan prioritas.
                </CardDescription>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="shrink-0">
                    <EllipsisVertical className="size-4" aria-hidden />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                  <DropdownMenuItem>
                    <Plus className="mr-2 size-4" aria-hidden />
                    Percakapan baru
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 size-4" aria-hidden />
                    Pengaturan
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <FileText className="mr-2 size-4" aria-hidden />
                    Lihat laporan
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 size-4" aria-hidden />
                    Logout ({user?.name})
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="relative">
              <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
              <Input
                type="search"
                placeholder="Cari nama atau nomor..."
                className="pl-9"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-secondary/70">
                Semua ({chats.length})
              </Badge>
              <Badge variant="outline">Belum dibaca ({totalUnread})</Badge>
              <Button
                variant="outline"
                size="icon"
                className="ml-auto"
                onClick={getChats}
              >
                <RefreshCw className="size-4" />
              </Button>
            </div>
          </CardContent>
          <Separator />
          <div className="flex flex-1 flex-col overflow-hidden">
            {!isReady ? (
              <div className="flex flex-1 items-center justify-center p-6">
                <QRCodeDisplay
                  qrCode={qrCode}
                  isReady={isReady}
                  error={error}
                />
              </div>
            ) : (
              <ScrollArea className="h-full px-4">
                <div className="flex flex-col gap-1 py-2">
                  {filteredConversations.length > 0 ? (
                    filteredConversations.map((conversation) => (
                      <ConversationItem
                        key={conversation.id}
                        conversation={conversation}
                        isActive={conversation.id === selectedChatId}
                        onSelect={setSelectedChatId}
                      />
                    ))
                  ) : (
                    <p className="text-center text-xs text-muted-foreground">
                      Percakapan tidak ditemukan.
                    </p>
                  )}
                </div>
              </ScrollArea>
            )}
          </div>
          <Separator />
          <CardFooter className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>
              Status koneksi:{" "}
              {connectionStatus === "ready"
                ? "Terhubung dengan WhatsApp Business API"
                : connectionStatus === "connecting"
                ? "Menghubungkan..."
                : "Terputus"}
            </span>
            <ShieldCheck
              className={`size-4 ${
                connectionStatus === "ready"
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
              aria-hidden
            />
          </CardFooter>
        </Card>

        {/* Messages Area */}
        <Card className="flex h-full flex-1 flex-col overflow-hidden border-border/60 shadow-xl shadow-primary/5">
          {selectedChat ? (
            <>
              <CardHeader className="flex flex-col gap-4 pb-4">
                <div className="flex flex-wrap items-center gap-4">
                  <Avatar className="size-12 shrink-0 bg-primary/10 font-semibold text-primary">
                    {getInitials(selectedChat.name)}
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-xl">{selectedChat.name}</CardTitle>
                      <Badge
                        variant={
                          connectionStatus === "ready" ? "outline" : "destructive"
                        }
                        className="gap-1 text-xs"
                      >
                        <span
                          className={`size-2 rounded-full ${
                            connectionStatus === "ready"
                              ? "bg-emerald-500"
                              : "bg-destructive"
                          }`}
                        />
                        {connectionStatus === "ready" ? "Terhubung" : "Tidak siap"}
                      </Badge>
                    </div>
                    <CardDescription>
                      @{formatHandle(selectedChat.id)}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" disabled>
                      <Phone className="size-4" aria-hidden />
                    </Button>
                    <Button variant="outline" size="icon" disabled>
                      <Video className="size-4" aria-hidden />
                    </Button>
                    <Button variant="outline" size="icon" disabled>
                      <FileText className="size-4" aria-hidden />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-border/60 bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
                  <span>
                    Nomor percakapan • {formatHandle(selectedChat.id)}
                  </span>
                  <Separator orientation="vertical" className="hidden h-3 sm:flex" />
                  <span>
                    Pembaruan terakhir{" "}
                    {formatRelativeTime(selectedChat.lastMessageAt) || "belum ada"}
                  </span>
                </div>
              </CardHeader>

              <Separator />

              <CardContent className="flex-1 overflow-hidden p-0">
                <MessageList
                  messages={messages}
                  hasMore={hasMore}
                  isLoading={isLoading}
                  onLoadMore={loadMore}
                  chatName={selectedChat.name}
                />
              </CardContent>

              <Separator />

              <CardFooter className="flex flex-col gap-4">
                <div className="flex w-full flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>
                    {connectionStatus === "ready"
                      ? "Mengetik sebagai Admin • Semua pesan direkam untuk audit."
                      : "Menunggu koneksi ke WhatsApp..."}
                  </span>
                  <span>Zona waktu: WIB (GMT+7)</span>
                </div>
                <SendMessageForm
                  onSend={handleSendMessage}
                  selectedChatId={selectedChatId}
                  isReady={isReady}
                />
              </CardFooter>
            </>
          ) : (
            <div className="flex h-full flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
              <CardTitle>Tidak ada percakapan terpilih</CardTitle>
              <CardDescription>
                Pilih salah satu percakapan di sisi kiri untuk mulai berinteraksi
                dengan pelanggan.
              </CardDescription>
            </div>
          )}
        </Card>
      </section>
    </main>
  );
}
