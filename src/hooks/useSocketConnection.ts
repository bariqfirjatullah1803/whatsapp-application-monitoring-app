import { useContext } from "react"

import { SocketConnectionContext } from "@/contexts/socket-connection-context"

export const useSocketConnection = () => {
  return useContext(SocketConnectionContext)
}

