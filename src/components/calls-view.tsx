import { Phone } from "lucide-react";
import { CallStage } from "@/components/call-stage";
import { Button } from "@/components/ui";
import { channelLabel, formatDuration, formatStamp } from "@/lib/format";
import { customerById, useDesk } from "@/lib/store";

export function CallsView() {
  const calls = useDesk((state) => state.calls);
  const customers = useDesk((state) => state.customers);
  const live = useDesk((state) => state.liveCall);
  const placeCall = useDesk((state) => state.placeCall);
  const select = useDesk((state) => state.select);
  const setView = useDesk((state) => state.setView);

  return (
    <div className="scroll-thin h-full overflow-y-auto">
      <header className="border-b border-line px-4 py-4">
        <h1 className="font-display text-2xl text-fg">Calls</h1>
        <p className="text-sm text-pretty text-muted">
          Voice is a session on the same conversation. Answer here, or from the banner.
        </p>
      </header>
      {live ? (
        <div className="border-b border-line">
          <CallStage role="agent" />
        </div>
      ) : (
        <div className="border-b border-line px-4 py-8">
          <p className="font-display text-2xl text-fg">No line open</p>
          <p className="mt-2 max-w-md text-sm text-pretty text-muted">
            Place a call from a conversation, or start one from Live as the customer. The other side has to answer.
          </p>
        </div>
      )}
      <ul>
        {calls.map((call) => {
          const person = customerById(customers, call.customerId);
          return (
            <li key={call.id} className="flex items-center gap-3 border-b border-line px-4 py-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-raised text-fg">
                <Phone className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-fg">{person?.name}</p>
                <p className="text-xs text-muted">
                  {call.direction === "in" ? "Inbound" : "Outbound"}
                  {" · "}
                  {channelLabel(call.channel)}
                  {" · "}
                  {call.status === "missed" ? "Missed" : formatDuration(call.seconds)}
                  {" · "}
                  <span className="tabular-nums">{formatStamp(call.startedAt)}</span>
                </p>
              </div>
              <Button
                tone="line"
                size="sm"
                onClick={() => {
                  select(call.conversationId);
                  setView("desk");
                  placeCall(call.conversationId);
                }}
              >
                Call
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
