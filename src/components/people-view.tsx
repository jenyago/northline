import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { channelLabel, initials } from "@/lib/format";
import { useDesk } from "@/lib/store";

export function PeopleView() {
  const customers = useDesk((state) => state.customers);
  const conversations = useDesk((state) => state.conversations);
  const select = useDesk((state) => state.select);
  const setView = useDesk((state) => state.setView);
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return customers
      .filter((customer) => {
        if (!q) return true;
        return [customer.name, customer.company, customer.email, customer.location, customer.language]
          .join(" ")
          .toLowerCase()
          .includes(q);
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [customers, query]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="shrink-0 space-y-3 border-b border-line px-4 py-4">
        <div>
          <h1 className="font-display text-2xl text-fg">People</h1>
          <p className="text-sm text-muted">Iberia, Latin America, MENA, India, Southeast Asia</p>
        </div>
        <label className="flex h-11 items-center gap-2 rounded-md border border-line bg-ink px-3">
          <Search className="size-4 text-muted" aria-hidden="true" />
          <span className="sr-only">Search people</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name, company, city"
            className="w-full bg-transparent text-sm text-fg outline-none placeholder:text-muted"
          />
        </label>
      </header>
      <ul className="scroll-thin min-h-0 flex-1 overflow-y-auto">
        {rows.map((customer) => {
          const conversation = conversations.find((item) => item.customerId === customer.id);
          return (
            <li key={customer.id}>
              <button
                type="button"
                className="flex w-full gap-3 border-b border-line px-4 py-3 text-left"
                onClick={() => {
                  if (!conversation) return;
                  select(conversation.id);
                  setView("desk");
                }}
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-raised text-sm font-medium text-fg">
                  {initials(customer.name)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-sm font-medium text-fg">{customer.name}</span>
                    <span className="shrink-0 text-xs text-copper">{customer.language}</span>
                  </span>
                  <span className="mt-0.5 block truncate text-sm text-muted">
                    {customer.company} · {customer.location}
                  </span>
                  <span className="mt-1 block truncate text-xs text-muted">
                    {conversation ? channelLabel(conversation.channel) : "No thread"}
                    {customer.note ? ` · ${customer.note}` : ""}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
