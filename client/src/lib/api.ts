import type { Stream, StreamDetail, Idea, GitHubNotification } from "../types";

const BASE = "";

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function putJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function patchJson<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function deleteJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const api = {
  getStreams: () => fetchJson<{ active: Stream[]; completed: Stream[] }>("/api/streams"),
  getStream: (id: string) => fetchJson<StreamDetail>(`/api/streams/${id}`),
  getDayPlan: () => fetchJson<{ content: string }>("/api/day-plan"),
  putDayPlan: (content: string) => putJson("/api/day-plan", { content }),
  getIdeas: () => fetchJson<Idea[]>("/api/ideas"),
  getIdea: (id: string) => fetchJson<Idea>(`/api/ideas/${id}`),
  getGitHubNotifications: () => fetchJson<GitHubNotification[]>("/api/github/notifications"),
  completeStream: (id: string) => patchJson(`/api/streams/${id}/complete`),
  deleteStream: (id: string) => deleteJson(`/api/streams/${id}`),

  // Notes
  getNotes: (date?: string) =>
    fetchJson<{ date: string; content: string }>(
      `/api/notes${date ? `?date=${date}` : ""}`,
    ),
  putNotes: (date: string, content: string) =>
    putJson("/api/notes", { date, content }),

  // Ideas CRUD
  createIdea: (data: {
    title: string;
    status?: string;
    priority?: string;
    content: string;
  }) => postJson<{ ok: true; id: string }>("/api/ideas", data),
  updateIdea: (
    id: string,
    data: {
      title?: string;
      status?: string;
      priority?: string;
      content?: string;
    },
  ) => putJson(`/api/ideas/${id}`, data),
  deleteIdea: (id: string) => deleteJson(`/api/ideas/${id}`),

  // GitHub config
  getGitHubConfig: () =>
    fetchJson<{ token: string; repos: string[] }>("/api/config/github"),
  putGitHubConfig: (config: { token?: string; repos?: string[] }) =>
    putJson<{ ok: boolean }>("/api/config/github", config),
};
