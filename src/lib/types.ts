export type Channel = "web" | "ios" | "whatsapp";

export type TicketStatus = "open" | "waiting" | "snoozed" | "closed";

export type Priority = "normal" | "high";

export type MessageKind = "customer" | "agent" | "system" | "note";

export type DeskView = "desk" | "calls" | "people" | "live" | "sdk";

export type InboxFilter = "all" | "unread" | "web" | "ios" | "whatsapp";

export type MobilePane = "list" | "thread";

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  language: string;
  location: string;
  tags: string[];
  note: string;
};

export type Conversation = {
  id: string;
  customerId: string;
  channel: Channel;
  subject: string;
  status: TicketStatus;
  priority: Priority;
  unread: boolean;
  updatedAt: number;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  kind: MessageKind;
  author: string;
  body: string;
  at: number;
};

export type CallRecord = {
  id: string;
  conversationId: string;
  customerId: string;
  channel: Channel;
  direction: "in" | "out";
  status: "ended" | "missed";
  startedAt: number;
  seconds: number;
};

export type LiveCall = {
  id: string;
  conversationId: string;
  customerId: string;
  channel: Channel;
  direction: "in" | "out";
  phase: "ringing" | "active";
  startedAt: number;
  answeredAt: number | null;
  muted: boolean;
};

export type DeskEvent = {
  id: string;
  at: number;
  name: string;
  detail: string;
};

export type LiveFocus = {
  channel: Channel;
  customerId: string;
};

export const AGENT_NAME = "Inés Vidal";
