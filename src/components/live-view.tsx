import { useEffect, useState } from "react";
import { Phone, Send } from "lucide-react";
import { CallStage } from "@/components/call-stage";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import { channelLabel, formatStamp } from "@/lib/format";
import { useDesk } from "@/lib/store";
import { Northline } from "@/sdk/northline";
import type { Channel } from "@/lib/types";

const TABS: Channel[] = ["whatsapp", "ios", "web"];

export function LiveView() {
  const focus = useDesk((state) => state.liveFocus);
  const clear = useDesk((state) => state.clearLiveFocus);
  const [tab, setTab] = useState<Channel>("whatsapp");

  useEffect(() => {
    if (!focus) return;
    setTab(focus.channel);
    clear();
  }, [focus, clear]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="shrink-0 space-y-3 border-b border-line px-4 py-4">
        <div>
          <h1 className="font-display text-2xl text-fg">Live channels</h1>
          <p className="text-sm text-pretty text-muted">
            WhatsApp is the line. The driver app and the site write into the same desk.
          </p>
        </div>
        <div className="flex gap-2 lg:hidden">
          {TABS.map((channel) => (
            <button
              key={channel}
              type="button"
              onClick={() => setTab(channel)}
              className={cn(
                "h-11 flex-1 rounded-md text-sm",
                tab === channel ? "bg-copper text-ink" : "bg-raised text-muted",
              )}
            >
              {channelLabel(channel)}
            </button>
          ))}
        </div>
      </header>
      <div className="min-h-0 flex-1 p-3 lg:p-4">
        <div className="grid h-full min-h-0 gap-3 lg:grid-cols-3">
          {TABS.map((channel) => (
            <div key={channel} className={cn("h-full min-h-0", tab === channel ? "block" : "hidden lg:block")}>
              <ChannelDevice channel={channel} focusedId={focus?.channel === channel ? focus.customerId : null} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ChannelDevice({ channel, focusedId }: { channel: Channel; focusedId: string | null }) {
  const customers = useDesk((state) => state.customers);
  const conversations = useDesk((state) => state.conversations);
  const messages = useDesk((state) => state.messages);
  const actors = customers.filter((customer) =>
    conversations.some((conversation) => conversation.customerId === customer.id && conversation.channel === channel),
  );
  const [actorId, setActorId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (focusedId) setActorId(focusedId);
  }, [focusedId]);

  const actor = actors.find((customer) => customer.id === actorId) ?? actors[0];
  const conversation = actor
    ? conversations.find(
        (item) => item.customerId === actor.id && item.channel === channel && item.status !== "closed",
      ) ?? conversations.find((item) => item.customerId === actor.id && item.channel === channel)
    : undefined;
  const thread = messages.filter(
    (message) => message.conversationId === conversation?.id && message.kind !== "note",
  );

  useEffect(() => {
    setText("");
    setCreating(false);
  }, [actor?.id, channel]);

  const send = () => {
    const body = text.trim();
    if (!body || !actor) return;
    if (channel === "whatsapp") {
      Northline.ingestWhatsApp({ from: actor.phone, name: actor.name, text: body });
    } else {
      Northline.send(channel, actor.id, body);
    }
    setText("");
  };

  const call = () => {
    if (!actor) return;
    if (channel === "whatsapp") Northline.ingestWhatsApp({ from: actor.phone, name: actor.name, call: true });
    else Northline.startCall(channel, actor.id);
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <label className="block shrink-0">
        <span className="sr-only">Acting as</span>
        <select
          value={actor?.id ?? ""}
          onChange={(event) => setActorId(event.target.value)}
          className="h-11 w-full rounded-md border border-line bg-panel px-3 text-sm text-fg"
        >
          {actors.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name} · {customer.company}
            </option>
          ))}
        </select>
      </label>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-line bg-ink">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-fg">
              {channel === "whatsapp" ? "Ruta Norte" : channel === "ios" ? "Ruta driver" : "Ruta site"}
            </p>
            <p className="truncate text-xs text-muted">
              {channel === "whatsapp" ? "WhatsApp business line" : channel === "ios" ? "NorthlineKit messenger" : "Web widget"}
              {actor ? ` · ${actor.name}` : ""}
            </p>
          </div>
          <Button tone="ghost" size="icon" aria-label="Start a call" onClick={call}>
            <Phone className="size-4" />
          </Button>
        </div>
        {creating && channel === "web" ? (
          <NewVisitor
            onDone={(id) => {
              setActorId(id);
              setCreating(false);
            }}
            onCancel={() => setCreating(false)}
          />
        ) : (
          <>
            <div className="scroll-thin min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3">
              {thread.length === 0 ? (
                <p className="text-sm text-pretty text-muted">
                  No messages on this channel yet. Send one and it opens on the desk.
                </p>
              ) : (
                thread.map((message) => {
                  if (message.kind === "system") {
                    return (
                      <p key={message.id} className="text-center text-xs text-muted">
                        {message.body}
                      </p>
                    );
                  }
                  const mine = message.kind === "customer";
                  return (
                    <div key={message.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                      <div className={cn("max-w-xs", mine ? "items-end" : "items-start")}>
                        <p
                          className={cn(
                            "rounded-lg px-3 py-2 text-sm text-pretty",
                            mine ? "bg-copper text-ink" : "bg-raised text-fg",
                          )}
                        >
                          {message.body}
                        </p>
                        <p className="mt-1 text-xs text-muted tabular-nums">{formatStamp(message.at)}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <CallStage role="customer" customerId={actor?.id} dense />
            <form
              className="flex shrink-0 gap-2 border-t border-line p-3"
              onSubmit={(event) => {
                event.preventDefault();
                send();
              }}
            >
              <label className="min-w-0 flex-1">
                <span className="sr-only">Message</span>
                <input
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  placeholder={`Message as ${actor?.name ?? "customer"}`}
                  className="h-11 w-full rounded-md border border-line bg-panel px-3 text-sm text-fg outline-none placeholder:text-muted"
                />
              </label>
              <Button tone="copper" size="icon" type="submit" aria-label="Send" disabled={!text.trim()}>
                <Send className="size-4" />
              </Button>
            </form>
          </>
        )}
        {channel === "web" && !creating ? (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="h-11 shrink-0 border-t border-line text-sm text-muted"
          >
            New visitor
          </button>
        ) : null}
      </div>
    </div>
  );
}

function NewVisitor({ onDone, onCancel }: { onDone: (id: string) => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");

  return (
    <form
      className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3"
      onSubmit={(event) => {
        event.preventDefault();
        const id = `cus_${Math.random().toString(36).slice(2, 8)}`;
        Northline.identify("web", {
          userId: id,
          name: name.trim(),
          email: email.trim(),
          company: company.trim() || "New visitor",
        });
        Northline.send("web", id, message.trim());
        onDone(id);
      }}
    >
      <p className="text-sm text-pretty text-muted">
        identify() then send(). A new person appears on the desk with this first message.
      </p>
      <Field label="Name" value={name} onChange={setName} required />
      <Field label="Email" value={email} onChange={setEmail} />
      <Field label="Company" value={company} onChange={setCompany} />
      <label className="block text-sm text-muted">
        Message
        <textarea
          required
          value={message}
          rows={3}
          onChange={(event) => setMessage(event.target.value)}
          className="mt-1 w-full resize-none rounded-md border border-line bg-panel px-3 py-2 text-sm text-fg outline-none"
        />
      </label>
      <div className="mt-auto flex gap-2">
        <Button tone="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button tone="copper" type="submit" disabled={!name.trim() || !message.trim()}>
          Start conversation
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block text-sm text-muted">
      {label}
      <input
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-11 w-full rounded-md border border-line bg-panel px-3 text-sm text-fg outline-none"
      />
    </label>
  );
}
