import { MarkdownRenderer } from "./MarkdownRenderer";
import type { StreamDetail as StreamDetailType } from "../types";

interface Props {
  detail: StreamDetailType | null;
  loading: boolean;
}

const eventTypeColors: Record<string, string> = {
  created: "bg-emerald-500",
  commit: "bg-blue-500",
  error: "bg-red-500",
  completed: "bg-gray-500",
  note: "bg-amber-500",
};

function formatTimestamp(ts: string): string {
  const date = new Date(ts);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-5 bg-gray-800 rounded w-1/3" />
      <div className="h-4 bg-gray-800 rounded w-full" />
      <div className="h-4 bg-gray-800 rounded w-2/3" />
      <div className="h-4 bg-gray-800 rounded w-1/2" />
    </div>
  );
}

export function StreamDetail({ detail, loading }: Props) {
  if (loading) {
    return (
      <div className="rounded-lg border border-gray-800 bg-gray-900 p-6">
        <LoadingSkeleton />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="rounded-lg border border-gray-800 bg-gray-900 p-6 text-gray-500 text-center">
        Failed to load stream details
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-100 mb-1">
          {detail.title}
        </h3>
        <div className="flex items-center gap-3 text-sm text-gray-400">
          {detail.repo && <span>{detail.repo}</span>}
          {detail.branch && (
            <span className="font-mono text-gray-500">{detail.branch}</span>
          )}
        </div>
      </div>

      {detail.scope && (
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-2">Scope</h4>
          <MarkdownRenderer content={detail.scope} />
        </div>
      )}

      {detail.events.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-3">Timeline</h4>
          <div className="relative space-y-0">
            {detail.events.map((event, i) => (
              <div key={i} className="flex gap-3 pb-4 last:pb-0">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${
                      eventTypeColors[event.type] || "bg-gray-600"
                    }`}
                  />
                  {i < detail.events.length - 1 && (
                    <div className="w-px flex-1 bg-gray-800 mt-1" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium text-gray-400 uppercase">
                      {event.type}
                    </span>
                    <span className="text-xs text-gray-600">
                      {formatTimestamp(event.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300">{event.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {detail.notes && (
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-2">Notes</h4>
          <MarkdownRenderer content={detail.notes} />
        </div>
      )}
    </div>
  );
}
