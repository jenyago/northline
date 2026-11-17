import type { Channel, TicketStatus } from "@/lib/types";

export function channelLabel(channel: Channel) {
  if (channel === "web") return "Web";
  if (channel === "ios") return "iOS";
  return "WhatsApp";
}

export function statusLabel(status: TicketStatus) {
  if (status === "open") return "Open";
  if (status === "waiting") return "Waiting";
  if (status === "snoozed") return "Snoozed";
  return "Closed";
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "?";
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return (a + b).toUpperCase();
}

export function formatStamp(at: number, now = Date.now()) {
  const day = new Date(at).toDateString();
  const today = new Date(now).toDateString();
  if (day === today) {
    return new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(at);
  }
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
  }).format(at);
}

export function formatDuration(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function digits(phone: string) {
  return phone.replace(/[^\d+]/g, "");
}
