import React, { useState, useEffect, useMemo } from "react";

/* =========================================================
   CONTROLE FINANCEIRO + HÁBITOS — React + hooks, SVG puro
   Tema: F9 Coding (verde-menta em vidro sobre verde-escuro)
   Dados persistidos em localStorage
   ========================================================= */

const STORAGE_KEY = "controle-financeiro-v1";

/* ---------------- paleta F9 ---------------- */
const C = {
  mint: "#6ee7b7",
  mint2: "#34d399",
  mint3: "#10b981",
  mintSoft: "rgba(110,231,183,.12)",
  deep: "#064e3b",
  deeper: "#022c22",
  text: "#ecfdf5",
  muted: "#8fb3a3",
  dim: "#5d7d70",
  line: "rgba(167,243,208,.09)",
  track: "rgba(255,255,255,.06)",
  red: "#fb7185",
  redSoft: "rgba(251,113,133,.13)",
  amber: "#fbbf24",
  amberSoft: "rgba(251,191,36,.12)",
  violet: "#a78bfa",
  violetSoft: "rgba(167,139,250,.13)",
  blue: "#60a5fa",
  blueSoft: "rgba(96,165,250,.13)",
};

const CAT_RECEITA = [
  { id: "salario", nome: "Salário", emoji: "💼" },
  { id: "freela", nome: "Freelance", emoji: "💻" },
  { id: "invest", nome: "Investimentos", emoji: "📈" },
  { id: "presente", nome: "Presente", emoji: "🎁" },
  { id: "venda", nome: "Vendas", emoji: "🏷️" },
  { id: "outros-r", nome: "Outros", emoji: "💰" },
];

const CAT_GASTO = [
  { id: "alimentacao", nome: "Alimentação", emoji: "🍔" },
  { id: "moradia", nome: "Moradia", emoji: "🏠" },
  { id: "transporte", nome: "Transporte", emoji: "🚗" },
  { id: "saude", nome: "Saúde", emoji: "💊" },
  { id: "lazer", nome: "Lazer", emoji: "🎮" },
  { id: "educacao", nome: "Educação", emoji: "📚" },
  { id: "compras", nome: "Compras", emoji: "🛍️" },
  { id: "assinaturas", nome: "Assinaturas", emoji: "📱" },
  { id: "contas", nome: "Contas", emoji: "💡" },
  { id: "outros-g", nome: "Outros", emoji: "📦" },
];

const TODAS_CATS = [...CAT_RECEITA, ...CAT_GASTO];
const catInfo = (id) => TODAS_CATS.find((c) => c.id === id) || { nome: "Outros", emoji: "📦" };

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const MESES_LONGOS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const CORES_CARTAO = ["#10b981", "#064e3b", "#7c3aed", "#2563eb", "#e11d48", "#ea580c", "#0d9488", "#334155"];

/* hábitos */
const DIAS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const DIAS_LONGOS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
const DIAS_LETRA = ["S", "T", "Q", "Q", "S", "S", "D"];
const EMOJIS_HAB = ["📖", "🧘", "🏋️", "🏃", "💧", "🥗", "😴", "📝", "🎸", "🎨", "🎮", "📷", "🧩", "🌱", "🙏", "💻", "🗣️", "🎧", "🚴", "♟️"];
const CORES_HAB = ["#6ee7b7", "#fbbf24", "#fb7185", "#a78bfa", "#60a5fa", "#f472b6", "#2dd4bf", "#fb923c"];

/* ---------------- utilitários ---------------- */

const pad = (n) => String(n).padStart(2, "0");
const brl = (v) => (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const brlCurto = (v) => {
  const n = Math.abs(v);
  if (n >= 1000) return `R$ ${(v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}k`;
  return `R$ ${Math.round(v)}`;
};
const ym = (y, m0) => `${y}-${pad(m0 + 1)}`;
const addMonths = (key, n) => {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return ym(d.getFullYear(), d.getMonth());
};
const labelYM = (key) => {
  const [y, m] = key.split("-").map(Number);
  return `${MESES[m - 1]}/${String(y).slice(2)}`;
};
const labelYMLongo = (key) => {
  const [y, m] = key.split("-").map(Number);
  return `${MESES_LONGOS[m - 1]} de ${y}`;
};
const mesAtual = () => {
  const d = new Date();
  return ym(d.getFullYear(), d.getMonth());
};
const isoDe = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const hojeISO = () => isoDe(new Date());
const parseISO = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const addDias = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const diaSemana = (d) => (d.getDay() + 6) % 7; // 0 = segunda
const inicioSemana = (d) => addDias(d, -diaSemana(d));
const dataBR = (iso) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

const shade = (hex, pct) => {
  let h = String(hex || "#10b981").replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  const ch = [n >> 16, (n >> 8) & 255, n & 255].map((v) =>
    Math.max(0, Math.min(255, Math.round(pct < 0 ? v * (1 + pct / 100) : v + (255 - v) * (pct / 100))))
  );
  return `rgb(${ch.join(",")})`;
};
const alpha = (hex, a) => {
  let h = String(hex).replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
};

/* Parcelamento inteligente:
   - compra ANTES do dia de fechamento → 1ª parcela na fatura do próprio mês
   - compra NO dia ou DEPOIS do fechamento → 1ª parcela na fatura do mês seguinte
   - centavos que sobram da divisão vão para a 1ª parcela */
function gerarParcelas(compra, cartao) {
  const [y, m, d] = compra.data.split("-").map(Number);
  let primeiro = ym(y, m - 1);
  const fech = Number(cartao?.fechamento) || 0;
  if (fech && d >= fech) primeiro = addMonths(primeiro, 1);
  const n = Math.max(1, Number(compra.parcelas) || 1);
  const totalC = Math.round(Number(compra.valor) * 100);
  const base = Math.floor(totalC / n);
  const resto = totalC - base * n;
  return Array.from({ length: n }, (_, i) => ({
    id: `${compra.id}-${i + 1}`,
    compraId: compra.id,
    cardId: compra.cardId,
    desc: compra.desc,
    categoria: compra.categoria,
    dataCompra: compra.data,
    mes: addMonths(primeiro, i),
    numero: i + 1,
    total: n,
    valor: (base + (i === 0 ? resto : 0)) / 100,
  }));
}

/* ---------------- lógica de hábitos ---------------- */

const feito = (checks, iso, id) => (checks[iso] || []).includes(id);
const programado = (h, d) => h.dias.includes(diaSemana(d)) && isoDe(d) >= h.criado;

// sequência de dias em que TODOS os itens programados foram concluídos
// (dias sem nada programado não quebram; hoje ainda pendente não quebra)
function sequencias(habitos, checks, hoje) {
  if (!habitos.length) return { atual: 0, maior: 0 };
  const inicio = habitos.reduce((m, h) => (h.criado < m ? h.criado : m), hojeISO());
  let d = parseISO(inicio);
  let run = 0, maior = 0;
  const hojeIso = isoDe(hoje);
  while (isoDe(d) <= hojeIso) {
    const iso = isoDe(d);
    const prog = habitos.filter((h) => programado(h, d));
    if (prog.length) {
      const ok = prog.every((h) => feito(checks, iso, h.id));
      if (ok) run++;
      else if (iso !== hojeIso) run = 0;
      maior = Math.max(maior, run);
    }
    d = addDias(d, 1);
  }
  return { atual: run, maior };
}

function sequenciaHabito(h, checks, hoje) {
  let d = hoje, n = 0;
  for (let i = 0; i < 400; i++) {
    const iso = isoDe(d);
    if (iso < h.criado) break;
    if (h.dias.includes(diaSemana(d))) {
      if (feito(checks, iso, h.id)) n++;
      else if (i !== 0) break;
    }
    d = addDias(d, -1);
  }
  return n;
}

function taxaHabito(h, checks, hoje, dias = 14) {
  let prog = 0, ok = 0;
  for (let i = 0; i < dias; i++) {
    const d = addDias(hoje, -i);
    if (!programado(h, d)) continue;
    if (i === 0 && !feito(checks, isoDe(d), h.id)) continue; // hoje pendente não conta
    prog++;
    if (feito(checks, isoDe(d), h.id)) ok++;
  }
  return { prog, ok, taxa: prog ? ok / prog : null };
}

function habitosExemplo() {
  const criado = isoDe(inicioSemana(new Date()));
  return [
    { id: uid(), nome: "Ler 20 páginas", emoji: "📖", tipo: "habito", dias: [0, 1, 2, 3, 4, 5, 6], horario: "21:00", cor: "#fbbf24", criado },
    { id: uid(), nome: "Meditar", emoji: "🧘", tipo: "habito", dias: [0, 1, 2, 3, 4], horario: "07:00", cor: "#fb7185", criado },
    { id: uid(), nome: "Treino", emoji: "🏋️", tipo: "habito", dias: [0, 2, 4], horario: "18:30", cor: "#6ee7b7", criado },
    { id: uid(), nome: "Beber 2L de água", emoji: "💧", tipo: "habito", dias: [0, 1, 2, 3, 4, 5, 6], horario: "", cor: "#60a5fa", criado },
    { id: uid(), nome: "Violão", emoji: "🎸", tipo: "hobby", dias: [1, 3, 5], horario: "20:00", cor: "#a78bfa", criado },
    { id: uid(), nome: "Fotografia", emoji: "📷", tipo: "hobby", dias: [6], horario: "16:00", cor: "#f472b6", criado },
  ];
}

/* ---------------- persistência ---------------- */

function carregarEstado() {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function podarChecks(checks) {
  const limite = isoDe(addDias(new Date(), -400));
  const out = {};
  Object.keys(checks).forEach((k) => {
    if (k >= limite && checks[k]?.length) out[k] = checks[k];
  });
  return out;
}

function dadosExemplo() {
  const atual = mesAtual();
  const dia = (mesKey, d) => `${mesKey}-${pad(d)}`;
  const transacoes = [];
  for (let i = -5; i <= 0; i++) {
    const k = addMonths(atual, i);
    transacoes.push(
      { id: uid(), tipo: "receita", desc: "Salário", valor: 3800, categoria: "salario", data: dia(k, 5) },
      { id: uid(), tipo: "gasto", desc: "Aluguel", valor: 1200, categoria: "moradia", data: dia(k, 10) },
      { id: uid(), tipo: "gasto", desc: "Mercado", valor: 520 + ((i * 37) % 90), categoria: "alimentacao", data: dia(k, 12) },
      { id: uid(), tipo: "gasto", desc: "Luz e internet", valor: 230, categoria: "contas", data: dia(k, 15) },
      { id: uid(), tipo: "gasto", desc: "Combustível", valor: 260 + ((i * 23) % 60), categoria: "transporte", data: dia(k, 18) }
    );
    if (i % 2 === 0) transacoes.push({ id: uid(), tipo: "receita", desc: "Freela site", valor: 700, categoria: "freela", data: dia(k, 20) });
  }
  const c1 = { id: uid(), nome: "Nubank", limite: 4000, fechamento: 3, final: "4821", cor: "#7c3aed" };
  const c2 = { id: uid(), nome: "Inter", limite: 2500, fechamento: 25, final: "1190", cor: "#ea580c" };
  const compras = [
    { id: uid(), cardId: c1.id, desc: "Notebook", valor: 3600, parcelas: 10, categoria: "compras", data: dia(addMonths(atual, -3), 15) },
    { id: uid(), cardId: c1.id, desc: "Streaming anual", valor: 240, parcelas: 3, categoria: "assinaturas", data: dia(atual, 2) },
    { id: uid(), cardId: c2.id, desc: "Curso online", valor: 900, parcelas: 6, categoria: "educacao", data: dia(addMonths(atual, -1), 8) },
    { id: uid(), cardId: c2.id, desc: "Tênis", valor: 450, parcelas: 3, categoria: "compras", data: dia(atual, 4) },
  ];
  return { transacoes, cartoes: [c1, c2], compras, meta: 800 };
}

/* ---------------- ícones ---------------- */

const ICONS = {
  home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  plus: "M12 5v14M5 12h14",
  card: "M2 6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2zM2 10h20M6 15h4",
  list: "M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01",
  bulb: "M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1V17h6v-.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2z",
  flame: "M12 22c4 0 7-2.8 7-7 0-3.5-2.2-5.6-3.6-7.6-.4 1.6-1.3 2.8-2.4 3.3C13 7 11.5 4.2 9 2c.4 3-1.5 5-3 7-1 1.4-1 2.8-1 4 0 5 3 9 7 9z",
  trophy: "M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3",
  spark: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z",
  up: "M7 17 17 7M8 7h9v9",
  down: "M7 7l10 10M17 8v9H8",
  wallet: "M20 7V5a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-4a2 2 0 0 0 0 4h4v2a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2V6",
  trash: "M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14",
  edit: "M4 20h4L19 9l-4-4L4 16zM14 6l4 4",
  left: "M15 18l-6-6 6-6",
  right: "M9 18l6-6-6-6",
  alert: "M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z",
  target: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  check: "M20 6 9 17l-5-5",
  clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2",
  x: "M18 6 6 18M6 6l12 12",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  mail: "M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM22 6l-10 7L2 6",
  lock: "M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4",
  user: "M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10z",
};

const Icon = ({ name, size = 18, color = "currentColor", sw = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={ICONS[name]} />
  </svg>
);

/* Logo F9: "F" geométrico em vidro verde-menta com contorno branco, sobre verde-escuro em degradê */
const LogoF9 = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" aria-label="Logo">
    <defs>
      <linearGradient id="f9bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#065f46" />
        <stop offset="100%" stopColor="#011a14" />
      </linearGradient>
      <linearGradient id="f9glass" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#d1fae5" stopOpacity="0.85" />
        <stop offset="100%" stopColor="#6ee7b7" stopOpacity="0.45" />
      </linearGradient>
    </defs>
    <rect width="48" height="48" rx="13" fill="url(#f9bg)" />
    <rect x="0.5" y="0.5" width="47" height="47" rx="12.5" fill="none" stroke="rgba(167,243,208,.25)" />
    <path d="M15 11h19v7H22v4h10v7H22v8h-7z" fill="url(#f9glass)" stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M16.5 12.5h16" stroke="rgba(255,255,255,.7)" strokeWidth="1" strokeLinecap="round" />
  </svg>
);

/* ---------------- gráficos (SVG puro) ---------------- */

function Sparkline({ values, color, id, w = 120, h = 40 }) {
  const p = 4;
  const max = Math.max(...values), min = Math.min(...values);
  const range = max - min;
  const pts = values.map((v, i) => [
    p + (i * (w - 2 * p)) / Math.max(1, values.length - 1),
    range === 0 ? h / 2 : h - p - ((v - min) / range) * (h - 2 * p),
  ]);
  const line = pts.map((pt, i) => `${i ? "L" : "M"}${pt[0].toFixed(1)},${pt[1].toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
  const area = `${line} L${last[0].toFixed(1)},${h} L${pts[0][0].toFixed(1)},${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} style={{ overflow: "visible", flexShrink: 0 }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="3.5" fill="#06120d" stroke={color} strokeWidth="2" />
    </svg>
  );
}

function GraficoCategorias({ itens }) {
  if (!itens.length) return <Vazio texto="Nenhum gasto neste mês." />;
  const W = 520, rowH = 38, labelW = 150, valorW = 96;
  const barMax = W - labelW - valorW - 10;
  const max = Math.max(...itens.map((i) => i.valor));
  const total = itens.reduce((s, i) => s + i.valor, 0);
  const H = itens.length * rowH;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
      <defs>
        <linearGradient id="barMint" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={C.mint3} />
          <stop offset="100%" stopColor={C.mint} />
        </linearGradient>
      </defs>
      {itens.map((it, idx) => {
        const y = idx * rowH;
        const bw = Math.max(4, (it.valor / max) * barMax);
        const c = catInfo(it.categoria);
        return (
          <g key={it.categoria}>
            <text x="0" y={y + 23} fontSize="13" fill={C.text} fontFamily="Inter, sans-serif">{c.emoji} {c.nome}</text>
            <rect x={labelW} y={y + 9} width={barMax} height="18" rx="9" fill={C.track} />
            <rect x={labelW} y={y + 9} width={bw} height="18" rx="9" fill="url(#barMint)" opacity={Math.max(0.35, 1 - idx * 0.12)} />
            <text x={W} y={y + 23} fontSize="13" fontWeight="600" textAnchor="end" fill={C.text} fontFamily="Inter, sans-serif">{brl(it.valor)}</text>
            <text x={labelW + bw + 6} y={y + 22} fontSize="10.5" fill={C.muted} fontFamily="Inter, sans-serif">
              {bw < barMax - 34 ? `${Math.round((it.valor / total) * 100)}%` : ""}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function TimelineParcelas({ cor, valores }) {
  const W = 640, H = 170, top = 22, bottom = 26, gap = 8;
  const n = valores.length;
  const bw = (W - gap * (n - 1)) / n;
  const max = Math.max(1, ...valores.map((v) => v.valor));
  const usable = H - top - bottom;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
      <line x1="0" x2={W} y1={H - bottom} y2={H - bottom} stroke={C.line} />
      {valores.map((v, i) => {
        const x = i * (bw + gap);
        const bh = v.valor > 0 ? Math.max(4, (v.valor / max) * usable) : 0;
        const y = H - bottom - bh;
        return (
          <g key={v.mes}>
            <rect x={x} y={top} width={bw} height={usable} rx="6" fill="rgba(255,255,255,.03)" />
            {bh > 0 && <rect x={x} y={y} width={bw} height={bh} rx="6" fill={i === 0 ? shade(cor, 25) : alpha(cor, 0.55)} />}
            {v.valor > 0 && (
              <text x={x + bw / 2} y={y - 6} fontSize="10" textAnchor="middle" fill={C.text} fontWeight="600" fontFamily="Inter, sans-serif">{brlCurto(v.valor)}</text>
            )}
            <text x={x + bw / 2} y={H - 8} fontSize="10.5" textAnchor="middle" fill={i === 0 ? C.mint : C.dim} fontWeight={i === 0 ? 700 : 500} fontFamily="Inter, sans-serif">
              {labelYM(v.mes)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function Donut({ partes, centro, sub, size = 140 }) {
  const r = 52, c = 2 * Math.PI * r;
  let acc = 0;
  const total = partes.reduce((s, p) => s + p.valor, 0) || 1;
  return (
    <svg viewBox="0 0 140 140" width={size} height={size}>
      <circle cx="70" cy="70" r={r} fill="none" stroke={C.track} strokeWidth="16" />
      {partes.map((p, i) => {
        const len = (p.valor / total) * c;
        if (len <= 0) return null;
        const el = (
          <circle key={i} cx="70" cy="70" r={r} fill="none" stroke={p.cor} strokeWidth="16" strokeLinecap={partes.length === 1 ? "round" : "butt"}
            strokeDasharray={`${Math.max(0, len - (partes.length > 1 ? 2 : 0))} ${c}`} strokeDashoffset={-acc} transform="rotate(-90 70 70)" />
        );
        acc += len;
        return el;
      })}
      <text x="70" y="68" textAnchor="middle" fontSize="18" fontWeight="800" fill={C.text} fontFamily="Inter, sans-serif">{centro}</text>
      <text x="70" y="86" textAnchor="middle" fontSize="10" fill={C.muted} fontFamily="Inter, sans-serif">{sub}</text>
    </svg>
  );
}

const Anel = ({ pct, size = 34, cor = C.mint, sw = 3.5, children }) => {
  const r = (size - sw) / 2, c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.track} strokeWidth={sw} />
      {pct > 0 && (
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={cor} strokeWidth={sw} strokeLinecap="round"
          strokeDasharray={`${c * Math.min(1, pct)} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      )}
      {children}
    </svg>
  );
};

/* ---------------- UI básica ---------------- */

const Vazio = ({ texto, acao }) => (
  <div style={{ textAlign: "center", padding: "28px 12px", color: C.dim, fontSize: 14 }}>
    <div style={{ fontSize: 28, marginBottom: 6, opacity: 0.8 }}>🗂️</div>
    {texto}
    {acao && <div style={{ marginTop: 12 }}>{acao}</div>}
  </div>
);

function SeletorMes({ value, onChange }) {
  const [y, m] = value.split("-").map(Number);
  const anoAtual = new Date().getFullYear();
  const anos = [];
  for (let a = Math.min(anoAtual - 5, y); a <= Math.max(anoAtual + 5, y); a++) anos.push(a);
  return (
    <div className="mes-sel">
      <button className="icon-btn" onClick={() => onChange(addMonths(value, -1))} aria-label="Mês anterior"><Icon name="left" /></button>
      <select value={m} onChange={(e) => onChange(ym(y, Number(e.target.value) - 1))}>
        {MESES_LONGOS.map((n, i) => <option key={n} value={i + 1}>{n}</option>)}
      </select>
      <select value={y} onChange={(e) => onChange(ym(Number(e.target.value), m - 1))}>
        {anos.map((a) => <option key={a} value={a}>{a}</option>)}
      </select>
      <button className="icon-btn" onClick={() => onChange(addMonths(value, 1))} aria-label="Próximo mês"><Icon name="right" /></button>
      {value !== mesAtual() && <button className="btn-link" onClick={() => onChange(mesAtual())}>Hoje</button>}
    </div>
  );
}

function CartaoVisual({ card, usado, compacto }) {
  const disp = card.limite - usado;
  const pct = card.limite > 0 ? Math.min(100, (usado / card.limite) * 100) : 0;
  return (
    <div className="cc" style={{
      background: `linear-gradient(135deg, ${shade(card.cor, 8)} 0%, ${shade(card.cor, -62)} 100%)`,
      minWidth: compacto ? 260 : 280,
    }}>
      <div className="cc-shine" />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: 0.2 }}>{card.nome}</span>
        <svg width="34" height="24" viewBox="0 0 34 24">
          <circle cx="12" cy="12" r="10" fill="rgba(255,255,255,.55)" />
          <circle cx="22" cy="12" r="10" fill="rgba(255,255,255,.3)" />
        </svg>
      </div>
      <svg width="36" height="26" viewBox="0 0 36 26" style={{ marginTop: 14 }}>
        <rect x="0.5" y="0.5" width="35" height="25" rx="5" fill="#f5d77a" stroke="#d4b14f" />
        <path d="M0 9h12M0 17h12M24 9h12M24 17h12M12 0v26M24 0v26" stroke="#c9a640" strokeWidth="1" />
      </svg>
      <div style={{ fontSize: 15, letterSpacing: 3, marginTop: 10, opacity: 0.95 }}>•••• •••• •••• {card.final || "0000"}</div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, fontSize: 11.5, opacity: 0.85 }}>
        <span>Disponível</span>
        <span>Limite {brl(card.limite)}</span>
      </div>
      <div style={{ fontSize: 19, fontWeight: 800, marginTop: 2 }}>{brl(disp)}</div>
      <div style={{ height: 6, background: "rgba(255,255,255,.2)", borderRadius: 6, marginTop: 10, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: pct > 85 ? "#fecaca" : "#fff", borderRadius: 6, transition: "width .4s" }} />
      </div>
      <div style={{ fontSize: 11, marginTop: 6, opacity: 0.8 }}>{Math.round(pct)}% comprometido · fecha dia {card.fechamento || "—"}</div>
    </div>
  );
}

function SeletorCategoria({ cats, value, onChange }) {
  return (
    <div className="cat-grid">
      {cats.map((c) => (
        <button type="button" key={c.id} className={`cat-chip ${value === c.id ? "on" : ""}`} onClick={() => onChange(c.id)}>
          <span style={{ fontSize: 18 }}>{c.emoji}</span>
          <span>{c.nome}</span>
        </button>
      ))}
    </div>
  );
}

/* Campo de dinheiro com máscara (estilo app de banco): digita 1089 → mostra 10,89.
   Não depende do idioma do navegador, aceita colar "10,89" ou "1.234,56". Guarda CENTAVOS (inteiro). */
function CampoValor({ centavos, onChange, placeholder = "0,00", pequeno = false, autoFocus = false }) {
  const texto = centavos > 0
    ? (centavos / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "";
  return (
    <div className={`valor-wrap ${pequeno ? "valor-sm" : ""}`}>
      <span className="valor-prefixo">R$</span>
      <input
        className="input valor-input"
        type="text"
        inputMode="numeric"
        autoComplete="off"
        autoFocus={autoFocus}
        placeholder={placeholder}
        value={texto}
        onChange={(e) => {
          const digitos = e.target.value.replace(/\D/g, "").replace(/^0+/, "").slice(0, 11);
          onChange(digitos ? parseInt(digitos, 10) : 0);
        }}
      />
    </div>
  );
}
const paraCentavos = (reais) => Math.round((Number(reais) || 0) * 100);

const Campo = ({ label, children, dica }) => (
  <label className="campo">
    <span className="campo-label">{label}</span>
    {children}
    {dica && <span className="campo-dica">{dica}</span>}
  </label>
);

/* =========================================================
   ABA: VISÃO GERAL
   ========================================================= */

function VisaoGeral({ ctx }) {
  const { mesSel, resumoMes, cartoes, usadoCartao, gastosCategoria, futuros, meta, setMeta, ultimas, irPara, carregarExemplo, vazio, habHoje } = ctx;
  const ultimos6 = Array.from({ length: 6 }, (_, i) => addMonths(mesSel, i - 5));
  const series = ultimos6.map(resumoMes);
  const atual = series[5], anterior = series[4];
  const variacao = (a, b) => (b ? ((a - b) / Math.abs(b)) * 100 : null);
  const vSaldo = variacao(atual.saldo, anterior.saldo);

  const progresso = meta > 0 ? Math.max(0, Math.min(100, (atual.saldo / meta) * 100)) : 0;
  const maxSlider = Math.max(1000, Math.ceil((atual.receitas || 5000) / 100) * 100);
  const totalComprometido = futuros.reduce((s, f) => s + f.valor, 0);
  const mediaReceita = series.reduce((s, x) => s + x.receitas, 0) / 6;

  const Sub = ({ titulo, valor, cor, icon, serie, varr, bom, id }) => (
    <div className="hero-sub">
      <div style={{ display: "flex", alignItems: "center", gap: 6, color: cor, fontSize: 13, fontWeight: 600 }}>
        <Icon name={icon} size={15} /> {titulo}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 8, marginTop: 6 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.4 }}>{brl(valor)}</div>
          {varr !== null && (
            <span className={`pill ${(varr >= 0) === bom ? "pill-ok" : "pill-bad"}`} style={{ marginTop: 6 }}>
              {varr >= 0 ? "▲" : "▼"} {Math.abs(varr).toFixed(0)}%
            </span>
          )}
        </div>
        <Sparkline values={serie} color={cor} id={id} w={96} h={34} />
      </div>
    </div>
  );

  return (
    <div className="stack">
      {vazio && (
        <div className="card banner">
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Bem-vindo(a)! 👋</div>
            <div className="muted" style={{ fontSize: 14, marginTop: 4 }}>Lance sua primeira receita ou carregue dados de exemplo para ver o painel funcionando.</div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="btn" onClick={() => irPara("lancar", "receita")}>Lançar receita</button>
            <button className="btn btn-ghost" onClick={carregarExemplo}>Dados de exemplo</button>
          </div>
        </div>
      )}

      <div className="grid-21">
        <div className="card hero">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div className="muted" style={{ fontSize: 13.5, fontWeight: 500 }}>Saldo do mês · BRL</div>
              <div className="hero-valor" style={{ color: atual.saldo < 0 ? C.red : C.text }}>{brl(atual.saldo)}</div>
              <div style={{ fontSize: 12.5, marginTop: 6 }}>
                {vSaldo === null ? <span className="muted">{labelYMLongo(mesSel)}</span> : (
                  <>
                    <span className={`pill ${vSaldo >= 0 ? "pill-ok" : "pill-bad"}`}>{vSaldo >= 0 ? "▲" : "▼"} {Math.abs(vSaldo).toFixed(0)}%</span>
                    <span className="muted" style={{ marginLeft: 6 }}>vs. mês anterior</span>
                  </>
                )}
              </div>
            </div>
            <Sparkline values={series.map((s) => s.saldo)} color={C.mint} id="spark-saldo" w={170} h={56} />
          </div>
          <div className="hero-subs">
            <Sub titulo="Receitas" valor={atual.receitas} cor={C.mint} icon="up" serie={series.map((s) => s.receitas)} varr={variacao(atual.receitas, anterior.receitas)} bom id="spark-r" />
            <Sub titulo="Despesas" valor={atual.gastos} cor={C.red} icon="down" serie={series.map((s) => s.gastos)} varr={variacao(atual.gastos, anterior.gastos)} bom={false} id="spark-g" />
          </div>
        </div>

        <div className="stack">
          <div className="card">
            <h3 style={{ marginBottom: 12 }}>Ações rápidas</h3>
            <div className="acoes">
              <button className="acao" onClick={() => irPara("lancar", "receita")}><span className="acao-ic" style={{ background: C.mintSoft, color: C.mint }}><Icon name="up" /></span>Receita</button>
              <button className="acao" onClick={() => irPara("lancar", "gasto")}><span className="acao-ic" style={{ background: C.redSoft, color: C.red }}><Icon name="down" /></span>Gasto</button>
              <button className="acao" onClick={() => irPara("lancar", "cartao")}><span className="acao-ic" style={{ background: C.violetSoft, color: C.violet }}><Icon name="card" /></span>Cartão</button>
              <button className="acao" onClick={() => irPara("habitos")}><span className="acao-ic" style={{ background: C.amberSoft, color: C.amber }}><Icon name="flame" /></span>Hábitos</button>
            </div>
          </div>

          <button className="card hab-mini" onClick={() => irPara("habitos")}>
            <Anel pct={habHoje.total ? habHoje.feitos / habHoje.total : 0} size={52} sw={5}>
              <text x="26" y="30.5" textAnchor="middle" fontSize="12" fontWeight="800" fill={C.text} fontFamily="Inter, sans-serif">
                {habHoje.feitos}/{habHoje.total}
              </text>
            </Anel>
            <div style={{ flex: 1, textAlign: "left" }}>
              <div style={{ fontWeight: 700, fontSize: 14.5 }}>Hábitos de hoje</div>
              <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>
                {habHoje.total === 0 ? "Nada programado para hoje" : habHoje.feitos === habHoje.total ? "Tudo concluído 🔥" : `Faltam ${habHoje.total - habHoje.feitos} para fechar o dia`}
              </div>
            </div>
            <span className="seq-badge"><Icon name="flame" size={13} /> {habHoje.seq}d</span>
          </button>
        </div>
      </div>

      <div className="grid-21">
        <div className="card">
          <div className="card-head">
            <h3>Meus cartões</h3>
            <button className="btn-link" onClick={() => irPara("cartoes")}>Gerenciar →</button>
          </div>
          {cartoes.length === 0 ? (
            <Vazio texto="Nenhum cartão cadastrado." acao={<button className="btn btn-sm" onClick={() => irPara("cartoes")}>Cadastrar cartão</button>} />
          ) : (
            <div className="cc-row">{cartoes.map((c) => <CartaoVisual key={c.id} card={c} usado={usadoCartao(c.id)} compacto />)}</div>
          )}
        </div>

        <div className="card">
          <div className="card-head">
            <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}><Icon name="target" size={17} color={C.mint} /> Meta de poupança</h3>
            <span className="muted" style={{ fontSize: 12 }}>{labelYM(mesSel)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontSize: 22, fontWeight: 800 }}>{brl(Math.max(0, atual.saldo))}</span>
            <span className="muted" style={{ fontSize: 13 }}>de {brl(meta)}</span>
          </div>
          <div className="progress"><div style={{ width: `${progresso}%` }} /></div>
          <div style={{ fontSize: 12.5, marginTop: 8, color: progresso >= 100 ? C.mint : C.muted, fontWeight: progresso >= 100 ? 600 : 400 }}>
            {progresso >= 100 ? "🎉 Meta atingida neste mês!" : atual.saldo < 0 ? "Saldo negativo — a meta ficou para trás." : `Faltam ${brl(meta - atual.saldo)} (${Math.round(progresso)}%)`}
          </div>
          <input type="range" min="0" max={maxSlider} step="50" value={Math.min(meta, maxSlider)} onChange={(e) => setMeta(Number(e.target.value))} className="range" />
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span className="muted" style={{ fontSize: 12 }}>Meta mensal:</span>
            <CampoValor pequeno centavos={paraCentavos(meta)} onChange={(c) => setMeta(c / 100)} />
          </div>
        </div>
      </div>

      <div className="grid-21">
        <div className="card">
          <div className="card-head">
            <h3>Gastos por categoria</h3>
            <span className="muted" style={{ fontSize: 12 }}>{labelYMLongo(mesSel)} · à vista + parcelas</span>
          </div>
          <GraficoCategorias itens={gastosCategoria} />
        </div>

        <div className="card">
          <div className="card-head">
            <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}><Icon name="alert" size={17} color={C.amber} /> Compromissos futuros</h3>
          </div>
          {totalComprometido === 0 ? (
            <Vazio texto="Nenhuma parcela comprometida nos próximos meses. 👏" />
          ) : (
            <>
              <div className="alerta-box">
                Você já tem <strong>{brl(totalComprometido)}</strong> comprometidos em parcelas nos próximos {futuros.length} meses.
              </div>
              <div style={{ marginTop: 12 }}>
                {futuros.map((f) => {
                  const max = Math.max(...futuros.map((x) => x.valor), 1);
                  const pesado = mediaReceita > 0 && f.valor / mediaReceita > 0.3;
                  return (
                    <div key={f.mes} className="fut-row">
                      <span style={{ width: 52, fontSize: 12.5, fontWeight: 600, color: C.muted }}>{labelYM(f.mes)}</span>
                      <div className="fut-bar"><div style={{ width: `${(f.valor / max) * 100}%`, background: pesado ? C.amber : C.mint2 }} /></div>
                      <span style={{ width: 92, textAlign: "right", fontSize: 12.5, fontWeight: 600 }}>{brl(f.valor)}</span>
                    </div>
                  );
                })}
              </div>
              {futuros.some((f) => mediaReceita > 0 && f.valor / mediaReceita > 0.3) && (
                <div style={{ fontSize: 12, color: C.amber, marginTop: 10 }}>⚠️ Meses em amarelo comprometem mais de 30% da sua renda média.</div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Últimas transações</h3>
          <button className="btn-link" onClick={() => irPara("historico")}>Ver tudo →</button>
        </div>
        {ultimas.length === 0 ? <Vazio texto="Nada lançado ainda." /> : (
          <div className="lista">{ultimas.map((t) => <LinhaTransacao key={t.id} t={t} />)}</div>
        )}
      </div>
    </div>
  );
}

function LinhaTransacao({ t, onDelete, extra }) {
  const c = catInfo(t.categoria);
  const positivo = t.tipo === "receita";
  return (
    <div className="linha">
      <div className="linha-ic" style={{ background: positivo ? C.mintSoft : C.redSoft }}>{c.emoji}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.desc}</div>
        <div className="muted" style={{ fontSize: 12 }}>{c.nome} · {dataBR(t.data)}{extra ? ` · ${extra}` : ""}</div>
      </div>
      <div style={{ fontWeight: 700, fontSize: 14, color: positivo ? C.mint : C.red, whiteSpace: "nowrap" }}>
        {positivo ? "+ " : "− "}{brl(t.valor)}
      </div>
      {onDelete && <button className="icon-btn danger" onClick={onDelete} aria-label="Excluir"><Icon name="trash" size={16} /></button>}
    </div>
  );
}

/* =========================================================
   ABA: LANÇAR
   ========================================================= */

function FormVista({ modoInicial, sinal, onAdd }) {
  const [tipo, setTipo] = useState(modoInicial === "gasto" ? "gasto" : "receita");
  const [desc, setDesc] = useState("");
  const [valor, setValor] = useState(0); // centavos
  const [categoria, setCategoria] = useState(modoInicial === "gasto" ? "alimentacao" : "salario");
  const [data, setData] = useState(hojeISO());
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (modoInicial === "receita" || modoInicial === "gasto") {
      setTipo(modoInicial);
      setCategoria(modoInicial === "gasto" ? "alimentacao" : "salario");
    }
  }, [modoInicial, sinal]);

  const trocarTipo = (t) => {
    setTipo(t);
    setCategoria(t === "gasto" ? "alimentacao" : "salario");
  };

  const enviar = (e) => {
    e.preventDefault();
    if (!desc.trim()) return setErro("Informe uma descrição.");
    if (!(valor > 0)) return setErro("Informe um valor maior que zero.");
    if (!data) return setErro("Informe a data.");
    onAdd({ id: uid(), tipo, desc: desc.trim(), valor: valor / 100, categoria, data });
    setDesc(""); setValor(0); setErro("");
  };

  return (
    <form className="card" onSubmit={enviar}>
      <h3>Receita ou gasto à vista</h3>
      <p className="muted" style={{ fontSize: 13, margin: "4px 0 16px" }}>Dinheiro, Pix ou débito — entra direto no mês da data.</p>
      <div className="toggle">
        <button type="button" className={tipo === "receita" ? "on" : ""} onClick={() => trocarTipo("receita")} style={tipo === "receita" ? { color: C.mint } : {}}>↑ Receita</button>
        <button type="button" className={tipo === "gasto" ? "on" : ""} onClick={() => trocarTipo("gasto")} style={tipo === "gasto" ? { color: C.red } : {}}>↓ Gasto</button>
      </div>
      <div className="form-grid">
        <Campo label="Descrição">
          <input className="input" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder={tipo === "receita" ? "Ex.: Salário de novembro" : "Ex.: Mercado do mês"} />
        </Campo>
        <div className="form-2">
          <Campo label="Valor">
            <CampoValor centavos={valor} onChange={setValor} />
          </Campo>
          <Campo label="Data">
            <input className="input" type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </Campo>
        </div>
        <Campo label="Categoria">
          <SeletorCategoria cats={tipo === "receita" ? CAT_RECEITA : CAT_GASTO} value={categoria} onChange={setCategoria} />
        </Campo>
      </div>
      {erro && <div className="erro">{erro}</div>}
      <button className={`btn btn-full ${tipo === "gasto" ? "btn-red" : ""}`} type="submit" style={{ marginTop: 16 }}>
        Lançar {tipo === "receita" ? "receita" : "gasto"}
      </button>
    </form>
  );
}

function FormCartao({ cartoes, onAdd, irCartoes, destacar }) {
  const [cardId, setCardId] = useState(cartoes[0]?.id || "");
  const [desc, setDesc] = useState("");
  const [valor, setValor] = useState(0); // centavos
  const [parcelas, setParcelas] = useState(1);
  const [categoria, setCategoria] = useState("compras");
  const [data, setData] = useState(hojeISO());
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!cartoes.find((c) => c.id === cardId)) setCardId(cartoes[0]?.id || "");
  }, [cartoes, cardId]);

  const cartao = cartoes.find((c) => c.id === cardId);
  const v = valor / 100;
  const preview = cartao && v > 0 && data ? gerarParcelas({ id: "prev", cardId, desc, valor: v, parcelas, categoria, data }, cartao) : [];

  const enviar = (e) => {
    e.preventDefault();
    if (!cartao) return setErro("Cadastre um cartão primeiro.");
    if (!desc.trim()) return setErro("Informe uma descrição.");
    if (!(v > 0)) return setErro("Informe um valor maior que zero.");
    if (!data) return setErro("Informe a data da compra.");
    onAdd({ id: uid(), cardId, desc: desc.trim(), valor: v, parcelas: Number(parcelas), categoria, data });
    setDesc(""); setValor(0); setParcelas(1); setErro("");
  };

  return (
    <form className={`card ${destacar ? "card-destaque" : ""}`} onSubmit={enviar}>
      <h3>Compra no cartão de crédito</h3>
      <p className="muted" style={{ fontSize: 13, margin: "4px 0 16px" }}>O app divide o valor e coloca cada parcela na fatura certa.</p>
      {cartoes.length === 0 ? (
        <Vazio texto="Você ainda não cadastrou nenhum cartão." acao={<button type="button" className="btn btn-sm" onClick={irCartoes}>Cadastrar cartão</button>} />
      ) : (
        <>
          <div className="form-grid">
            <Campo label="Cartão">
              <div className="card-pick">
                {cartoes.map((c) => (
                  <button type="button" key={c.id} onClick={() => setCardId(c.id)} className={`card-pick-btn ${c.id === cardId ? "on" : ""}`}>
                    <span style={{ width: 22, height: 14, borderRadius: 3, background: `linear-gradient(135deg, ${c.cor}, ${shade(c.cor, -55)})` }} />
                    {c.nome}
                  </button>
                ))}
              </div>
            </Campo>
            <Campo label="Descrição">
              <input className="input" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Ex.: Geladeira nova" />
            </Campo>
            <div className="form-3">
              <Campo label="Valor total">
                <CampoValor centavos={valor} onChange={setValor} />
              </Campo>
              <Campo label="Parcelas">
                <select className="input" value={parcelas} onChange={(e) => setParcelas(Number(e.target.value))}>
                  {Array.from({ length: 24 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n === 1 ? "À vista (1x)" : `${n}x`}</option>)}
                </select>
              </Campo>
              <Campo label="Data da compra">
                <input className="input" type="date" value={data} onChange={(e) => setData(e.target.value)} />
              </Campo>
            </div>
            <Campo label="Categoria">
              <SeletorCategoria cats={CAT_GASTO} value={categoria} onChange={setCategoria} />
            </Campo>
          </div>
          {preview.length > 0 && (
            <div className="preview">
              <div style={{ fontWeight: 700, fontSize: 14 }}>
                {preview.length}x de {brl(preview[preview.length - 1].valor)}
                {preview[0].valor !== preview[preview.length - 1].valor && <span className="muted" style={{ fontWeight: 400 }}> (1ª de {brl(preview[0].valor)})</span>}
              </div>
              <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>
                1ª parcela na fatura de <strong style={{ color: C.text }}>{labelYMLongo(preview[0].mes)}</strong>
                {preview.length > 1 && <> · última em <strong style={{ color: C.text }}>{labelYMLongo(preview[preview.length - 1].mes)}</strong></>}
                {cartao?.fechamento ? ` · cartão fecha dia ${cartao.fechamento}` : ""}
              </div>
              <div className="chips-meses">
                {preview.slice(0, 12).map((p) => <span key={p.id}>{labelYM(p.mes)}</span>)}
                {preview.length > 12 && <span>+{preview.length - 12}</span>}
              </div>
            </div>
          )}
          {erro && <div className="erro">{erro}</div>}
          <button className="btn btn-full" type="submit" style={{ marginTop: 16 }}>Registrar compra parcelada</button>
        </>
      )}
    </form>
  );
}

/* =========================================================
   ABA: CARTÕES
   ========================================================= */

function Cartoes({ ctx }) {
  const { cartoes, addCartao, removerCartao, usadoCartao, parcelas, mesSel } = ctx;
  const [nome, setNome] = useState("");
  const [limite, setLimite] = useState(0); // centavos
  const [fechamento, setFechamento] = useState(5);
  const [final, setFinal] = useState("");
  const [cor, setCor] = useState(CORES_CARTAO[0]);
  const [erro, setErro] = useState("");

  const enviar = (e) => {
    e.preventDefault();
    if (!nome.trim()) return setErro("Dê um nome ao cartão.");
    if (!(limite > 0)) return setErro("Informe o limite.");
    addCartao({ id: uid(), nome: nome.trim(), limite: limite / 100, fechamento: Number(fechamento), final: final.replace(/\D/g, "").slice(-4), cor });
    setNome(""); setLimite(0); setFinal(""); setErro("");
  };

  const meses12 = Array.from({ length: 12 }, (_, i) => addMonths(mesSel, i));

  return (
    <div className="grid-12">
      <form className="card" onSubmit={enviar} style={{ alignSelf: "start" }}>
        <h3>Novo cartão</h3>
        <div style={{ margin: "16px 0" }}>
          <CartaoVisual card={{ nome: nome || "Meu cartão", limite: limite / 100, fechamento, final: final.slice(-4), cor }} usado={0} />
        </div>
        <div className="form-grid">
          <Campo label="Nome"><input className="input" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Nubank" /></Campo>
          <div className="form-2">
            <Campo label="Limite"><CampoValor centavos={limite} onChange={setLimite} placeholder="3.000,00" /></Campo>
            <Campo label="Final (4 dígitos)"><input className="input" value={final} maxLength={4} inputMode="numeric" onChange={(e) => setFinal(e.target.value.replace(/\D/g, ""))} placeholder="1234" /></Campo>
          </div>
          <Campo label="Dia de fechamento da fatura" dica="Compras a partir desse dia caem na fatura do mês seguinte.">
            <select className="input" value={fechamento} onChange={(e) => setFechamento(Number(e.target.value))}>
              {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => <option key={d} value={d}>Dia {d}</option>)}
            </select>
          </Campo>
          <Campo label="Cor">
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              {CORES_CARTAO.map((c) => (
                <button type="button" key={c} onClick={() => setCor(c)} className="swatch" style={{ background: c, outline: cor === c ? `2px solid ${C.mint}` : "none" }} aria-label={`Cor ${c}`} />
              ))}
              <input type="color" value={cor} onChange={(e) => setCor(e.target.value)} className="color-input" title="Cor personalizada" />
            </div>
          </Campo>
        </div>
        {erro && <div className="erro">{erro}</div>}
        <button className="btn btn-full" type="submit" style={{ marginTop: 16 }}>Adicionar cartão</button>
      </form>

      <div className="stack">
        {cartoes.length === 0 && <div className="card"><Vazio texto="Seus cartões aparecerão aqui, com a timeline de parcelas de cada um." /></div>}
        {cartoes.map((c) => {
          const usado = usadoCartao(c.id);
          const valores = meses12.map((m) => ({
            mes: m,
            valor: parcelas.filter((p) => p.cardId === c.id && p.mes === m).reduce((s, p) => s + p.valor, 0),
          }));
          const comprasAtivas = new Set(parcelas.filter((p) => p.cardId === c.id && p.mes >= mesSel).map((p) => p.compraId)).size;
          return (
            <div className="card" key={c.id}>
              <div className="cartao-linha">
                <CartaoVisual card={c} usado={usado} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="card-head">
                    <h3>Timeline de parcelas</h3>
                    <button className="icon-btn danger" onClick={() => removerCartao(c.id)} aria-label="Excluir cartão"><Icon name="trash" size={16} /></button>
                  </div>
                  <div className="mini-stats">
                    <div><span className="muted">Fatura de {labelYM(mesSel)}</span><strong>{brl(valores[0].valor)}</strong></div>
                    <div><span className="muted">Total a pagar</span><strong>{brl(usado)}</strong></div>
                    <div><span className="muted">Compras ativas</span><strong>{comprasAtivas}</strong></div>
                  </div>
                  <TimelineParcelas cor={c.cor} valores={valores} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* =========================================================
   ABA: HISTÓRICO
   ========================================================= */

function Historico({ ctx }) {
  const { mesSel, transacoes, parcelas, cartoes, removerTransacao, removerCompra, resumoMes } = ctx;
  const [filtro, setFiltro] = useState("todos");
  const doMes = transacoes
    .filter((t) => t.data.slice(0, 7) === mesSel)
    .filter((t) => filtro === "todos" || t.tipo === filtro)
    .sort((a, b) => b.data.localeCompare(a.data));
  const parcMes = parcelas.filter((p) => p.mes === mesSel).sort((a, b) => b.dataCompra.localeCompare(a.dataCompra));
  const r = resumoMes(mesSel);
  const nomeCartao = (id) => cartoes.find((c) => c.id === id)?.nome || "Cartão";

  return (
    <div className="stack">
      <div className="grid-4">
        <div className="card mini"><span className="muted">Receitas</span><strong style={{ color: C.mint }}>{brl(r.receitas)}</strong></div>
        <div className="card mini"><span className="muted">Gastos à vista</span><strong>{brl(r.gastosVista)}</strong></div>
        <div className="card mini"><span className="muted">Parcelas do cartão</span><strong>{brl(r.parcelas)}</strong></div>
        <div className="card mini"><span className="muted">Saldo</span><strong style={{ color: r.saldo >= 0 ? C.mint : C.red }}>{brl(r.saldo)}</strong></div>
      </div>
      <div className="grid-2">
        <div className="card">
          <div className="card-head">
            <h3>Transações à vista</h3>
            <div className="toggle toggle-sm">
              {[["todos", "Todas"], ["receita", "Receitas"], ["gasto", "Gastos"]].map(([k, l]) => (
                <button key={k} className={filtro === k ? "on" : ""} onClick={() => setFiltro(k)}>{l}</button>
              ))}
            </div>
          </div>
          {doMes.length === 0 ? <Vazio texto={`Nenhuma transação em ${labelYMLongo(mesSel)}.`} /> : (
            <div className="lista">{doMes.map((t) => <LinhaTransacao key={t.id} t={t} onDelete={() => removerTransacao(t.id)} />)}</div>
          )}
        </div>
        <div className="card">
          <div className="card-head">
            <h3>Parcelas do cartão</h3>
            <span className="muted" style={{ fontSize: 12 }}>{parcMes.length} parcela(s)</span>
          </div>
          {parcMes.length === 0 ? <Vazio texto={`Nenhuma parcela na fatura de ${labelYMLongo(mesSel)}.`} /> : (
            <div className="lista">
              {parcMes.map((p) => (
                <LinhaTransacao key={p.id}
                  t={{ id: p.id, tipo: "gasto", desc: p.desc, valor: p.valor, categoria: p.categoria, data: p.dataCompra }}
                  extra={`${nomeCartao(p.cardId)} · ${p.numero}/${p.total}`}
                  onDelete={() => removerCompra(p.compraId)} />
              ))}
            </div>
          )}
          {parcMes.length > 0 && <div className="muted" style={{ fontSize: 11.5, marginTop: 10 }}>Excluir uma parcela remove a compra inteira (todas as parcelas).</div>}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   ABA: HÁBITOS & HOBBIES
   ========================================================= */

function FormHabito({ inicial, onSalvar, onFechar }) {
  const [nome, setNome] = useState(inicial?.nome || "");
  const [emoji, setEmoji] = useState(inicial?.emoji || "📖");
  const [tipo, setTipo] = useState(inicial?.tipo || "habito");
  const [dias, setDias] = useState(inicial?.dias || [0, 1, 2, 3, 4]);
  const [horario, setHorario] = useState(inicial?.horario || "");
  const [cor, setCor] = useState(inicial?.cor || CORES_HAB[0]);
  const [erro, setErro] = useState("");

  const toggleDia = (i) => setDias((d) => (d.includes(i) ? d.filter((x) => x !== i) : [...d, i].sort()));
  const presets = [["Todo dia", [0, 1, 2, 3, 4, 5, 6]], ["Dias úteis", [0, 1, 2, 3, 4]], ["Fim de semana", [5, 6]]];

  const salvar = (e) => {
    e.preventDefault();
    if (!nome.trim()) return setErro("Dê um nome.");
    if (!dias.length) return setErro("Escolha pelo menos um dia da semana.");
    onSalvar({
      id: inicial?.id || uid(),
      criado: inicial?.criado || hojeISO(),
      nome: nome.trim(), emoji, tipo, dias, horario, cor,
    });
  };

  return (
    <div className="modal-bg" onClick={onFechar}>
      <form className="card modal" onClick={(e) => e.stopPropagation()} onSubmit={salvar}>
        <div className="card-head">
          <h3>{inicial ? "Editar" : "Novo"} {tipo === "hobby" ? "hobby" : "hábito"}</h3>
          <button type="button" className="icon-btn" onClick={onFechar} aria-label="Fechar"><Icon name="x" size={16} /></button>
        </div>
        <div className="toggle">
          <button type="button" className={tipo === "habito" ? "on" : ""} onClick={() => setTipo("habito")}>🔥 Hábito</button>
          <button type="button" className={tipo === "hobby" ? "on" : ""} onClick={() => setTipo("hobby")}>🎨 Hobby</button>
        </div>
        <div className="form-grid">
          <div style={{ display: "flex", gap: 10 }}>
            <div className="hab-emoji-big" style={{ background: alpha(cor, 0.16), boxShadow: `inset 0 0 0 1px ${alpha(cor, 0.35)}` }}>{emoji}</div>
            <Campo label="Nome"><input className="input" autoFocus value={nome} onChange={(e) => setNome(e.target.value)} placeholder={tipo === "hobby" ? "Ex.: Violão" : "Ex.: Ler 20 páginas"} /></Campo>
          </div>
          <Campo label="Ícone">
            <div className="emoji-grid">
              {EMOJIS_HAB.map((em) => (
                <button type="button" key={em} className={`emoji-btn ${emoji === em ? "on" : ""}`} onClick={() => setEmoji(em)}>{em}</button>
              ))}
            </div>
          </Campo>
          <Campo label="Dias da semana" dica="Os check-ins zeram toda segunda-feira — a semana começa do zero.">
            <div className="dias-pick">
              {DIAS.map((d, i) => (
                <button type="button" key={d} className={`dia-chip ${dias.includes(i) ? "on" : ""}`} onClick={() => toggleDia(i)}>{d}</button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {presets.map(([l, v]) => (
                <button type="button" key={l} className="preset" onClick={() => setDias(v)}>{l}</button>
              ))}
            </div>
          </Campo>
          <div className="form-2">
            <Campo label="Horário (opcional)"><input className="input" type="time" value={horario} onChange={(e) => setHorario(e.target.value)} /></Campo>
            <Campo label="Cor">
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", paddingTop: 4 }}>
                {CORES_HAB.map((c) => (
                  <button type="button" key={c} onClick={() => setCor(c)} className="swatch swatch-sm" style={{ background: c, outline: cor === c ? `2px solid ${C.text}` : "none" }} aria-label={`Cor ${c}`} />
                ))}
              </div>
            </Campo>
          </div>
        </div>
        {erro && <div className="erro">{erro}</div>}
        <button className="btn btn-full" type="submit" style={{ marginTop: 16 }}>{inicial ? "Salvar alterações" : "Adicionar"}</button>
      </form>
    </div>
  );
}

function Habitos({ ctx }) {
  const { habitos, checks, toggleCheck, salvarHabito, removerHabito, carregarHabitosExemplo } = ctx;
  const hoje = new Date();
  const hojeIso = isoDe(hoje);
  const semana = Array.from({ length: 7 }, (_, i) => addDias(inicioSemana(hoje), i));
  const [diaSel, setDiaSel] = useState(diaSemana(hoje));
  const [filtro, setFiltro] = useState("todos");
  const [modal, setModal] = useState(null); // null | "novo" | habito

  const dataSel = semana[diaSel];
  const isoSel = isoDe(dataSel);
  const futuro = isoSel > hojeIso;

  const filtrados = habitos.filter((h) => filtro === "todos" || h.tipo === filtro);
  const doDia = filtrados
    .filter((h) => h.dias.includes(diaSel))
    .sort((a, b) => (a.horario || "99").localeCompare(b.horario || "99"));
  const feitosDia = doDia.filter((h) => feito(checks, isoSel, h.id)).length;

  const seq = useMemo(() => sequencias(habitos, checks, hoje), [habitos, checks, hojeIso]);

  // progresso da semana (até hoje)
  let progSemana = 0, okSemana = 0;
  semana.forEach((d) => {
    if (isoDe(d) > hojeIso) return;
    habitos.forEach((h) => {
      if (!programado(h, d)) return;
      progSemana++;
      if (feito(checks, isoDe(d), h.id)) okSemana++;
    });
  });
  const totalSemana = semana.reduce((s, d) => s + habitos.filter((h) => h.dias.includes(diaSemana(d))).length, 0);

  // análise automática (regras simples, sem IA)
  const analise = useMemo(() => {
    const out = [];
    if (!habitos.length) return out;
    const hojeProg = habitos.filter((h) => programado(h, hoje));
    const hojeOk = hojeProg.filter((h) => feito(checks, hojeIso, h.id)).length;
    if (seq.atual >= 2) out.push(`🔥 ${seq.atual} dias seguidos fechando tudo o que estava programado.`);
    if (hojeProg.length) {
      out.push(hojeOk === hojeProg.length ? "✅ Todos os de hoje concluídos. Sequência mantida!" : `⏳ Faltam ${hojeProg.length - hojeOk} de ${hojeProg.length} para fechar hoje.`);
    }
    const taxas = habitos.map((h) => ({ h, ...taxaHabito(h, checks, hoje) })).filter((t) => t.prog >= 2);
    if (taxas.length) {
      const melhor = [...taxas].sort((a, b) => b.taxa - a.taxa)[0];
      const pior = [...taxas].sort((a, b) => a.taxa - b.taxa)[0];
      if (melhor.taxa >= 0.8) out.push(`💪 "${melhor.h.nome}" está sólido: ${Math.round(melhor.taxa * 100)}% nos últimos 14 dias.`);
      if (pior.h.id !== melhor.h.id && pior.taxa < 0.5) out.push(`⚠️ "${pior.h.nome}" está escorregando (${Math.round(pior.taxa * 100)}%). Talvez menos dias por semana funcione melhor.`);
    }
    const hobbiesSemana = habitos.filter((h) => h.tipo === "hobby").reduce((s, h) => s + h.dias.length, 0);
    if (hobbiesSemana) out.push(`🎨 ${hobbiesSemana} momento(s) de hobby reservados nesta semana.`);
    else out.push("🎨 Nenhum hobby cadastrado — reservar tempo pra algo que você gosta também é hábito.");
    return out.slice(0, 4);
  }, [habitos, checks, hojeIso, seq.atual]);

  const fmtSemana = `${pad(semana[0].getDate())}/${pad(semana[0].getMonth() + 1)} a ${pad(semana[6].getDate())}/${pad(semana[6].getMonth() + 1)}`;

  return (
    <div className="stack">
      <div className="grid-3 hab-stats">
        <div className="card hab-stat">
          <div className="muted hab-stat-l"><Icon name="flame" size={15} color={C.amber} /> Sequência atual</div>
          <div><span className="hab-num">{seq.atual}</span> <span className="muted">dias</span></div>
        </div>
        <div className="card hab-stat">
          <div className="muted hab-stat-l"><Icon name="trophy" size={15} color={C.mint} /> Maior sequência</div>
          <div><span className="hab-num">{seq.maior}</span> <span className="muted">dias</span></div>
        </div>
        <div className="card hab-stat">
          <div className="muted hab-stat-l"><Icon name="target" size={15} color={C.blue} /> Semana até agora</div>
          <div><span className="hab-num">{progSemana ? Math.round((okSemana / progSemana) * 100) : 0}</span> <span className="muted">% <span className="hide-sm">· {okSemana}/{totalSemana} check-ins</span></span></div>
        </div>
      </div>

      <div className="grid-21">
        <div className="stack">
          <div className="card">
            <div className="card-head">
              <div>
                <h3>Semana de {fmtSemana}</h3>
                <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>Reinicia toda segunda-feira</div>
              </div>
              <button className="btn btn-sm" onClick={() => setModal("novo")}><span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Icon name="plus" size={16} /> Novo</span></button>
            </div>
            <div className="semana">
              {semana.map((d, i) => {
                const iso = isoDe(d);
                const prog = habitos.filter((h) => programado(h, d));
                const ok = prog.filter((h) => feito(checks, iso, h.id)).length;
                const status = !prog.length ? "" : ok === prog.length ? "full" : ok > 0 ? "part" : iso < hojeIso ? "miss" : "";
                return (
                  <button key={iso} className={`dia-pill ${i === diaSel ? "sel" : ""} ${iso === hojeIso ? "hoje" : ""}`} onClick={() => setDiaSel(i)}>
                    <span className="dia-l">{DIAS_LETRA[i]}</span>
                    <span className="dia-n">{d.getDate()}</span>
                    <span className={`dia-dot ${status}`} />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div>
                <h3>{isoSel === hojeIso ? "Hoje" : DIAS_LONGOS[diaSel]}</h3>
                <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>{futuro ? "Dia futuro — check-in liberado no dia" : `${feitosDia}/${doDia.length} concluídos · ${doDia.length ? Math.round((feitosDia / doDia.length) * 100) : 0}%`}</div>
              </div>
              <div className="toggle toggle-sm">
                {[["todos", "Todos"], ["habito", "Hábitos"], ["hobby", "Hobbies"]].map(([k, l]) => (
                  <button key={k} className={filtro === k ? "on" : ""} onClick={() => setFiltro(k)}>{l}</button>
                ))}
              </div>
            </div>
            <div className="progress" style={{ marginTop: 12 }}>
              <div style={{ width: `${doDia.length ? (feitosDia / doDia.length) * 100 : 0}%`, background: "linear-gradient(90deg, #10b981, #6ee7b7)" }} />
            </div>

            <div className="stack" style={{ gap: 10, marginTop: 16 }}>
              {habitos.length === 0 ? (
                <Vazio texto="Crie seus hábitos e hobbies e escolha em quais dias da semana eles acontecem."
                  acao={<div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                    <button className="btn btn-sm" onClick={() => setModal("novo")}>Criar primeiro</button>
                    <button className="btn btn-sm btn-ghost" onClick={carregarHabitosExemplo}>Usar exemplos</button>
                  </div>} />
              ) : doDia.length === 0 ? (
                <Vazio texto={`Nada programado para ${DIAS_LONGOS[diaSel].toLowerCase()}${filtro !== "todos" ? " neste filtro" : ""}. Dia livre 😌`} />
              ) : (
                doDia.map((h) => {
                  const ok = feito(checks, isoSel, h.id);
                  const s = sequenciaHabito(h, checks, hoje);
                  return (
                    <div key={h.id} className={`hab-item ${ok ? "ok" : ""}`}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div className="hab-emoji" style={{ background: alpha(h.cor, 0.15), boxShadow: `inset 0 0 0 1px ${alpha(h.cor, 0.3)}` }}>{h.emoji}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 15, textDecoration: ok ? "line-through" : "none", textDecorationColor: alpha(h.cor, 0.6) }}>{h.nome}</div>
                          <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>
                            <span className={`tag ${h.tipo}`}>{h.tipo === "hobby" ? "Hobby" : "Hábito"}</span>
                            {h.horario && <> · {h.horario}</>}
                            {s > 0 && <> · 🔥 {s}</>}
                          </div>
                        </div>
                        <button className="icon-btn ghost" onClick={() => setModal(h)} aria-label="Editar"><Icon name="edit" size={15} /></button>
                        <button
                          className={`check-btn ${ok ? "on" : ""}`}
                          disabled={futuro}
                          style={ok ? { background: alpha(h.cor, 0.2), borderColor: h.cor, color: h.cor } : {}}
                          onClick={() => toggleCheck(isoSel, h.id)}
                          aria-label={ok ? "Desmarcar" : "Concluir"}
                        >
                          <Icon name="check" size={20} sw={2.6} />
                        </button>
                      </div>
                      <div className="hab-barras">
                        {semana.map((d, i) => {
                          const iso = isoDe(d);
                          const prog = programado(h, d) || (h.dias.includes(i) && iso < h.criado);
                          const done = feito(checks, iso, h.id);
                          let bg = "rgba(255,255,255,.025)";
                          if (prog) bg = done ? h.cor : iso < hojeIso ? "rgba(251,113,133,.28)" : "rgba(255,255,255,.1)";
                          return (
                            <div key={iso} className="hab-barra-wrap">
                              <div className={`hab-barra ${prog ? "" : "off"}`} style={{ background: bg, boxShadow: done ? `0 0 10px ${alpha(h.cor, 0.45)}` : "none" }} />
                              <span style={{ color: i === diaSel ? C.text : C.dim }}>{DIAS_LETRA[i]}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="stack">
          <div className="card analise">
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span className="acao-ic" style={{ background: C.mintSoft, color: C.mint }}><Icon name="spark" size={17} /></span>
              <h3>Resumo dos seus hábitos</h3>
            </div>
            {analise.length === 0 ? <div className="muted" style={{ fontSize: 13.5 }}>Adicione hábitos para ver o resumo.</div> : (
              <ul className="analise-lista">{analise.map((a, i) => <li key={i}>{a}</li>)}</ul>
            )}
          </div>

          <div className="card">
            <div className="card-head">
              <h3>Por dia da semana</h3>
              <span className="muted" style={{ fontSize: 12 }}>{habitos.length} item(ns)</span>
            </div>
            <div className="por-dia">
              {DIAS.map((d, i) => {
                const lista = habitos.filter((h) => h.dias.includes(i));
                return (
                  <button key={d} className={`por-dia-row ${i === diaSel ? "sel" : ""}`} onClick={() => setDiaSel(i)}>
                    <span className="por-dia-nome">{d}</span>
                    <span className="por-dia-itens">
                      {lista.length === 0 ? <span className="muted" style={{ fontSize: 12 }}>livre</span> :
                        lista.map((h) => (
                          <span key={h.id} className="mini-chip" title={h.nome} style={{ background: alpha(h.cor, 0.14), color: h.cor }}>
                            {h.emoji}
                          </span>
                        ))}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {habitos.length > 0 && (
            <div className="card">
              <h3 style={{ marginBottom: 10 }}>Gerenciar</h3>
              <div className="lista">
                {habitos.map((h) => (
                  <div className="linha" key={h.id}>
                    <div className="linha-ic" style={{ background: alpha(h.cor, 0.15) }}>{h.emoji}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{h.nome}</div>
                      <div className="muted" style={{ fontSize: 12 }}>
                        {h.tipo === "hobby" ? "Hobby" : "Hábito"} · {h.dias.length === 7 ? "Todo dia" : h.dias.map((x) => DIAS[x]).join(", ")}
                      </div>
                    </div>
                    <button className="icon-btn ghost" onClick={() => setModal(h)} aria-label="Editar"><Icon name="edit" size={15} /></button>
                    <button className="icon-btn danger" onClick={() => removerHabito(h.id)} aria-label="Excluir"><Icon name="trash" size={15} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {modal && (
        <FormHabito
          inicial={modal === "novo" ? null : modal}
          onFechar={() => setModal(null)}
          onSalvar={(h) => { salvarHabito(h); setModal(null); }}
        />
      )}
    </div>
  );
}

/* =========================================================
   ABA: DICAS
   ========================================================= */

function Dicas({ ctx }) {
  const { resumoMes, mesSel } = ctx;
  const ult6 = Array.from({ length: 6 }, (_, i) => resumoMes(addMonths(mesSel, i - 5)));
  const mesesComDados = ult6.filter((r) => r.gastos > 0);
  const gastoMedio = mesesComDados.length ? mesesComDados.reduce((s, r) => s + r.gastos, 0) / mesesComDados.length : 0;
  const renda = resumoMes(mesSel).receitas;

  const partes = [
    { nome: "Necessidades", pct: 50, cor: C.mint3, desc: "Moradia, mercado, contas, transporte, saúde." },
    { nome: "Desejos", pct: 30, cor: C.mint, desc: "Lazer, restaurantes, compras, assinaturas." },
    { nome: "Futuro", pct: 20, cor: "#d1fae5", desc: "Reserva de emergência, investimentos, quitar dívidas." },
  ];

  const dicas = [
    { emoji: "🛟", titulo: "Fundo de emergência", texto: `É o dinheiro que segura você num imprevisto (demissão, conserto, saúde) sem precisar de cartão ou empréstimo. A referência comum é de 3 a 6 meses do seu custo de vida — quem tem renda variável deve mirar mais perto de 6 a 12. ${gastoMedio > 0 ? `Pelo seu gasto médio (${brl(gastoMedio)}/mês), a meta seria entre ${brl(gastoMedio * 3)} e ${brl(gastoMedio * 6)}.` : "Lance seus gastos por alguns meses para o app calcular sua meta."} Deixe essa reserva em algo com liquidez diária e baixo risco, separado da conta do dia a dia.` },
    { emoji: "🌱", titulo: "Como investir com pouco", texto: "Primeiro monte a reserva de emergência; depois pense em rentabilidade. Títulos públicos do Tesouro Direto e CDBs com liquidez diária aceitam valores baixos e costumam render mais que a poupança. Verifique se o CDB tem cobertura do FGC e compare a rentabilidade em % do CDI. O que mais pesa no começo é a constância: um valor fixo todo mês, programado logo após receber." },
    { emoji: "💳", titulo: "Cartão de crédito sem susto", texto: "Parcelas pequenas somadas viram uma fatura grande. Antes de parcelar, olhe a aba Cartões: se algum mês futuro já está pesado, espere. Nunca pague só o mínimo — os juros do rotativo estão entre os mais altos do mercado. Comprar logo depois do fechamento dá mais tempo até o vencimento." },
    { emoji: "🧾", titulo: "Pague-se primeiro", texto: "Trate a poupança como uma conta fixa: assim que o salário cair, transfira o valor da sua meta antes de gastar com qualquer outra coisa. Use a meta de poupança da Visão Geral para acompanhar." },
    { emoji: "🔍", titulo: "Corte o que não vê", texto: "Assinaturas esquecidas, taxas bancárias e delivery frequente drenam dinheiro sem dor. Uma vez por mês, abra o gráfico de categorias e pergunte: isso valeu o que custou?" },
    { emoji: "⛓️", titulo: "Dívidas caras primeiro", texto: "Se tiver dívidas, ataque primeiro as de juros mais altos (rotativo, cheque especial). Muitas vezes vale trocar por um crédito mais barato e negociar desconto para quitação à vista." },
  ];

  return (
    <div className="stack">
      <div className="card regra">
        <Donut partes={partes.map((p) => ({ valor: p.pct, cor: p.cor }))} centro="50·30·20" sub="da sua renda" />
        <div style={{ flex: 1, minWidth: 240 }}>
          <h3>Regra 50-30-20</h3>
          <p className="muted" style={{ fontSize: 14, margin: "6px 0 14px", lineHeight: 1.55 }}>
            Uma forma simples de dividir a renda líquida. Não é lei — é um ponto de partida. Se seu custo fixo passa de 50%, ajuste os desejos antes de mexer no futuro.
          </p>
          <div className="regra-grid">
            {partes.map((p) => (
              <div key={p.nome} className="regra-item">
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: p.cor }} />
                  <strong>{p.pct}% · {p.nome}</strong>
                </div>
                <div className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>{p.desc}</div>
                {renda > 0 && <div style={{ fontWeight: 700, marginTop: 6, color: C.mint }}>{brl((renda * p.pct) / 100)}</div>}
              </div>
            ))}
          </div>
          {renda > 0 && <div className="muted" style={{ fontSize: 12, marginTop: 10 }}>Valores calculados com sua receita de {labelYMLongo(mesSel)} ({brl(renda)}).</div>}
        </div>
      </div>
      <div className="grid-3">
        {dicas.map((d) => (
          <div className="card dica" key={d.titulo}>
            <div className="dica-emoji">{d.emoji}</div>
            <h3 style={{ marginTop: 12 }}>{d.titulo}</h3>
            <p style={{ fontSize: 13.5, color: C.muted, lineHeight: 1.6, marginTop: 8 }}>{d.texto}</p>
          </div>
        ))}
      </div>
      <p className="muted" style={{ fontSize: 12, textAlign: "center" }}>Conteúdo educativo e geral — não é recomendação de investimento.</p>
    </div>
  );
}

/* =========================================================
   APP
   ========================================================= */

const ABAS = [
  { id: "geral", label: "Início", icon: "home" },
  { id: "lancar", label: "Lançar", icon: "plus" },
  { id: "cartoes", label: "Cartões", icon: "card" },
  { id: "historico", label: "Histórico", icon: "list" },
  { id: "habitos", label: "Hábitos", icon: "flame" },
  { id: "dicas", label: "Dicas", icon: "bulb" },
];

export default function App({ usuario, inicial, onChange, onSair, statusSync }) {
  const [salvo] = useState(() => inicial || null);
  const [aba, setAba] = useState("geral");
  const [transacoes, setTransacoes] = useState(salvo?.transacoes ?? []);
  const [cartoes, setCartoes] = useState(salvo?.cartoes ?? []);
  const [compras, setCompras] = useState(salvo?.compras ?? []);
  const [meta, setMeta] = useState(salvo?.meta ?? 500);
  const [habitos, setHabitos] = useState(salvo?.habitos ?? []);
  const [checks, setChecks] = useState(salvo?.checks ?? {});
  const [mesSel, setMesSel] = useState(mesAtual());
  const [modoLancar, setModoLancar] = useState("receita");
  const [sinalLancar, setSinalLancar] = useState(0);
  const [toast, setToast] = useState(null);

  // persistência: entrega o estado para quem salva (banco do usuário logado)
  useEffect(() => {
    onChange?.({ transacoes, cartoes, compras, meta, habitos, checks: podarChecks(checks) });
  }, [transacoes, cartoes, compras, meta, habitos, checks]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  /* derivados — finanças */
  const parcelas = useMemo(
    () => compras.flatMap((c) => gerarParcelas(c, cartoes.find((k) => k.id === c.cardId))),
    [compras, cartoes]
  );

  const resumoMes = (key) => {
    let receitas = 0, gastosVista = 0;
    for (const t of transacoes) {
      if (t.data.slice(0, 7) !== key) continue;
      if (t.tipo === "receita") receitas += t.valor; else gastosVista += t.valor;
    }
    const parc = parcelas.reduce((s, p) => (p.mes === key ? s + p.valor : s), 0);
    const gastos = gastosVista + parc;
    return { receitas, gastosVista, parcelas: parc, gastos, saldo: receitas - gastos };
  };

  const usadoCartao = (cardId) => parcelas.reduce((s, p) => (p.cardId === cardId && p.mes >= mesSel ? s + p.valor : s), 0);

  const gastosCategoria = useMemo(() => {
    const mapa = {};
    transacoes.forEach((t) => {
      if (t.tipo === "gasto" && t.data.slice(0, 7) === mesSel) mapa[t.categoria] = (mapa[t.categoria] || 0) + t.valor;
    });
    parcelas.forEach((p) => {
      if (p.mes === mesSel) mapa[p.categoria] = (mapa[p.categoria] || 0) + p.valor;
    });
    return Object.entries(mapa).map(([categoria, valor]) => ({ categoria, valor })).sort((a, b) => b.valor - a.valor);
  }, [transacoes, parcelas, mesSel]);

  const futuros = useMemo(() => {
    const ultimoMes = parcelas.reduce((max, p) => (p.mes > max ? p.mes : max), mesSel);
    const lista = [];
    for (let i = 1; i <= 12; i++) {
      const k = addMonths(mesSel, i);
      if (k > ultimoMes) break;
      lista.push({ mes: k, valor: parcelas.reduce((s, p) => (p.mes === k ? s + p.valor : s), 0) });
    }
    return lista.slice(0, 6);
  }, [parcelas, mesSel]);

  const ultimas = useMemo(() => {
    const cc = compras.map((c) => ({
      id: c.id, tipo: "gasto", desc: `${c.desc}${c.parcelas > 1 ? ` (${c.parcelas}x)` : ""}`, valor: c.valor, categoria: c.categoria, data: c.data,
    }));
    return [...transacoes, ...cc].sort((a, b) => b.data.localeCompare(a.data)).slice(0, 6);
  }, [transacoes, compras]);

  /* derivados — hábitos (para o card do início) */
  const habHoje = useMemo(() => {
    const hoje = new Date();
    const iso = isoDe(hoje);
    const prog = habitos.filter((h) => programado(h, hoje));
    return {
      total: prog.length,
      feitos: prog.filter((h) => feito(checks, iso, h.id)).length,
      seq: sequencias(habitos, checks, hoje).atual,
    };
  }, [habitos, checks]);

  /* ações */
  const irPara = (id, modo) => {
    setAba(id);
    if (modo) { setModoLancar(modo); setSinalLancar((n) => n + 1); }
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const addTransacao = (t) => {
    setTransacoes((p) => [...p, t]);
    setToast(t.tipo === "receita" ? `Receita de ${brl(t.valor)} lançada ✓` : `Gasto de ${brl(t.valor)} lançado ✓`);
  };
  const addCompra = (c) => {
    setCompras((p) => [...p, c]);
    setToast(`Compra de ${brl(c.valor)} em ${c.parcelas}x registrada ✓`);
  };
  const addCartao = (c) => {
    setCartoes((p) => [...p, c]);
    setToast(`Cartão ${c.nome} adicionado ✓`);
  };
  const removerTransacao = (id) => setTransacoes((p) => p.filter((t) => t.id !== id));
  const removerCompra = (id) => {
    const c = compras.find((x) => x.id === id);
    if (c && !window.confirm(`Excluir a compra "${c.desc}" e todas as suas ${c.parcelas} parcela(s)?`)) return;
    setCompras((p) => p.filter((x) => x.id !== id));
  };
  const removerCartao = (id) => {
    const card = cartoes.find((c) => c.id === id);
    const n = compras.filter((c) => c.cardId === id).length;
    if (!window.confirm(`Excluir o cartão ${card?.nome}${n ? ` e as ${n} compra(s) lançadas nele` : ""}?`)) return;
    setCartoes((p) => p.filter((c) => c.id !== id));
    setCompras((p) => p.filter((c) => c.cardId !== id));
  };
  const toggleCheck = (iso, id) => {
    setChecks((prev) => {
      const lista = prev[iso] || [];
      return { ...prev, [iso]: lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id] };
    });
  };
  const salvarHabito = (h) => {
    setHabitos((p) => (p.some((x) => x.id === h.id) ? p.map((x) => (x.id === h.id ? h : x)) : [...p, h]));
    setToast(`${h.tipo === "hobby" ? "Hobby" : "Hábito"} "${h.nome}" salvo ✓`);
  };
  const removerHabito = (id) => {
    const h = habitos.find((x) => x.id === id);
    if (!window.confirm(`Excluir "${h?.nome}" e todo o histórico dele?`)) return;
    setHabitos((p) => p.filter((x) => x.id !== id));
    setChecks((prev) => {
      const out = {};
      Object.entries(prev).forEach(([k, v]) => { const f = v.filter((x) => x !== id); if (f.length) out[k] = f; });
      return out;
    });
  };
  const carregarHabitosExemplo = () => {
    setHabitos(habitosExemplo());
    setToast("Hábitos de exemplo adicionados");
  };
  const carregarExemplo = () => {
    const d = dadosExemplo();
    setTransacoes(d.transacoes); setCartoes(d.cartoes); setCompras(d.compras); setMeta(d.meta);
    if (!habitos.length) setHabitos(habitosExemplo());
    setToast("Dados de exemplo carregados");
  };
  const resetar = () => {
    if (!window.confirm("Apagar TODOS os dados salvos (finanças e hábitos)? Isso não pode ser desfeito.")) return;
    setTransacoes([]); setCartoes([]); setCompras([]); setMeta(500); setHabitos([]); setChecks({});
  };

  const vazio = transacoes.length === 0 && compras.length === 0;
  const saldoMes = resumoMes(mesSel).saldo;

  const ctx = {
    mesSel, transacoes, cartoes, compras, parcelas, meta, setMeta,
    resumoMes, usadoCartao, gastosCategoria, futuros, ultimas, irPara,
    addCartao, removerCartao, removerTransacao, removerCompra, carregarExemplo, vazio,
    habitos, checks, toggleCheck, salvarHabito, removerHabito, carregarHabitosExemplo, habHoje,
  };

  const titulos = {
    geral: ["Visão Geral", `Resumo de ${labelYMLongo(mesSel)}`],
    lancar: ["Lançar", "Registre receitas, gastos e compras no cartão"],
    cartoes: ["Cartões", "Limites, faturas e parcelas futuras"],
    historico: ["Histórico", `Movimentações de ${labelYMLongo(mesSel)}`],
    habitos: ["Hábitos & Hobbies", "Construa a versão consistente de você."],
    dicas: ["Dicas", "Guia rápido para organizar seu dinheiro"],
  };
  const mostraMes = ["geral", "cartoes", "historico"].includes(aba);

  return (
    <div className="fin-app">
      <style>{CSS}</style>
      <div className="bg-glow" />

      <aside className="sidebar">
        <div className="brand">
          <LogoF9 size={40} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: -0.3 }}>Finanças</div>
            <div className="muted" style={{ fontSize: 11.5 }}>dinheiro & rotina</div>
          </div>
        </div>
        <nav className="nav">
          {ABAS.map((a) => (
            <button key={a.id} className={`nav-btn ${aba === a.id ? "active" : ""}`} onClick={() => irPara(a.id)}>
              <Icon name={a.icon} size={19} />
              <span className="lbl">{a.label}</span>
            </button>
          ))}
        </nav>
        <div className="side-foot">
          <div className="side-saldo">
            <span className="muted" style={{ fontSize: 11.5 }}>Saldo de {labelYM(mesSel)}</span>
            <strong style={{ color: saldoMes >= 0 ? C.mint : C.red }}>{brl(saldoMes)}</strong>
          </div>
          {usuario && (
            <div className="conta-box">
              <div className="avatar">{(usuario.nome || usuario.email || "?").trim()[0].toUpperCase()}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="conta-nome">{usuario.nome || "Minha conta"}</div>
                <div className="conta-email">{usuario.email}</div>
              </div>
              <button className="icon-btn" onClick={onSair} title="Sair" aria-label="Sair"><Icon name="logout" size={16} /></button>
            </div>
          )}
          <div className="sync-line">
            <span className={`sync-dot ${statusSync || "ok"}`} />
            {statusSync === "salvando" ? "Salvando…" : statusSync === "erro" ? "Erro ao salvar — tentando de novo" : "Salvo na nuvem"}
          </div>
          <button className="btn-link" style={{ fontSize: 12, color: C.dim }} onClick={resetar}>Apagar todos os meus dados</button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <h1>{titulos[aba][0]}</h1>
            <p className="muted" style={{ fontSize: 14, marginTop: 2 }}>{titulos[aba][1]}</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {mostraMes && <SeletorMes value={mesSel} onChange={setMesSel} />}
            {usuario && (
              <button className="conta-mobile" onClick={onSair} title={`Sair de ${usuario.email}`}>
                <span className="avatar avatar-sm">{(usuario.nome || usuario.email || "?").trim()[0].toUpperCase()}</span>
                <Icon name="logout" size={15} />
              </button>
            )}
          </div>
        </header>

        {aba === "geral" && <VisaoGeral ctx={ctx} />}
        {aba === "lancar" && (
          <div className="grid-2">
            <FormVista modoInicial={modoLancar} sinal={sinalLancar} onAdd={addTransacao} />
            <FormCartao cartoes={cartoes} onAdd={addCompra} irCartoes={() => irPara("cartoes")} destacar={modoLancar === "cartao"} />
          </div>
        )}
        {aba === "cartoes" && <Cartoes ctx={ctx} />}
        {aba === "historico" && <Historico ctx={ctx} />}
        {aba === "habitos" && <Habitos ctx={ctx} />}
        {aba === "dicas" && <Dicas ctx={ctx} />}
      </main>

      {toast && <div className="toast"><Icon name="check" size={16} color={C.mint} /> {toast}</div>}
    </div>
  );
}

/* =========================================================
   ESTILOS — tema F9 (escuro, vidro, verde-menta)
   ========================================================= */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

.fin-app, .fin-app * { box-sizing: border-box; }
.fin-app {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background: linear-gradient(180deg, #04120d 0%, #020806 100%);
  color: ${C.text}; min-height: 100vh; color-scheme: dark; position: relative;
  -webkit-font-smoothing: antialiased;
}
.bg-glow {
  position: fixed; inset: 0; pointer-events: none; z-index: 0;
  background:
    radial-gradient(900px 500px at 15% -10%, rgba(16,185,129,.20), transparent 60%),
    radial-gradient(700px 500px at 100% 0%, rgba(6,95,70,.25), transparent 60%),
    radial-gradient(600px 400px at 60% 110%, rgba(110,231,183,.06), transparent 60%);
}
.fin-app h1 { font-size: 27px; font-weight: 800; letter-spacing: -0.7px; margin: 0; }
.fin-app h3 { font-size: 15.5px; font-weight: 700; letter-spacing: -0.2px; margin: 0; }
.fin-app p { margin: 0; }
.fin-app button { font-family: inherit; cursor: pointer; color: inherit; }
.fin-app option { background: #0a1a14; color: ${C.text}; }
.muted { color: ${C.muted}; }

/* sidebar */
.sidebar {
  position: fixed; inset: 0 auto 0 0; width: 240px; z-index: 30; overflow-y: auto;
  background: rgba(4,18,13,.72); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
  border-right: 1px solid ${C.line}; padding: 22px 14px; display: flex; flex-direction: column;
}
.brand { display: flex; gap: 11px; align-items: center; padding: 0 8px 24px; }
.nav { display: flex; flex-direction: column; gap: 4px; }
.nav-btn {
  display: flex; align-items: center; gap: 12px; border: 0; background: transparent;
  padding: 11px 12px; border-radius: 12px; color: ${C.muted} !important; font-size: 14px; font-weight: 500; text-align: left;
  transition: background .15s, color .15s;
}
.nav-btn:hover { background: rgba(255,255,255,.04); color: ${C.text} !important; }
.nav-btn.active {
  background: linear-gradient(135deg, rgba(110,231,183,.16), rgba(16,185,129,.06));
  color: ${C.mint} !important; font-weight: 600; box-shadow: inset 0 0 0 1px rgba(110,231,183,.18);
}
.side-foot { margin-top: auto; display: flex; flex-direction: column; gap: 10px; }
.side-saldo { background: rgba(255,255,255,.03); border: 1px solid ${C.line}; border-radius: 14px; padding: 12px; display: flex; flex-direction: column; gap: 3px; }

/* layout */
.main { position: relative; z-index: 1; margin-left: 240px; padding: 28px 32px 60px; max-width: 1420px; }
.topbar { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 22px; flex-wrap: wrap; }
.stack { display: flex; flex-direction: column; gap: 18px; }
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; align-items: start; }
.grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
.grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.grid-21 { display: grid; grid-template-columns: 1.7fr 1fr; gap: 18px; align-items: start; }
.grid-12 { display: grid; grid-template-columns: 360px 1fr; gap: 18px; }

.card {
  background: linear-gradient(180deg, rgba(255,255,255,.045), rgba(255,255,255,.02));
  border: 1px solid ${C.line}; border-radius: 22px; padding: 20px; min-width: 0;
  box-shadow: 0 1px 0 rgba(255,255,255,.04) inset, 0 10px 30px rgba(0,0,0,.25);
  backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
}
.card-destaque { border-color: rgba(110,231,183,.45); box-shadow: 0 0 0 1px rgba(110,231,183,.25), 0 0 30px rgba(16,185,129,.12); }
.card-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; gap: 10px; }
.banner { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap;
  background: linear-gradient(120deg, rgba(16,185,129,.16), rgba(255,255,255,.02) 60%); }

/* hero (saldo) */
.hero {
  padding: 24px; border-color: rgba(110,231,183,.28);
  background:
    radial-gradient(500px 220px at 0% 0%, rgba(110,231,183,.18), transparent 70%),
    linear-gradient(160deg, rgba(6,95,70,.55), rgba(2,44,34,.35) 55%, rgba(255,255,255,.02));
  box-shadow: 0 0 0 1px rgba(110,231,183,.06), 0 20px 60px rgba(16,185,129,.12), 0 1px 0 rgba(255,255,255,.08) inset;
}
.hero-valor { font-size: 44px; font-weight: 900; letter-spacing: -1.6px; margin-top: 4px; line-height: 1.05; }
.hero-subs { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 20px; }
.hero-sub { background: rgba(0,0,0,.25); border: 1px solid rgba(255,255,255,.06); border-radius: 18px; padding: 14px 16px; min-width: 0; }

.pill { display: inline-block; padding: 2px 8px; border-radius: 99px; font-weight: 600; font-size: 11.5px; }
.pill-ok { background: rgba(110,231,183,.14); color: ${C.mint}; }
.pill-bad { background: ${C.redSoft}; color: ${C.red}; }

.mini { display: flex; flex-direction: column; gap: 4px; padding: 16px; }
.mini span { font-size: 12.5px; }
.mini strong { font-size: 19px; font-weight: 800; letter-spacing: -0.3px; }

/* botões */
.btn {
  border: 0; background: linear-gradient(135deg, #6ee7b7, #10b981); color: #022c22 !important;
  padding: 11px 18px; border-radius: 13px; font-weight: 700; font-size: 14px;
  box-shadow: 0 8px 22px rgba(16,185,129,.28), 0 1px 0 rgba(255,255,255,.4) inset;
  transition: transform .1s, filter .15s;
}
.btn:hover { filter: brightness(1.06); }
.btn:active { transform: scale(.98); }
.btn-red { background: linear-gradient(135deg, #fda4af, #f43f5e); color: #3f0712 !important; box-shadow: 0 8px 22px rgba(244,63,94,.25); }
.btn-sm { padding: 8px 14px; font-size: 13px; }
.btn-full { width: 100%; }
.btn-ghost { background: rgba(110,231,183,.06); color: ${C.mint} !important; box-shadow: inset 0 0 0 1px rgba(110,231,183,.3); }
.btn-link { border: 0; background: none; color: ${C.mint} !important; font-weight: 600; font-size: 13px; padding: 4px; }
.icon-btn {
  border: 0; background: rgba(255,255,255,.05); color: ${C.muted} !important; width: 34px; height: 34px; border-radius: 10px;
  display: grid; place-items: center; flex-shrink: 0;
}
.icon-btn:hover { background: rgba(255,255,255,.09); color: ${C.text} !important; }
.icon-btn.ghost { background: transparent; }
.icon-btn.danger { background: transparent; color: ${C.dim} !important; }
.icon-btn.danger:hover { background: ${C.redSoft}; color: ${C.red} !important; }

/* seletor de mês */
.mes-sel { display: flex; align-items: center; gap: 6px; padding: 6px; border-radius: 16px;
  background: rgba(255,255,255,.04); border: 1px solid ${C.line}; }
.mes-sel select { border: 0; background: transparent; font: 600 14px Inter, sans-serif; color: ${C.text}; padding: 6px 4px; cursor: pointer; outline: none; }

/* cartões */
.cc-row { display: flex; gap: 14px; overflow-x: auto; padding-bottom: 6px; scroll-snap-type: x mandatory; }
.cc-row::-webkit-scrollbar { height: 6px; }
.cc-row::-webkit-scrollbar-thumb { background: rgba(255,255,255,.1); border-radius: 6px; }
.cc {
  position: relative; overflow: hidden; color: #fff; border-radius: 20px; padding: 18px 20px;
  box-shadow: 0 14px 34px rgba(0,0,0,.4), inset 0 0 0 1px rgba(255,255,255,.12); scroll-snap-align: start; flex-shrink: 0;
}
.cc-shine { position: absolute; width: 220px; height: 220px; border-radius: 50%; right: -80px; top: -110px; background: rgba(255,255,255,.1); pointer-events: none; }
.cartao-linha { display: flex; gap: 22px; align-items: flex-start; }
.mini-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 14px; }
.mini-stats div { background: rgba(255,255,255,.03); border: 1px solid ${C.line}; border-radius: 12px; padding: 10px; display: flex; flex-direction: column; gap: 2px; }
.mini-stats span { font-size: 11.5px; }
.mini-stats strong { font-size: 15px; }

/* ações rápidas */
.acoes { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.acao {
  border: 1px solid ${C.line}; background: rgba(255,255,255,.02); border-radius: 14px; padding: 12px 4px;
  display: flex; flex-direction: column; align-items: center; gap: 8px; font-size: 12px; font-weight: 600; color: ${C.text} !important;
  transition: border-color .15s, transform .1s, background .15s;
}
.acao:hover { border-color: rgba(110,231,183,.35); background: rgba(110,231,183,.05); transform: translateY(-1px); }
.acao-ic { width: 36px; height: 36px; border-radius: 11px; display: grid; place-items: center; flex-shrink: 0; }

.hab-mini { display: flex; align-items: center; gap: 14px; text-align: left; width: 100%; transition: border-color .15s; }
.hab-mini:hover { border-color: rgba(110,231,183,.35); }
.seq-badge { display: inline-flex; align-items: center; gap: 4px; padding: 5px 10px; border-radius: 99px; font-size: 12px; font-weight: 700;
  background: ${C.amberSoft}; color: ${C.amber}; border: 1px solid rgba(251,191,36,.25); }

/* meta */
.progress { height: 10px; background: ${C.track}; border-radius: 99px; overflow: hidden; margin-top: 10px; }
.progress div { height: 100%; border-radius: 99px; transition: width .5s; background: linear-gradient(90deg, #10b981, #6ee7b7); box-shadow: 0 0 12px rgba(110,231,183,.45); }
.range { width: 100%; margin: 14px 0 10px; accent-color: ${C.mint2}; }

/* alertas */
.alerta-box { background: ${C.amberSoft}; border: 1px solid rgba(251,191,36,.25); color: #fde68a; padding: 12px; border-radius: 14px; font-size: 13.5px; line-height: 1.5; }
.fut-row { display: flex; align-items: center; gap: 10px; padding: 5px 0; }
.fut-bar { flex: 1; height: 8px; background: ${C.track}; border-radius: 99px; overflow: hidden; }
.fut-bar div { height: 100%; border-radius: 99px; }

/* listas */
.lista { display: flex; flex-direction: column; }
.linha { display: flex; align-items: center; gap: 12px; padding: 10px 4px; border-bottom: 1px solid ${C.line}; }
.linha:last-child { border-bottom: 0; }
.linha-ic { width: 42px; height: 42px; border-radius: 50%; display: grid; place-items: center; font-size: 19px; flex-shrink: 0; }

/* formulários */
.form-grid { display: flex; flex-direction: column; gap: 14px; }
.form-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.form-3 { display: grid; grid-template-columns: 1.2fr 1fr 1.2fr; gap: 12px; }
.campo { display: flex; flex-direction: column; gap: 6px; min-width: 0; flex: 1; }
.campo-label { font-size: 12.5px; font-weight: 600; color: ${C.muted}; }
.campo-dica { font-size: 11.5px; color: ${C.dim}; }
.input {
  width: 100%; border: 1px solid rgba(255,255,255,.08); background: rgba(0,0,0,.25); border-radius: 12px; padding: 11px 12px;
  font: 500 14px Inter, sans-serif; color: ${C.text}; outline: none; transition: border-color .15s, box-shadow .15s;
}
.input::placeholder { color: ${C.dim}; }
.input:focus { border-color: rgba(110,231,183,.55); box-shadow: 0 0 0 3px rgba(110,231,183,.12); }
.input-sm { padding: 7px 10px; width: 120px; }
.toggle { display: inline-flex; background: rgba(0,0,0,.3); padding: 4px; border-radius: 13px; gap: 4px; margin-bottom: 16px; border: 1px solid ${C.line}; }
.toggle button { border: 0; background: transparent; padding: 8px 16px; border-radius: 10px; font-weight: 600; font-size: 13.5px; color: ${C.muted} !important; }
.toggle button.on { background: rgba(255,255,255,.08); color: ${C.text} !important; box-shadow: inset 0 0 0 1px rgba(255,255,255,.06); }
.toggle-sm { margin-bottom: 0; }
.toggle-sm button { padding: 6px 10px; font-size: 12px; }
.cat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(104px, 1fr)); gap: 8px; }
.cat-chip {
  border: 1px solid rgba(255,255,255,.07); background: rgba(255,255,255,.02); border-radius: 13px; padding: 9px 6px;
  display: flex; flex-direction: column; align-items: center; gap: 3px; font-size: 12px; font-weight: 500; color: ${C.muted} !important;
  transition: all .15s;
}
.cat-chip:hover { border-color: rgba(110,231,183,.3); }
.cat-chip.on { border-color: ${C.mint2}; background: rgba(110,231,183,.1); color: ${C.mint} !important; font-weight: 600; }
.card-pick { display: flex; gap: 8px; flex-wrap: wrap; }
.card-pick-btn { display: flex; align-items: center; gap: 8px; border: 1px solid rgba(255,255,255,.08); background: rgba(255,255,255,.02); border-radius: 11px; padding: 8px 12px; font-size: 13px; font-weight: 600; }
.card-pick-btn.on { border-color: ${C.mint2}; background: rgba(110,231,183,.1); }
.preview { margin-top: 16px; background: rgba(110,231,183,.05); border: 1px dashed rgba(110,231,183,.3); border-radius: 14px; padding: 14px; }
.chips-meses { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
.chips-meses span { background: rgba(255,255,255,.04); border: 1px solid ${C.line}; border-radius: 99px; padding: 3px 9px; font-size: 11.5px; font-weight: 600; color: ${C.muted}; }
.erro { margin-top: 12px; background: ${C.redSoft}; color: ${C.red}; padding: 10px 12px; border-radius: 11px; font-size: 13px; font-weight: 500; }
.swatch { width: 28px; height: 28px; border-radius: 9px; border: 2px solid #06120d; outline-offset: 1px; }
.swatch-sm { width: 24px; height: 24px; border-radius: 50%; }
.color-input { width: 36px; height: 30px; border: 0; padding: 0; background: none; cursor: pointer; }

/* hábitos */
.hab-stat { display: flex; flex-direction: column; gap: 10px; padding: 18px 20px; }
.hab-stat-l { display: flex; align-items: center; gap: 7px; font-size: 13.5px; font-weight: 500; }
.hab-num { font-size: 38px; font-weight: 900; letter-spacing: -1.2px; line-height: 1; }
.semana { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; }
.dia-pill {
  border: 1px solid ${C.line}; background: rgba(255,255,255,.02); border-radius: 22px; padding: 10px 0 8px;
  display: flex; flex-direction: column; align-items: center; gap: 2px; transition: all .15s;
}
.dia-pill:hover { border-color: rgba(110,231,183,.3); }
.dia-pill.hoje { border-color: rgba(110,231,183,.45); }
.dia-pill.sel { background: linear-gradient(160deg, #6ee7b7, #10b981); border-color: transparent; box-shadow: 0 10px 24px rgba(16,185,129,.3); }
.dia-pill.sel .dia-l, .dia-pill.sel .dia-n { color: #022c22; }
.dia-l { font-size: 11px; font-weight: 600; color: ${C.muted}; }
.dia-n { font-size: 17px; font-weight: 800; color: ${C.text}; }
.dia-dot { width: 6px; height: 6px; border-radius: 50%; margin-top: 3px; background: transparent; }
.dia-dot.full { background: ${C.mint}; box-shadow: 0 0 8px ${C.mint}; }
.dia-dot.part { background: ${C.amber}; }
.dia-dot.miss { background: rgba(251,113,133,.6); }
.dia-pill.sel .dia-dot.full, .dia-pill.sel .dia-dot.part, .dia-pill.sel .dia-dot.miss { background: #022c22; box-shadow: none; }

.hab-item { background: rgba(0,0,0,.2); border: 1px solid ${C.line}; border-radius: 20px; padding: 14px 16px; transition: border-color .2s; }
.hab-item.ok { border-color: rgba(110,231,183,.22); }
.hab-emoji { width: 46px; height: 46px; border-radius: 50%; display: grid; place-items: center; font-size: 21px; flex-shrink: 0; }
.hab-emoji-big { width: 62px; height: 62px; border-radius: 18px; display: grid; place-items: center; font-size: 28px; flex-shrink: 0; }
.tag { font-weight: 600; }
.tag.habito { color: ${C.amber}; }
.tag.hobby { color: ${C.violet}; }
.check-btn {
  width: 46px; height: 46px; border-radius: 50%; border: 1.5px solid rgba(255,255,255,.14); background: transparent;
  display: grid; place-items: center; color: rgba(255,255,255,.25) !important; transition: all .18s; flex-shrink: 0;
}
.check-btn:hover:not(:disabled) { border-color: ${C.mint}; color: ${C.mint} !important; }
.check-btn:disabled { opacity: .35; cursor: not-allowed; }
.check-btn.on { box-shadow: 0 0 16px rgba(110,231,183,.25); }
.hab-barras { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; margin-top: 12px; }
.hab-barra-wrap { display: flex; flex-direction: column; align-items: center; gap: 4px; font-size: 10px; font-weight: 600; }
.hab-barra { width: 100%; height: 7px; border-radius: 99px; transition: background .2s; }
.hab-barra.off { height: 3px; margin: 2px 0; opacity: .6; }

.analise { background: linear-gradient(160deg, rgba(16,185,129,.12), rgba(255,255,255,.02)); }
.analise-lista { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 10px; }
.analise-lista li { font-size: 13.5px; line-height: 1.5; color: ${C.text}; opacity: .9; }

.por-dia { display: flex; flex-direction: column; gap: 6px; }
.por-dia-row { display: flex; align-items: center; gap: 12px; border: 1px solid transparent; background: rgba(255,255,255,.02); border-radius: 12px; padding: 8px 10px; text-align: left; }
.por-dia-row:hover { border-color: ${C.line}; }
.por-dia-row.sel { border-color: rgba(110,231,183,.35); background: rgba(110,231,183,.06); }
.por-dia-nome { width: 34px; font-size: 12.5px; font-weight: 700; color: ${C.muted}; }
.por-dia-itens { display: flex; flex-wrap: wrap; gap: 5px; flex: 1; }
.mini-chip { width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center; font-size: 14px; }

.emoji-grid { display: grid; grid-template-columns: repeat(10, 1fr); gap: 6px; }
.emoji-btn { border: 1px solid transparent; background: rgba(255,255,255,.03); border-radius: 10px; aspect-ratio: 1; font-size: 18px; display: grid; place-items: center; }
.emoji-btn.on { border-color: ${C.mint2}; background: rgba(110,231,183,.12); }
.dias-pick { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; }
.dia-chip { border: 1px solid rgba(255,255,255,.08); background: rgba(255,255,255,.02); border-radius: 11px; padding: 9px 0; font-size: 12.5px; font-weight: 600; color: ${C.muted} !important; }
.dia-chip.on { background: linear-gradient(160deg, #6ee7b7, #10b981); color: #022c22 !important; border-color: transparent; }
.preset { border: 1px solid ${C.line}; background: transparent; border-radius: 99px; padding: 4px 10px; font-size: 11.5px; font-weight: 600; color: ${C.muted} !important; }
.preset:hover { color: ${C.mint} !important; border-color: rgba(110,231,183,.3); }

.modal-bg { position: fixed; inset: 0; z-index: 60; background: rgba(1,8,6,.7); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
  display: grid; place-items: center; padding: 16px; animation: fade .18s ease-out; }
.modal { width: 100%; max-width: 480px; max-height: 92vh; overflow-y: auto; background: linear-gradient(180deg, #0b1f18, #06120d); }
@keyframes fade { from { opacity: 0; } to { opacity: 1; } }

/* dicas */
.regra { display: flex; gap: 28px; align-items: center; flex-wrap: wrap; }
.regra-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.regra-item { background: rgba(255,255,255,.03); border: 1px solid ${C.line}; border-radius: 14px; padding: 12px; font-size: 13.5px; }
.dica-emoji { width: 46px; height: 46px; border-radius: 14px; background: rgba(110,231,183,.1); display: grid; place-items: center; font-size: 22px; }

/* toast */
.toast {
  position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); z-index: 70;
  width: max-content; max-width: calc(100vw - 32px);
  background: rgba(6,18,13,.95); border: 1px solid rgba(110,231,183,.3); color: ${C.text}; padding: 12px 18px; border-radius: 14px;
  font-size: 14px; font-weight: 500; display: flex; align-items: center; gap: 8px; box-shadow: 0 12px 30px rgba(0,0,0,.5);
  animation: subir .25s ease-out;
}
@keyframes subir { from { opacity: 0; transform: translate(-50%, 10px); } to { opacity: 1; transform: translate(-50%, 0); } }

/* campo de valor */
.valor-wrap { position: relative; display: flex; align-items: center; }
.valor-prefixo { position: absolute; left: 12px; font-size: 14px; font-weight: 600; color: ${C.dim}; pointer-events: none; }
.valor-input { padding-left: 40px !important; font-variant-numeric: tabular-nums; font-weight: 600 !important; }
.valor-sm { width: 150px; }
.valor-sm .valor-input { padding-top: 7px; padding-bottom: 7px; }

/* conta */
.conta-box { display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 14px; background: rgba(255,255,255,.03); border: 1px solid ${C.line}; }
.avatar { width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center; font-weight: 800; font-size: 14px; flex-shrink: 0;
  background: linear-gradient(135deg, #6ee7b7, #10b981); color: #022c22; }
.avatar-sm { width: 26px; height: 26px; font-size: 12px; }
.conta-nome { font-size: 13px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.conta-email { font-size: 11px; color: ${C.dim}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sync-line { display: flex; align-items: center; gap: 7px; font-size: 11.5px; color: ${C.dim}; padding: 0 4px; }
.sync-dot { width: 7px; height: 7px; border-radius: 50%; background: ${C.mint}; box-shadow: 0 0 6px ${C.mint}; }
.sync-dot.salvando { background: ${C.amber}; box-shadow: 0 0 6px ${C.amber}; }
.sync-dot.erro { background: ${C.red}; box-shadow: 0 0 6px ${C.red}; }
.conta-mobile { display: none; align-items: center; gap: 6px; border: 1px solid ${C.line}; background: rgba(255,255,255,.04); border-radius: 99px; padding: 4px 10px 4px 4px; color: ${C.muted} !important; }

/* responsivo */
@media (max-width: 1180px) {
  .grid-12 { grid-template-columns: 1fr; }
  .cartao-linha { flex-direction: column; }
  .cartao-linha > .cc { width: 100%; max-width: 360px; }
}
@media (max-width: 980px) {
  .grid-21, .grid-2, .grid-3 { grid-template-columns: 1fr; }
  .grid-4 { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 760px) {
  .sidebar { inset: auto 0 0 0; width: 100%; height: 70px; padding: 6px 4px; flex-direction: row; border-right: 0; border-top: 1px solid ${C.line}; background: rgba(3,12,9,.94); }
  .brand, .side-foot { display: none; }
  .conta-mobile { display: inline-flex; }
  .sidebar { overflow: visible; }
  .input, .valor-input, .mes-sel select { font-size: 16px !important; } /* evita o zoom automático do iPhone ao tocar no campo */
  .topbar { align-items: flex-start; }
  .nav { flex-direction: row; width: 100%; justify-content: space-around; }
  .nav-btn { flex-direction: column; gap: 3px; padding: 7px 6px; font-size: 10.5px; }
  .nav-btn.active { box-shadow: none; background: transparent; }
  .main { margin-left: 0; padding: 18px 14px 100px; }
  .fin-app h1 { font-size: 23px; }
  .hero-valor { font-size: 36px; }
  .hero-subs { grid-template-columns: 1fr; }
  .form-3, .regra-grid, .mini-stats { grid-template-columns: 1fr; }
  .acoes { grid-template-columns: repeat(2, 1fr); }
  .semana { gap: 5px; }
  .grid-3.hab-stats { grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .hab-stat { padding: 12px; gap: 6px; border-radius: 18px; }
  .hab-stat-l { font-size: 11px; }
  .hab-num { font-size: 28px; }
  .hide-sm { display: none; }
  .dia-n { font-size: 15px; }
  .emoji-grid { grid-template-columns: repeat(7, 1fr); }
  .toast { bottom: 86px; }
}
`;

export { C, CSS, Icon, LogoF9, STORAGE_KEY, carregarEstado };
