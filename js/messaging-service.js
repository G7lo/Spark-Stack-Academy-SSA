import { supabase } from "./supabase.js";

const ROLE_ORDER = { student: 1, instructor: 2, admin: 3, founder: 4 };

function canMessage(fromRole, toRole) {
    if (!fromRole || !toRole) return false;
    if (fromRole === "founder") return true;
    if (fromRole === "admin") return ["instructor", "student", "founder"].includes(toRole);
    if (fromRole === "instructor") return ["student", "admin"].includes(toRole);
    if (fromRole === "student") return toRole === "instructor";
    return false;
}

export async function findUsers({ query = "", role = null, limit = 20 } = {}) {
    let request = supabase.from("profiles").select("id,email,full_name,role,avatar_url,status").eq("status", "active").limit(limit);
    if (role) request = request.eq("role", role);
    if (query.trim()) request = request.ilike("full_name", `%${query.trim()}%`);
    const { data, error } = await request.order("full_name");
    if (error) throw error;
    return data || [];
}

export async function getConversation(conversationId) {
    const { data, error } = await supabase.from("conversations").select("*, conversation_members(user_id,joined_at,last_read_at)").eq("id", conversationId).single();
    if (error) throw error;
    return data;
}

export async function getMyConversations(userId) {
    const { data, error } = await supabase.from("conversation_members").select("conversation_id,last_read_at,conversations(id,type,title,last_message_at,updated_at)").eq("user_id", userId).order("last_read_at", { ascending: false });
    if (error) throw error;
    return data || [];
}

export async function getMessages(conversationId, { limit = 50 } = {}) {
    const { data, error } = await supabase.from("messages").select("id,conversation_id,sender_id,body,message_type,created_at,edited_at,deleted_at").eq("conversation_id", conversationId).is("deleted_at", null).order("created_at", { ascending: true }).limit(limit);
    if (error) throw error;
    return data || [];
}

export function subscribeToMessages(conversationId, callback) {
    return supabase.channel(`messages:${conversationId}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` }, payload => callback(payload.new))
        .subscribe();
}

export async function sendMessage({ conversationId, senderId, body }) {
    const text = String(body || "").trim();
    if (!text) throw new Error("Message cannot be empty.");
    const { data, error } = await supabase.from("messages").insert({ conversation_id: conversationId, sender_id: senderId, body: text, message_type: "text" }).select().single();
    if (error) throw error;
    return data;
}

export async function markConversationRead({ conversationId, userId }) {
    const { error } = await supabase.from("conversation_members").update({ last_read_at: new Date().toISOString() }).eq("conversation_id", conversationId).eq("user_id", userId);
    if (error) throw error;
}

export { canMessage, ROLE_ORDER };
