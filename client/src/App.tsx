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
import { useNotes } from "./hooks/useNotes";
import { useGitHub } from "./hooks/useGitHub";
import { ChatSidebar } from "./components/ChatSidebar";
import { useFileWatcher } from "./hooks/useWebSocket";
import type { FileChangeEvent } from "./types";

export default function App() {
  const [selectedStreamId, setSelectedStreamId] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  const streams = useStreams();
  const streamDetail = useStreamDetail(selectedStreamId);
  const dayPlan = useDayPlan();
  const ideas = useIdeas();
  const notes = useNotes();
  const github = useGitHub();

  // Keep refetch functions in refs so callbacks remain stable
  const refetchRefs = useRef({
    streams: streams.refetch,
    streamDetail: streamDetail.refetch,
    dayPlan: dayPlan.refetch,
    ideas: ideas.refetch,
    notes: notes.refetch,
    github: github.refetch,
  });
  refetchRefs.current = {
    streams: streams.refetch,
    streamDetail: streamDetail.refetch,
    dayPlan: dayPlan.refetch,
    ideas: ideas.refetch,
    notes: notes.refetch,
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
    r.notes();
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
          debouncedRefetch("notes", r.notes);
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
              onComplete={streams.completeStream}
              onDelete={streams.deleteStream}
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
            dailyNotes={{
              content: notes.content,
              loading: notes.loading,
              date: notes.date,
              onDateChange: notes.setDate,
              onSave: notes.save,
            }}
            ideas={ideas.ideas}
            ideasLoading={ideas.loading}
            onCreateIdea={ideas.createIdea}
            onUpdateIdea={ideas.updateIdea}
            onDeleteIdea={ideas.deleteIdea}
          />
        }
        chatOpen={chatOpen}
        chatSidebar={
          <ChatSidebar
            isOpen={chatOpen}
            onToggle={() => setChatOpen((prev) => !prev)}
          />
        }
      />
    </div>
  );
}
