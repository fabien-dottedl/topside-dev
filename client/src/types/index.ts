export interface Stream {
  id: string;
  title: string;
  status: "active" | "waiting" | "completed" | "paused" | "error";
  created: string;
  completedAt?: string;
  repo?: string;
  branch?: string;
  worktree?: string;
}

export interface StreamEvent {
  type: string;
  timestamp: string;
  message: string;
}

export interface StreamDetail extends Stream {
  events: StreamEvent[];
  scope?: string;
  notes?: string;
}

export interface Idea {
  id: string;
  title: string;
  status: string;
  priority: string;
  created: string;
  content: string;
}

export interface GitHubNotification {
  id: string;
  type: string;
  repo: string;
  title: string;
  url: string;
  reason: string;
  unread: boolean;
  updated_at: string;
}

export interface FileChangeEvent {
  type: "file-change";
  event: "add" | "change" | "unlink";
  path: string;
  category: "streams" | "day-plan" | "ideas" | "github" | "notes" | "config";
}
