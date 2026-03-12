import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "../lib/api";
import type { StreamDetail } from "../types";

export function useStreamDetail(streamId: string | null) {
  const [detail, setDetail] = useState<StreamDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const streamIdRef = useRef(streamId);
  streamIdRef.current = streamId;

  const fetchDetail = useCallback(async () => {
    const id = streamIdRef.current;
    if (!id) {
      setDetail(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await api.getStream(id);
      if (streamIdRef.current === id) setDetail(data);
    } catch (e) {
      console.error("Failed to fetch stream detail", e);
    } finally {
      if (streamIdRef.current === id) setLoading(false);
    }
  }, []);

  useEffect(() => {
    setDetail(null);
    fetchDetail();
  }, [streamId, fetchDetail]);

  return { detail, loading, refetch: fetchDetail };
}
