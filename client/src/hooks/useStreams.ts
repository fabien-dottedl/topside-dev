import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";
import type { Stream } from "../types";

export function useStreams() {
  const [active, setActive] = useState<Stream[]>([]);
  const [completed, setCompleted] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const data = await api.getStreams();
      setActive(data.active);
      setCompleted(data.completed);
    } catch (e) {
      console.error("Failed to fetch streams", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const completeStream = useCallback(async (id: string) => {
    await api.completeStream(id);
    await fetch();
  }, [fetch]);

  const deleteStream = useCallback(async (id: string) => {
    await api.deleteStream(id);
    await fetch();
  }, [fetch]);

  return { active, completed, loading, refetch: fetch, completeStream, deleteStream };
}
