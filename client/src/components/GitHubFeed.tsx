import type { GitHubNotification } from "../types";

interface Props {
  notifications: GitHubNotification[];
  loading: boolean;
}

const typeIcons: Record<string, string> = {
  PullRequest: "PR",
  Issue: "IS",
  Release: "RE",
  Discussion: "DI",
  CheckSuite: "CI",
  Commit: "CO",
};

const typeBadgeColors: Record<string, string> = {
  PullRequest: "bg-purple-500/20 text-purple-400",
  Issue: "bg-emerald-500/20 text-emerald-400",
  Release: "bg-blue-500/20 text-blue-400",
  Discussion: "bg-amber-500/20 text-amber-400",
  CheckSuite: "bg-gray-500/20 text-gray-400",
  Commit: "bg-cyan-500/20 text-cyan-400",
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex gap-3">
          <div className="w-8 h-8 bg-gray-800 rounded" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-gray-800 rounded w-3/4" />
            <div className="h-3 bg-gray-800 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function GitHubFeed({ notifications, loading }: Props) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-6">
      <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
        GitHub
      </h2>
      {loading ? (
        <LoadingSkeleton />
      ) : notifications.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-4">
          No notifications
        </p>
      ) : (
        <div className="space-y-1">
          {notifications.map((n) => (
            <a
              key={n.id}
              href={n.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-start gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-gray-800 ${
                n.unread ? "bg-gray-800/50" : ""
              }`}
            >
              <span
                className={`inline-flex items-center justify-center w-8 h-8 rounded text-xs font-bold flex-shrink-0 ${
                  typeBadgeColors[n.type] || "bg-gray-500/20 text-gray-400"
                }`}
              >
                {typeIcons[n.type] || n.type.slice(0, 2).toUpperCase()}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {n.unread && (
                    <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                  )}
                  <p className="text-sm text-gray-100 truncate">{n.title}</p>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-500 truncate">
                    {n.repo}
                  </span>
                  <span className="text-xs text-gray-600">&middot;</span>
                  <span className="text-xs text-gray-500">{n.reason}</span>
                  <span className="text-xs text-gray-600">&middot;</span>
                  <span className="text-xs text-gray-600">
                    {timeAgo(n.updated_at)}
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
