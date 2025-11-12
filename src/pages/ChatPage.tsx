import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import {
  EllipsisVertical,
  FileText,
  Phone,
  Plus,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Video,
} from "lucide-react"

import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { connectSocket, disconnectSocket, getSocket } from "@/services/socket"

type Conversation = {
  id: string
  name: string
  isGroup: boolean
  unreadCount: number
  lastMessage: string
  lastMessageAt?: number
}

type ChatMessage = {
  id: string
  direction: "incoming" | "outgoing"
  content: string
  time: string
  status?: "sent" | "delivered" | "read"
}

const formatHandle = (id: string) => {
  if (!id) {
    return "-"
  }

  const [number] = id.split("@")
  return number ?? id
}

const getInitials = (name: string) => {
  if (!name) {
    return "?"
  }

  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) {
    return parts[0]!.charAt(0).toUpperCase()
  }

  return (
    (parts[0]?.charAt(0) ?? "") + (parts[parts.length - 1]?.charAt(0) ?? "")
  ).toUpperCase()
}

const formatRelativeTime = (timestamp?: number) => {
  if (!timestamp) {
    return ""
  }

  const diffMs = Date.now() - timestamp
  const diffMinutes = Math.round(diffMs / 60000)

  if (diffMinutes < 1) {
    return "baru"
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}m`
  }

  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) {
    return `${diffHours}j`
  }

  const diffDays = Math.round(diffHours / 24)
  return `${diffDays}h`
}

const formatMessageTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

type ConversationItemProps = {
  conversation: Conversation
  isActive: boolean
  onSelect: (conversationId: string) => void
}

const ConversationItem = ({ conversation, isActive, onSelect }: ConversationItemProps) => {
  const initials = getInitials(conversation.name)
  const handle = formatHandle(conversation.id)
  const lastActivity = formatRelativeTime(conversation.lastMessageAt)

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
            <Badge variant="outline" className="border-emerald-500/40 text-emerald-600">
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
  )
}

const MessageBubble = ({ message }: { message: ChatMessage }) => {
  const isOutgoing = message.direction === "outgoing"

  return (
    <div className={`flex w-full flex-col gap-1 ${isOutgoing ? "items-end" : "items-start"}`}>
      <div
        className={`flex max-w-[75%] flex-col gap-1 rounded-2xl px-4 py-3 text-sm shadow ${
          isOutgoing
            ? "rounded-br-md bg-primary text-primary-foreground"
            : "rounded-bl-md bg-muted"
        }`}
      >
        <p>{message.content}</p>
      </div>
      <span className="text-xs text-muted-foreground">
        {message.time}
        {isOutgoing && message.status === "read" ? " • Dibaca" : null}
        {isOutgoing && message.status === "delivered" ? " • Terkirim" : null}
        {isOutgoing && message.status === "sent" ? " • Terkirim" : null}
      </span>
    </div>
  )
}

export const ChatPage = () => {
  const socket = useMemo(() => getSocket(), [])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({})
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [composer, setComposer] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "ready" | "error">(
    "connecting"
  )
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const activeConversationIdRef = useRef<string | null>(null)

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId
  }, [activeConversationId])

  useEffect(() => {
    connectSocket()

    const handleReady = () => {
      setConnectionStatus("ready")
      setErrorMessage(null)
      socket.emit("getChats")
    }

    const handleChatsList = (
      payload: Array<{
        id: string
        name: string
        isGroup: boolean
        unreadCount: number
        lastMessage: string
      }>
    ) => {
      setConversations(() =>
        payload.map((chat, index) => ({
          id: chat.id,
          name: chat.name || formatHandle(chat.id),
          isGroup: chat.isGroup,
          unreadCount: chat.unreadCount ?? 0,
          lastMessage: chat.lastMessage ?? "",
          lastMessageAt: Date.now() - index,
        }))
      )

      if (!activeConversationIdRef.current && payload.length > 0) {
        setActiveConversationId(payload[0]!.id)
      }
    }

    const handleIncomingMessage = (payload: {
      from: string
      number: string
      body: string
      timestamp: number
      isGroup: boolean
      chatName: string
    }) => {
      const chatId = payload.number
      const timestampMs =
        (payload.timestamp ? payload.timestamp * 1000 : Date.now()) ?? Date.now()

      setMessages((prev) => {
        const current = prev[chatId] ?? []
        const incoming: ChatMessage = {
          id: `incoming-${timestampMs}-${current.length}`,
          direction: "incoming",
          content: payload.body,
          time: formatMessageTime(timestampMs),
        }
        return {
          ...prev,
          [chatId]: [...current, incoming],
        }
      })

      setConversations((prev) => {
        const existing = prev.find((conversation) => conversation.id === chatId)
        const base: Conversation =
          existing ??
          ({
            id: chatId,
            name: payload.chatName || payload.from || formatHandle(chatId),
            isGroup: payload.isGroup,
            unreadCount: 0,
            lastMessage: "",
          } satisfies Conversation)

        const updated: Conversation = {
          ...base,
          lastMessage: payload.body,
          lastMessageAt: timestampMs,
          unreadCount:
            activeConversationIdRef.current === chatId
              ? 0
              : (base.unreadCount ?? 0) + 1,
        }

        const others = prev.filter((conversation) => conversation.id !== chatId)
        return [updated, ...others]
      })
    }

    const handleMessageSent = (payload: { success: boolean; to: string; message: string }) => {
      const chatId = payload.to.includes("@") ? payload.to : `${payload.to}@c.us`
      const timestampMs = Date.now()

      const outgoing: ChatMessage = {
        id: `outgoing-${timestampMs}`,
        direction: "outgoing",
        content: payload.message,
        time: formatMessageTime(timestampMs),
        status: payload.success ? "sent" : undefined,
      }

      setMessages((prev) => {
        const current = prev[chatId] ?? []
        return {
          ...prev,
          [chatId]: [...current, outgoing],
        }
      })

      setConversations((prev) => {
        const existing = prev.find((conversation) => conversation.id === chatId)
        const base: Conversation =
          existing ??
          ({
            id: chatId,
            name: formatHandle(chatId),
            isGroup: false,
            unreadCount: 0,
            lastMessage: "",
          } satisfies Conversation)

        const updated: Conversation = {
          ...base,
          lastMessage: payload.message,
          lastMessageAt: timestampMs,
          unreadCount: base.id === activeConversationIdRef.current ? 0 : base.unreadCount ?? 0,
        }

        const others = prev.filter((conversation) => conversation.id !== chatId)
        return [updated, ...others]
      })

      setIsSending(false)
    }

    const handleError = (payload: { message: string }) => {
      setErrorMessage(payload.message)
      setConnectionStatus("error")
      setIsSending(false)
    }

    const handleDisconnected = (reason: string) => {
      setConnectionStatus("error")
      setErrorMessage(`Terputus: ${reason}`)
    }

    const handleAuthFailure = (message: string) => {
      setConnectionStatus("error")
      setErrorMessage(`Gagal autentikasi: ${message}`)
    }

    socket.on("ready", handleReady)
    socket.on("chatsList", handleChatsList)
    socket.on("message", handleIncomingMessage)
    socket.on("messageSent", handleMessageSent)
    socket.on("error", handleError)
    socket.on("disconnected", handleDisconnected)
    socket.on("auth_failure", handleAuthFailure)

    if (socket.connected) {
      setConnectionStatus("ready")
      socket.emit("getChats")
    }

    return () => {
      socket.off("ready", handleReady)
      socket.off("chatsList", handleChatsList)
      socket.off("message", handleIncomingMessage)
      socket.off("messageSent", handleMessageSent)
      socket.off("error", handleError)
      socket.off("disconnected", handleDisconnected)
      socket.off("auth_failure", handleAuthFailure)
      disconnectSocket()
    }
  }, [socket])

  useEffect(() => {
    if (!activeConversationId) {
      return
    }

    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.id === activeConversationId
          ? { ...conversation, unreadCount: 0 }
          : conversation
      )
    )
  }, [activeConversationId])

  const filteredConversations = useMemo(() => {
    if (!searchTerm.trim()) {
      return conversations
    }

    const term = searchTerm.toLowerCase()
    return conversations.filter(
      (conversation) =>
        conversation.name.toLowerCase().includes(term) ||
        formatHandle(conversation.id).toLowerCase().includes(term)
    )
  }, [conversations, searchTerm])

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId) ?? null,
    [conversations, activeConversationId]
  )

  const currentMessages = activeConversation
    ? messages[activeConversation.id] ?? []
    : []

  const totalUnread = useMemo(
    () => conversations.reduce((total, conversation) => total + (conversation.unreadCount ?? 0), 0),
    [conversations]
  )

  const handleSelectConversation = useCallback((conversationId: string) => {
    setActiveConversationId(conversationId)
  }, [])

  const handleSendMessage = useCallback(() => {
    if (!activeConversationIdRef.current) {
      return
    }

    const trimmed = composer.trim()
    if (!trimmed) {
      return
    }

    setIsSending(true)
    socket.emit("sendMessage", {
      number: activeConversationIdRef.current,
      message: trimmed,
    })
    setComposer("")
  }, [composer, socket])

  const canSendMessage =
    connectionStatus === "ready" &&
    !isSending &&
    Boolean(composer.trim()) &&
    Boolean(activeConversation)

  return (
    <main className="flex h-screen w-full overflow-hidden bg-linear-to-br from-background via-background to-muted/40 p-6">
      <section className="flex w-full flex-1 gap-6 overflow-hidden">
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
                  <DropdownMenuLabel>Aksi percakapan</DropdownMenuLabel>
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
                Semua ({conversations.length})
              </Badge>
              <Badge variant="outline">Belum dibaca ({totalUnread})</Badge>
              <Badge variant="outline">Filter lain</Badge>
            </div>
          </CardContent>
          <Separator />
          <div className="flex flex-1 flex-col overflow-hidden">
            <ScrollArea className="h-full px-4">
              <div className="flex flex-col gap-1 py-2">
                {filteredConversations.length > 0 ? (
                  filteredConversations.map((conversation) => (
                    <ConversationItem
                      key={conversation.id}
                      conversation={conversation}
                      isActive={conversation.id === activeConversationId}
                      onSelect={handleSelectConversation}
                    />
                  ))
                ) : (
                  <p className="text-center text-xs text-muted-foreground">
                    Percakapan tidak ditemukan.
                  </p>
                )}
              </div>
            </ScrollArea>
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
              className={`size-4 ${connectionStatus === "ready" ? "text-primary" : "text-muted-foreground"}`}
              aria-hidden
            />
          </CardFooter>
        </Card>

        <Card className="flex h-full flex-1 flex-col overflow-hidden border-border/60 shadow-xl shadow-primary/5">
          {activeConversation ? (
            <>
              <CardHeader className="flex flex-col gap-4 pb-4">
                <div className="flex flex-wrap items-center gap-4">
                  <Avatar className="size-12 shrink-0 bg-primary/10 font-semibold text-primary">
                    {getInitials(activeConversation.name)}
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-xl">{activeConversation.name}</CardTitle>
                      <Badge
                        variant={connectionStatus === "ready" ? "outline" : "destructive"}
                        className="gap-1 text-xs"
                      >
                        <span
                          className={`size-2 rounded-full ${connectionStatus === "ready" ? "bg-emerald-500" : "bg-destructive"}`}
                        />
                        {connectionStatus === "ready" ? "Terhubung" : "Tidak siap"}
                      </Badge>
                    </div>
                    <CardDescription>@{formatHandle(activeConversation.id)}</CardDescription>
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
                  <span>Nomor percakapan • {formatHandle(activeConversation.id)}</span>
                  <Separator orientation="vertical" className="hidden h-3 sm:flex" />
                  <span>
                    Pembaruan terakhir {formatRelativeTime(activeConversation.lastMessageAt) || "belum ada"}
                  </span>
                </div>
              </CardHeader>

              <Separator />

              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full px-6 py-6">
                  <div className="flex flex-col gap-4">
                    {currentMessages.length > 0 ? (
                      currentMessages.map((message) => (
                        <MessageBubble key={message.id} message={message} />
                      ))
                    ) : (
                      <p className="text-center text-xs text-muted-foreground">
                        Belum ada pesan pada percakapan ini.
                      </p>
                    )}
                  </div>
                </ScrollArea>
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
                <div className="w-full rounded-xl border border-border/60 bg-muted/40">
                  <Textarea
                    placeholder={`Tulis balasan untuk ${activeConversation.name}...`}
                    className="min-h-[110px] w-full resize-none border-0 bg-transparent focus-visible:ring-0"
                    value={composer}
                    onChange={(event) => setComposer(event.target.value)}
                    disabled={connectionStatus !== "ready"}
                  />
                  <div className="flex w-full flex-wrap items-center justify-between gap-2 px-3 pb-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="gap-1 text-[10px]">
                        + Lampiran
                      </Badge>
                      <Badge variant="outline" className="gap-1 text-[10px]">
                        Template balasan
                      </Badge>
                    </div>
                    <Button className="w-full gap-2 sm:w-auto sm:flex-none" onClick={handleSendMessage} disabled={!canSendMessage}>
                      {isSending ? "Mengirim..." : "Kirim pesan"}
                      <Send className="size-4" aria-hidden />
                    </Button>
                  </div>
                </div>
                {errorMessage ? (
                  <p className="text-xs text-destructive">
                    {errorMessage}
                  </p>
                ) : null}
              </CardFooter>
            </>
          ) : (
            <div className="flex h-full flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
              <CardTitle>Tidak ada percakapan terpilih</CardTitle>
              <CardDescription>
                Pilih salah satu percakapan di sisi kiri untuk mulai berinteraksi dengan pelanggan.
              </CardDescription>
            </div>
          )}
        </Card>
      </section>
    </main>
  )
}

export default ChatPage

