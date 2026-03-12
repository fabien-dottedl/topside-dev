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

export const api = {
  getStreams: () => fetchJson<{ active: Stream[]; completed: Stream[] }>("/api/streams"),
  getStream: (id: string) => fetchJson<StreamDetail>(`/api/streams/${id}`),
  getDayPlan: () => fetchJson<{ content: string }>("/api/day-plan"),
  putDayPlan: (content: string) => putJson("/api/day-plan", { content }),
  getIdeas: () => fetchJson<Idea[]>("/api/ideas"),
  getIdea: (id: string) => fetchJson<Idea>(`/api/ideas/${id}`),
  getGitHubNotifications: () => fetchJson<GitHubNotification[]>("/api/github/notifications"),
};
