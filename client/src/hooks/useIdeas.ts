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

  const createIdea = useCallback(
    async (data: {
      title: string;
      status?: string;
      priority?: string;
      content: string;
    }) => {
      await api.createIdea(data);
      fetch();
    },
    [fetch],
  );

  const updateIdea = useCallback(
    async (
      id: string,
      data: {
        title?: string;
        status?: string;
        priority?: string;
        content?: string;
      },
    ) => {
      await api.updateIdea(id, data);
      fetch();
    },
    [fetch],
  );

  const deleteIdea = useCallback(
    async (id: string) => {
      await api.deleteIdea(id);
      fetch();
    },
    [fetch],
  );

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { ideas, loading, refetch: fetch, createIdea, updateIdea, deleteIdea };
}
