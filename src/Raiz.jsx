import React, { useEffect, useRef, useState, useCallback } from "react";
import App, { C, CSS, Icon, LogoF9, STORAGE_KEY, carregarEstado } from "./App.jsx";
import { supabase, TABELA } from "./supabase.js";

/* =========================================================
   Raiz: sessão → tela de login OU painel do usuário logado.
   Cada usuário tem UMA linha em financas_dados (protegida por RLS).
   ========================================================= */

const traduzErro = (msg = "") => {
  const m = msg.toLowerCase();
  if (m.includes("invalid login credentials")) return "Email ou senha incorretos.";
  if (m.includes("email not confirmed")) return "Confirme seu email antes de entrar — veja sua caixa de entrada (e o spam).";
  if (m.includes("already registered") || m.includes("already been registered")) return "Já existe uma conta com esse email. Tente entrar.";
  if (m.includes("password should be at least")) return "A senha precisa ter pelo menos 6 caracteres.";
  if (m.includes("rate limit")) return "Muitas tentativas seguidas. Espere alguns minutos e tente de novo.";
  if (m.includes("unable to validate email") || m.includes("invalid email")) return "Esse email não parece válido.";
  if (m.includes("failed to fetch") || m.includes("network")) return "Sem conexão com o servidor. Verifique sua internet.";
  if (m.includes("same password") || m.includes("different from the old")) return "A nova senha precisa ser diferente da anterior.";
  return msg || "Algo deu errado. Tente de novo.";
};

const temConteudo = (d) =>
  !!d && ((d.transacoes?.length || 0) + (d.compras?.length || 0) + (d.habitos?.length || 0) + (d.cartoes?.length || 0) > 0);

/* ---------------- moldura visual das telas de acesso ---------------- */

function Moldura({ children }) {
  return (
    <div className="fin-app">
      <style>{CSS + AUTH_CSS}</style>
      <div className="bg-glow" />
      <div className="auth-wrap">
        <div className="auth-brand">
          <LogoF9 size={52} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 22, letterSpacing: -0.5 }}>Finanças</div>
            <div className="muted" style={{ fontSize: 13 }}>dinheiro & rotina</div>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

const CampoAuth = ({ icon, ...props }) => (
  <div className="auth-campo">
    <Icon name={icon} size={17} color={C.dim} />
    <input {...props} />
  </div>
);

/* ---------------- login / cadastro / esqueci a senha ---------------- */

function TelaAcesso() {
  const [modo, setModo] = useState("entrar"); // entrar | cadastrar | esqueci
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [verSenha, setVerSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");

  const trocar = (m) => { setModo(m); setErro(""); setAviso(""); };

  const enviar = async (e) => {
    e.preventDefault();
    setErro(""); setAviso("");
    const em = email.trim().toLowerCase();
    if (!em) return setErro("Informe seu email.");
    if (modo !== "esqueci" && senha.length < 6) return setErro("A senha precisa ter pelo menos 6 caracteres.");
    if (modo === "cadastrar" && !nome.trim()) return setErro("Informe seu nome.");
    setCarregando(true);
    try {
      if (modo === "entrar") {
        const { error } = await supabase.auth.signInWithPassword({ email: em, password: senha });
        if (error) throw error;
      } else if (modo === "cadastrar") {
        const { data, error } = await supabase.auth.signUp({
          email: em,
          password: senha,
          options: { data: { nome: nome.trim() }, emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        // Supabase não revela se o email já existe quando a confirmação está ligada:
        if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
          throw new Error("already registered");
        }
        if (!data.session) {
          setAviso(`Conta criada! Enviamos um link de confirmação para ${em}. Clique nele e depois entre aqui.`);
          setModo("entrar");
          setSenha("");
        }
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(em, { redirectTo: window.location.origin });
        if (error) throw error;
        setAviso(`Se existir uma conta com ${em}, você vai receber um link para criar uma nova senha.`);
      }
    } catch (err) {
      setErro(traduzErro(err.message));
    } finally {
      setCarregando(false);
    }
  };

  const titulos = {
    entrar: ["Entrar", "Acesse sua conta. Seus dados ficam separados dos de qualquer outra pessoa."],
    cadastrar: ["Criar conta", "Cada conta tem o próprio painel, cartões e hábitos."],
    esqueci: ["Esqueci a senha", "Enviaremos um link para você criar uma nova senha."],
  };

  return (
    <Moldura>
      <form className="card auth-card" onSubmit={enviar}>
        {modo !== "esqueci" && (
          <div className="toggle" style={{ width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr" }}>
            <button type="button" className={modo === "entrar" ? "on" : ""} onClick={() => trocar("entrar")}>Entrar</button>
            <button type="button" className={modo === "cadastrar" ? "on" : ""} onClick={() => trocar("cadastrar")}>Criar conta</button>
          </div>
        )}
        <h2 className="auth-titulo">{titulos[modo][0]}</h2>
        <p className="muted" style={{ fontSize: 13.5, marginTop: 4, lineHeight: 1.5 }}>{titulos[modo][1]}</p>

        <div className="form-grid" style={{ marginTop: 18 }}>
          {modo === "cadastrar" && (
            <CampoAuth icon="user" placeholder="Seu nome" value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="name" />
          )}
          <CampoAuth icon="mail" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          {modo !== "esqueci" && (
            <div className="auth-campo">
              <Icon name="lock" size={17} color={C.dim} />
              <input
                type={verSenha ? "text" : "password"}
                placeholder={modo === "cadastrar" ? "Crie uma senha (mín. 6)" : "Senha"}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                autoComplete={modo === "cadastrar" ? "new-password" : "current-password"}
              />
              <button type="button" className="auth-ver" onClick={() => setVerSenha((v) => !v)}>{verSenha ? "ocultar" : "mostrar"}</button>
            </div>
          )}
        </div>

        {erro && <div className="erro">{erro}</div>}
        {aviso && <div className="auth-aviso">{aviso}</div>}

        <button className="btn btn-full" type="submit" disabled={carregando} style={{ marginTop: 18, opacity: carregando ? 0.7 : 1 }}>
          {carregando ? "Aguarde…" : modo === "entrar" ? "Entrar" : modo === "cadastrar" ? "Criar minha conta" : "Enviar link"}
        </button>

        <div style={{ textAlign: "center", marginTop: 14 }}>
          {modo === "entrar" && <button type="button" className="btn-link" onClick={() => trocar("esqueci")}>Esqueci minha senha</button>}
          {modo === "esqueci" && <button type="button" className="btn-link" onClick={() => trocar("entrar")}>← Voltar para o login</button>}
        </div>
      </form>
      <p className="muted" style={{ fontSize: 11.5, textAlign: "center", marginTop: 16 }}>
        Seus dados são salvos na nuvem e só você tem acesso a eles.
      </p>
    </Moldura>
  );
}

function TelaNovaSenha({ onPronto }) {
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const salvar = async (e) => {
    e.preventDefault();
    if (senha.length < 6) return setErro("A senha precisa ter pelo menos 6 caracteres.");
    setCarregando(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    setCarregando(false);
    if (error) return setErro(traduzErro(error.message));
    onPronto();
  };
  return (
    <Moldura>
      <form className="card auth-card" onSubmit={salvar}>
        <h2 className="auth-titulo">Nova senha</h2>
        <p className="muted" style={{ fontSize: 13.5, marginTop: 4 }}>Escolha uma nova senha para sua conta.</p>
        <div className="form-grid" style={{ marginTop: 18 }}>
          <CampoAuth icon="lock" type="password" placeholder="Nova senha (mín. 6)" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="new-password" />
        </div>
        {erro && <div className="erro">{erro}</div>}
        <button className="btn btn-full" type="submit" disabled={carregando} style={{ marginTop: 18 }}>{carregando ? "Salvando…" : "Salvar nova senha"}</button>
      </form>
    </Moldura>
  );
}

const TelaCarregando = ({ texto = "Carregando…" }) => (
  <Moldura>
    <div className="card auth-card" style={{ textAlign: "center" }}>
      <div className="spinner" />
      <div className="muted" style={{ marginTop: 14, fontSize: 14 }}>{texto}</div>
    </div>
  </Moldura>
);

/* ---------------- painel do usuário logado ---------------- */

function Painel({ user }) {
  const [fase, setFase] = useState("carregando"); // carregando | importar | pronto | erro
  const [dados, setDados] = useState(null);
  const [status, setStatus] = useState("ok");
  const [erroCarga, setErroCarga] = useState("");
  const dadosLocais = useRef(null);
  const pendente = useRef(null);
  const timer = useRef(null);
  const primeira = useRef(true);

  const usuario = { id: user.id, email: user.email, nome: user.user_metadata?.nome || "" };

  const gravar = useCallback(async (payload) => {
    const { error } = await supabase.from(TABELA).upsert({ user_id: user.id, dados: payload }, { onConflict: "user_id" });
    if (error) throw error;
  }, [user.id]);

  // carrega os dados SÓ deste usuário
  const carregar = useCallback(async () => {
    setFase("carregando");
    const { data, error } = await supabase.from(TABELA).select("dados").eq("user_id", user.id).maybeSingle();
    if (error) {
      setErroCarga(traduzErro(error.message));
      return setFase("erro");
    }
    if (data) {
      setDados(data.dados || {});
      return setFase("pronto");
    }
    // primeira vez desta conta: existe algo salvo neste navegador pela versão antiga?
    const local = carregarEstado();
    if (temConteudo(local)) {
      dadosLocais.current = local;
      return setFase("importar");
    }
    try { await gravar({}); } catch { /* tenta de novo no primeiro salvamento */ }
    setDados({});
    setFase("pronto");
  }, [user.id, gravar]);

  useEffect(() => { carregar(); }, [carregar]);

  const decidirImportacao = async (importar) => {
    const inicial = importar ? dadosLocais.current : {};
    setFase("carregando");
    try {
      await gravar(inicial);
      if (importar) { try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* ok */ } }
    } catch { /* o salvamento automático tenta de novo */ }
    setDados(inicial);
    setFase("pronto");
  };

  // salvamento com debounce
  const salvarAgora = useCallback(async () => {
    clearTimeout(timer.current);
    const payload = pendente.current;
    if (!payload) return;
    pendente.current = null;
    setStatus("salvando");
    try {
      await gravar(payload);
      setStatus((s) => (pendente.current ? s : "ok"));
    } catch {
      setStatus("erro");
      if (!pendente.current) pendente.current = payload;
      timer.current = setTimeout(salvarAgora, 4000);
    }
  }, [gravar]);

  const onChange = useCallback((estado) => {
    if (primeira.current) { primeira.current = false; return; } // estado inicial = o que veio do banco
    pendente.current = estado;
    setStatus("salvando");
    clearTimeout(timer.current);
    timer.current = setTimeout(salvarAgora, 800);
  }, [salvarAgora]);

  // não perder o último lançamento ao fechar/trocar de aba
  useEffect(() => {
    const flush = () => { if (document.visibilityState === "hidden") salvarAgora(); };
    document.addEventListener("visibilitychange", flush);
    window.addEventListener("pagehide", salvarAgora);
    return () => {
      document.removeEventListener("visibilitychange", flush);
      window.removeEventListener("pagehide", salvarAgora);
      clearTimeout(timer.current);
    };
  }, [salvarAgora]);

  const sair = async () => {
    await salvarAgora();
    await supabase.auth.signOut();
  };

  if (fase === "carregando") return <TelaCarregando texto="Carregando seus dados…" />;

  if (fase === "erro") {
    return (
      <Moldura>
        <div className="card auth-card">
          <h2 className="auth-titulo">Não consegui carregar seus dados</h2>
          <div className="erro">{erroCarga}</div>
          <button className="btn btn-full" style={{ marginTop: 16 }} onClick={carregar}>Tentar de novo</button>
          <button className="btn-link" style={{ marginTop: 10, width: "100%" }} onClick={() => supabase.auth.signOut()}>Sair</button>
        </div>
      </Moldura>
    );
  }

  if (fase === "importar") {
    const d = dadosLocais.current;
    return (
      <Moldura>
        <div className="card auth-card">
          <h2 className="auth-titulo">Encontrei dados neste aparelho</h2>
          <p className="muted" style={{ fontSize: 13.5, marginTop: 6, lineHeight: 1.55 }}>
            Este navegador tem dados da versão sem login: {d.transacoes?.length || 0} transações, {d.compras?.length || 0} compras no cartão e {d.habitos?.length || 0} hábitos.
            Quer levar tudo para a conta <strong style={{ color: C.text }}>{user.email}</strong>?
          </p>
          <p style={{ fontSize: 12.5, marginTop: 10, color: C.amber }}>Só importe se esses dados forem seus — depois de importados, eles saem deste navegador.</p>
          <button className="btn btn-full" style={{ marginTop: 16 }} onClick={() => decidirImportacao(true)}>Sim, importar para minha conta</button>
          <button className="btn btn-ghost btn-full" style={{ marginTop: 8 }} onClick={() => decidirImportacao(false)}>Não, começar do zero</button>
        </div>
      </Moldura>
    );
  }

  return <App usuario={usuario} inicial={dados} onChange={onChange} onSair={sair} statusSync={status} />;
}

/* ---------------- raiz ---------------- */

export default function Raiz() {
  const [sessao, setSessao] = useState(undefined); // undefined = verificando
  const [recuperando, setRecuperando] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSessao(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((evento, s) => {
      if (evento === "PASSWORD_RECOVERY") setRecuperando(true);
      setSessao(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (sessao === undefined) return <TelaCarregando />;
  if (recuperando && sessao) return <TelaNovaSenha onPronto={() => setRecuperando(false)} />;
  if (!sessao) return <TelaAcesso />;
  // key = id do usuário → ao trocar de conta, todo o estado é recriado do zero (nada vaza entre contas)
  return <Painel key={sessao.user.id} user={sessao.user} />;
}

const AUTH_CSS = `
.auth-wrap { position: relative; z-index: 1; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 32px 16px; }
.auth-brand { display: flex; align-items: center; gap: 14px; margin-bottom: 22px; }
.auth-card { width: 100%; max-width: 420px; padding: 26px; }
.auth-titulo { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; margin: 6px 0 0; }
.auth-campo { display: flex; align-items: center; gap: 10px; border: 1px solid rgba(255,255,255,.08); background: rgba(0,0,0,.25); border-radius: 13px; padding: 0 12px; transition: border-color .15s, box-shadow .15s; }
.auth-campo:focus-within { border-color: rgba(110,231,183,.55); box-shadow: 0 0 0 3px rgba(110,231,183,.12); }
.auth-campo input { flex: 1; min-width: 0; border: 0; outline: none; background: transparent; color: ${C.text}; font: 500 15px Inter, sans-serif; padding: 13px 0; }
.auth-campo input::placeholder { color: ${C.dim}; }
.auth-ver { border: 0; background: none; color: ${C.muted} !important; font-size: 12px; font-weight: 600; }
.auth-aviso { margin-top: 12px; background: rgba(110,231,183,.08); border: 1px solid rgba(110,231,183,.25); color: ${C.mint}; padding: 10px 12px; border-radius: 11px; font-size: 13px; line-height: 1.5; }
.spinner { width: 34px; height: 34px; margin: 6px auto 0; border-radius: 50%; border: 3px solid rgba(255,255,255,.08); border-top-color: ${C.mint}; animation: girar .8s linear infinite; }
@keyframes girar { to { transform: rotate(360deg); } }
`;
