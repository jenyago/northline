/**
 * Keep the broker-registered OAuth callback path on Better Auth 1.7+.
 *
 * Better Auth 1.7 folded the generic-oauth plugin into the core social flow:
 * providers now sign in through `/sign-in/social` and return to `/callback/:id`.
 * The auth broker, however, only accepts this app's callbacks at
 * `/api/auth/oauth2/callback/<providerId>` (see `./preview` and `./providers`),
 * so the redirect_uri must not change.
 *
 * - `withLegacyCallbackPath` sets `callbackPath` on this app's broker providers,
 *   so the redirect_uri Better Auth sends (and re-sends on the token exchange)
 *   stays `<baseURL>/oauth2/callback/<providerId>`.
 * - `legacyOAuthCallbackRoute` rewrites an incoming `/oauth2/callback/<id>`
 *   request to the core `/callback/<id>` handler, which does the actual work.
 */
import type { BetterAuthPlugin } from "better-auth";

const LEGACY_SEGMENT = "/oauth2/callback/";

export function legacyCallbackPath(providerId: string): string {
  return `${LEGACY_SEGMENT}${providerId}`;
}

type ProviderWithPath = { id: string; callbackPath?: string };

export function withLegacyCallbackPath<P extends BetterAuthPlugin>(
  plugin: P,
  providerIds: readonly string[],
): P {
  const ids = new Set(providerIds);
  const init = plugin.init;
  if (!init) return plugin;
  return {
    ...plugin,
    async init(ctx) {
      const result = await init(ctx);
      const providers = (result?.context as { socialProviders?: ProviderWithPath[] } | undefined)
        ?.socialProviders;
      for (const p of providers ?? []) {
        if (ids.has(p.id)) p.callbackPath = legacyCallbackPath(p.id);
      }
      return result;
    },
  } as P;
}

/** Rewrite `<basePath>/oauth2/callback/<id>` to `<basePath>/callback/<id>`; other URLs unchanged. */
export function rewriteLegacyCallbackURL(url: string, basePath: string): string | null {
  const u = new URL(url);
  const base = basePath.replace(/\/+$/, "");
  const prefix = `${base}${LEGACY_SEGMENT}`;
  if (!u.pathname.startsWith(prefix)) return null;
  const id = u.pathname.slice(prefix.length);
  if (!id || id.includes("/")) return null;
  u.pathname = `${base}/callback/${id}`;
  return u.toString();
}

export function legacyOAuthCallbackRoute(): BetterAuthPlugin {
  return {
    id: "legacy-oauth2-callback",
    async onRequest(request, ctx) {
      const rewritten = rewriteLegacyCallbackURL(request.url, new URL(ctx.baseURL).pathname);
      if (!rewritten) return;
      return { request: new Request(rewritten, request) };
    },
  };
}
