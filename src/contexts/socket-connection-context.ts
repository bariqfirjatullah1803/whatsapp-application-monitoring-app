import { createContext } from "react"

export type ConnectionStatus =
  | "connecting"
  | "awaiting-qr"
  | "ready"
  | "authenticated"
  | "disconnected"
  | "error"

export type SocketConnectionContextValue = {
  status: ConnectionStatus
  lastError?: string | null
}

export const SocketConnectionContext = createContext<SocketConnectionContextValue>({
  status: "connecting",
  lastError: null,
})

