import type { Stream } from "../types";

interface Props {
  active: Stream[];
  completed: Stream[];
  selectedId: string | null;
  onSelect: (id: string) => void;
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
}: {
  stream: Stream;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      onClick={() => onSelect(stream.id)}
      className={`flex-shrink-0 w-64 rounded-lg border p-4 text-left transition-colors cursor-pointer ${
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
  loading,
}: Props) {
  if (loading) {
    return (
      <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
        <LoadingSkeleton />
      </div>
    );
  }

  const allStreams = [...active, ...completed];

  if (allStreams.length === 0) {
    return (
      <div className="rounded-lg border border-gray-800 bg-gray-900 p-6 text-center text-gray-500">
        No streams
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
      <div className="flex gap-3 overflow-x-auto pb-2">
        {allStreams.map((stream) => (
          <StreamCard
            key={stream.id}
            stream={stream}
            selected={selectedId === stream.id}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}
