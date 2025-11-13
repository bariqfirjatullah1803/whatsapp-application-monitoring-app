import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Message } from "@/lib/types";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";

interface MessageListProps {
  messages: Message[];
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  chatName?: string;
}

export function MessageList({
  messages,
  hasMore,
  isLoading,
  onLoadMore,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 p-0 overflow-hidden">
      <ScrollArea className="h-[calc(100vh-16rem)] px-4" ref={scrollRef}>
        {hasMore && (
          <div className="text-center py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={onLoadMore}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                "Load more"
              )}
            </Button>
          </div>
        )}

        <div className="space-y-4 py-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No messages yet
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={`${message.id}-${message.timestamp}-${index}`}
                className={`flex ${
                  message.direction === "outgoing"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
                    message.direction === "outgoing"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {message.direction === "incoming" && message.contactName && (
                    <p className="text-xs font-semibold mb-1 opacity-80">
                      {message.contactName}
                    </p>
                  )}
                  <p className="text-sm whitespace-pre-wrap wrap-break-words">
                    {message.body}
                  </p>
                  <p className="text-xs opacity-70 mt-1">
                    {format(new Date(message.timestamp), "HH:mm")}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
    </div>
  );
}
