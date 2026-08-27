import { createClient } from "@supabase/supabase-js";

// PALITAN ITO! Yung "dijh" yung tama, hindi "djjh"
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ddenlhcecyxdakewdijh.supabase.co";
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_OiUUwnOYJDbR2MkFVF2E7w_YP2nTx8k";

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey
);