import { Suspense } from "react";
import { PlayerNotesPanel } from "@/components/player-notes-panel";

export default function MonthlyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <Suspense fallback={null}>
        <PlayerNotesPanel />
      </Suspense>
    </>
  );
}
