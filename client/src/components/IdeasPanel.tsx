import type { Idea } from "../types";

interface Props {
  ideas: Idea[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  exploring: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "in-progress": "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

const priorityIndicators: Record<string, string> = {
  high: "text-red-400",
  medium: "text-amber-400",
  low: "text-gray-500",
};

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-12 bg-gray-800 rounded" />
      ))}
    </div>
  );
}

export function IdeasPanel({ ideas, loading, selectedId, onSelect }: Props) {
  if (loading) {
    return <LoadingSkeleton />;
  }

  if (ideas.length === 0) {
    return (
      <p className="text-gray-500 text-sm text-center py-4">No ideas yet</p>
    );
  }

  return (
    <div className="space-y-1">
      {ideas.map((idea) => (
        <button
          key={idea.id}
          onClick={() => onSelect(idea.id)}
          className={`w-full text-left rounded-md px-3 py-2.5 transition-colors cursor-pointer ${
            selectedId === idea.id
              ? "bg-gray-800 border border-emerald-500/50"
              : "hover:bg-gray-800 border border-transparent"
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`text-xs ${priorityIndicators[idea.priority] || "text-gray-500"}`}
            >
              {idea.priority === "high"
                ? "!!!"
                : idea.priority === "medium"
                  ? "!!"
                  : "!"}
            </span>
            <span className="text-sm text-gray-100 truncate flex-1">
              {idea.title}
            </span>
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                statusColors[idea.status] ||
                "bg-gray-500/20 text-gray-400 border-gray-500/30"
              }`}
            >
              {idea.status}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
