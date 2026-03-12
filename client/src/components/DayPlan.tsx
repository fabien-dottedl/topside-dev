import { useCallback, useEffect, useRef, useState } from "react";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface Props {
  content: string | null;
  loading: boolean;
  onSave: (content: string) => void;
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-4 bg-gray-800 rounded w-2/3" />
      <div className="h-4 bg-gray-800 rounded w-full" />
      <div className="h-4 bg-gray-800 rounded w-5/6" />
      <div className="h-4 bg-gray-800 rounded w-3/4" />
      <div className="h-4 bg-gray-800 rounded w-1/2" />
    </div>
  );
}

export function DayPlan({ content, loading, onSave }: Props) {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow textarea to fit content
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = `${ta.scrollHeight}px`;
    }
  }, [editContent]);

  const handleCheckboxToggle = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      if (target.tagName !== "INPUT" || target.getAttribute("type") !== "checkbox") {
        return;
      }

      e.preventDefault();

      if (content === null) return;

      // Find the closest list item to get the checkbox text
      const li = target.closest("li");
      if (!li) return;

      const text = li.textContent?.trim() || "";
      const lines = content.split("\n");

      // Find the line that matches this checkbox text
      const lineIndex = lines.findIndex((line) => {
        const match = line.match(/^(\s*)-\s+\[([ x])\]\s+(.*)/);
        if (!match) return false;
        return match[3].trim() === text;
      });

      if (lineIndex === -1) return;

      const line = lines[lineIndex];
      if (line.includes("- [ ]")) {
        lines[lineIndex] = line.replace("- [ ]", "- [x]");
      } else if (line.includes("- [x]")) {
        lines[lineIndex] = line.replace("- [x]", "- [ ]");
      }

      onSave(lines.join("\n"));
    },
    [content, onSave]
  );

  const handleEdit = useCallback(() => {
    setEditContent(content ?? "");
    setEditing(true);
  }, [content]);

  const handleSave = useCallback(() => {
    onSave(editContent);
    setEditing(false);
  }, [editContent, onSave]);

  const handleCancel = useCallback(() => {
    setEditing(false);
  }, []);

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/80 border-l-2 border-l-blue-500/40 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
          Day Plan
        </h2>
        {!editing && content !== null && !loading && (
          <button
            onClick={handleEdit}
            className="text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
            title="Edit day plan"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
            </svg>
          </button>
        )}
      </div>
      {loading ? (
        <LoadingSkeleton />
      ) : content === null && !editing ? (
        <p className="text-gray-500 text-sm">No day plan found</p>
      ) : editing ? (
        <div className="space-y-3">
          <textarea
            ref={textareaRef}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full min-h-[200px] bg-gray-800 text-gray-100 border border-gray-700 rounded-md p-3 font-mono text-sm resize-none focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30"
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={handleCancel}
              className="px-3 py-1.5 text-sm text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors cursor-pointer"
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <div onClick={handleCheckboxToggle}>
          <MarkdownRenderer content={content!} />
        </div>
      )}
    </div>
  );
}
