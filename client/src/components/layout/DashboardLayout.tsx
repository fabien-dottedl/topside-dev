import { ReactNode } from "react";

interface Props {
  streamCards: ReactNode;
  dayPlan: ReactNode;
  githubFeed: ReactNode;
  docViewer: ReactNode;
  chatDrawer: ReactNode;
}

export function DashboardLayout({
  streamCards,
  dayPlan,
  githubFeed,
  docViewer,
  chatDrawer,
}: Props) {
  return (
    <div className="flex flex-col gap-4 p-4 pb-20">
      <section>{streamCards}</section>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section>{dayPlan}</section>
        <section>{githubFeed}</section>
      </div>
      <section>{docViewer}</section>
      {chatDrawer}
    </div>
  );
}
