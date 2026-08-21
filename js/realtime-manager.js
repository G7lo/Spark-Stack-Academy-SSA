// Spark Stack Academy — shared realtime subscription manager
// Keeps Supabase channels centralized and prevents duplicate subscriptions.

import { supabase } from "./supabase.js";

const channels = new Map();

export function subscribeToTable({ key, table, event = "*", filter, onPayload }) {
    if (!key || !table || typeof onPayload !== "function") return () => {};

    if (channels.has(key)) return channels.get(key).unsubscribe;

    let channel = supabase.channel(`ssa:${key}`);
    const config = { event, schema: "public", table };
    if (filter) config.filter = filter;

    channel = channel.on("postgres_changes", config, onPayload);
    channel.subscribe();

    const unsubscribe = async () => {
        channels.delete(key);
        await supabase.removeChannel(channel);
    };

    channels.set(key, { channel, unsubscribe });
    return unsubscribe;
}

export async function unsubscribeAllRealtime() {
    const entries = [...channels.values()];
    channels.clear();
    await Promise.all(entries.map(({ channel }) => supabase.removeChannel(channel)));
}

export function getRealtimeSubscription(key) {
    return channels.get(key)?.channel || null;
}
