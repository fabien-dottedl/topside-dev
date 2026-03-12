import { useState } from "react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { IdeasPanel } from "./IdeasPanel";
import type { Idea } from "../types";

interface Props {
  scope: string | null;
  notes: string | null;
  ideas: Idea[];
  ideasLoading: boolean;
}

type Tab = "scope" | "ideas" | "notes";

const tabs: { key: Tab; label: string }[] = [
  { key: "scope", label: "Scope" },
  { key: "ideas", label: "Ideas" },
  { key: "notes", label: "Notes" },
];

export function DocViewer({ scope, notes, ideas, ideasLoading }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("scope");
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);

  const selectedIdea = ideas.find((i) => i.id === selectedIdeaId);

  function renderContent() {
    switch (activeTab) {
      case "scope":
        return scope ? (
          <MarkdownRenderer content={scope} />
        ) : (
          <p className="text-gray-500 text-sm text-center py-8">
            Select a stream to view its scope
          </p>
        );
      case "ideas":
        if (selectedIdea) {
          return (
            <div>
              <button
                onClick={() => setSelectedIdeaId(null)}
                className="text-xs text-gray-400 hover:text-gray-200 mb-3 cursor-pointer"
              >
                &larr; Back to ideas
              </button>
              <h3 className="text-lg font-semibold text-gray-100 mb-3">
                {selectedIdea.title}
              </h3>
              <MarkdownRenderer content={selectedIdea.content} />
            </div>
          );
        }
        return (
          <IdeasPanel
            ideas={ideas}
            loading={ideasLoading}
            selectedId={selectedIdeaId}
            onSelect={setSelectedIdeaId}
          />
        );
      case "notes":
        return notes ? (
          <MarkdownRenderer content={notes} />
        ) : (
          <p className="text-gray-500 text-sm text-center py-8">
            Select a stream to view its notes
          </p>
        );
    }
  }

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-6">
      <div className="flex gap-1 mb-4 border-b border-gray-800 -mx-6 px-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              if (tab.key !== "ideas") setSelectedIdeaId(null);
            }}
            className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer border-b-2 -mb-px ${
              activeTab === tab.key
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-gray-500 hover:text-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div>{renderContent()}</div>
    </div>
  );
}
