import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";

function todayDate(): string {
  return new Date().toISOString().split("T")[0];
}

export function useNotes() {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [date, setDateState] = useState<string>(todayDate);

  const fetchNotes = useCallback(async (d: string) => {
    try {
      setLoading(true);
      const data = await api.getNotes(d);
      setContent(data.content);
    } catch (e) {
      console.error("Failed to fetch notes", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const setDate = useCallback(
    (d: string) => {
      setDateState(d);
      fetchNotes(d);
    },
    [fetchNotes],
  );

  const save = useCallback(
    async (newContent: string) => {
      try {
        setContent(newContent); // optimistic update
        await api.putNotes(date, newContent);
      } catch (e) {
        console.error("Failed to save notes", e);
        fetchNotes(date);
      }
    },
    [date, fetchNotes],
  );

  const refetch = useCallback(() => {
    fetchNotes(date);
  }, [date, fetchNotes]);

  useEffect(() => {
    fetchNotes(date);
  }, []);

  return { content, loading, date, setDate, save, refetch };
}
