import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { useChat } from "@ai-sdk/react";
import { ChatMessage } from "./ChatMessage";

export function ChatDrawer() {
  const [expanded, setExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading, status } = useChat({
    api: "/api/chat",
  });

  // Auto-scroll when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when expanded
  useEffect(() => {
    if (expanded) inputRef.current?.focus();
  }, [expanded]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape") {
      setExpanded(false);
    }
  };

  // Extract text from message - useChat v3 uses parts array
  const getMessageText = (message: typeof messages[number]): string => {
    if (typeof message.content === "string") return message.content;
    // For v3 with parts, try to extract text parts
    if (message.parts) {
      return message.parts
        .filter((p: any) => p.type === "text")
        .map((p: any) => p.text)
        .join("");
    }
    return "";
  };

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 flex flex-col bg-gray-900 border-t border-gray-800 transition-all duration-300 ease-in-out ${
      expanded ? "h-[50vh]" : "h-12"
    }`}>
      {/* Header bar - always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between px-4 h-12 min-h-[3rem] text-sm text-gray-300 hover:text-gray-100 hover:bg-gray-800 transition-colors"
      >
        <span className="font-medium">Chat with Topside</span>
        <span className="text-xs text-gray-500">
          {expanded ? "\u2193 Collapse" : "\u2191 Expand"} \u00b7 {messages.length} messages
        </span>
      </button>

      {/* Chat content - only rendered when expanded */}
      {expanded && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {messages.length === 0 && (
              <p className="text-center text-gray-500 text-sm mt-8">
                Ask Topside anything about your streams, day plan, or ideas.
              </p>
            )}
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                role={message.role as "user" | "assistant"}
                content={getMessageText(message)}
              />
            ))}
            {isLoading && (
              <div className="flex justify-start mb-3">
                <div className="bg-gray-800 rounded-lg px-4 py-2.5 text-gray-400 text-sm">
                  Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="border-t border-gray-800 p-3">
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Message Topside..."
                rows={1}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 resize-none focus:outline-none focus:border-gray-600"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Send
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
