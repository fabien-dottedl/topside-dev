import { useRef, useEffect, useState, KeyboardEvent } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { ChatMessage } from "./ChatMessage";

interface Props {
  isOpen: boolean;
  onToggle: () => void;
}

export function ChatSidebar({ isOpen, onToggle }: Props) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [input, setInput] = useState("");

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const isLoading = status !== "ready";

  // Auto-scroll when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when expanded
  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        sendMessage({ text: input });
        setInput("");
      }
    }
    if (e.key === "Escape") {
      onToggle();
    }
  };

  // Extract text from message - v3 uses parts array
  const getMessageText = (message: (typeof messages)[number]): string => {
    return message.parts
      .filter(
        (p): p is Extract<typeof p, { type: "text" }> => p.type === "text",
      )
      .map((p) => p.text)
      .join("");
  };

  return (
    <div
      className={`fixed top-12 right-0 h-[calc(100vh-3rem)] z-40 flex flex-col bg-gray-900 border-l border-gray-800 transition-all duration-300 ease-in-out ${
        isOpen ? "w-[400px]" : "w-10"
      }`}
    >
      {/* Collapsed: vertical "Chat" label */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="flex items-center justify-center w-10 h-full text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-colors"
        >
          <span
            className="text-xs font-medium tracking-widest"
            style={{ writingMode: "vertical-rl" }}
          >
            Chat
          </span>
        </button>
      )}

      {/* Expanded panel */}
      {isOpen && (
        <>
          {/* Header bar */}
          <button
            onClick={onToggle}
            className="flex items-center justify-between px-4 h-12 min-h-[3rem] text-sm text-gray-300 hover:text-gray-100 hover:bg-gray-800 transition-colors border-b border-gray-800"
          >
            <span className="font-medium">Chat with Topside</span>
            <span className="text-xs text-gray-500">
              {messages.length} messages
            </span>
          </button>

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
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (input.trim() && !isLoading) {
                sendMessage({ text: input });
                setInput("");
              }
            }}
            className="border-t border-gray-800 p-3"
          >
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message Topside..."
                rows={3}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 resize-y max-h-[150px] focus:outline-none focus:border-gray-600"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors self-end"
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
