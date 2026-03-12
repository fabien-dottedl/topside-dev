import { ReactNode } from "react";

interface Props {
  streamCards: ReactNode;
  dayPlan: ReactNode;
  githubFeed: ReactNode;
  docViewer: ReactNode;
  chatSidebar: ReactNode;
  chatOpen: boolean;
}

export function DashboardLayout({
  streamCards,
  dayPlan,
  githubFeed,
  docViewer,
  chatSidebar,
  chatOpen,
}: Props) {
  return (
    <>
      <div
        className={`flex flex-col gap-5 p-4 bg-gray-950 transition-all duration-300 ${
          chatOpen ? "mr-[400px]" : "mr-10"
        }`}
      >
        <section>{streamCards}</section>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <section>{dayPlan}</section>
          <section>{githubFeed}</section>
        </div>
        <section>{docViewer}</section>
      </div>
      {chatSidebar}
    </>
  );
}
