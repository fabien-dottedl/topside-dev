import { useState, useCallback, useEffect, useRef } from "react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { IdeasPanel, IdeaDetail } from "./IdeasPanel";
import type { Idea } from "../types";

interface DailyNotesProps {
  content: string | null;
  loading: boolean;
  date: string;
  onDateChange: (date: string) => void;
  onSave: (content: string) => void;
}

interface Props {
  scope: string | null;
  dailyNotes: DailyNotesProps;
  ideas: Idea[];
  ideasLoading: boolean;
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

type Tab = "scope" | "ideas" | "notes";

const tabs: { key: Tab; label: string }[] = [
  { key: "scope", label: "Scope" },
  { key: "ideas", label: "Ideas" },
  { key: "notes", label: "Notes" },
];

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function DailyNotes({
  content,
  loading,
  date,
  onDateChange,
  onSave,
}: DailyNotesProps) {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = `${ta.scrollHeight}px`;
    }
  }, [editContent]);

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
    <div className="space-y-4">
      {/* Date navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onDateChange(shiftDate(date, -1))}
            className="text-gray-400 hover:text-gray-200 transition-colors cursor-pointer px-1"
            title="Previous day"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path
                fillRule="evenodd"
                d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <span className="text-sm text-gray-300 font-medium tabular-nums">
            {date}
          </span>
          <button
            onClick={() => onDateChange(shiftDate(date, 1))}
            className="text-gray-400 hover:text-gray-200 transition-colors cursor-pointer px-1"
            title="Next day"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path
                fillRule="evenodd"
                d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
        {!editing && !loading && content !== null && content !== "" && (
          <button
            onClick={handleEdit}
            className="text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
            title="Edit notes"
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

      {/* Content */}
      {loading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-800 rounded w-2/3" />
          <div className="h-4 bg-gray-800 rounded w-full" />
          <div className="h-4 bg-gray-800 rounded w-5/6" />
        </div>
      ) : editing ? (
        <div className="space-y-3">
          <textarea
            ref={textareaRef}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full min-h-[200px] bg-gray-800 text-gray-100 border border-gray-700 rounded-md p-3 font-mono text-sm resize-none focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30"
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
              className="px-3 py-1.5 text-sm bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition-colors cursor-pointer"
            >
              Save
            </button>
          </div>
        </div>
      ) : !content ? (
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm mb-3">No notes for {date}</p>
          <button
            onClick={handleEdit}
            className="px-3 py-1.5 text-sm text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 hover:border-emerald-500/50 rounded-md transition-colors cursor-pointer"
          >
            Start writing
          </button>
        </div>
      ) : (
        <MarkdownRenderer content={content} />
      )}
    </div>
  );
}

export function DocViewer({
  scope,
  dailyNotes,
  ideas,
  ideasLoading,
  onCreateIdea,
  onUpdateIdea,
  onDeleteIdea,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("scope");
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);

  const selectedIdea = ideas.find((i) => i.id === selectedIdeaId);

  function renderContent() {
    switch (activeTab) {
      case "scope":
        return scope ? (
          <MarkdownRenderer content={scope} />
        ) : (
          <p className="text-gray-500 text-sm text-center py-8">
            Select a stream to view its scope
          </p>
        );
      case "ideas":
        if (selectedIdea) {
          return (
            <IdeaDetail
              idea={selectedIdea}
              onBack={() => setSelectedIdeaId(null)}
              onUpdate={onUpdateIdea}
              onDelete={onDeleteIdea}
            />
          );
        }
        return (
          <IdeasPanel
            ideas={ideas}
            loading={ideasLoading}
            selectedId={selectedIdeaId}
            onSelect={setSelectedIdeaId}
            onCreateIdea={onCreateIdea}
            onUpdateIdea={onUpdateIdea}
            onDeleteIdea={onDeleteIdea}
          />
        );
      case "notes":
        return (
          <div className="rounded-md bg-gray-900/60 p-4 -mx-2">
            <DailyNotes
              content={dailyNotes.content}
              loading={dailyNotes.loading}
              date={dailyNotes.date}
              onDateChange={dailyNotes.onDateChange}
              onSave={dailyNotes.onSave}
            />
          </div>
        );
    }
  }

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/60 p-6">
      <div className="flex gap-1 mb-4 border-b border-gray-800 -mx-6 px-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              if (tab.key !== "ideas") setSelectedIdeaId(null);
            }}
            className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer border-b-2 -mb-px ${
              activeTab === tab.key
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-gray-500 hover:text-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div>{renderContent()}</div>
    </div>
  );
}
