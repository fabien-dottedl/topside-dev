import { useState, useCallback, useRef } from "react";
import { Header } from "./components/layout/Header";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { StreamCards } from "./components/StreamCards";
import { StreamDetail } from "./components/StreamDetail";
import { DayPlan } from "./components/DayPlan";
import { GitHubFeed } from "./components/GitHubFeed";
import { DocViewer } from "./components/DocViewer";
import { useStreams } from "./hooks/useStreams";
import { useStreamDetail } from "./hooks/useStreamDetail";
import { useDayPlan } from "./hooks/useDayPlan";
import { useIdeas } from "./hooks/useIdeas";
import { useGitHub } from "./hooks/useGitHub";
import { ChatDrawer } from "./components/ChatDrawer";
import { useFileWatcher } from "./hooks/useWebSocket";
import type { FileChangeEvent } from "./types";

export default function App() {
  const [selectedStreamId, setSelectedStreamId] = useState<string | null>(null);

  const streams = useStreams();
  const streamDetail = useStreamDetail(selectedStreamId);
  const dayPlan = useDayPlan();
  const ideas = useIdeas();
  const github = useGitHub();

  // Keep refetch functions in refs so callbacks remain stable
  const refetchRefs = useRef({
    streams: streams.refetch,
    streamDetail: streamDetail.refetch,
    dayPlan: dayPlan.refetch,
    ideas: ideas.refetch,
    github: github.refetch,
  });
  refetchRefs.current = {
    streams: streams.refetch,
    streamDetail: streamDetail.refetch,
    dayPlan: dayPlan.refetch,
    ideas: ideas.refetch,
    github: github.refetch,
  };

  // Debounce timers for file-change refetches
  const debounceTimers = useRef<Record<string, number>>({});

  const debouncedRefetch = useCallback((category: string, refetchFn: () => void) => {
    clearTimeout(debounceTimers.current[category]);
    debounceTimers.current[category] = window.setTimeout(refetchFn, 300);
  }, []);

  // Refetch all data — used on WebSocket reconnect to catch missed events
  const refetchAll = useCallback(() => {
    const r = refetchRefs.current;
    r.streams();
    r.streamDetail();
    r.dayPlan();
    r.ideas();
    r.github();
  }, []);

  const handleFileChange = useCallback(
    (event: FileChangeEvent) => {
      const r = refetchRefs.current;
      switch (event.category) {
        case "streams":
          debouncedRefetch("streams", () => {
            r.streams();
            r.streamDetail();
          });
          break;
        case "day-plan":
          debouncedRefetch("day-plan", r.dayPlan);
          break;
        case "ideas":
          debouncedRefetch("ideas", r.ideas);
          break;
        case "github":
          debouncedRefetch("github", r.github);
          break;
        case "notes":
          debouncedRefetch("notes", () => {
            r.ideas();
            r.streamDetail();
          });
          break;
      }
    },
    [debouncedRefetch],
  );

  const watcher = useFileWatcher({
    onFileChange: handleFileChange,
    onReconnect: refetchAll,
  });

  const handleStreamSelect = useCallback((id: string) => {
    setSelectedStreamId((prev) => (prev === id ? null : id));
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Header connected={watcher.connected} />
      <DashboardLayout
        streamCards={
          <div className="space-y-4">
            <StreamCards
              active={streams.active}
              completed={streams.completed}
              selectedId={selectedStreamId}
              onSelect={handleStreamSelect}
              loading={streams.loading}
            />
            {selectedStreamId && (
              <StreamDetail
                detail={streamDetail.detail}
                loading={streamDetail.loading}
              />
            )}
          </div>
        }
        dayPlan={
          <DayPlan
            content={dayPlan.content}
            loading={dayPlan.loading}
            onSave={dayPlan.save}
          />
        }
        githubFeed={
          <GitHubFeed
            notifications={github.notifications}
            loading={github.loading}
          />
        }
        docViewer={
          <DocViewer
            scope={streamDetail.detail?.scope ?? null}
            notes={streamDetail.detail?.notes ?? null}
            ideas={ideas.ideas}
            ideasLoading={ideas.loading}
          />
        }
        chatDrawer={<ChatDrawer />}
      />
    </div>
  );
}
