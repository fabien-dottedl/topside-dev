import { MarkdownRenderer } from "./MarkdownRenderer";

interface Props {
  role: "user" | "assistant";
  content: string;
}

export function ChatMessage({ role, content }: Props) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div className={`max-w-[85%] rounded-lg px-4 py-2.5 ${
        isUser
          ? "bg-blue-600 text-white"
          : "bg-gray-800 text-gray-100"
      }`}>
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap">{content}</p>
        ) : (
          <MarkdownRenderer content={content} />
        )}
      </div>
    </div>
  );
}
