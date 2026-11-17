import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, CircleUser, MapPin, Phone, Search, Send } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import { channelLabel, formatStamp, initials, statusLabel } from "@/lib/format";
import { MACROS } from "@/lib/macros";
import { customerById, useDesk } from "@/lib/store";
import type { Channel, Conversation, InboxFilter, TicketStatus } from "@/lib/types";
import { useWide } from "@/lib/use-wide";

const FILTERS: { id: InboxFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "ios", label: "iOS" },
  { id: "web", label: "Web" },
];

const STATUSES: TicketStatus[] = ["open", "waiting", "snoozed", "closed"];

export function DeskView() {
  const pane = useDesk((state) => state.mobilePane);
  const setPane = useDesk((state) => state.setMobilePane);

  return (
    <div className="flex h-full min-h-0">
      <section
        className={cn(
          "h-full min-h-0 w-full flex-col border-line bg-panel lg:w-80 lg:shrink-0 lg:border-r xl:w-96",
          pane === "thread" ? "hidden lg:flex" : "flex",
        )}
      >
        <Inbox />
      </section>
      <section className={cn("h-full min-h-0 min-w-0 flex-1", pane === "list" ? "hidden lg:block" : "block")}>
        <Thread onBack={() => setPane("list")} />
      </section>
    </div>
  );
}

function Inbox() {
  const conversations = useDesk((state) => state.conversations);
  const customers = useDesk((state) => state.customers);
  const messages = useDesk((state) => state.messages);
  const selectedId = useDesk((state) => state.selectedId);
  const filter = useDesk((state) => state.filter);
  const query = useDesk((state) => state.query);
  const setFilter = useDesk((state) => state.setFilter);
  const setQuery = useDesk((state) => state.setQuery);
  const select = useDesk((state) => state.select);

  const unread = conversations.filter((conversation) => conversation.unread).length;

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return conversations
      .filter((conversation) => {
        if (filter === "unread") return conversation.unread;
        if (filter === "web" || filter === "ios" || filter === "whatsapp") return conversation.channel === filter;
        return true;
      })
      .filter((conversation) => {
        if (!q) return true;
        const person = customerById(customers, conversation.customerId);
        const blob = [
          person?.name,
          person?.company,
          conversation.subject,
          ...messages.filter((message) => message.conversationId === conversation.id).map((message) => message.body),
        ]
          .join(" ")
          .toLowerCase();
        return blob.includes(q);
      })
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [conversations, customers, messages, filter, query]);

  return (
    <>
      <div className="shrink-0 space-y-3 border-b border-line px-4 py-4">
        <div>
          <h1 className="font-display text-2xl text-fg">Inbox</h1>
          <p className="text-sm text-muted">
            {unread > 0 ? `${unread} unread on the line` : "WhatsApp first. App and site behind it."}
          </p>
        </div>
        <label className="flex h-11 items-center gap-2 rounded-md border border-line bg-ink px-3">
          <Search className="size-4 text-muted" aria-hidden="true" />
          <span className="sr-only">Search conversations</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search people, companies, words"
            className="w-full bg-transparent text-sm text-fg outline-none placeholder:text-muted"
          />
        </label>
        <div className="scroll-thin flex gap-2 overflow-x-auto">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={cn(
                "h-9 shrink-0 rounded-md px-3 text-sm transition-transform duration-150 active:scale-[0.96]",
                filter === item.id ? "bg-copper text-ink" : "bg-raised text-muted",
              )}
            >
              {item.label}
              {item.id === "unread" && unread > 0 ? ` ${unread}` : ""}
            </button>
          ))}
        </div>
      </div>
      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">
        {rows.length === 0 ? (
          <p className="px-4 py-8 text-sm text-muted">Nothing in this view.</p>
        ) : (
          rows.map((conversation) => {
            const person = customerById(customers, conversation.customerId);
            const preview = [...messages]
              .reverse()
              .find((message) => message.conversationId === conversation.id && message.kind !== "note");
            const active = conversation.id === selectedId;
            return (
              <button
                key={conversation.id}
                type="button"
                onClick={() => select(conversation.id)}
                className={cn(
                  "flex w-full gap-3 border-b border-line px-4 py-3 text-left",
                  active ? "bg-ink" : "hover:bg-ink/60",
                )}
              >
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-md bg-raised text-sm font-medium text-fg",
                    conversation.priority === "high" && conversation.status !== "closed" ? "border border-copper" : "",
                  )}
                >
                  {initials(person?.name ?? "?")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className={cn("truncate text-sm text-fg", conversation.unread && "font-semibold")}>
                      {person?.name}
                    </span>
                    <span className="shrink-0 text-xs text-muted tabular-nums">
                      {formatStamp(conversation.updatedAt)}
                    </span>
                  </span>
                  <span className="mt-0.5 block truncate text-sm text-muted">
                    {preview?.body ?? conversation.subject}
                  </span>
                  <span className="mt-1 flex items-center gap-2 text-xs text-muted">
                    <span>{person?.location}</span>
                    <span aria-hidden="true">·</span>
                    <span>{channelLabel(conversation.channel)}</span>
                    {conversation.status !== "open" ? (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{statusLabel(conversation.status)}</span>
                      </>
                    ) : null}
                    {conversation.priority === "high" && conversation.status !== "closed" ? (
                      <span className="text-copper">Urgent</span>
                    ) : null}
                    {conversation.unread ? <span className="ml-auto size-2 rounded-full bg-copper" aria-label="Unread" /> : null}
                  </span>
                </span>
              </button>
            );
          })
        )}
      </div>
    </>
  );
}

function Thread({ onBack }: { onBack: () => void }) {
  const wide = useWide();
  const selectedId = useDesk((state) => state.selectedId);
  const conversations = useDesk((state) => state.conversations);
  const customers = useDesk((state) => state.customers);
  const messages = useDesk((state) => state.messages);
  const markRead = useDesk((state) => state.markRead);
  const setStatus = useDesk((state) => state.setStatus);
  const setPriority = useDesk((state) => state.setPriority);
  const placeCall = useDesk((state) => state.placeCall);
  const focusLive = useDesk((state) => state.focusLive);
  const draft = useDesk((state) => (selectedId ? state.drafts[selectedId] ?? "" : ""));
  const setDraft = useDesk((state) => state.setDraft);
  const agentReply = useDesk((state) => state.agentReply);
  const agentNote = useDesk((state) => state.agentNote);
  const [noteMode, setNoteMode] = useState(false);
  const [profile, setProfile] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const conversation = conversations.find((item) => item.id === selectedId);
  const person = conversation ? customerById(customers, conversation.customerId) : undefined;
  const thread = messages.filter((message) => message.conversationId === selectedId);
  const pane = useDesk((state) => state.mobilePane);
  const visible = Boolean(conversation) && (wide || pane === "thread");

  useEffect(() => {
    if (visible && conversation?.unread) markRead(conversation.id);
  }, [visible, conversation?.id, conversation?.unread, markRead]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [thread.length, selectedId]);

  if (!conversation || !person) {
    return <p className="p-6 text-sm text-muted">Pick a conversation.</p>;
  }

  const send = () => {
    if (noteMode) agentNote(conversation.id, draft);
    else agentReply(conversation.id, draft);
  };

  return (
    <div className="flex h-full min-h-0">
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="shrink-0 space-y-3 border-b border-line px-3 py-3 sm:px-4">
        <div className="flex items-center gap-2">
          <Button className="lg:hidden" tone="ghost" size="icon" aria-label="Back to inbox" onClick={onBack}>
            <ArrowLeft className="size-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-display text-xl text-fg">{person.name}</h2>
            <p className="truncate text-sm text-muted">
              {conversation.subject} · {channelLabel(conversation.channel)}
            </p>
          </div>
          <Button tone="ghost" size="icon" className="xl:hidden" aria-label="Customer profile" onClick={() => setProfile(true)}>
            <CircleUser className="size-5" />
          </Button>
          <Button tone="copper" size="icon" aria-label={`Call ${person.name}`} onClick={() => placeCall(conversation.id)}>
            <Phone className="size-4" />
          </Button>
        </div>
        <div className="scroll-thin flex gap-2 overflow-x-auto">
          {STATUSES.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatus(conversation.id, status)}
              className={cn(
                "h-9 shrink-0 rounded-md px-3 text-sm",
                conversation.status === status ? "bg-copper text-ink" : "bg-raised text-muted",
              )}
            >
              {statusLabel(status)}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPriority(conversation.id, conversation.priority === "high" ? "normal" : "high")}
            className={cn(
              "h-9 shrink-0 rounded-md px-3 text-sm",
              conversation.priority === "high" ? "bg-copper text-ink" : "bg-raised text-muted",
            )}
          >
            {conversation.priority === "high" ? "Urgent" : "Mark urgent"}
          </button>
        </div>
      </header>
      <div className="scroll-thin min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-4 sm:px-4">
        {thread.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        <div ref={endRef} />
      </div>
      <form
        className="shrink-0 space-y-3 border-t border-line px-3 py-3 sm:px-4"
        onSubmit={(event) => {
          event.preventDefault();
          send();
        }}
      >
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setNoteMode(false)}
            className={cn("h-9 rounded-md px-3 text-sm", !noteMode ? "bg-copper text-ink" : "bg-raised text-muted")}
          >
            Reply
          </button>
          <button
            type="button"
            onClick={() => setNoteMode(true)}
            className={cn("h-9 rounded-md px-3 text-sm", noteMode ? "bg-copper text-ink" : "bg-raised text-muted")}
          >
            Note
          </button>
        </div>
        <div className="scroll-thin flex gap-2 overflow-x-auto">
          {MACROS.map((macro) => (
            <button
              key={macro.id}
              type="button"
              onClick={() => setDraft(conversation.id, macro.body)}
              className="h-9 shrink-0 rounded-md bg-raised px-3 text-sm text-muted"
            >
              {macro.label}
            </button>
          ))}
        </div>
        <div className="flex items-end gap-2">
          <label className="min-w-0 flex-1">
            <span className="sr-only">{noteMode ? "Internal note" : "Reply"}</span>
            <textarea
              value={draft}
              rows={2}
              onChange={(event) => setDraft(conversation.id, event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  send();
                }
              }}
              placeholder={noteMode ? "Only the desk can see this note" : `Reply on ${channelLabel(conversation.channel)}`}
              className="w-full resize-none rounded-md border border-line bg-ink px-3 py-2 text-sm text-fg outline-none placeholder:text-muted"
            />
          </label>
          <Button tone="copper" type="submit" size="icon" aria-label={noteMode ? "Save note" : "Send reply"} disabled={!draft.trim()}>
            <Send className="size-4" />
          </Button>
        </div>
      </form>
      {profile ? (
        <div className="absolute inset-0 z-10 flex flex-col bg-ink xl:hidden">
          <div className="flex h-14 items-center border-b border-line px-2">
            <Button tone="ghost" onClick={() => setProfile(false)}>
              <ArrowLeft className="size-4" />
              Thread
            </Button>
          </div>
          <CustomerCard
            conversation={conversation}
            onOpenLive={() => focusLive({ channel: conversation.channel, customerId: person.id })}
          />
        </div>
      ) : null}
      </div>
      <aside className="hidden w-80 shrink-0 border-l border-line bg-panel xl:flex xl:flex-col">
        <CustomerCard
          conversation={conversation}
          onOpenLive={() => focusLive({ channel: conversation.channel, customerId: person.id })}
        />
      </aside>
    </div>
  );
}

function MessageBubble({ message }: { message: { kind: string; author: string; body: string; at: number } }) {
  if (message.kind === "system") {
    return <p className="text-center text-xs text-muted">{message.body}</p>;
  }
  if (message.kind === "note") {
    return (
      <div className="rounded-md border border-copper/40 bg-copper/10 px-3 py-2">
        <p className="text-xs text-copper">Internal note · {message.author}</p>
        <p className="mt-1 text-sm text-pretty text-fg">{message.body}</p>
      </div>
    );
  }
  const mine = message.kind === "agent";
  return (
    <div className={cn("flex max-w-xs flex-col sm:max-w-sm", mine ? "ml-auto items-end" : "items-start")}>
      <p className="mb-1 text-xs text-muted">
        {message.author} · <span className="tabular-nums">{formatStamp(message.at)}</span>
      </p>
      <p
        className={cn(
          "rounded-lg px-3 py-2 text-sm text-pretty",
          mine ? "bg-copper text-ink" : "bg-raised text-fg",
        )}
      >
        {message.body}
      </p>
    </div>
  );
}

function CustomerCard({
  conversation,
  onOpenLive,
}: {
  conversation: Conversation;
  onOpenLive: () => void;
}) {
  const customers = useDesk((state) => state.customers);
  const setNote = useDesk((state) => state.setCustomerNote);
  const person = customerById(customers, conversation.customerId);
  if (!person) return null;

  return (
    <div className="scroll-thin min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-5">
      <div>
        <span className="flex size-12 items-center justify-center rounded-md bg-raised font-medium text-fg">
          {initials(person.name)}
        </span>
        <h3 className="mt-3 font-display text-2xl text-fg">{person.name}</h3>
        <p className="text-sm text-muted">{person.company}</p>
        <p className="mt-2 text-sm text-copper">
          {person.language} · {channelLabel(conversation.channel as Channel)}
        </p>
      </div>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-muted">Email</dt>
          <dd className="truncate text-fg">{person.email || "—"}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted">Phone</dt>
          <dd className="text-fg tabular-nums">{person.phone || "—"}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="flex items-center gap-1 text-muted">
            <MapPin className="size-3.5" aria-hidden="true" />
            Where
          </dt>
          <dd className="text-fg">{person.location}</dd>
        </div>
      </dl>
      <div className="flex flex-wrap gap-2">
        {person.tags.map((tag) => (
          <span key={tag} className="rounded-md bg-raised px-2 py-1 text-xs text-muted">
            {tag}
          </span>
        ))}
      </div>
      <label className="block">
        <span className="text-sm text-muted">Desk note</span>
        <textarea
          value={person.note}
          rows={5}
          onChange={(event) => setNote(person.id, event.target.value)}
          className="mt-2 w-full resize-none rounded-md border border-line bg-ink px-3 py-2 text-sm text-fg outline-none"
        />
      </label>
      <Button tone="line" className="w-full" onClick={onOpenLive}>
        Open this channel
      </Button>
    </div>
  );
}
