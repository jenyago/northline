import { useEffect, useState } from "react";
import { Mic, MicOff, Phone, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import { channelLabel, formatDuration } from "@/lib/format";
import { customerById, useDesk } from "@/lib/store";
import { Northline } from "@/sdk/northline";
import type { LiveCall } from "@/lib/types";

export function shouldAnswer(call: LiveCall, role: "agent" | "customer") {
  if (call.phase !== "ringing") return false;
  return role === "agent" ? call.direction === "in" : call.direction === "out";
}

export function useClock(running: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [running]);
  return now;
}

export function CallBanner() {
  const call = useDesk((state) => state.liveCall);
  const customers = useDesk((state) => state.customers);
  const now = useClock(Boolean(call));
  if (!call) return null;
  const customer = customerById(customers, call.customerId);
  const answer = shouldAnswer(call, "agent");
  const origin = call.phase === "active" && call.answeredAt ? call.answeredAt : call.startedAt;
  const elapsed = formatDuration(Math.max(0, Math.floor((now - origin) / 1000)));
  const phase =
    call.phase === "active"
      ? call.muted
        ? "Muted"
        : "On the line"
      : call.direction === "in"
        ? "Incoming"
        : "Calling";

  return (
    <div
      className="flex items-center gap-3 border-b border-line bg-raised px-3 py-2"
      role="status"
      aria-live="polite"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-copper text-ink">
        <Phone className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-fg">{customer?.name ?? "Voice line"}</p>
        <p className="text-xs text-muted">
          <span className="tabular-nums">{elapsed}</span>
          {" · "}
          {phase}
          {" · "}
          {channelLabel(call.channel)}
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        {call.phase === "active" ? (
          <Button tone="line" size="icon" aria-label={call.muted ? "Unmute" : "Mute"} onClick={() => Northline.toggleMute()}>
            {call.muted ? <MicOff className="size-4" /> : <Mic className="size-4" />}
          </Button>
        ) : null}
        {call.phase === "ringing" && call.direction === "out" ? (
          <Button tone="copper" size="sm" onClick={() => Northline.answer()}>
            Pick up
          </Button>
        ) : null}
        {answer ? (
          <Button tone="copper" size="sm" onClick={() => Northline.answer()}>
            Answer
          </Button>
        ) : null}
        <Button
          tone={call.phase === "active" ? "copper" : "quiet"}
          size="sm"
          onClick={() => Northline.endCall()}
        >
          {call.phase === "active" ? "End" : answer ? "Decline" : "Cancel"}
        </Button>
      </div>
    </div>
  );
}

export function CallStage({
  role,
  customerId,
  dense = false,
}: {
  role: "agent" | "customer";
  customerId?: string;
  dense?: boolean;
}) {
  const call = useDesk((state) => state.liveCall);
  const customers = useDesk((state) => state.customers);
  const now = useClock(Boolean(call));
  if (!call) return null;
  if (role === "customer" && customerId && call.customerId !== customerId) return null;
  const customer = customerById(customers, call.customerId);
  const answer = shouldAnswer(call, role);
  const origin = call.phase === "active" && call.answeredAt ? call.answeredAt : call.startedAt;
  const elapsed = formatDuration(Math.max(0, Math.floor((now - origin) / 1000)));
  const title =
    call.phase === "active"
      ? "Connected"
      : answer
        ? "Incoming voice line"
        : role === "agent"
          ? "Ringing their side"
          : "Ringing the desk";

  return (
    <div className={cn("flex flex-col items-center text-center", dense ? "gap-2 px-3 py-3" : "gap-4 px-4 py-6")}>
      <p className="text-sm text-muted">{channelLabel(call.channel)}</p>
      <h2 className={cn("font-display text-fg", dense ? "text-xl" : "text-3xl")}>{customer?.name}</h2>
      <p className="text-sm text-muted">{title}</p>
      <p className={cn("font-display tabular-nums text-copper", dense ? "text-3xl" : "text-5xl")}>{elapsed}</p>
      {dense ? null : (
        <div className="flex h-12 items-center gap-1" aria-hidden="true">
          {Array.from({ length: 7 }, (_, index) => (
            <span
              key={index}
              className="wave-bar h-8 w-1 rounded-full bg-copper"
              style={{ animationDelay: `${index * 120}ms` }}
            />
          ))}
        </div>
      )}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {call.phase === "active" ? (
          <Button tone="line" onClick={() => Northline.toggleMute()}>
            {call.muted ? <MicOff className="size-4" /> : <Mic className="size-4" />}
            {call.muted ? "Unmute" : "Mute"}
          </Button>
        ) : null}
        {answer ? (
          <Button tone="copper" onClick={() => Northline.answer()}>
            <Phone className="size-4" />
            Answer
          </Button>
        ) : null}
        <Button tone="quiet" onClick={() => Northline.endCall()}>
          <PhoneOff className="size-4" />
          {call.phase === "active" ? "End call" : answer ? "Decline" : "Cancel"}
        </Button>
      </div>
    </div>
  );
}
