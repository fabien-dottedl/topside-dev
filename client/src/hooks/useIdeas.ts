import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";
import type { Idea } from "../types";

export function useIdeas() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const data = await api.getIdeas();
      setIdeas(data);
    } catch (e) {
      console.error("Failed to fetch ideas", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { ideas, loading, refetch: fetch };
}
