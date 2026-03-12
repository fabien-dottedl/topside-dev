import { useState, useCallback, useEffect, useRef } from "react";
import type { Idea } from "../types";

interface Props {
  ideas: Idea[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreateIdea?: (data: {
    title: string;
    status?: string;
    priority?: string;
    content: string;
  }) => void;
  onUpdateIdea?: (
    id: string,
    data: {
      title?: string;
      status?: string;
      priority?: string;
      content?: string;
    },
  ) => void;
  onDeleteIdea?: (id: string) => void;
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  exploring: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "in-progress": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  parked: "bg-purple-500/20 text-purple-400 border-purple-500/30",
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

export function IdeasPanel({
  ideas,
  loading,
  selectedId,
  onSelect,
  onCreateIdea,
  onUpdateIdea,
  onDeleteIdea,
}: Props) {
  const [showNewForm, setShowNewForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState("normal");
  const [newContent, setNewContent] = useState("");

  const handleCreate = useCallback(() => {
    if (!newTitle.trim() || !onCreateIdea) return;
    onCreateIdea({
      title: newTitle.trim(),
      priority: newPriority,
      content: newContent,
    });
    setNewTitle("");
    setNewPriority("normal");
    setNewContent("");
    setShowNewForm(false);
  }, [newTitle, newPriority, newContent, onCreateIdea]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-3">
      {/* New Idea button / form */}
      {showNewForm ? (
        <div className="rounded-md border border-gray-700 bg-gray-800/60 p-3 space-y-3">
          <input
            type="text"
            placeholder="Idea title..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full bg-gray-800 text-gray-100 border border-gray-700 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30"
          />
          <select
            value={newPriority}
            onChange={(e) => setNewPriority(e.target.value)}
            className="bg-gray-800 text-gray-300 border border-gray-700 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-emerald-500/50"
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
          </select>
          <textarea
            placeholder="Describe the idea..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            className="w-full min-h-[80px] bg-gray-800 text-gray-100 border border-gray-700 rounded-md p-3 font-mono text-sm resize-none focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30"
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowNewForm(false)}
              className="px-3 py-1.5 text-sm text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!newTitle.trim()}
              className="px-3 py-1.5 text-sm bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-md transition-colors cursor-pointer"
            >
              Create
            </button>
          </div>
        </div>
      ) : (
        onCreateIdea && (
          <button
            onClick={() => setShowNewForm(true)}
            className="w-full text-left rounded-md px-3 py-2 text-sm text-emerald-400 hover:bg-gray-800 border border-dashed border-gray-700 hover:border-emerald-500/40 transition-colors cursor-pointer"
          >
            + New Idea
          </button>
        )
      )}

      {ideas.length === 0 && !showNewForm && (
        <p className="text-gray-500 text-sm text-center py-4">No ideas yet</p>
      )}

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
    </div>
  );
}

interface IdeaDetailProps {
  idea: Idea;
  onBack: () => void;
  onUpdate?: (
    id: string,
    data: {
      title?: string;
      status?: string;
      priority?: string;
      content?: string;
    },
  ) => void;
  onDelete?: (id: string) => void;
}

export function IdeaDetail({
  idea,
  onBack,
  onUpdate,
  onDelete,
}: IdeaDetailProps) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(idea.title);
  const [editStatus, setEditStatus] = useState(idea.status);
  const [editPriority, setEditPriority] = useState(idea.priority);
  const [editContent, setEditContent] = useState(idea.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync edit fields when idea changes
  useEffect(() => {
    setEditTitle(idea.title);
    setEditStatus(idea.status);
    setEditPriority(idea.priority);
    setEditContent(idea.content);
  }, [idea]);

  // Auto-grow textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = `${ta.scrollHeight}px`;
    }
  }, [editContent, editing]);

  const handleSave = useCallback(() => {
    if (!onUpdate) return;
    onUpdate(idea.id, {
      title: editTitle,
      status: editStatus,
      priority: editPriority,
      content: editContent,
    });
    setEditing(false);
  }, [idea.id, editTitle, editStatus, editPriority, editContent, onUpdate]);

  const handleDelete = useCallback(() => {
    if (!onDelete) return;
    if (window.confirm(`Delete idea "${idea.title}"?`)) {
      onDelete(idea.id);
      onBack();
    }
  }, [idea, onDelete, onBack]);

  if (editing) {
    return (
      <div className="space-y-3">
        <button
          onClick={() => setEditing(false)}
          className="text-xs text-gray-400 hover:text-gray-200 cursor-pointer"
        >
          &larr; Cancel editing
        </button>
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          className="w-full bg-gray-800 text-gray-100 border border-gray-700 rounded-md px-3 py-1.5 text-sm font-semibold focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30"
        />
        <div className="flex gap-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Status</label>
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
              className="bg-gray-800 text-gray-300 border border-gray-700 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-emerald-500/50"
            >
              <option value="draft">draft</option>
              <option value="exploring">exploring</option>
              <option value="in-progress">in-progress</option>
              <option value="parked">parked</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">
              Priority
            </label>
            <select
              value={editPriority}
              onChange={(e) => setEditPriority(e.target.value)}
              className="bg-gray-800 text-gray-300 border border-gray-700 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-emerald-500/50"
            >
              <option value="low">low</option>
              <option value="normal">normal</option>
              <option value="high">high</option>
            </select>
          </div>
        </div>
        <textarea
          ref={textareaRef}
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          className="w-full min-h-[200px] bg-gray-800 text-gray-100 border border-gray-700 rounded-md p-3 font-mono text-sm resize-none focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30"
        />
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => setEditing(false)}
            className="px-3 py-1.5 text-sm text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-1.5 text-sm bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition-colors cursor-pointer"
          >
            Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={onBack}
          className="text-xs text-gray-400 hover:text-gray-200 cursor-pointer"
        >
          &larr; Back to ideas
        </button>
        <div className="flex items-center gap-2">
          {onUpdate && (
            <button
              onClick={() => setEditing(true)}
              className="text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
              title="Edit idea"
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
          {onDelete && (
            <button
              onClick={handleDelete}
              className="text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
              title="Delete idea"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path
                  fillRule="evenodd"
                  d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022 1.005 11.36A2.75 2.75 0 007.77 20h4.46a2.75 2.75 0 002.751-2.689l1.005-11.36.15.022a.75.75 0 00.228-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 01.78.72l.5 6a.75.75 0 01-1.49.12l-.5-6a.75.75 0 01.71-.84zm3.62.72a.75.75 0 00-1.49-.12l-.5 6a.75.75 0 101.49.12l.5-6z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
      <h3 className="text-lg font-semibold text-gray-100 mb-1">
        {idea.title}
      </h3>
      <div className="flex gap-2 mb-3">
        <span
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
            statusColors[idea.status] ||
            "bg-gray-500/20 text-gray-400 border-gray-500/30"
          }`}
        >
          {idea.status}
        </span>
        <span
          className={`text-xs ${priorityIndicators[idea.priority] || "text-gray-500"}`}
        >
          {idea.priority} priority
        </span>
      </div>
      <div className="prose prose-invert prose-sm max-w-none text-gray-300 whitespace-pre-wrap">
        {idea.content || (
          <span className="text-gray-500 italic">No content</span>
        )}
      </div>
    </div>
  );
}
