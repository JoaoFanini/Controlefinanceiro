import { createClient } from "@supabase/supabase-js";

// A chave publicável é feita para ficar no navegador: quem protege os dados
// são as políticas de RLS da tabela financas_dados (cada usuário só acessa a própria linha).
const URL = import.meta.env.VITE_SUPABASE_URL || "https://euvudosmsnmrvrzqsnhb.supabase.co";
const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_zahnun2drq9g5UV8alnSbw_sedG_EcO";

export const supabase = createClient(URL, KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

export const TABELA = "financas_dados";
