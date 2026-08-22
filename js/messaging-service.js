import { supabase } from "./supabase.js";

const ROLE_ORDER = { student: 1, instructor: 2, admin: 3, founder: 4 };

function canMessage(fromRole, toRole) {
    if (!fromRole || !toRole) return false;
    if (fromRole === "founder") return true;
    if (fromRole === "admin") return ["founder", "instructor", "student"].includes(toRole);
    if (fromRole === "instructor") return ["student", "admin"].includes(toRole);
    if (fromRole === "student") return toRole === "instructor";
    return false;
}

export async function getProfileByFirebaseUid(firebaseUid) {
    if (!firebaseUid) throw new Error("Your account identity is missing.");
    const { data, error } = await supabase.from("profiles")
        .select("id,firebase_uid,username,full_name,role,status,avatar_url,last_seen_at")
        .eq("firebase_uid", firebaseUid).maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("Your account is still being set up. Please sign in again.");
    return data;
}

export async function findUsers({ query = "", role = null, limit = 20 } = {}) {
    let request = supabase.from("profiles")
        .select("id,username,full_name,role,status,avatar_url,last_seen_at")
        .eq("status", "active").limit(limit);
    if (role) request = request.eq("role", role);
    if (query.trim()) {
        const q = query.trim();
        request = request.or(`username.ilike.%${q}%,full_name.ilike.%${q}%`);
    }
    const { data, error } = await request.order("full_name");
    if (error) throw error;
    return data || [];
}

export async function getConversation(conversationId) {
    const { data, error } = await supabase.from("conversations")
        .select("*, conversation_members(user_id,joined_at,last_read_at)")
        .eq("id", conversationId).single();
    if (error) throw error;
    return data;
}

export async function getConversationPeople(conversationId) {
    const conversation = await getConversation(conversationId);
    const members = conversation.conversation_members || [];
    const ids = members.map(member => member.user_id);
    if (!ids.length) return [];
    const { data, error } = await supabase.from("profiles")
        .select("id,username,full_name,role,status,avatar_url,last_seen_at")
        .in("id", ids);
    if (error) throw error;
    return (data || []).map(person => ({
        ...person,
        last_read_at: members.find(member => member.user_id === person.id)?.last_read_at || null
    }));
}

export async function getMyConversations(firebaseUid) {
    const profile = await getProfileByFirebaseUid(firebaseUid);
    const { data, error } = await supabase.from("conversation_members")
        .select("conversation_id,last_read_at,conversations(id,type,title,last_message_at,updated_at)")
        .eq("user_id", profile.id).order("last_read_at", { ascending: false });
    if (error) throw error;
    return data || [];
}

export async function getMessages(conversationId, { limit = 80 } = {}) {
    const { data, error } = await supabase.from("messages")
        .select("id,conversation_id,sender_id,body,message_type,created_at,edited_at,deleted_at")
        .eq("conversation_id", conversationId).is("deleted_at", null)
        .order("created_at", { ascending: true }).limit(limit);
    if (error) throw error;
    return data || [];
}

export function subscribeToMessages(conversationId, callback) {
    if (!conversationId) return () => {};
    const channel = supabase.channel(`messages:${conversationId}:${crypto.randomUUID()}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` }, payload => {
            if (payload?.new) callback(payload.new);
        }).subscribe();
    return () => supabase.removeChannel(channel);
}

export function subscribeToReadReceipts(conversationId, callback) {
    if (!conversationId) return () => {};
    const channel = supabase.channel(`reads:${conversationId}:${crypto.randomUUID()}`)
        .on("postgres_changes", {
            event: "UPDATE",
            schema: "public",
            table: "conversation_members",
            filter: `conversation_id=eq.${conversationId}`
        }, payload => callback?.(payload.new))
        .subscribe();
    return () => supabase.removeChannel(channel);
}

export function createChatPresence(conversationId, profile, { onSync, onTyping } = {}) {
    if (!conversationId || !profile?.id) return { setTyping: () => {}, stop: async () => {} };
    const channel = supabase.channel(`chat-presence:${conversationId}`, { config: { presence: { key: profile.id } } });
    const sync = () => onSync?.(channel.presenceState());
    channel.on("presence", { event: "sync" }, sync);
    channel.on("presence", { event: "join" }, sync);
    channel.on("presence", { event: "leave" }, sync);
    channel.on("broadcast", { event: "typing" }, ({ payload }) => {
        if (payload?.user_id !== profile.id) onTyping?.(payload);
    });
    channel.subscribe(async status => {
        if (status === "SUBSCRIBED") {
            await channel.track({
                user_id: profile.id,
                username: profile.username,
                online: true,
                typing: false,
                online_at: new Date().toISOString()
            });
        }
    });
    let typingTimer;
    const setTyping = typing => {
        clearTimeout(typingTimer);
        channel.send({
            type: "broadcast",
            event: "typing",
            payload: { user_id: profile.id, typing: Boolean(typing), at: Date.now() }
        });
        if (typing) typingTimer = setTimeout(() => setTyping(false), 2200);
    };
    const stop = async () => {
        clearTimeout(typingTimer);
        try { await channel.untrack(); } catch (_) {}
        await supabase.removeChannel(channel);
    };
    return { setTyping, stop };
}

export async function touchLastSeen(profileId) {
    if (!profileId) return;
    const { error } = await supabase.from("profiles")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("id", profileId);
    if (error) console.warn("Last-seen update skipped:", error.message);
}

export async function sendMessage({ conversationId, senderId, body }) {
    const text = String(body || "").trim();
    if (!conversationId) throw new Error("Conversation not found.");
    if (!senderId) throw new Error("Your account identity is missing.");
    if (!text) throw new Error("Message cannot be empty.");
    if (text.length > 4000) throw new Error("Message is too long.");
    const { data, error } = await supabase.from("messages")
        .insert({ conversation_id: conversationId, sender_id: senderId, body: text, message_type: "text" })
        .select().single();
    if (error) throw error;
    return data;
}

export async function markConversationRead({ conversationId, userId }) {
    if (!conversationId || !userId) return;
    const { error } = await supabase.from("conversation_members")
        .update({ last_read_at: new Date().toISOString() })
        .eq("conversation_id", conversationId).eq("user_id", userId);
    if (error) throw error;
}

export { canMessage, ROLE_ORDER };