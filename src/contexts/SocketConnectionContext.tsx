import { useEffect, useMemo, useState, type ReactNode } from "react"

import { connectSocket, disconnectSocket, getSocket } from "@/services/socket"
import {
  SocketConnectionContext,
  type ConnectionStatus,
} from "@/contexts/socket-connection-context"

type SocketConnectionProviderProps = {
  children: ReactNode
}

export const SocketConnectionProvider = ({ children }: SocketConnectionProviderProps) => {
  const [status, setStatus] = useState<ConnectionStatus>("connecting")
  const [lastError, setLastError] = useState<string | null>(null)

  useEffect(() => {
    connectSocket()

    const socket = getSocket()

    const handleQr = () => {
      setStatus("awaiting-qr")
      setLastError(null)
    }

    const handleReady = () => {
      setStatus("ready")
      setLastError(null)
    }

    const handleAuthenticated = () => {
      setStatus("authenticated")
      setLastError(null)
    }

    const handleDisconnected = (reason: string) => {
      setStatus("disconnected")
      setLastError(reason)
    }

    const handleError = (payload: { message: string }) => {
      setStatus("error")
      setLastError(payload.message)
    }

    const handleAuthFailure = (message: string) => {
      setStatus("error")
      setLastError(message)
    }

    socket.on("qr", handleQr)
    socket.on("ready", handleReady)
    socket.on("authenticated", handleAuthenticated)
    socket.on("disconnected", handleDisconnected)
    socket.on("error", handleError)
    socket.on("auth_failure", handleAuthFailure)

    if (socket.connected) {
      setStatus("ready")
    }

    return () => {
      socket.off("qr", handleQr)
      socket.off("ready", handleReady)
      socket.off("authenticated", handleAuthenticated)
      socket.off("disconnected", handleDisconnected)
      socket.off("error", handleError)
      socket.off("auth_failure", handleAuthFailure)
      disconnectSocket()
    }
  }, [])

  const value = useMemo(
    () => ({
      status,
      lastError,
    }),
    [status, lastError]
  )

  return (
    <SocketConnectionContext.Provider value={value}>
      {children}
    </SocketConnectionContext.Provider>
  )
}

