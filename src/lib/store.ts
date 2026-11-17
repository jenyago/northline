import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { digits, formatDuration } from "@/lib/format";
import { createSeed } from "@/lib/seed";
import {
  AGENT_NAME,
  type Channel,
  type ChatMessage,
  type Conversation,
  type Customer,
  type DeskEvent,
  type DeskView,
  type InboxFilter,
  type LiveCall,
  type LiveFocus,
  type MobilePane,
  type Priority,
  type TicketStatus,
} from "@/lib/types";

type NewCustomer = {
  userId?: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  language?: string;
  location?: string;
  tags?: string[];
};

export type DeskState = {
  customers: Customer[];
  conversations: Conversation[];
  messages: ChatMessage[];
  calls: ReturnType<typeof createSeed>["calls"];
  selectedId: string;
  liveCall: LiveCall | null;
  events: DeskEvent[];
  drafts: Record<string, string>;
  view: DeskView;
  mobilePane: MobilePane;
  filter: InboxFilter;
  query: string;
  liveFocus: LiveFocus | null;
  setView: (view: DeskView) => void;
  setMobilePane: (pane: MobilePane) => void;
  setFilter: (filter: InboxFilter) => void;
  setQuery: (query: string) => void;
  setDraft: (conversationId: string, value: string) => void;
  select: (conversationId: string) => void;
  markRead: (conversationId: string) => void;
  setStatus: (conversationId: string, status: TicketStatus) => void;
  setPriority: (conversationId: string, priority: Priority) => void;
  setCustomerNote: (customerId: string, note: string) => void;
  focusLive: (focus: LiveFocus) => void;
  clearLiveFocus: () => void;
  upsertCustomer: (channel: Channel, user: NewCustomer) => string;
  postCustomer: (userId: string, channel: Channel, body: string) => string;
  agentReply: (conversationId: string, body: string) => void;
  agentNote: (conversationId: string, body: string) => void;
  requestCall: (userId: string, channel: Channel) => void;
  placeCall: (conversationId: string) => void;
  answerCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  ingestWhatsApp: (update: { from: string; name: string; text?: string; call?: boolean }) => string;
  reset: () => void;
};

const memoryStorage = {
  getItem: (name: string) => (typeof window === "undefined" ? null : localStorage.getItem(name)),
  setItem: (name: string, value: string) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(name, value);
  },
  removeItem: (name: string) => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(name);
  },
};

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`;
}

function pushEvent(events: DeskEvent[], name: string, detail: string): DeskEvent[] {
  return [{ id: uid("ev"), at: Date.now(), name, detail }, ...events].slice(0, 12);
}

function findCustomer(customers: Customer[], user: NewCustomer) {
  const email = user.email?.trim().toLowerCase();
  const phone = user.phone ? digits(user.phone) : "";
  return customers.find((customer) => {
    if (user.userId && customer.id === user.userId) return true;
    if (email && customer.email.toLowerCase() === email) return true;
    if (phone && digits(customer.phone) === phone) return true;
    return false;
  });
}

function blankCustomer(user: NewCustomer, id: string): Customer {
  return {
    id,
    name: user.name.trim() || "New contact",
    email: user.email?.trim() ?? "",
    phone: user.phone?.trim() ?? "",
    company: user.company?.trim() || "New account",
    language: user.language?.trim() || "Español",
    location: user.location?.trim() || "Unknown",
    tags: user.tags ?? [],
    note: "",
  };
}

function subjectFrom(body: string) {
  const line = body.replace(/\s+/g, " ").trim();
  return line.length > 72 ? `${line.slice(0, 69)}…` : line || "New conversation";
}

export const useDesk = create<DeskState>()(
  persist(
    (set, get) => {
      const seed = createSeed();

      const log = (name: string, detail: string) =>
        set((state) => ({ events: pushEvent(state.events, name, detail) }));

      const finishLive = () => {
        const call = get().liveCall;
        if (!call) return;
        const answeredAt = call.answeredAt;
        const answered = call.phase === "active" && answeredAt != null;
        const seconds = answered ? Math.max(1, Math.round((Date.now() - answeredAt) / 1000)) : 0;
        const missed = !answered;
        const body = missed
          ? call.direction === "in"
            ? "Missed voice call"
            : "Voice call cancelled"
          : `Voice call · ${formatDuration(seconds)}`;
        const message: ChatMessage = {
          id: uid("m"),
          conversationId: call.conversationId,
          kind: "system",
          author: "Northline",
          body,
          at: Date.now(),
        };
        set((state) => ({
          liveCall: null,
          calls: [
            {
              id: call.id,
              conversationId: call.conversationId,
              customerId: call.customerId,
              channel: call.channel,
              direction: call.direction,
              status: missed ? "missed" : "ended",
              startedAt: call.startedAt,
              seconds,
            },
            ...state.calls,
          ],
          messages: [...state.messages, message],
          conversations: state.conversations.map((conversation) =>
            conversation.id === call.conversationId
              ? { ...conversation, updatedAt: message.at, status: conversation.status === "closed" ? "open" : conversation.status }
              : conversation,
          ),
          events: pushEvent(state.events, "call", body),
        }));
      };

      const openConversation = (userId: string, channel: Channel, subject: string) => {
        const state = get();
        const existing = state.conversations.find(
          (conversation) =>
            conversation.customerId === userId &&
            conversation.channel === channel &&
            conversation.status !== "closed",
        );
        if (existing) return existing.id;
        const closed = state.conversations.find(
          (conversation) => conversation.customerId === userId && conversation.channel === channel,
        );
        if (closed) {
          set((current) => ({
            conversations: current.conversations.map((conversation) =>
              conversation.id === closed.id
                ? { ...conversation, status: "open" as const, updatedAt: Date.now() }
                : conversation,
            ),
          }));
          return closed.id;
        }
        const id = uid("cnv");
        const conversation: Conversation = {
          id,
          customerId: userId,
          channel,
          subject,
          status: "open",
          priority: "normal",
          unread: false,
          updatedAt: Date.now(),
        };
        set((current) => ({ conversations: [conversation, ...current.conversations] }));
        return id;
      };

      const startRing = (conversationId: string, direction: "in" | "out") => {
        const state = get();
        if (
          state.liveCall &&
          state.liveCall.conversationId === conversationId &&
          state.liveCall.direction === direction
        ) {
          return;
        }
        if (state.liveCall) finishLive();
        const conversation = get().conversations.find((item) => item.id === conversationId);
        const customer = get().customers.find((item) => item.id === conversation?.customerId);
        if (!conversation || !customer) return;
        const call: LiveCall = {
          id: uid("call"),
          conversationId,
          customerId: customer.id,
          channel: conversation.channel,
          direction,
          phase: "ringing",
          startedAt: Date.now(),
          answeredAt: null,
          muted: false,
        };
        set((current) => ({
          liveCall: call,
          selectedId: conversationId,
          liveFocus:
            direction === "out" && get().view === "live"
              ? { channel: conversation.channel, customerId: customer.id }
              : current.liveFocus,
          events: pushEvent(
            current.events,
            "call",
            direction === "in"
              ? `${customer.name} is ringing on ${conversation.channel}`
              : `Calling ${customer.name}`,
          ),
        }));
      };

      return {
        ...seed,
        liveCall: null,
        events: [],
        drafts: {},
        view: "desk",
        mobilePane: "list",
        filter: "all",
        query: "",
        liveFocus: null,

        setView: (view) => set({ view }),
        setMobilePane: (mobilePane) => set({ mobilePane }),
        setFilter: (filter) => set({ filter }),
        setQuery: (query) => set({ query }),
        setDraft: (conversationId, value) =>
          set((state) => ({ drafts: { ...state.drafts, [conversationId]: value } })),
        select: (conversationId) => set({ selectedId: conversationId, mobilePane: "thread" }),
        markRead: (conversationId) =>
          set((state) => ({
            conversations: state.conversations.map((conversation) =>
              conversation.id === conversationId ? { ...conversation, unread: false } : conversation,
            ),
          })),
        setStatus: (conversationId, status) => {
          const conversation = get().conversations.find((item) => item.id === conversationId);
          if (!conversation || conversation.status === status) return;
          const message: ChatMessage = {
            id: uid("m"),
            conversationId,
            kind: "system",
            author: "Northline",
            body: `Marked ${status}`,
            at: Date.now(),
          };
          set((state) => ({
            messages: [...state.messages, message],
            conversations: state.conversations.map((item) =>
              item.id === conversationId ? { ...item, status, updatedAt: message.at } : item,
            ),
            events: pushEvent(state.events, "status", `${conversation.subject} · ${status}`),
          }));
        },
        setPriority: (conversationId, priority) =>
          set((state) => ({
            conversations: state.conversations.map((conversation) =>
              conversation.id === conversationId ? { ...conversation, priority } : conversation,
            ),
          })),
        setCustomerNote: (customerId, note) =>
          set((state) => ({
            customers: state.customers.map((customer) =>
              customer.id === customerId ? { ...customer, note } : customer,
            ),
          })),
        focusLive: (liveFocus) => set({ liveFocus, view: "live" }),
        clearLiveFocus: () => set({ liveFocus: null }),

        upsertCustomer: (channel, user) => {
          const existing = findCustomer(get().customers, user);
          if (existing) {
            log("identify", `${existing.name} · ${channel}`);
            return existing.id;
          }
          const id = user.userId || uid("cus");
          const customer = blankCustomer(user, id);
          const tags = customer.tags.includes(channel) ? customer.tags : [...customer.tags, channel];
          const next = { ...customer, tags };
          set((state) => ({
            customers: [next, ...state.customers],
            events: pushEvent(state.events, "identify", `${next.name} · ${channel}`),
          }));
          return id;
        },

        postCustomer: (userId, channel, body) => {
          const text = body.trim();
          if (!text) return "";
          const customer = get().customers.find((item) => item.id === userId);
          if (!customer) return "";
          const conversationId = openConversation(userId, channel, subjectFrom(text));
          const message: ChatMessage = {
            id: uid("m"),
            conversationId,
            kind: "customer",
            author: customer.name,
            body: text,
            at: Date.now(),
          };
          set((state) => ({
            messages: [...state.messages, message],
            selectedId: conversationId,
            conversations: state.conversations.map((conversation) =>
              conversation.id === conversationId
                ? { ...conversation, status: "open", unread: true, updatedAt: message.at }
                : conversation,
            ),
            events: pushEvent(state.events, "message", `${customer.name} on ${channel}: ${subjectFrom(text)}`),
          }));
          return conversationId;
        },

        agentReply: (conversationId, body) => {
          const text = body.trim();
          if (!text) return;
          const message: ChatMessage = {
            id: uid("m"),
            conversationId,
            kind: "agent",
            author: AGENT_NAME,
            body: text,
            at: Date.now(),
          };
          set((state) => ({
            messages: [...state.messages, message],
            drafts: { ...state.drafts, [conversationId]: "" },
            conversations: state.conversations.map((conversation) =>
              conversation.id === conversationId
                ? {
                    ...conversation,
                    status: "waiting",
                    unread: false,
                    updatedAt: message.at,
                  }
                : conversation,
            ),
            events: pushEvent(state.events, "message", `${AGENT_NAME} replied`),
          }));
        },

        agentNote: (conversationId, body) => {
          const text = body.trim();
          if (!text) return;
          const message: ChatMessage = {
            id: uid("m"),
            conversationId,
            kind: "note",
            author: AGENT_NAME,
            body: text,
            at: Date.now(),
          };
          set((state) => ({
            messages: [...state.messages, message],
            drafts: { ...state.drafts, [conversationId]: "" },
            conversations: state.conversations.map((conversation) =>
              conversation.id === conversationId ? { ...conversation, updatedAt: message.at } : conversation,
            ),
            events: pushEvent(state.events, "note", "Internal note saved"),
          }));
        },

        requestCall: (userId, channel) => {
          const customer = get().customers.find((item) => item.id === userId);
          if (!customer) return;
          const conversationId = openConversation(userId, channel, "Voice line");
          startRing(conversationId, "in");
        },

        placeCall: (conversationId) => startRing(conversationId, "out"),

        answerCall: () => {
          const call = get().liveCall;
          if (!call || call.phase !== "ringing") return;
          const customer = get().customers.find((item) => item.id === call.customerId);
          set((state) => ({
            liveCall: state.liveCall
              ? { ...state.liveCall, phase: "active", answeredAt: Date.now() }
              : null,
            events: pushEvent(state.events, "call", `Connected with ${customer?.name ?? "the line"}`),
          }));
        },

        endCall: () => finishLive(),

        toggleMute: () =>
          set((state) => ({
            liveCall: state.liveCall ? { ...state.liveCall, muted: !state.liveCall.muted } : null,
          })),

        ingestWhatsApp: ({ from, name, text, call }) => {
          const id = get().upsertCustomer("whatsapp", {
            name,
            phone: from,
            company: "WhatsApp contact",
            tags: ["whatsapp"],
          });
          if (text?.trim()) get().postCustomer(id, "whatsapp", text);
          if (call) get().requestCall(id, "whatsapp");
          return id;
        },

        reset: () => {
          const fresh = createSeed();
          set({
            ...fresh,
            liveCall: null,
            events: [],
            drafts: {},
            view: "desk",
            mobilePane: "list",
            filter: "all",
            query: "",
            liveFocus: null,
          });
        },
      };
    },
    {
      name: "northline-desk-v2",
      skipHydration: true,
      storage: createJSONStorage(() => memoryStorage),
      partialize: (state) => ({
        customers: state.customers,
        conversations: state.conversations,
        messages: state.messages,
        calls: state.calls,
        selectedId: state.selectedId,
        liveCall: state.liveCall,
      }),
    },
  ),
);

export function customerById(customers: Customer[], id: string) {
  return customers.find((customer) => customer.id === id);
}
