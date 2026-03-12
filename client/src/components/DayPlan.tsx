import { useCallback } from "react";
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

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-6">
      <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
        Day Plan
      </h2>
      {loading ? (
        <LoadingSkeleton />
      ) : content === null ? (
        <p className="text-gray-500 text-sm">No day plan found</p>
      ) : (
        <div onClick={handleCheckboxToggle}>
          <MarkdownRenderer content={content} />
        </div>
      )}
    </div>
  );
}
