import { useDesk } from "@/lib/store";
import type { Channel, DeskEvent } from "@/lib/types";

export const APP_ID = "nl_live_fieldwork";

export type NorthlineUser = {
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
};

export type NorthlineEvent = DeskEvent;

/**
 * Northline client SDK.
 * Web, iOS, and the WhatsApp bridge share these methods.
 * This build runs an in-browser transport so the desk and the
 * channel previews stay on one conversation. Point the same
 * calls at HTTPS when you ship.
 */
export const Northline = {
  appId: APP_ID,

  identify(channel: Channel, user: NorthlineUser) {
    return useDesk.getState().upsertCustomer(channel, user);
  },

  send(channel: Channel, userId: string, body: string) {
    return useDesk.getState().postCustomer(userId, channel, body);
  },

  reply(conversationId: string, body: string) {
    useDesk.getState().agentReply(conversationId, body);
  },

  note(conversationId: string, body: string) {
    useDesk.getState().agentNote(conversationId, body);
  },

  startCall(channel: Channel, userId: string) {
    useDesk.getState().requestCall(userId, channel);
  },

  placeCall(conversationId: string) {
    useDesk.getState().placeCall(conversationId);
  },

  answer() {
    useDesk.getState().answerCall();
  },

  endCall() {
    useDesk.getState().endCall();
  },

  toggleMute() {
    useDesk.getState().toggleMute();
  },

  subscribe(listener: (event: NorthlineEvent) => void) {
    return useDesk.subscribe((state, prev) => {
      const next = state.events[0];
      if (next && next !== prev.events[0]) listener(next);
    });
  },

  ingestWhatsApp(update: { from: string; name: string; text?: string; call?: boolean }) {
    return useDesk.getState().ingestWhatsApp(update);
  },
};
