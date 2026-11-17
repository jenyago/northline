import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui";
import { useDesk } from "@/lib/store";
import { APP_ID } from "@/sdk/northline";
import { IOS_PACKAGE_FILES } from "@/sdk/ios-package-files";
import { IOS_SNIPPET, WEB_SNIPPET, WHATSAPP_SNIPPET } from "@/sdk/snippets";

const BLOCKS = [
  {
    id: "wa",
    title: "WhatsApp",
    detail: "The front door. A Cloud API webhook becomes a thread. A call button rings the desk.",
    code: WHATSAPP_SNIPPET,
  },
  {
    id: "ios",
    title: "iOS",
    detail: "NorthlineKit inside a driver or clinic app. Same identify, send, and startCall. Not a website widget.",
    code: IOS_SNIPPET,
  },
  {
    id: "web",
    title: "Web",
    detail: "For the few who still write from a browser. Most of these customers never open it.",
    code: WEB_SNIPPET,
  },
];

export function SdkView() {
  const events = useDesk((state) => state.events);
  const reset = useDesk((state) => state.reset);
  const setView = useDesk((state) => state.setView);
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (id: string, text: string) => {
    const ok = await copyText(text);
    if (!ok) return;
    setCopied(id);
    window.setTimeout(() => setCopied((current) => (current === id ? null : current)), 1600);
  };

  return (
    <div className="scroll-thin h-full overflow-y-auto">
      <header className="space-y-3 border-b border-line px-4 py-4">
        <h1 className="font-display text-2xl text-fg">SDK</h1>
        <p className="max-w-xl text-sm text-pretty text-muted">
          One client for desks Intercom does not cover: Iberia, Latin America, MENA, India, Southeast Asia. Customers already have a WhatsApp number. The app and the site are optional.
        </p>
        <p className="text-sm text-fg">
          App id <span className="text-copper">{APP_ID}</span>
        </p>
        <div className="flex flex-wrap gap-2">
          <Button tone="copper" onClick={() => setView("live")}>
            Open Live
          </Button>
          <Button tone="line" onClick={() => reset()}>
            Reset sample desk
          </Button>
        </div>
      </header>
      <div className="space-y-4 px-4 py-4">
        {BLOCKS.map((block) => (
          <article key={block.id} className="rounded-lg border border-line bg-panel p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-xl text-fg">{block.title}</h2>
                <p className="mt-1 text-sm text-pretty text-muted">{block.detail}</p>
              </div>
              <Button tone="quiet" size="sm" onClick={() => copy(block.id, block.code)}>
                {copied === block.id ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied === block.id ? "Copied" : "Copy"}
              </Button>
            </div>
            <pre className="scroll-thin mt-3 overflow-x-auto rounded-md bg-ink p-4 text-sm leading-relaxed text-fg">
              <code>{block.code}</code>
            </pre>
            {block.id === "ios" ? <PackageFiles copied={copied} onCopy={copy} /> : null}
          </article>
        ))}
        <article className="rounded-lg border border-line bg-panel p-4">
          <h2 className="font-display text-xl text-fg">Methods</h2>
          <dl className="mt-3 space-y-3 text-sm">
            <Method name="identify(channel, user)" detail="Attach a known person, or create them." />
            <Method name="send(channel, userId, body)" detail="Customer message. Opens a thread on that channel." />
            <Method name="reply(conversationId, body)" detail="Agent reply. Delivered back to the widget." />
            <Method name="note(conversationId, body)" detail="Desk-only. Never sent to the customer SDK." />
            <Method name="startCall(channel, userId)" detail="Customer rings the desk. Someone has to answer." />
            <Method name="ingestWhatsApp({ from, name, text, call })" detail="Webhook entry for the WhatsApp line." />
            <Method name="subscribe(listener)" detail="message, call, identify, note, status." />
          </dl>
        </article>
        <article className="rounded-lg border border-line bg-panel p-4">
          <h2 className="font-display text-xl text-fg">Event log</h2>
          <p className="mt-1 text-sm text-muted">Filled as you use the desk and the Live channels.</p>
          {events.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Nothing yet this session.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {events.map((event) => (
                <li key={event.id} className="text-sm">
                  <span className="text-copper">{event.name}</span>{" "}
                  <span className="text-fg">{event.detail}</span>
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>
    </div>
  );
}

function PackageFiles({
  copied,
  onCopy,
}: {
  copied: string | null;
  onCopy: (id: string, text: string) => void;
}) {
  const [fileId, setFileId] = useState<(typeof IOS_PACKAGE_FILES)[number]["id"]>("client");
  const file = IOS_PACKAGE_FILES.find((item) => item.id === fileId) ?? IOS_PACKAGE_FILES[0];

  return (
    <div className="mt-4 space-y-3">
      <p className="text-sm text-pretty text-muted">
        The Live iPhone on this page still talks to the desk in the browser. This package is the one you compile.
        Point baseURL at your API. Calls are HTTP until you attach a media provider.
      </p>
      <div className="scroll-thin flex gap-2 overflow-x-auto">
        {IOS_PACKAGE_FILES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFileId(item.id)}
            className={
              item.id === file.id
                ? "h-9 shrink-0 rounded-md bg-copper px-3 text-sm text-ink"
                : "h-9 shrink-0 rounded-md bg-raised px-3 text-sm text-muted"
            }
          >
            {item.name}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="truncate text-sm text-fg">{file.name}</p>
        <Button tone="quiet" size="sm" onClick={() => onCopy(file.id, file.source)}>
          {copied === file.id ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied === file.id ? "Copied" : "Copy file"}
        </Button>
      </div>
      <pre className="scroll-thin max-h-80 overflow-auto rounded-md bg-ink p-4 text-sm leading-relaxed text-fg">
        <code>{file.source}</code>
      </pre>
    </div>
  );
}

function Method({ name, detail }: { name: string; detail: string }) {
  return (
    <div>
      <dt className="text-fg">{name}</dt>
      <dd className="text-muted">{detail}</dd>
    </div>
  );
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  }
}
