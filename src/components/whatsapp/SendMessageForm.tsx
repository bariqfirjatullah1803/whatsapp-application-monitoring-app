import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { useState } from "react";

interface SendMessageFormProps {
  onSend: (number: string, message: string) => void;
  selectedChatId?: string | null;
  isReady: boolean;
}

export function SendMessageForm({
  onSend,
  selectedChatId,
  isReady,
}: SendMessageFormProps) {
  const [number, setNumber] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const targetNumber = selectedChatId
      ? selectedChatId.replace("@c.us", "").replace("@g.us", "")
      : number;

    if (!targetNumber) return;

    onSend(targetNumber, message);
    setMessage("");
    if (!selectedChatId) setNumber("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full">
      {!selectedChatId && (
        <Input
          placeholder="Phone number (e.g., 628123456789)"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          required
          disabled={!isReady}
        />
      )}

      <div className="flex gap-2">
        <Textarea
          placeholder="Type your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          className="min-h-[60px] resize-none"
          disabled={!isReady}
        />
        <Button
          type="submit"
          size="icon"
          className="h-[60px] w-[60px]"
          disabled={!isReady || !message.trim()}
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>

      {!isReady && (
        <p className="text-sm text-muted-foreground">
          WhatsApp is not connected. Please scan QR code first.
        </p>
      )}
    </form>
  );
}
