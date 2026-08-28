import { createClient } from "@supabase/supabase-js";
import { isPasswordRecoveryUrl } from "./auth";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const passwordRecoveryRequested =
  typeof window !== "undefined" &&
  isPasswordRecoveryUrl(window.location.href);

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      // IdeaHire jest aplikacją kliencką. Implicit flow nie wymaga
      // zapisanego lokalnie PKCE verifiera, więc link można otworzyć
      // z klienta pocztowego albo na innym urządzeniu.
      flowType: "implicit",
    },
  }
);
