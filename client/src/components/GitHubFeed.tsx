import { useState, useEffect, useCallback } from "react";
import type { GitHubNotification } from "../types";
import { api } from "../lib/api";

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

function GearIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

function ConfigForm({ onClose }: { onClose: () => void }) {
  const [token, setToken] = useState("");
  const [reposText, setReposText] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);

  const loadConfig = useCallback(async () => {
    try {
      const config = await api.getGitHubConfig();
      setToken(config.token || "");
      setReposText((config.repos || []).join("\n"));
    } catch (err) {
      console.error("Failed to load GitHub config:", err);
    } finally {
      setLoadingConfig(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  async function handleSave() {
    setSaving(true);
    try {
      await api.putGitHubConfig({
        token,
        repos: reposText
          .split("\n")
          .map((r) => r.trim())
          .filter(Boolean),
      });
      onClose();
    } catch (err) {
      console.error("Failed to save GitHub config:", err);
    } finally {
      setSaving(false);
    }
  }

  if (loadingConfig) {
    return (
      <div className="mt-3 p-4 bg-gray-900/80 border-l-2 border-purple-500/40 rounded-md">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-800 rounded w-1/3" />
          <div className="h-8 bg-gray-800 rounded" />
          <div className="h-4 bg-gray-800 rounded w-1/3" />
          <div className="h-16 bg-gray-800 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 p-4 bg-gray-900/80 border-l-2 border-purple-500/40 rounded-md space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1">
          API Token
        </label>
        <div className="flex gap-2">
          <input
            type={showToken ? "text" : "password"}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="ghp_xxxxxxxxxxxx"
            className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-purple-500/60"
          />
          <button
            type="button"
            onClick={() => setShowToken(!showToken)}
            className="px-2 py-1.5 text-xs text-gray-400 hover:text-gray-200 bg-gray-800 border border-gray-700 rounded transition-colors"
          >
            {showToken ? "Hide" : "Show"}
          </button>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1">
          Repos (one per line, owner/repo)
        </label>
        <textarea
          value={reposText}
          onChange={(e) => setReposText(e.target.value)}
          placeholder={"owner/repo\norg/another-repo"}
          rows={3}
          className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-purple-500/60 resize-none"
        />
      </div>
      <p className="text-xs text-gray-500">Polls every 60s</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-3 py-1.5 text-xs font-medium bg-purple-600 hover:bg-purple-500 text-white rounded transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-gray-200 bg-gray-800 border border-gray-700 rounded transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export function GitHubFeed({ notifications, loading }: Props) {
  const [showConfig, setShowConfig] = useState(false);

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/80 border-l-2 border-l-purple-500/40 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
          GitHub
        </h2>
        <button
          type="button"
          onClick={() => setShowConfig(!showConfig)}
          className={`p-1 rounded transition-colors ${
            showConfig
              ? "text-purple-400 bg-purple-500/10"
              : "text-gray-500 hover:text-gray-300"
          }`}
          title="GitHub settings"
        >
          <GearIcon />
        </button>
      </div>
      {showConfig && <ConfigForm onClose={() => setShowConfig(false)} />}
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
