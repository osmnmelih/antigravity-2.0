// Use the standard client if we don't have a service role key.
// This allows local dev to work out-of-the-box using the publishable key.
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { supabase } from "@/integrations/supabase/client";

const hasServiceKey = typeof process !== 'undefined' && process.env.SUPABASE_SERVICE_ROLE_KEY;
export const db = hasServiceKey ? supabaseAdmin : supabase;

