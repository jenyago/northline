import { APP_ID } from "@/sdk/northline";

export const WEB_SNIPPET = `<script
  src="https://cdn.northline.dev/sdk.js"
  data-app-id="${APP_ID}"
  data-channel="web"
  async
></script>
<script>
  Northline.identify("web", {
    userId: "cus_sari",
    name: "Sari Wulandari",
    email: "sari@tokokite.id",
    company: "Toko Kite"
  });

  Northline.send("web", "cus_sari", "Pelanggan kami cuma buka WhatsApp.");
  Northline.startCall("web", "cus_sari");

  const stop = Northline.subscribe((event) => {
    console.log(event.name, event.detail);
  });
</script>`;

export const IOS_SNIPPET = `import SwiftUI
import NorthlineKit

// Xcode: File → Add Package Dependencies → Add Local…
// Choose the NorthlineKit folder.

Northline.shared.start(
    appId: "${APP_ID}",
    baseURL: URL(string: "https://example.com")!
)

try await Northline.shared.identify(NorthlineUser(
    userId: "cus_mateo",
    name: "Mateo Ruiz",
    email: "mateo@andenrojo.mx",
    company: "Andén Rojo"
))

NorthlineMessenger()

try await Northline.shared.startCall()

Northline.shared.onMessage { message in
    print(message.body)
}`;

export const WHATSAPP_SNIPPET = `import { Northline } from "@northline/sdk";

// WhatsApp Cloud API webhook. Verify the signature before this.
export async function POST(req: Request) {
  const update = await req.json();
  const value = update.entry?.[0]?.changes?.[0]?.value;
  const message = value?.messages?.[0];
  const name = value?.contacts?.[0]?.profile?.name ?? "WhatsApp";
  if (!message) return new Response("ok");

  if (message.type === "text") {
    Northline.ingestWhatsApp({
      from: message.from,
      name,
      text: message.text.body
    });
  }

  if (message.interactive?.button_reply?.id === "call") {
    Northline.ingestWhatsApp({ from: message.from, name, call: true });
  }

  return new Response("ok");
}`;
