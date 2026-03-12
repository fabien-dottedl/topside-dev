import { useState } from "react";
import type { Stream } from "../types";

interface Props {
  active: Stream[];
  completed: Stream[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  loading: boolean;
}

const statusColors: Record<Stream["status"], string> = {
  active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  waiting: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  completed: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  paused: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  error: "bg-red-500/20 text-red-400 border-red-500/30",
};

function StatusBadge({ status }: { status: Stream["status"] }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${statusColors[status]}`}
    >
      {status}
    </span>
  );
}

function StreamCard({
  stream,
  selected,
  onSelect,
  onComplete,
  onDelete,
  isActive,
}: {
  stream: Stream;
  selected: boolean;
  onSelect: (id: string) => void;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  isActive: boolean;
}) {
  return (
    <div className="relative group flex-shrink-0 w-64">
      <button
        onClick={() => onSelect(stream.id)}
        className={`w-full rounded-lg border p-4 text-left transition-colors cursor-pointer ${
          selected
            ? "border-emerald-500 bg-gray-800"
            : "border-gray-800 bg-gray-900 hover:bg-gray-800"
        }`}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-sm font-medium text-gray-100 truncate">
            {stream.title}
          </h3>
          <StatusBadge status={stream.status} />
        </div>
        {stream.repo && (
          <p className="text-xs text-gray-400 truncate">{stream.repo}</p>
        )}
        {stream.branch && (
          <p className="text-xs text-gray-500 truncate font-mono">
            {stream.branch}
          </p>
        )}
      </button>
      {/* Action buttons — visible on hover for active, always for completed */}
      <div
        className={`absolute top-2 right-2 flex gap-1 ${
          isActive ? "opacity-0 group-hover:opacity-100" : "opacity-100"
        } transition-opacity`}
      >
        {isActive && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onComplete(stream.id);
            }}
            title="Complete stream"
            className="rounded p-1 text-gray-400 hover:text-emerald-400 hover:bg-gray-700 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path
                fillRule="evenodd"
                d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm(`Delete stream "${stream.title}"?`)) {
              onDelete(stream.id);
            }
          }}
          title="Delete stream"
          className="rounded p-1 text-gray-400 hover:text-red-400 hover:bg-gray-700 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-4 h-4"
          >
            <path
              fillRule="evenodd"
              d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex-shrink-0 w-64 rounded-lg border border-gray-800 bg-gray-900 p-4 animate-pulse"
        >
          <div className="h-4 bg-gray-800 rounded w-3/4 mb-3" />
          <div className="h-3 bg-gray-800 rounded w-1/2 mb-2" />
          <div className="h-3 bg-gray-800 rounded w-1/3" />
        </div>
      ))}
    </div>
  );
}

export function StreamCards({
  active,
  completed,
  selectedId,
  onSelect,
  onComplete,
  onDelete,
  loading,
}: Props) {
  const [showCompleted, setShowCompleted] = useState(false);

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-800 bg-gray-900 border-t-2 border-t-emerald-500/30 p-4">
        <LoadingSkeleton />
      </div>
    );
  }

  const allStreams = [...active, ...completed];

  if (allStreams.length === 0) {
    return (
      <div className="rounded-lg border border-gray-800 bg-gray-900 border-t-2 border-t-emerald-500/30 p-6 text-center text-gray-500">
        No streams
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 border-t-2 border-t-emerald-500/30 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <h2 className="text-sm font-semibold text-gray-200">Streams</h2>
        </div>
        {completed.length > 0 && (
          <button
            onClick={() => setShowCompleted((v) => !v)}
            className="text-xs text-gray-400 hover:text-gray-200 transition-colors"
          >
            {showCompleted
              ? "Hide completed"
              : `Show completed (${completed.length})`}
          </button>
        )}
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {active.map((stream) => (
          <StreamCard
            key={stream.id}
            stream={stream}
            selected={selectedId === stream.id}
            onSelect={onSelect}
            onComplete={onComplete}
            onDelete={onDelete}
            isActive={true}
          />
        ))}

        {showCompleted && completed.length > 0 && (
          <>
            {active.length > 0 && (
              <div className="flex-shrink-0 w-px bg-gray-700 my-2" />
            )}
            {completed.map((stream) => (
              <StreamCard
                key={stream.id}
                stream={stream}
                selected={selectedId === stream.id}
                onSelect={onSelect}
                onComplete={onComplete}
                onDelete={onDelete}
                isActive={false}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
