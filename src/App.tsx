import { SocketConnectionProvider } from "@/contexts/SocketConnectionContext"
import { useSocketConnection } from "@/hooks/useSocketConnection"
import { ChatPage } from "@/pages/ChatPage"
import { ScanQrPage } from "@/pages/ScanQrPage"

const AppContent = () => {
  const { status } = useSocketConnection()

  if (status === "ready" || status === "authenticated") {
    return <ChatPage />
  }

  return <ScanQrPage />
}

const App = () => {
  return (
    <SocketConnectionProvider>
      <AppContent />
    </SocketConnectionProvider>
  )
}

export default App
