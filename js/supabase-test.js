import { supabase } from "./supabase.js";

const { data, error } = await supabase
    .from("platform_commands")
    .select("*")
    .limit(1);

console.log("SUPABASE DATA:", data);
console.log("SUPABASE ERROR:", error);