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

type Conversation = {
  id: string
  name: string
  handle: string
  avatarInitials: string
  status: "online" | "offline"
  lastMessage: string
  lastActivity: string
  unreadCount?: number
  tags?: string[]
}

type Message = {
  id: string
  sender: "agent" | "customer"
  content: string
  time: string
  status?: "sent" | "delivered" | "read"
}

const conversations: Conversation[] = [
  {
    id: "1",
    name: "PT Sukses Selalu",
    handle: "@suksesselalu",
    avatarInitials: "SS",
    status: "online",
    lastMessage: "Baik kak, kami tunggu notanya ya.",
    lastActivity: "2m",
    unreadCount: 3,
    tags: ["Prioritas", "Tagihan"],
  },
  {
    id: "2",
    name: "Rian Dwi",
    handle: "@riandwi",
    avatarInitials: "RD",
    status: "offline",
    lastMessage: "Terima kasih infonya kak 🙏",
    lastActivity: "15m",
  },
  {
    id: "3",
    name: "Anita • Admin",
    handle: "@anita",
    avatarInitials: "AN",
    status: "online",
    lastMessage: "Barang sudah sampai ya kak?",
    lastActivity: "1h",
    tags: ["Internal"],
  },
  {
    id: "4",
    name: "Customer Service",
    handle: "@cs-team",
    avatarInitials: "CS",
    status: "offline",
    lastMessage: "Sesi laporan harian siap dikirim.",
    lastActivity: "3h",
  },
]

const activeConversation = conversations[0]

const messages: Message[] = [
  {
    id: "msg-1",
    sender: "customer",
    content: "Selamat siang kak, saya mau konfirmasi pesanan 1243 ya.",
    time: "13.40",
    status: "read",
  },
  {
    id: "msg-2",
    sender: "agent",
    content:
      "Selamat siang kak! Untuk pesanan 1243 sudah kami siapkan, tinggal kirimkan bukti transfer ya kak.",
    time: "13.41",
    status: "read",
  },
  {
    id: "msg-3",
    sender: "customer",
    content: "Baik kak, saya kirimkan struknya sebentar lagi.",
    time: "13.42",
    status: "read",
  },
  {
    id: "msg-4",
    sender: "agent",
    content: "Baik, kami tunggu ya kak 🙏",
    time: "13.43",
    status: "sent",
  },
]

const ConversationItem = ({
  conversation,
  isActive,
}: {
  conversation: Conversation
  isActive?: boolean
}) => (
  <button
    type="button"
    className="flex w-full items-start gap-3 rounded-xl border border-transparent bg-transparent p-3 text-left text-sm transition hover:bg-muted/70 focus-visible:border-ring focus-visible:outline-none"
    data-state={isActive ? "active" : undefined}
  >
    <Avatar className="size-10 shrink-0 bg-primary/10 font-semibold text-primary">
      {conversation.avatarInitials}
    </Avatar>
    <div className="flex flex-1 flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold text-foreground">{conversation.name}</p>
        <span className="text-xs text-muted-foreground">{conversation.lastActivity}</span>
      </div>
      <p className="text-xs text-muted-foreground">{conversation.lastMessage}</p>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">{conversation.handle}</span>
        {conversation.status === "online" ? (
          <Badge variant="outline" className="border-emerald-500/40 text-emerald-600">
            Online
          </Badge>
        ) : null}
        {conversation.tags?.map((tag) => (
          <Badge key={tag} variant="secondary" className="bg-secondary/60 text-xs font-medium">
            {tag}
          </Badge>
        ))}
        {conversation.unreadCount ? (
          <Badge className="ml-auto bg-primary text-primary-foreground text-[10px]">
            {conversation.unreadCount}
          </Badge>
        ) : null}
      </div>
    </div>
  </button>
)

const MessageBubble = ({ message }: { message: Message }) => {
  const isAgent = message.sender === "agent"

  return (
    <div className={`flex w-full flex-col gap-1 ${isAgent ? "items-end" : "items-start"}`}>
      <div
        className={`flex max-w-[75%] flex-col gap-1 rounded-2xl px-4 py-3 text-sm shadow ${
          isAgent
            ? "rounded-br-md bg-primary text-primary-foreground"
            : "rounded-bl-md bg-muted"
        }`}
      >
        <p>{message.content}</p>
      </div>
      <span className="text-xs text-muted-foreground">
        {message.time}
        {isAgent && message.status === "read" ? " • Dibaca" : null}
        {isAgent && message.status === "delivered" ? " • Terkirim" : null}
        {isAgent && message.status === "sent" ? " • Terkirim" : null}
      </span>
    </div>
  )
}

export const ChatPage = () => {
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
                placeholder="Cari nama, nomor, atau tag..."
                className="pl-9"
              />
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-secondary/70">
                Semua (28)
              </Badge>
              <Badge variant="outline">Prioritas (6)</Badge>
              <Badge variant="outline">Menunggu (4)</Badge>
            </div>
          </CardContent>
          <Separator />
          <div className="flex flex-1 flex-col overflow-hidden">
            <ScrollArea className="h-full px-4">
              <div className="flex flex-col gap-1 py-2">
                {conversations.map((conversation) => (
                  <ConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    isActive={conversation.id === activeConversation.id}
                  />
                ))}
              </div>
            </ScrollArea>
          </div>
          <Separator />
          <CardFooter className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>Terhubung dengan WhatsApp Business API</span>
            <ShieldCheck className="size-4 text-primary" aria-hidden />
          </CardFooter>
        </Card>

        <Card className="flex h-full flex-1 flex-col overflow-hidden border-border/60 shadow-xl shadow-primary/5">
          <CardHeader className="flex flex-col gap-4 pb-4">
            <div className="flex flex-wrap items-center gap-4">
              <Avatar className="size-12 shrink-0 bg-primary/10 font-semibold text-primary">
                {activeConversation.avatarInitials}
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-xl">{activeConversation.name}</CardTitle>
                  <Badge variant="outline" className="gap-1 text-xs">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    Terhubung
                  </Badge>
                </div>
                <CardDescription>{activeConversation.handle}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon">
                  <Phone className="size-4" aria-hidden />
                </Button>
                <Button variant="outline" size="icon">
                  <Video className="size-4" aria-hidden />
                </Button>
                <Button variant="outline" size="icon">
                  <FileText className="size-4" aria-hidden />
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-border/60 bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
              <span>Nomor WhatsApp • +62 812-9876-5432</span>
              <Separator orientation="vertical" className="hidden h-3 sm:flex" />
              <span>Terakhir sinkronisasi 5 menit lalu</span>
            </div>
          </CardHeader>

          <Separator />

          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full px-6 py-6">
              <div className="flex flex-col gap-4">
                {messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
              </div>
            </ScrollArea>
          </CardContent>

          <Separator />

          <CardFooter className="flex flex-col gap-4">
            <div className="flex w-full flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>Mengetik sebagai Admin • Semua pesan direkam untuk audit.</span>
              <span>Zona waktu: WIB (GMT+7)</span>
            </div>
            <div className="w-full rounded-xl border border-border/60 bg-muted/40">
              <Textarea
                placeholder="Tulis balasan untuk PT Sukses Selalu..."
                className="min-h-[110px] w-full resize-none border-0 bg-transparent focus-visible:ring-0"
              />
              <div className="flex w-full flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="gap-1 text-[10px]">
                    + Lampiran
                  </Badge>
                  <Badge variant="outline" className="gap-1 text-[10px]">
                    Template balasan
                  </Badge>
                </div>
                <Button className="w-full gap-2 sm:w-auto sm:flex-none">
                  Kirim pesan
                  <Send className="size-4" aria-hidden />
                </Button>
              </div>
            </div>
          </CardFooter>
        </Card>
      </section>
    </main>
  )
}

export default ChatPage

