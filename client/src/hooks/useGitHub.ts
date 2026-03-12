import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";
import type { GitHubNotification } from "../types";

export function useGitHub() {
  const [notifications, setNotifications] = useState<GitHubNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const data = await api.getGitHubNotifications();
      setNotifications(data);
    } catch (e) {
      console.error("Failed to fetch GitHub notifications", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { notifications, loading, refetch: fetch };
}
