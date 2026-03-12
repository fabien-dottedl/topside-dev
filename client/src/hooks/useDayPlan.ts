import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";

export function useDayPlan() {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const data = await api.getDayPlan();
      setContent(data.content);
    } catch (e) {
      console.error("Failed to fetch day plan", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const save = useCallback(async (newContent: string) => {
    try {
      setContent(newContent);
      await api.putDayPlan(newContent);
    } catch (e) {
      console.error("Failed to save day plan", e);
      // Re-fetch to restore server state
      fetch();
    }
  }, [fetch]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { content, loading, refetch: fetch, save };
}
