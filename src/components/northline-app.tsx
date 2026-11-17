import { useEffect } from "react";
import { Code2, Inbox, Phone, Radio, Users } from "lucide-react";
import { CallBanner } from "@/components/call-stage";
import { CallsView } from "@/components/calls-view";
import { DeskView } from "@/components/desk-view";
import { LiveView } from "@/components/live-view";
import { Mark } from "@/components/mark";
import { PeopleView } from "@/components/people-view";
import { SdkView } from "@/components/sdk-view";
import { cn } from "@/lib/cn";
import { useDesk } from "@/lib/store";
import { AGENT_NAME, type DeskView as ViewId } from "@/lib/types";

const NAV: { id: ViewId; label: string; icon: typeof Inbox }[] = [
  { id: "desk", label: "Desk", icon: Inbox },
  { id: "calls", label: "Calls", icon: Phone },
  { id: "people", label: "People", icon: Users },
  { id: "live", label: "Live", icon: Radio },
  { id: "sdk", label: "SDK", icon: Code2 },
];

export function NorthlineApp() {
  useEffect(() => {
    void Promise.resolve(useDesk.persist.rehydrate());
  }, []);

  return <Shell />;
}

function Shell() {
  const view = useDesk((state) => state.view);
  const setView = useDesk((state) => state.setView);
  const live = useDesk((state) => state.liveCall);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-ink text-fg">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-line px-3 sm:px-4">
        <div className="flex items-center gap-3">
          <Mark />
          <div>
            <p className="font-display text-lg leading-none text-fg">Northline</p>
            <p className="text-xs text-muted">WhatsApp desk</p>
          </div>
        </div>
        <p className="hidden text-sm text-muted sm:block">{AGENT_NAME}</p>
      </header>
      {live ? <CallBanner /> : null}
      <div className="flex min-h-0 flex-1">
        <nav className="hidden w-44 shrink-0 flex-col gap-1 border-r border-line bg-panel p-3 md:flex" aria-label="Desk">
          {NAV.map((item) => (
            <NavButton key={item.id} item={item} active={view === item.id} onClick={() => setView(item.id)} />
          ))}
        </nav>
        <main className="min-w-0 flex-1 overflow-hidden">
          {view === "desk" ? <DeskView /> : null}
          {view === "calls" ? <CallsView /> : null}
          {view === "people" ? <PeopleView /> : null}
          {view === "live" ? <LiveView /> : null}
          {view === "sdk" ? <SdkView /> : null}
        </main>
      </div>
      <nav className="flex shrink-0 border-t border-line bg-panel pb-safe md:hidden" aria-label="Desk">
        {NAV.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setView(item.id)}
            className={cn(
              "flex h-14 flex-1 flex-col items-center justify-center gap-0.5 text-xs",
              view === item.id ? "text-copper" : "text-muted",
            )}
            aria-current={view === item.id ? "page" : undefined}
          >
            <item.icon className="size-5" aria-hidden="true" />
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

function NavButton({
  item,
  active,
  onClick,
}: {
  item: (typeof NAV)[number];
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-11 items-center gap-3 rounded-md px-3 text-sm",
        active ? "bg-raised text-fg" : "text-muted",
      )}
      aria-current={active ? "page" : undefined}
    >
      <item.icon className="size-4" aria-hidden="true" />
      {item.label}
    </button>
  );
}
