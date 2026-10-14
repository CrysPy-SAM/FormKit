const AUTH_CHANNEL_NAME = "formkit-auth";

export const authChannel = new BroadcastChannel(AUTH_CHANNEL_NAME);

export type AuthChannelMessage =
    | { type: "logout" }
    | { type: "login" }; // optional — useful if you want OTHER tabs to refresh/re-fetch on a fresh login too

export function broadcastLogout() {
    authChannel.postMessage({ type: "logout" } satisfies AuthChannelMessage);
}