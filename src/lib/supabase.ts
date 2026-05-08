import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://odswgsvccutgwwnoappf.supabase.co";

const supabaseAnonKey =
  "sb_publishable_e_E-ma83wPNxoO2D4CE_dQ_FSzeXqZ5";

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);
