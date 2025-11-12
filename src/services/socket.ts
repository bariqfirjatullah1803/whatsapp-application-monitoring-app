import { io, type Socket } from "socket.io-client"

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:3000"

type ServerToClientEvents = {
  qr: (qr: string) => void
  ready: (payload: { message: string }) => void
  authenticated: () => void
  auth_failure: (message: string) => void
  disconnected: (reason: string) => void
  message: (payload: {
    from: string
    number: string
    body: string
    timestamp: number
    isGroup: boolean
    chatName: string
  }) => void
  messageSent: (payload: { success: boolean; to: string; message: string }) => void
  chatsList: (
    payload: Array<{
      id: string
      name: string
      isGroup: boolean
      unreadCount: number
      lastMessage: string
    }>
  ) => void
  error: (payload: { message: string }) => void
}

type ClientToServerEvents = {
  getChats: () => void
  sendMessage: (payload: { number: string; message: string }) => void
}

const createSocket = () => {
  const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(BACKEND_URL, {
    autoConnect: false,
    transports: ["websocket"],
    withCredentials: true,
  })

  return socket
}

const socket = createSocket()

export const connectSocket = () => {
  if (!socket.connected && !socket.active) {
    socket.connect()
  }
}

export const disconnectSocket = () => {
  if (socket.connected || socket.active) {
    socket.disconnect()
  }
}

export const getSocket = () => socket

