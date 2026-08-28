import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus, ChevronRight, ArrowLeft, Play, Check, X, Pencil,
  Trash2, History as HistoryIcon, Trophy, Users, Loader2, AlertTriangle, RefreshCw,
  Download, Upload, CloudOff, Link2
} from "lucide-react";

/* ---------------------------------- tokens ---------------------------------- */
const STYLE = `
.gf-root{
  --bg:#E6E5EA; --surface:#FFFFFF; --surface-2:#F1EFF9; --line:#E3E1EE;
  --ink:#211F2E; --ink-dim:#6E6B80; --purple:#6C4FD1; --purple-deep:#4B2FAE; --blue:#3E63D9;
  background:var(--bg); color:var(--ink); min-height:100%;
  font-family:'Inter',ui-sans-serif,system-ui,-apple-system,sans-serif;
}
.gf-display{ font-family:'Sora',ui-sans-serif,system-ui,-apple-system,sans-serif; font-weight:700; }
.gf-mono{ font-family:'JetBrains Mono',ui-monospace,'SF Mono',Menlo,monospace; }
.gf-shell{ max-width:480px; margin:0 auto; min-height:100vh; display:flex; flex-direction:column; }
.gf-topbar{ position:sticky; top:0; z-index:20; background:var(--purple-deep); box-shadow:0 2px 10px rgba(75,47,174,0.25); }
.gf-wordmark{ color:#fff; }
.gf-plate{ border-radius:9999px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.gf-card{ background:var(--surface); border:1px solid var(--line); border-radius:14px; }
.gf-btn-primary{ background:var(--purple); color:#fff; font-weight:600; border-radius:12px; }
.gf-btn-primary:disabled{ opacity:0.45; }
.gf-btn-outline{ background:#fff; border:1px solid var(--line); color:var(--ink); border-radius:12px; }
.gf-input{ background:var(--surface-2); border:1px solid var(--line); color:var(--ink); border-radius:10px; }
.gf-input:focus{ outline:none; border-color:var(--purple); }
.gf-input::placeholder{ color:#A6A3B5; }
.gf-backdrop{ position:fixed; inset:0; background:rgba(33,31,46,0.45); z-index:40; display:flex; align-items:flex-end; justify-content:center; }
.gf-sheet{ background:var(--surface); border-top-left-radius:20px; border-top-right-radius:20px; border:1px solid var(--line);
  width:100%; max-width:480px; max-height:88vh; overflow-y:auto; animation:gf-up 0.18s ease-out; }
@keyframes gf-up{ from{ transform:translateY(16px); opacity:0.6;} to{ transform:translateY(0); opacity:1;} }
.gf-record{ background:rgba(62,99,217,0.08); border:1px solid var(--blue); color:var(--blue); }
.gf-dot{ width:6px; height:6px; border-radius:9999px; background:var(--line); }
.gf-dot.active{ background:var(--purple); width:16px; border-radius:9999px; }
.gf-scroll::-webkit-scrollbar{ display:none; }
`;

/* ---------------------------------- categorias ---------------------------------- */
const CATS = [
  { key: "peito", label: "Peito", abbr: "PT", color: "#6C4FD1" },
  { key: "costas", label: "Costas", abbr: "CS", color: "#3E63D9" },
  { key: "ombro", label: "Ombro", abbr: "OM", color: "#8B7BC7" },
  { key: "biceps", label: "Bíceps", abbr: "BI", color: "#375FC4" },
  { key: "triceps", label: "Tríceps", abbr: "TR", color: "#5B4FA6" },
  { key: "perna", label: "Perna", abbr: "PR", color: "#4B2FAE" },
  { key: "gluteo", label: "Glúteo", abbr: "GL", color: "#6C4FD1" },
  { key: "abdomen", label: "Abdômen", abbr: "AB", color: "#6E6B80" },
  { key: "lombar", label: "Lombar", abbr: "LB", color: "#8A8798" },
  { key: "cardio", label: "Cardio", abbr: "CD", color: "#3E63D9" },
  { key: "geral", label: "Geral", abbr: "GR", color: "#9A97A8" },
];
const catInfo = (key) => CATS.find((c) => c.key === key) || CATS[CATS.length - 1];
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const parseNum = (s) => {
  if (!s) return null;
  const m = String(s).replace(",", ".").match(/(\d+(\.\d+)?)/);
  return m ? parseFloat(m[1]) : null;
};
const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });

/* ---------------------------------- seed: Luara (6 dias) ---------------------------------- */
const SEED_WORKOUTS_LUARA = [
  { name: "Dia 1 — Superior A", exercises: [
    { name: "Supino Reto", category: "peito", sets: 3, repsMin: 8, repsMax: 10, rir: "1 a 2", load: "9 kg", rest: "90 seg", refNote: "Costas 100% apoiadas no banco — zero envolvimento lombar" },
    { name: "Remada Baixa", category: "costas", sets: 3, repsMin: 10, repsMax: 12, rir: "1 a 2", load: "26,1 kg", rest: "90 seg", refNote: "Tronco ereto e fixo; puxe com as costas, não com a lombar" },
    { name: "Desenvolvimento sentada", category: "ombro", sets: 3, repsMin: 10, repsMax: 12, rir: "1 a 2", load: "6 kg", rest: "90 seg", refNote: "O encosto sustenta a lombar — evite em pé com carga alta" },
    { name: "Puxada Alta Pulley", category: "costas", sets: 3, repsMin: 10, repsMax: 12, rir: "1", load: "32 kg", rest: "90 seg", refNote: "Amplitude completa, sem balançar o tronco" },
    { name: "Elevação Lateral", category: "ombro", sets: 3, repsMin: 12, repsMax: 15, rir: "1", load: "4 kg", rest: "Sem pausa", refNote: "Super-série com Rosca Direta", supersetGroup: "l-d1-5", supersetLabel: "Bi-set" },
    { name: "Rosca Direta", category: "biceps", sets: 3, repsMin: 10, repsMax: 12, rir: "1", load: "5kg", rest: "60 seg", refNote: "Cotovelos fixos ao lado do corpo", supersetGroup: "l-d1-5", supersetLabel: "Bi-set" },
    { name: "Tríceps Corda", category: "triceps", sets: 3, repsMin: 12, repsMax: 15, rir: "1", load: "7,9 kg a +1", rest: "60 seg", refNote: "Mantenha o abdômen levemente contraído durante o movimento" },
  ]},
  { name: "Dia 2 — Inferior A", exercises: [
    { name: "Leg Press 45°", category: "perna", sets: 4, repsMin: 8, repsMax: 12, rir: "1 a 2", load: "40kg", rest: "90 a 120 seg", refNote: "Prioridade nº1 de perna — apoio total das costas, sem compressão axial na coluna" },
    { name: "Cadeira Extensora", category: "perna", sets: 3, repsMin: 10, repsMax: 12, rir: "1 a 2", load: "41kg", rest: "90 seg", refNote: "Troca o Hack Squat, como combinado — apoio total das costas, sem compressão axial" },
    { name: "Leg Press Unilateral", category: "perna", sets: 3, repsMin: 8, repsMax: 10, rir: "2", load: "45kg", rest: "90 seg", refNote: "Por perna. Substitui a Passada no Lugar — apoio total das costas, sem exigir equilíbrio em pé" },
    { name: "Elevação Pélvica", category: "gluteo", sets: 3, repsMin: 10, repsMax: 12, rir: "1 a 2", load: "2,5kg", rest: "90 seg", refNote: "Excelente para glúteo com baixíssimo estresse lombar — pode ser priorizado" },
    { name: "Cadeira Abdutora", category: "gluteo", sets: 3, repsMin: 12, repsMax: 15, rir: "1", load: "45kg", rest: "60 seg", refNote: "Trabalha estabilidade de quadril, relevante para o padrão de dança" },
    { name: "Panturrilha na Leg Press", category: "perna", sets: 3, repsMin: 12, repsMax: 15, rir: "1", load: "77kg", rest: "60 seg", refNote: "Evita a extensão forçada da lombar que a panturrilha em pé com barra pode gerar" },
  ]},
  { name: "Dia 3 — Core + Cardio", exercises: [
    { name: "Curl-up Modificado (McGill)", category: "abdomen", sets: 3, repsMin: 15, repsMax: 20, rir: "", load: "Peso do corpo", rest: "Sem pausa", refNote: "Cada repetição inclui hold de 8 a 10s. Evite fazer como 1º exercício antes de treino pesado de perna" },
    { name: "Prancha Lateral", category: "abdomen", sets: 3, repsMin: 40, repsMax: 50, rir: "", load: "—", rest: "Sem pausa", refNote: "Medido em segundos por lado, não repetições. Alinhamento reto da cabeça aos pés" },
    { name: "Bird Dog Movimentado", category: "lombar", sets: 3, repsMin: 12, repsMax: 15, rir: "", load: "Por lado", rest: "Sem pausa", refNote: "Por lado. Movimento lento; lombar neutra o tempo todo" },
    { name: "Pallof Press", category: "abdomen", sets: 3, repsMin: 10, repsMax: 12, rir: "", load: "Por lado", rest: "60 seg", refNote: "Por lado. Resista à rotação do tronco — não gire" },
    { name: "Mobilidade de Quadril (90/90)", category: "geral", sets: 1, repsMin: 8, repsMax: 10, rir: "", load: "—", rest: "—", refNote: "Duração em minutos, não repetições. Evite amplitude extrema de lombar" },
    { name: "Escada", category: "cardio", sets: 1, repsMin: 30, repsMax: 45, rir: "", load: "6-7", rest: "—", refNote: "Duração em minutos. Ritmo moderado e constante" },
  ]},
  { name: "Dia 4 — Superior B", exercises: [
    { name: "Supino Inclinado 30°", category: "peito", sets: 3, repsMin: 8, repsMax: 10, rir: "1 a 2", load: "8kg", rest: "90 seg", refNote: "Ênfase em peito superior; banco dá suporte total às costas" },
    { name: "Remada Unilateral Apoiada", category: "costas", sets: 3, repsMin: 10, repsMax: 12, rir: "1 a 2", load: "10kg", rest: "90 seg", refNote: "O apoio do tronco no banco tira toda a carga da lombar" },
    { name: "Elevação Lateral", category: "ombro", sets: 3, repsMin: 12, repsMax: 15, rir: "1", load: "4kg", rest: "60 seg", refNote: "Controle a descida, sem usar embalo" },
    { name: "Barra Fixa Assistida", category: "costas", sets: 3, repsMin: 10, repsMax: 12, rir: "1", load: "23kg", rest: "90 seg", refNote: "Ajuste a assistência para manter a faixa de reps" },
    { name: "Rosca Alternada", category: "biceps", sets: 3, repsMin: 10, repsMax: 12, rir: "1", load: "5kg", rest: "Sem pausa", refNote: "Super-série com Tríceps Corda", supersetGroup: "l-d4-5", supersetLabel: "Bi-set" },
    { name: "Tríceps Corda", category: "triceps", sets: 3, repsMin: 12, repsMax: 15, rir: "1", load: "7,9kg / 11,25kg", rest: "60 seg", refNote: "Fecha a super-série", supersetGroup: "l-d4-5", supersetLabel: "Bi-set" },
    { name: "Face Pull", category: "ombro", sets: 2, repsMin: 15, repsMax: 15, rir: "1 a 2", load: "30kg / 21,25kg", rest: "60 seg", refNote: "Saúde do ombro — relevante pelo histórico de dança/mobilidade" },
  ]},
  { name: "Dia 5 — Inferior B", exercises: [
    { name: "Mesa Flexora", category: "perna", sets: 3, repsMin: 10, repsMax: 12, rir: "1 a 2", load: "23kg", rest: "90 seg", refNote: "Contração completa no topo, sem tranco" },
    { name: "Cadeira Flexora", category: "perna", sets: 3, repsMin: 10, repsMax: 12, rir: "1 a 2", load: "+20,5kg", rest: "90 seg", refNote: "Substitui o Stiff — sem exigência de dobradiça de quadril sob carga" },
    { name: "Cadeira Adutora", category: "gluteo", sets: 3, repsMin: 12, repsMax: 15, rir: "1", load: "34,5kg", rest: "60 seg", refNote: "Estabilidade de quadril" },
    { name: "Glúteo Máquina", category: "gluteo", sets: 3, repsMin: 12, repsMax: 15, rir: "1", load: "23kg", rest: "60 seg", refNote: "Substitui o Coice na Polia, que gerou dor" },
    { name: "Ponte de Glúteo Unilateral", category: "gluteo", sets: 3, repsMin: 10, repsMax: 12, rir: "1 a 2", load: "15kg", rest: "60 seg", refNote: "Por perna. Boa opção de baixo impacto para glúteo" },
    { name: "Panturrilha Sentada", category: "perna", sets: 3, repsMin: 12, repsMax: 15, rir: "1", load: "15kg", rest: "45 seg", refNote: "Fecha o dia com baixo estresse articular" },
  ]},
  { name: "Dia 6 — Pump + Core (opcional)", exercises: [
    { name: "Elevação Pélvica", category: "gluteo", sets: 3, repsMin: 12, repsMax: 15, rir: "2", load: "Zero", rest: "60 seg", refNote: "Volume extra de glúteo — não é dia de força" },
    { name: "Elevação Lateral", category: "ombro", sets: 3, repsMin: 15, repsMax: 15, rir: "2", load: "3kg", rest: "45 seg", refNote: "Foco em bombear o ombro, sem buscar carga alta" },
    { name: "Abdutora + Adutora", category: "gluteo", sets: 3, repsMin: 15, repsMax: 15, rir: "1 a 2", load: "38kg / 34,5kg", rest: "45 seg", refNote: "Circuito leve para a região de maior interesse estético" },
    { name: "Abd Bola + Dead bug", category: "abdomen", sets: 3, repsMin: 12, repsMax: 15, rir: "", load: "Zero", rest: "Sem pausa", refNote: "Repete o Big 3 de McGill — reforço, não substitui o Dia 3" },
    { name: "Escada", category: "cardio", sets: 1, repsMin: 15, repsMax: 20, rir: "", load: "5-6", rest: "—", refNote: "Duração em minutos. Recuperação ativa" },
  ]},
];

/* ---------------------------------- seed: Guilherme (5 dias) ---------------------------------- */
const SEED_WORKOUTS_GUILHERME = [
  { name: "Dia 1 — Força: Superior", exercises: [
    { name: "Supino Reto (Barra)", category: "peito", sets: 4, repsMin: 4, repsMax: 5, rir: "2", load: "30 kg", rest: "180 seg", refNote: "(Foco: Força) Base do dia; priorize técnica antes de subir carga" },
    { name: "Remada Curvada (Barra)", category: "costas", sets: 4, repsMin: 4, repsMax: 5, rir: "2", load: "25 kg", rest: "180 seg", refNote: "(Foco: Força) Equilibra o volume de empurrar com puxar no mesmo dia" },
    { name: "Desenvolvimento Militar (Barra/Halteres)", category: "ombro", sets: 3, repsMin: 5, repsMax: 6, rir: "2", load: "7,5 kg", rest: "150 seg", refNote: "(Foco: Força) Sentado se sentir instabilidade lombar" },
    { name: "Barra Fixa ou Puxada Supinada", category: "costas", sets: 3, repsMin: 5, repsMax: 6, rir: "2", load: "73+ kg", rest: "150 seg", refNote: "(Foco: Força) Use lastro/assistência para manter a faixa de reps" },
    { name: "Rosca Direta (Barra W)", category: "biceps", sets: 2, repsMin: 8, repsMax: 8, rir: "2", load: "36 kg", rest: "Sem pausa", refNote: "(Foco: Acessório) Super-série com Tríceps Testa", supersetGroup: "g-d1-5", supersetLabel: "Bi-set" },
    { name: "Tríceps Testa (Halteres)", category: "triceps", sets: 2, repsMin: 8, repsMax: 8, rir: "2", load: "14 kg", rest: "90 seg", refNote: "(Foco: Acessório) Cotovelos fixos, sem dor no ombro", supersetGroup: "g-d1-5", supersetLabel: "Bi-set" },
  ]},
  { name: "Dia 2 — Força: Inferior", exercises: [
    { name: "Agachamento Livre ou Leg Press 45°", category: "perna", sets: 4, repsMin: 4, repsMax: 5, rir: "2", load: "30kg", rest: "180 a 210 seg", refNote: "(Foco: Força) Priorize ROM completo antes de perseguir carga" },
    { name: "Levantamento Terra Romeno (Stiff)", category: "perna", sets: 3, repsMin: 5, repsMax: 6, rir: "2", load: "25kg", rest: "150 seg", refNote: "(Foco: Força) Quadril para trás, joelho quase estendido" },
    { name: "Afundo Búlgaro (Halteres)", category: "perna", sets: 3, repsMin: 6, repsMax: 8, rir: "2", load: "14kg", rest: "120 seg", refNote: "(Foco: Força/Unilateral) Por perna. Corrige assimetrias entre pernas" },
    { name: "Panturrilha em Pé", category: "perna", sets: 4, repsMin: 8, repsMax: 10, rir: "1", load: "70kg", rest: "60 seg", refNote: "(Foco: Acessório) Pausa de 1 seg no alongamento" },
    { name: "Prancha com Sobrecarga", category: "abdomen", sets: 3, repsMin: 30, repsMax: 45, rir: "", load: "Peso do corpo (adicione carga quando dominar o tempo)", rest: "60 seg", refNote: "(Foco: Core) Medido em segundos, não repetições. Adicione peso nas costas quando dominar o tempo" },
  ]},
  { name: "Dia 3 — Condicionamento + Core", exercises: [
    { name: "Aquecimento articular + mobilidade de quadril/ombro", category: "geral", sets: 1, repsMin: 5, repsMax: 8, rir: "", load: "—", rest: "—", refNote: "(Foco: Mobilidade) Duração em minutos. Dia de recuperação ativa entre os dois dias pesados" },
    { name: "Bike ou Remo — Intervalado (HIIT)", category: "cardio", sets: 1, repsMin: 8, repsMax: 10, rir: "", load: "30s forte / 90s leve por rodada", rest: "Conforme o bloco", refNote: "(Foco: Condicionamento) 8 a 10 rodadas. Intensidade alta real no bloco forte, não RIR" },
    { name: "Prancha Lateral", category: "abdomen", sets: 3, repsMin: 30, repsMax: 40, rir: "", load: "Peso do corpo", rest: "Sem pausa", refNote: "(Foco: Core) Por lado, em segundos.", supersetGroup: "g-d3-3", supersetLabel: "Circuito" },
    { name: "Dead Bug", category: "lombar", sets: 3, repsMin: 10, repsMax: 12, rir: "", load: "Peso do corpo", rest: "Sem pausa", refNote: "(Foco: Core) Por lado. Controle lombar, sem arquear", supersetGroup: "g-d3-3", supersetLabel: "Circuito" },
    { name: "Pallof Press", category: "abdomen", sets: 3, repsMin: 10, repsMax: 12, rir: "", load: "Cabo/elástico", rest: "60 seg", refNote: "(Foco: Core/Anti-rotação) Fecha o circuito de core", supersetGroup: "g-d3-3", supersetLabel: "Circuito" },
    { name: "Caminhada inclinada ou bike leve (LISS)", category: "cardio", sets: 1, repsMin: 15, repsMax: 20, rir: "", load: "—", rest: "—", refNote: "(Foco: Cardio leve) Duração em minutos. Opcional, conforme tempo e recuperação" },
  ]},
  { name: "Dia 4 — Hipertrofia: Superior", exercises: [
    { name: "Supino Inclinado (Halteres)", category: "peito", sets: 3, repsMin: 8, repsMax: 10, rir: "1 a 2", load: "", rest: "90 seg", refNote: "(Foco: Hipertrofia) Amplitude completa, descida controlada" },
    { name: "Remada Baixa (Cabo/Pulley)", category: "costas", sets: 3, repsMin: 10, repsMax: 12, rir: "1 a 2", load: "", rest: "90 seg", refNote: "(Foco: Hipertrofia) Foco na retração escapular" },
    { name: "Desenvolvimento (Halteres, sentado)", category: "ombro", sets: 3, repsMin: 10, repsMax: 12, rir: "1", load: "", rest: "90 seg", refNote: "(Foco: Hipertrofia) Preserva a articulação do ombro" },
    { name: "Puxada Alta Pegada Aberta", category: "costas", sets: 3, repsMin: 10, repsMax: 12, rir: "1", load: "", rest: "90 seg", refNote: "(Foco: Hipertrofia) Máximo alongamento sob tensão no topo" },
    { name: "Elevação Lateral", category: "ombro", sets: 3, repsMin: 12, repsMax: 15, rir: "1", load: "", rest: "Sem pausa", refNote: "(Foco: Isolador) Super-série com Tríceps Corda", supersetGroup: "g-d4-5", supersetLabel: "Bi-set" },
    { name: "Tríceps Corda", category: "triceps", sets: 3, repsMin: 12, repsMax: 15, rir: "1", load: "", rest: "60 seg", refNote: "(Foco: Isolador) Cotovelo junto ao corpo", supersetGroup: "g-d4-5", supersetLabel: "Bi-set" },
    { name: "Face Pull ou Remada Alta", category: "ombro", sets: 2, repsMin: 15, repsMax: 15, rir: "1 a 2", load: "", rest: "60 seg", refNote: "(Foco: Saúde do ombro) Prevenção — mantém equilíbrio anterior/posterior" },
    { name: "Flexão de Braço", category: "peito", sets: 2, repsMin: 8, repsMax: 12, rir: "2", load: "Peso do corpo", rest: "60 seg", refNote: "(Foco: Volume/Core) Repita até RIR 2 (2 reps de reserva), pare antes da falha, não até esgotar" },
  ]},
  { name: "Dia 5 — Hipertrofia: Inferior", exercises: [
    { name: "Leg Press 45° (variando posição dos pés)", category: "perna", sets: 3, repsMin: 10, repsMax: 12, rir: "1 a 2", load: "", rest: "90 seg", refNote: "(Foco: Hipertrofia) Alterne foco quadríceps/glúteo por semana" },
    { name: "Cadeira Extensora", category: "perna", sets: 3, repsMin: 10, repsMax: 12, rir: "1 (última série 0)", load: "", rest: "90 seg", refNote: "(Foco: Hipertrofia) Só a última série vai à falha total" },
    { name: "Mesa ou Cadeira Flexora", category: "perna", sets: 3, repsMin: 10, repsMax: 12, rir: "1", load: "", rest: "90 seg", refNote: "(Foco: Hipertrofia) Contração máxima no pico" },
    { name: "Cadeira Abdutora/Adutora", category: "gluteo", sets: 2, repsMin: 12, repsMax: 15, rir: "1", load: "", rest: "60 seg", refNote: "(Foco: Hipertrofia/Estabilidade) Relevante para estabilidade de quadril em campo" },
    { name: "Panturrilha Sentado", category: "perna", sets: 3, repsMin: 12, repsMax: 15, rir: "0 a 1", load: "", rest: "45 seg", refNote: "(Foco: Acessório) Séries curtas, foco na densidade" },
    { name: "Abdominal Infra", category: "abdomen", sets: 3, repsMin: 15, repsMax: 20, rir: "1", load: "Peso do corpo", rest: "Sem pausa", refNote: "(Foco: Core) Super-série com Prancha Abdominal", supersetGroup: "g-d5-6", supersetLabel: "Bi-set" },
    { name: "Prancha Abdominal", category: "abdomen", sets: 3, repsMin: 30, repsMax: 60, rir: "", load: "Peso do corpo", rest: "60 seg", refNote: "(Foco: Core) Tempo máximo sustentado, medido em segundos. Foco no controle lombar", supersetGroup: "g-d5-6", supersetLabel: "Bi-set" },
  ]},
];

/* ---------------------------------- storage (localStorage do navegador) ---------------------------------- */
// localStorage é síncrono e local ao dispositivo: sem round-trip de rede, então sem retries,
// sem heurística de "essa mensagem de erro quer dizer chave inexistente" e sem leitura de
// confirmação depois de gravar. Só falha de verdade em casos raros (aba anônima com storage
// bloqueado, quota cheia) — nesses casos sGet/sSet retornam null/false e o app cai para os
// dados padrão em memória, sem travar o uso.
function sGet(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? null : JSON.parse(raw);
  } catch (e) {
    console.error(`[GaiaFit] Falha ao ler "${key}" do localStorage`, e);
    return null;
  }
}
function sSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error(`[GaiaFit] Falha ao gravar "${key}" no localStorage`, e);
    return false;
  }
}
function buildWorkouts(seedList, profileId) {
  return seedList.map((w, wi) => ({
    id: `${profileId}-w${wi}`,
    name: w.name,
    exercises: w.exercises.map((e, ei) => ({ id: `${profileId}-w${wi}-e${ei}`, ...e })),
    createdAt: new Date().toISOString(),
  }));
}

// Histórico de sessões da migração (28/08/2026): recria o contador "feito Nx" e "última vez"
// que existia no artifact antigo do claude.ai, já que o site novo começa com armazenamento
// vazio em cada aparelho. Datas/cargas são as informadas pela usuária no momento da migração
// (a carga de cada sessão fica igual à carga de referência atual do exercício — não temos o
// histórico exato de progressão, só o estado mais recente).
const LUARA_SESSION_HISTORY = [
  { dayIndex: 0, dates: ["2026-08-19", "2026-08-28"] }, // Dia 1 — Superior A: 2x (contador da usuária, não do artifact antigo)
  { dayIndex: 1, dates: ["2026-08-16", "2026-08-25"] }, // Dia 2 — Inferior A: 2x, última vez 25/08/26
  { dayIndex: 2, dates: ["2026-08-17", "2026-08-26"] }, // Dia 3 — Core + Cardio: 2x, última vez 26/08/26
  { dayIndex: 3, dates: ["2026-08-18", "2026-08-28"] }, // Dia 4 — Superior B: 2x, última vez 28/08/26 (hoje foi a 2ª vez)
  { dayIndex: 4, dates: ["2026-08-21"] }, // Dia 5 — Inferior B: 1x, última vez 21/08/26
  { dayIndex: 5, dates: ["2026-08-22"] }, // Dia 6 — Pump + Core: 1x, última vez 22/08/26
];
const GUILHERME_SESSION_HISTORY = [
  { dayIndex: 1, dates: ["2026-08-18"] }, // Dia 2 — Força: Inferior: 1x, última vez 18/08/26
];
// IDs de sessão histórica são baseados na DATA, não na posição no array — assim continuam estáveis
// mesmo que uma data seja removida/adicionada em versões futuras do histórico (ver migração abaixo).
// `uid()` (sessões reais, ver finishSession) nunca produz esse formato, então não há colisão.
const HIST_ID_MARK = "-hist-";
function buildSeedSessions(seedList, profileId, history) {
  const workouts = buildWorkouts(seedList, profileId);
  return history.flatMap(({ dayIndex, dates }) => {
    const w = workouts[dayIndex];
    return dates.map((date) => ({
      id: `${profileId}-w${dayIndex}${HIST_ID_MARK}${date}`,
      workoutId: w.id,
      workoutName: w.name,
      date: new Date(`${date}T12:00:00`).toISOString(),
      entries: w.exercises.map((ex) => ({ exerciseId: ex.id, name: ex.name, loadUsed: ex.load, repsUsed: "" })),
    }));
  });
}

// Sobe sempre que SEED_WORKOUTS_LUARA/GUILHERME ou *_SESSION_HISTORY mudarem de verdade. Aparelhos
// que já tinham sido seedados (perfil já existe) recebem os treinos/títulos atualizados; o histórico
// de sessões é reconciliado por completo a cada versão (sessões históricas obsoletas são removidas,
// as que faltam são adicionadas) — mas qualquer sessão real (id sem HIST_ID_MARK, sempre gerado por
// uid()) nunca é tocada.
const SEED_VERSION = 3;
function migrateDefaultProfileSeed(id, seedList, history) {
  const verKey = `gaiafit:seedVersion:${id}`;
  if ((sGet(verKey) || 0) >= SEED_VERSION) return;

  sSet(`gaiafit:workouts:${id}`, buildWorkouts(seedList, id));

  const correctSeedSessions = buildSeedSessions(seedList, id, history);
  const correctIds = new Set(correctSeedSessions.map((s) => s.id));
  const existing = sGet(`gaiafit:sessions:${id}`) || [];
  // "-hist" (sem o traço final) cobre também o formato antigo (hist0/hist1...) de versões
  // anteriores da migração, além do formato atual (hist-AAAA-MM-DD) — uid() nunca gera essa
  // substring, então sessões reais nunca são classificadas como histórico por engano.
  const kept = existing.filter((s) => !s.id.includes("-hist") || correctIds.has(s.id));
  const keptIds = new Set(kept.map((s) => s.id));
  const missing = correctSeedSessions.filter((s) => !keptIds.has(s.id));
  sSet(`gaiafit:sessions:${id}`, [...kept, ...missing]);

  sSet(verKey, SEED_VERSION);
}

/* ---------------------------------- small UI bits ---------------------------------- */
function PlateIcon({ category, size = 44, fontSize = 13 }) {
  const c = catInfo(category);
  return (
    <div className="gf-plate" style={{ width: size, height: size, background: `${c.color}1F`, border: `1.5px solid ${c.color}` }}>
      <span className="gf-mono" style={{ color: c.color, fontSize, fontWeight: 700 }}>{c.abbr}</span>
    </div>
  );
}

const CAT_AVATAR = "data:image/png;base64,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";

function CatMascot({ height = 76 }) {
  return (
    <img
      src={CAT_AVATAR}
      alt="Gato do GaiaFit"
      style={{ height, width: "auto", display: "block", flexShrink: 0 }}
    />
  );
}

function ErrorScreen({ message, detail, onRetry }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 py-16 text-center">
      <div className="gf-plate mb-4" style={{ width: 60, height: 60, background: "#3E63D91F", border: "1.5px solid var(--blue)" }}>
        <AlertTriangle size={26} color="var(--blue)" />
      </div>
      <p className="text-sm mb-2" style={{ color: "var(--ink-dim)" }}>{message}</p>
      {detail && (
        <p className="text-xs gf-mono mb-5 px-3 py-2 rounded-lg" style={{ color: "var(--purple-deep)", background: "var(--surface-2)", wordBreak: "break-word" }}>
          {detail}
        </p>
      )}
      <button className="gf-btn-primary px-6 py-3 flex items-center gap-2" onClick={onRetry}>
        <RefreshCw size={16} /> Tentar novamente
      </button>
    </div>
  );
}

function ConfirmModal({ title, message, confirmLabel = "Excluir", onConfirm, onCancel }) {
  return (
    <div className="gf-backdrop" onClick={onCancel}>
      <div className="gf-sheet p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="gf-display text-2xl mb-1">{title}</h3>
        <p className="text-sm mb-5" style={{ color: "var(--ink-dim)" }}>{message}</p>
        <div className="flex gap-3">
          <button className="gf-btn-outline flex-1 py-3" onClick={onCancel}>Cancelar</button>
          <button className="flex-1 py-3 rounded-xl font-semibold" style={{ background: "var(--purple-deep)", color: "#fff" }} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- mini gráfico (sem libs externas) ---------------------------------- */
function MiniLineChart({ data }) {
  const w = 320, h = 120, pad = 20;
  const vals = data.map((d) => d.value);
  const min = Math.min(...vals), max = Math.max(...vals);
  const range = max - min || 1;
  const stepX = data.length > 1 ? (w - pad * 2) / (data.length - 1) : 0;
  const pts = data.map((d, i) => {
    const x = pad + i * stepX;
    const y = h - pad - ((d.value - min) / range) * (h - pad * 2);
    return { x, y, ...d };
  });
  const line = pts.map((p) => `${p.x},${p.y}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none">
      <polyline points={line} fill="none" stroke="var(--purple)" strokeWidth="2.5" />
      {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="var(--purple)" />)}
    </svg>
  );
}

/* ---------------------------------- exercise form ---------------------------------- */
function ExerciseForm({ initial, onSave, onClose }) {
  const [f, setF] = useState(
    initial || { name: "", category: "geral", sets: 3, repsMin: 10, repsMax: 12, rir: "", load: "", rest: "60 seg", refNote: "" }
  );
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const canSave = f.name.trim().length > 0;
  return (
    <div className="gf-backdrop" onClick={onClose}>
      <div className="gf-sheet p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="gf-display text-2xl">{initial ? "Editar exercício" : "Novo exercício"}</h3>
          <button onClick={onClose}><X size={22} color="var(--ink-dim)" /></button>
        </div>

        <label className="text-xs" style={{ color: "var(--ink-dim)" }}>Nome do exercício</label>
        <input className="gf-input w-full px-3 py-2.5 mt-1 mb-3" placeholder="Ex.: Supino Reto"
          value={f.name} onChange={(e) => set("name", e.target.value)} />

        <label className="text-xs" style={{ color: "var(--ink-dim)" }}>Grupo muscular</label>
        <p className="text-xs mb-2" style={{ color: "var(--ink-dim)" }}>Define o ícone do exercício.</p>
        <div className="flex flex-wrap gap-2 mt-1 mb-3">
          {CATS.map((c) => (
            <button key={c.key} onClick={() => set("category", c.key)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs"
              style={{ border: `1px solid ${f.category === c.key ? c.color : "var(--line)"}`,
                background: f.category === c.key ? `${c.color}14` : "transparent",
                color: f.category === c.key ? c.color : "var(--ink-dim)" }}>
              <PlateIcon category={c.key} size={18} fontSize={8} />{c.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          <div>
            <label className="text-xs" style={{ color: "var(--ink-dim)" }}>Séries</label>
            <input type="number" min="1" className="gf-input w-full px-2 py-2.5 mt-1 gf-mono"
              value={f.sets} onChange={(e) => set("sets", e.target.value)} />
          </div>
          <div>
            <label className="text-xs" style={{ color: "var(--ink-dim)" }}>Reps mín.</label>
            <input type="number" min="1" className="gf-input w-full px-2 py-2.5 mt-1 gf-mono"
              value={f.repsMin} onChange={(e) => set("repsMin", e.target.value)} />
          </div>
          <div>
            <label className="text-xs" style={{ color: "var(--ink-dim)" }}>Reps máx.</label>
            <input type="number" min="1" className="gf-input w-full px-2 py-2.5 mt-1 gf-mono"
              value={f.repsMax} onChange={(e) => set("repsMax", e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <label className="text-xs" style={{ color: "var(--ink-dim)" }}>RIR (opcional)</label>
            <input className="gf-input w-full px-3 py-2.5 mt-1" placeholder="Ex.: 1 a 2"
              value={f.rir} onChange={(e) => set("rir", e.target.value)} />
          </div>
          <div>
            <label className="text-xs" style={{ color: "var(--ink-dim)" }}>Descanso</label>
            <input className="gf-input w-full px-3 py-2.5 mt-1" placeholder="Ex.: 90 seg"
              value={f.rest} onChange={(e) => set("rest", e.target.value)} />
          </div>
        </div>

        <label className="text-xs" style={{ color: "var(--ink-dim)" }}>Carga de referência</label>
        <input className="gf-input w-full px-3 py-2.5 mt-1 mb-3" placeholder="Ex.: 8 a 10 kg cada mão, ou 25,5 kg"
          value={f.load} onChange={(e) => set("load", e.target.value)} />

        <label className="text-xs" style={{ color: "var(--ink-dim)" }}>Nota (opcional)</label>
        <textarea className="gf-input w-full px-3 py-2.5 mt-1 mb-4" rows={2}
          placeholder="Ex.: observação técnica, referência de máquina..."
          value={f.refNote} onChange={(e) => set("refNote", e.target.value)} />

        <button disabled={!canSave} className="gf-btn-primary w-full py-3" onClick={() => canSave && onSave(f)}>
          Salvar exercício
        </button>
      </div>
    </div>
  );
}

function WorkoutForm({ initial, onSave, onClose }) {
  const [name, setName] = useState(initial?.name || "");
  return (
    <div className="gf-backdrop" onClick={onClose}>
      <div className="gf-sheet p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="gf-display text-2xl">{initial ? "Editar treino" : "Novo treino"}</h3>
          <button onClick={onClose}><X size={22} color="var(--ink-dim)" /></button>
        </div>
        <label className="text-xs" style={{ color: "var(--ink-dim)" }}>Nome do treino</label>
        <input className="gf-input w-full px-3 py-2.5 mt-1 mb-4" placeholder="Ex.: Dia 7 — Full Body"
          value={name} onChange={(e) => setName(e.target.value)} />
        <button disabled={!name.trim()} className="gf-btn-primary w-full py-3" onClick={() => onSave({ name: name.trim() })}>
          Salvar treino
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------- session mode ---------------------------------- */
function SessionMode({ workout, onFinish, onExit }) {
  const [idx, setIdx] = useState(0);
  const [logs, setLogs] = useState(() =>
    Object.fromEntries(workout.exercises.map((ex) => [ex.id, { load: ex.load, reps: "" }]))
  );
  const [done, setDone] = useState(false);
  const [prs, setPrs] = useState([]);
  const ex = workout.exercises[idx];
  const c = catInfo(ex.category);

  const updateLog = (k, v) => setLogs((p) => ({ ...p, [ex.id]: { ...p[ex.id], [k]: v } }));
  const finish = () => onFinish(logs, (prList) => { setPrs(prList); setDone(true); });

  if (done) {
    return (
      <div className="gf-root fixed inset-0 z-50 flex flex-col overflow-y-auto">
        <AppHeader />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="gf-plate mb-5" style={{ width: 84, height: 84, background: "var(--purple)" }}>
            <Check size={38} color="#fff" />
          </div>
          <h2 className="gf-display text-4xl mb-2">Treino concluído</h2>
          <p style={{ color: "var(--ink-dim)" }} className="mb-4">Cargas e repetições atualizadas no seu treino.</p>
          {prs.length > 0 && (
            <div className="gf-record rounded-xl px-4 py-3 mb-5 text-sm text-left w-full max-w-sm">
              <div className="flex items-center gap-2 font-semibold mb-1"><Trophy size={16} /> Novo recorde</div>
              {prs.map((p) => <div key={p}>{p}</div>)}
            </div>
          )}
          <button className="gf-btn-primary px-8 py-3" onClick={onExit}>Voltar ao treino</button>
        </div>
      </div>
    );
  }

  return (
    <div className="gf-root fixed inset-0 z-50 flex flex-col overflow-y-auto">
      <AppHeader right={
        <button onClick={onExit} className="flex items-center justify-center rounded-full" style={{ width: 32, height: 32, background: "rgba(255,255,255,0.14)" }}>
          <X size={18} color="#fff" />
        </button>
      } />
      <div className="flex items-center justify-center mb-2">
        <span className="gf-mono text-xs" style={{ color: "var(--ink-dim)" }}>
          EXERCÍCIO {idx + 1} DE {workout.exercises.length}
        </span>
      </div>
      <div className="flex gap-1.5 justify-center mb-4">
        {workout.exercises.map((_, i) => <div key={i} className={`gf-dot ${i === idx ? "active" : ""}`} />)}
      </div>

      <div className="flex-1 flex flex-col items-center px-6 overflow-y-auto gf-scroll">
        <PlateIcon category={ex.category} size={72} fontSize={20} />
        <h2 className="gf-display text-3xl text-center mt-4 mb-1">{ex.name}</h2>
        <p className="text-sm mb-6" style={{ color: c.color }}>{catInfo(ex.category).label}</p>

        <div className="gf-card w-full p-4 mb-4 flex justify-around text-center">
          <div>
            <div className="gf-mono text-xl">{ex.sets}×</div>
            <div className="text-xs" style={{ color: "var(--ink-dim)" }}>séries</div>
          </div>
          <div>
            <div className="gf-mono text-xl">{ex.repsMin}–{ex.repsMax}</div>
            <div className="text-xs" style={{ color: "var(--ink-dim)" }}>reps</div>
          </div>
          {ex.rir && (
            <div>
              <div className="gf-mono text-xl">{ex.rir}</div>
              <div className="text-xs" style={{ color: "var(--ink-dim)" }}>RIR</div>
            </div>
          )}
          <div>
            <div className="gf-mono text-xl">{ex.rest}</div>
            <div className="text-xs" style={{ color: "var(--ink-dim)" }}>descanso</div>
          </div>
        </div>

        {ex.refNote && <p className="text-xs text-center mb-4" style={{ color: "var(--ink-dim)" }}>{ex.refNote}</p>}

        <div className="w-full mb-3">
          <label className="text-xs" style={{ color: "var(--ink-dim)" }}>Carga usada hoje</label>
          <input className="gf-input w-full px-3 py-3 mt-1 gf-mono text-lg" placeholder="Ex.: 10 kg"
            value={logs[ex.id]?.load || ""} onChange={(e) => updateLog("load", e.target.value)} />
        </div>
        <div className="w-full mb-4">
          <label className="text-xs" style={{ color: "var(--ink-dim)" }}>Repetições feitas (opcional)</label>
          <input className="gf-input w-full px-3 py-3 mt-1 gf-mono" placeholder="Ex.: 10, 9, 8"
            value={logs[ex.id]?.reps || ""} onChange={(e) => updateLog("reps", e.target.value)} />
        </div>
      </div>

      <div className="p-4 flex gap-3">
        {idx > 0 && <button className="gf-btn-outline px-5 py-3" onClick={() => setIdx((i) => i - 1)}>Anterior</button>}
        {idx < workout.exercises.length - 1 ? (
          <button className="gf-btn-primary flex-1 py-3" onClick={() => setIdx((i) => i + 1)}>Concluir e próximo</button>
        ) : (
          <button className="gf-btn-primary flex-1 py-3" onClick={finish}>Finalizar treino</button>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------- history ---------------------------------- */
function HistoryView({ workout, sessions, onBack, onDeleteSession }) {
  const wSessions = sessions.filter((s) => s.workoutId === workout.id).sort((a, b) => new Date(b.date) - new Date(a.date));
  const [selExId, setSelExId] = useState(workout.exercises[0]?.id);
  const [delSession, setDelSession] = useState(null);
  const chartData = wSessions
    .slice().reverse()
    .map((s) => {
      const entry = s.entries.find((e) => e.exerciseId === selExId);
      const val = entry ? parseNum(entry.loadUsed) : null;
      return { label: fmtDate(s.date), value: val };
    })
    .filter((d) => d.value !== null);
  const delta = chartData.length >= 2 ? chartData[chartData.length - 1].value - chartData[0].value : null;

  return (
    <div className="px-4 pb-8">
      <button className="flex items-center gap-1 py-4 text-sm" style={{ color: "var(--ink-dim)" }} onClick={onBack}>
        <ArrowLeft size={16} /> Voltar
      </button>
      <h2 className="gf-display text-3xl mb-1">{workout.name}</h2>
      <p className="text-sm mb-5" style={{ color: "var(--ink-dim)" }}>
        Feito {wSessions.length} {wSessions.length === 1 ? "vez" : "vezes"}
      </p>

      <div className="gf-card p-4 mb-5">
        <label className="text-xs" style={{ color: "var(--ink-dim)" }}>Evolução de carga</label>
        <select className="gf-input w-full px-3 py-2 mt-1 mb-3" value={selExId} onChange={(e) => setSelExId(e.target.value)}>
          {workout.exercises.map((ex) => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
        </select>
        {chartData.length >= 2 ? (
          <>
            <MiniLineChart data={chartData} />
            <div className="flex justify-between text-xs mt-2 gf-mono" style={{ color: "var(--ink-dim)" }}>
              <span>{chartData[0].label}: {chartData[0].value}</span>
              <span style={{ color: delta > 0 ? "var(--purple)" : "var(--ink-dim)" }}>
                {delta > 0 ? "+" : ""}{delta} desde o início
              </span>
              <span>{chartData[chartData.length - 1].label}: {chartData[chartData.length - 1].value}</span>
            </div>
          </>
        ) : (
          <p className="text-xs" style={{ color: "var(--ink-dim)" }}>
            Registre esse exercício em pelo menos 2 treinos para ver a evolução.
          </p>
        )}
      </div>

      <label className="text-xs" style={{ color: "var(--ink-dim)" }}>Sessões anteriores</label>
      <div className="flex flex-col gap-2 mt-2">
        {wSessions.length === 0 && <p className="text-sm" style={{ color: "var(--ink-dim)" }}>Nenhuma sessão registrada ainda.</p>}
        {wSessions.map((s) => (
          <div key={s.id} className="gf-card p-3">
            <div className="flex items-center justify-between mb-1.5">
              <div className="gf-mono text-sm">{fmtDate(s.date)}</div>
              <button onClick={() => setDelSession(s)}><Trash2 size={14} color="var(--ink-dim)" /></button>
            </div>
            <div className="flex flex-col gap-1">
              {s.entries.map((e) => (
                <div key={e.exerciseId} className="flex justify-between text-xs gap-3">
                  <span style={{ color: "var(--ink-dim)" }} className="truncate">{e.name}</span>
                  <span className="gf-mono flex-shrink-0">{e.loadUsed || "—"}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {delSession && (
        <ConfirmModal title="Excluir sessão" message={`Remover o registro de ${fmtDate(delSession.date)} deste treino? Essa ação não pode ser desfeita.`}
          onConfirm={() => { onDeleteSession(delSession.id); setDelSession(null); }} onCancel={() => setDelSession(null)} />
      )}
    </div>
  );
}

function groupExercises(exercises) {
  const blocks = [];
  let i = 0;
  while (i < exercises.length) {
    const ex = exercises[i];
    if (ex.supersetGroup) {
      const group = [ex];
      let j = i + 1;
      while (j < exercises.length && exercises[j].supersetGroup === ex.supersetGroup) {
        group.push(exercises[j]); j++;
      }
      blocks.push({ type: "group", label: ex.supersetLabel || "Bi-set", items: group });
      i = j;
    } else {
      blocks.push({ type: "single", ex });
      i++;
    }
  }
  return blocks;
}

/* ---------------------------------- workout detail ---------------------------------- */
function WorkoutDetail({ workout, sessions, onBack, onStart, onSaveWorkout, onDeleteWorkout, onHistory }) {
  const [showExForm, setShowExForm] = useState(false);
  const [editEx, setEditEx] = useState(null);
  const [delEx, setDelEx] = useState(null);
  const [editWorkout, setEditWorkout] = useState(false);
  const [delWorkout, setDelWorkout] = useState(false);
  const count = sessions.filter((s) => s.workoutId === workout.id).length;
  const last = sessions.filter((s) => s.workoutId === workout.id).sort((a, b) => new Date(b.date) - new Date(a.date))[0];

  const saveExercise = (data) => {
    let exercises;
    if (editEx) exercises = workout.exercises.map((e) => (e.id === editEx.id ? { ...editEx, ...data } : e));
    else exercises = [...workout.exercises, { id: uid(), ...data }];
    onSaveWorkout({ ...workout, exercises });
    setShowExForm(false); setEditEx(null);
  };
  const removeExercise = () => {
    onSaveWorkout({ ...workout, exercises: workout.exercises.filter((e) => e.id !== delEx.id) });
    setDelEx(null);
  };

  return (
    <div className="px-4 pb-24">
      <button className="flex items-center gap-1 py-4 text-sm" style={{ color: "var(--ink-dim)" }} onClick={onBack}>
        <ArrowLeft size={16} /> Voltar
      </button>

      <div className="flex items-start justify-between mb-1">
        <h2 className="gf-display text-3xl">{workout.name}</h2>
        <button onClick={() => setEditWorkout(true)}><Pencil size={16} color="var(--ink-dim)" /></button>
      </div>
      <p className="text-xs mb-5 gf-mono" style={{ color: "var(--ink-dim)" }}>
        {count} {count === 1 ? "vez feito" : "vezes feito"}{last ? ` · última vez ${fmtDate(last.date)}` : ""}
      </p>

      <div className="flex gap-3 mb-6">
        <button className="gf-btn-primary flex-1 py-3 flex items-center justify-center gap-2"
          disabled={workout.exercises.length === 0} onClick={onStart}>
          <Play size={16} /> Iniciar treino
        </button>
        <button className="gf-btn-outline px-4 py-3" onClick={onHistory}><HistoryIcon size={18} /></button>
        <button className="gf-btn-outline px-4 py-3" onClick={() => setDelWorkout(true)}><Trash2 size={18} color="var(--purple-deep)" /></button>
      </div>

      <div className="flex flex-col gap-2">
        {groupExercises(workout.exercises).map((block, bi) =>
          block.type === "single" ? (
            <div key={block.ex.id} className="gf-card p-3 flex items-center gap-3">
              <PlateIcon category={block.ex.category} />
              <div className="flex-1 min-w-0" onClick={() => { setEditEx(block.ex); setShowExForm(true); }}>
                <div className="text-sm font-medium truncate">{block.ex.name}</div>
                <div className="text-xs gf-mono mt-0.5 truncate" style={{ color: "var(--ink-dim)" }}>
                  {block.ex.sets}× {block.ex.repsMin} a {block.ex.repsMax}{block.ex.rir ? ` · RIR ${block.ex.rir}` : ""}{block.ex.load ? ` · ${block.ex.load}` : ""}
                </div>
              </div>
              <button onClick={() => setDelEx(block.ex)}><Trash2 size={16} color="var(--ink-dim)" /></button>
            </div>
          ) : (
            <div key={`group-${bi}`} className="rounded-2xl overflow-hidden" style={{ border: "1.5px solid var(--purple)" }}>
              <div className="px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5" style={{ background: "var(--purple)", color: "#fff" }}>
                <Link2 size={12} /> {block.label} · sem descanso entre eles
              </div>
              <div style={{ background: "var(--surface)" }}>
                {block.items.map((ex, idx) => (
                  <div key={ex.id} className="p-3 flex items-center gap-3"
                    style={{ borderBottom: idx < block.items.length - 1 ? "1px solid var(--line)" : "none" }}>
                    <PlateIcon category={ex.category} />
                    <div className="flex-1 min-w-0" onClick={() => { setEditEx(ex); setShowExForm(true); }}>
                      <div className="text-sm font-medium truncate">{ex.name}</div>
                      <div className="text-xs gf-mono mt-0.5 truncate" style={{ color: "var(--ink-dim)" }}>
                        {ex.sets}× {ex.repsMin} a {ex.repsMax}{ex.rir ? ` · RIR ${ex.rir}` : ""}{ex.load ? ` · ${ex.load}` : ""}
                      </div>
                    </div>
                    <button onClick={() => setDelEx(ex)}><Trash2 size={16} color="var(--ink-dim)" /></button>
                  </div>
                ))}
              </div>
            </div>
          )
        )}
        {workout.exercises.length === 0 && (
          <p className="text-sm text-center py-6" style={{ color: "var(--ink-dim)" }}>Nenhum exercício ainda. Adicione o primeiro abaixo.</p>
        )}
      </div>

      <button className="gf-btn-outline w-full py-3 mt-4 flex items-center justify-center gap-2"
        onClick={() => { setEditEx(null); setShowExForm(true); }}>
        <Plus size={16} /> Adicionar exercício
      </button>

      {showExForm && <ExerciseForm initial={editEx} onSave={saveExercise} onClose={() => { setShowExForm(false); setEditEx(null); }} />}
      {delEx && <ConfirmModal title="Excluir exercício" message={`Remover "${delEx.name}" deste treino?`} onConfirm={removeExercise} onCancel={() => setDelEx(null)} />}
      {editWorkout && (
        <WorkoutForm initial={workout}
          onSave={(data) => { onSaveWorkout({ ...workout, ...data }); setEditWorkout(false); }}
          onClose={() => setEditWorkout(false)} />
      )}
      {delWorkout && (
        <ConfirmModal title="Excluir treino" message={`Excluir "${workout.name}" e todo o seu histórico?`}
          onConfirm={() => onDeleteWorkout(workout.id)} onCancel={() => setDelWorkout(false)} />
      )}
    </div>
  );
}

/* ---------------------------------- dashboard ---------------------------------- */
function getTodaysSuggestion(workouts, sessions) {
  if (!workouts || workouts.length === 0) return null;
  const sorted = [...sessions].sort((a, b) => new Date(b.date) - new Date(a.date));
  const last = sorted[0];
  if (!last) return workouts[0].id; // nunca treinou ainda: sugere o primeiro
  if (new Date(last.date).toDateString() === new Date().toDateString()) return null; // já treinou hoje
  const idx = workouts.findIndex((w) => w.id === last.workoutId);
  if (idx === -1) return workouts[0].id;
  return workouts[(idx + 1) % workouts.length].id;
}

function Dashboard({ profile, workouts, sessions, onOpen, onNew }) {
  const [showForm, setShowForm] = useState(false);
  const suggestionId = getTodaysSuggestion(workouts, sessions);
  return (
    <div className="px-4 pb-24">
      <h2 className="gf-display text-3xl mt-5 mb-1">Treinos de {profile.name}</h2>
      <p className="text-xs mb-5" style={{ color: "var(--ink-dim)" }}>Seus dados ficam salvos automaticamente neste app.</p>
      <div className="flex flex-col gap-3">
        {workouts.map((w) => {
          const wSessions = sessions.filter((s) => s.workoutId === w.id);
          const last = wSessions.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
          return (
            <button key={w.id} onClick={() => onOpen(w)} className="gf-card p-4 text-left flex items-center gap-3">
              <div className="flex -space-x-2">
                {w.exercises.slice(0, 3).map((ex) => <PlateIcon key={ex.id} category={ex.category} size={32} fontSize={9} />)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="font-medium truncate">{w.name}</div>
                  {w.id === suggestionId && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: "#6C4FD11F", color: "var(--purple)" }}>
                      Para hoje
                    </span>
                  )}
                </div>
                <div className="text-xs gf-mono mt-0.5" style={{ color: "var(--ink-dim)" }}>
                  {w.exercises.length} exercícios · feito {wSessions.length}x{last ? ` · última vez ${fmtDate(last.date)}` : ""}
                </div>
              </div>
              <ChevronRight size={18} color="var(--ink-dim)" />
            </button>
          );
        })}
        {workouts.length === 0 && <p className="text-sm text-center py-8" style={{ color: "var(--ink-dim)" }}>Nenhum treino cadastrado ainda.</p>}
      </div>
      <button className="w-full py-3 mt-5 rounded-xl font-semibold flex items-center justify-center gap-2" style={{ background: "var(--purple-deep)", color: "#fff" }} onClick={() => setShowForm(true)}>
        <Plus size={16} /> Novo treino
      </button>
      {showForm && <WorkoutForm onSave={(data) => { onNew(data); setShowForm(false); }} onClose={() => setShowForm(false)} />}
    </div>
  );
}

/* ---------------------------------- profile switcher ---------------------------------- */
function ProfileSwitcher({ profiles, current, onSelect, onAdd, onClose }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  return (
    <div className="gf-backdrop" onClick={onClose}>
      <div className="gf-sheet p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="gf-display text-2xl mb-4 flex items-center gap-2"><Users size={20} color="var(--purple)" /> Quem é você?</h3>
        <div className="flex flex-col gap-2 mb-4">
          {profiles.map((p) => (
            <button key={p.id} onClick={() => onSelect(p.id)}
              className="gf-card p-3 flex items-center gap-3 text-left"
              style={{ borderColor: p.id === current ? "var(--purple)" : "var(--line)" }}>
              <div className="gf-plate" style={{ width: 36, height: 36, background: "var(--purple)" }}>
                <span className="gf-mono text-xs" style={{ color: "#fff" }}>{p.name.slice(0, 3).toUpperCase()}</span>
              </div>
              <span className="flex-1">{p.name}</span>
              {p.id === current && <Check size={16} color="var(--purple)" />}
            </button>
          ))}
        </div>
        {adding ? (
          <div className="flex gap-2">
            <input autoFocus className="gf-input flex-1 px-3 py-2.5" placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} />
            <button className="gf-btn-primary px-4" onClick={() => { if (name.trim()) { onAdd(name.trim()); setName(""); setAdding(false); } }}>
              <Check size={18} />
            </button>
          </div>
        ) : (
          <button className="gf-btn-outline w-full py-3 flex items-center justify-center gap-2" onClick={() => setAdding(true)}>
            <Plus size={16} /> Novo perfil da família
          </button>
        )}
      </div>
    </div>
  );
}

function AppHeader({ right }) {
  return (
    <>
      <div className="gf-topbar px-4 pt-3 pb-1.5 flex items-start justify-between" style={{ minHeight: 48, overflow: "visible" }}>
        <div className="flex items-start gap-1.5" style={{ position: "relative" }}>
          <div style={{ marginBottom: -60, position: "relative", zIndex: 5 }}>
            <CatMascot height={104} />
          </div>
          <span className="gf-display gf-wordmark text-3xl leading-none pt-1.5" style={{ letterSpacing: "0.01em" }}>GaiaFit</span>
        </div>
        {right}
      </div>
      <div style={{ height: 22 }} aria-hidden="true" />
    </>
  );
}

/* ---------------------------------- app ---------------------------------- */
function downloadJSON(filename, data) {
  try {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}

function StorageBanner({ onExport, onRetry }) {
  return (
    <div className="mx-4 mt-3 p-3 rounded-xl text-xs" style={{ background: "#3E63D912", border: "1px solid var(--blue)" }}>
      <div className="flex items-start gap-2">
        <CloudOff size={16} color="var(--ink-dim)" className="flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="font-semibold mb-1" style={{ color: "var(--ink)" }}>Não consegui salvar neste navegador</div>
          <div className="mb-2" style={{ color: "var(--ink-dim)" }}>
            O armazenamento local está bloqueado ou cheio (comum em aba anônima). Você pode continuar usando normalmente,
            mas os dados podem se perder ao fechar. Exporte uma cópia por garantia.
          </div>
          <div className="flex gap-2">
            <button onClick={onExport} className="px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1" style={{ background: "#DAD8E3", color: "var(--ink)", border: "1px solid var(--line)" }}>
              <Download size={13} /> Exportar backup
            </button>
            <button onClick={onRetry} className="px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1" style={{ background: "#DAD8E3", color: "var(--ink)", border: "1px solid var(--line)" }}>
              <RefreshCw size={13} /> Tentar salvar de novo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ImportButton({ onImport, label = "Importar backup" }) {
  const inputRef = useRef(null);
  const [msg, setMsg] = useState("");
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        onImport(data);
        setMsg("Importado com sucesso.");
      } catch {
        setMsg("Não consegui ler esse arquivo. Confirme que é um backup exportado pelo GaiaFit.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };
  return (
    <div>
      <input ref={inputRef} type="file" accept="application/json" style={{ display: "none" }} onChange={handleFile} />
      <button className="gf-btn-outline w-full py-2.5 flex items-center justify-center gap-2 text-sm" onClick={() => inputRef.current?.click()}>
        <Upload size={14} /> {label}
      </button>
      {msg && <p className="text-xs mt-1.5 text-center" style={{ color: "var(--ink-dim)" }}>{msg}</p>}
    </div>
  );
}

const LUARA_ID = "p-luara";
const GUILHERME_ID = "p-guilherme";

export default function App() {
  const [loading, setLoading] = useState(true);
  const [storageOk, setStorageOk] = useState(true);

  const [profiles, setProfiles] = useState([]);
  const [currentId, setCurrentId] = useState(null);

  const [profileLoading, setProfileLoading] = useState(false);

  const [dataByProfile, setDataByProfile] = useState({}); // { [profileId]: { workouts, sessions } }
  const [view, setView] = useState("dashboard");
  const [activeWorkoutId, setActiveWorkoutId] = useState(null);
  const [sessionWorkout, setSessionWorkout] = useState(null);
  const [showSwitcher, setShowSwitcher] = useState(false);

  const loadedProfiles = useRef(new Set()); // perfis já carregados nesta sessão: nunca buscamos de novo, só usamos a memória

  const fallbackWorkoutsFor = (id) =>
    id === LUARA_ID ? buildWorkouts(SEED_WORKOUTS_LUARA, LUARA_ID) : id === GUILHERME_ID ? buildWorkouts(SEED_WORKOUTS_GUILHERME, GUILHERME_ID) : [];

  // bootstrap: cria os perfis padrão (Luara + Guilherme) na primeira execução, ou adiciona o
  // Guilherme em bases mais antigas que só tinham a Luara.
  useEffect(() => {
    let ok = true;
    let profilesArr;

    const p = sGet("gaiafit:profiles");
    if (!p || p.length === 0) {
      profilesArr = [{ id: LUARA_ID, name: "Luara" }, { id: GUILHERME_ID, name: "Guilherme" }];
      const okP = sSet("gaiafit:profiles", profilesArr);
      const okW1 = sSet(`gaiafit:workouts:${LUARA_ID}`, buildWorkouts(SEED_WORKOUTS_LUARA, LUARA_ID));
      const okS1 = sSet(`gaiafit:sessions:${LUARA_ID}`, buildSeedSessions(SEED_WORKOUTS_LUARA, LUARA_ID, LUARA_SESSION_HISTORY));
      const okW2 = sSet(`gaiafit:workouts:${GUILHERME_ID}`, buildWorkouts(SEED_WORKOUTS_GUILHERME, GUILHERME_ID));
      const okS2 = sSet(`gaiafit:sessions:${GUILHERME_ID}`, buildSeedSessions(SEED_WORKOUTS_GUILHERME, GUILHERME_ID, GUILHERME_SESSION_HISTORY));
      sSet(`gaiafit:seedVersion:${LUARA_ID}`, SEED_VERSION);
      sSet(`gaiafit:seedVersion:${GUILHERME_ID}`, SEED_VERSION);
      ok = okP && okW1 && okS1 && okW2 && okS2;
    } else {
      profilesArr = p;
      if (!profilesArr.find((pr) => pr.name.trim().toLowerCase() === "guilherme")) {
        const gWorkouts = sGet(`gaiafit:workouts:${GUILHERME_ID}`);
        if (!gWorkouts) {
          sSet(`gaiafit:workouts:${GUILHERME_ID}`, buildWorkouts(SEED_WORKOUTS_GUILHERME, GUILHERME_ID));
          sSet(`gaiafit:sessions:${GUILHERME_ID}`, buildSeedSessions(SEED_WORKOUTS_GUILHERME, GUILHERME_ID, GUILHERME_SESSION_HISTORY));
          sSet(`gaiafit:seedVersion:${GUILHERME_ID}`, SEED_VERSION);
        }
        profilesArr = [...profilesArr, { id: GUILHERME_ID, name: "Guilherme" }];
        sSet("gaiafit:profiles", profilesArr);
      }
      // aparelho que já tinha perfil salvo antes de uma atualização de treinos/histórico: atualiza
      // os treinos padrão e completa sessões históricas que faltam, preservando sessões reais
      migrateDefaultProfileSeed(LUARA_ID, SEED_WORKOUTS_LUARA, LUARA_SESSION_HISTORY);
      migrateDefaultProfileSeed(GUILHERME_ID, SEED_WORKOUTS_GUILHERME, GUILHERME_SESSION_HISTORY);
    }

    setProfiles(profilesArr);
    setCurrentId(profilesArr[0].id);
    setStorageOk(ok);
    setLoading(false);
  }, []);

  // carrega treinos/sessões do perfil ativo apenas uma vez por sessão; depois disso, usa sempre a memória
  useEffect(() => {
    if (!currentId) return;
    if (loadedProfiles.current.has(currentId)) {
      setView("dashboard"); setActiveWorkoutId(null);
      return;
    }
    setProfileLoading(true);
    const w = sGet(`gaiafit:workouts:${currentId}`);
    const s = sGet(`gaiafit:sessions:${currentId}`);
    const isDefault = currentId === LUARA_ID || currentId === GUILHERME_ID;
    let finalWorkouts = Array.isArray(w) ? w : [];
    let finalSessions = Array.isArray(s) ? s : [];
    // perfil padrão sem nada salvo ainda (primeira vez): usa o plano de treino padrão
    if (isDefault && finalWorkouts.length === 0) {
      finalWorkouts = fallbackWorkoutsFor(currentId);
    }
    loadedProfiles.current.add(currentId);
    setDataByProfile((prev) => ({ ...prev, [currentId]: { workouts: finalWorkouts, sessions: finalSessions } }));
    setView("dashboard"); setActiveWorkoutId(null);
    setProfileLoading(false);
  }, [currentId]);

  const currentProfile = profiles.find((p) => p.id === currentId);
  const workouts = dataByProfile[currentId]?.workouts || [];
  const sessions = dataByProfile[currentId]?.sessions || [];
  const activeWorkout = workouts.find((w) => w.id === activeWorkoutId);

  const persistWorkouts = useCallback((arr) => {
    setDataByProfile((prev) => ({ ...prev, [currentId]: { sessions: [], ...(prev[currentId] || {}), workouts: arr } }));
    setStorageOk(sSet(`gaiafit:workouts:${currentId}`, arr));
  }, [currentId]);
  const persistSessions = useCallback((arr) => {
    setDataByProfile((prev) => ({ ...prev, [currentId]: { workouts: [], ...(prev[currentId] || {}), sessions: arr } }));
    setStorageOk(sSet(`gaiafit:sessions:${currentId}`, arr));
  }, [currentId]);

  const addProfile = (name) => {
    const id = uid();
    const p = [...profiles, { id, name }];
    setProfiles(p);
    setDataByProfile((prev) => ({ ...prev, [id]: { workouts: [], sessions: [] } }));
    loadedProfiles.current.add(id);
    const okP = sSet("gaiafit:profiles", p);
    const okW = sSet(`gaiafit:workouts:${id}`, []);
    const okS = sSet(`gaiafit:sessions:${id}`, []);
    setStorageOk(okP && okW && okS);
    setCurrentId(id); setShowSwitcher(false);
  };

  const newWorkout = (data) => persistWorkouts([...workouts, { id: uid(), ...data, exercises: [], createdAt: new Date().toISOString() }]);
  const saveWorkout = (updated) => persistWorkouts(workouts.map((w) => (w.id === updated.id ? updated : w)));
  const deleteWorkout = (id) => {
    persistWorkouts(workouts.filter((w) => w.id !== id));
    persistSessions(sessions.filter((s) => s.workoutId !== id));
    setView("dashboard"); setActiveWorkoutId(null);
  };
  const deleteSession = (id) => persistSessions(sessions.filter((s) => s.id !== id));

  const finishSession = (logs, callback) => {
    const w = activeWorkout;
    const prs = [];
    const entries = w.exercises.map((ex) => {
      const loadUsed = logs[ex.id]?.load || ex.load;
      const newVal = parseNum(loadUsed);
      if (newVal !== null) {
        const past = sessions
          .filter((s) => s.workoutId === w.id)
          .flatMap((s) => s.entries.filter((e) => e.exerciseId === ex.id))
          .map((e) => parseNum(e.loadUsed))
          .filter((v) => v !== null);
        if (past.length > 0 && newVal > Math.max(...past)) prs.push(`${ex.name}: ${loadUsed}`);
      }
      return { exerciseId: ex.id, name: ex.name, loadUsed, repsUsed: logs[ex.id]?.reps || "" };
    });
    const record = { id: uid(), workoutId: w.id, workoutName: w.name, date: new Date().toISOString(), entries };
    persistSessions([...sessions, record]);
    persistWorkouts(workouts.map((wk) => wk.id === w.id
      ? { ...wk, exercises: wk.exercises.map((ex) => ({ ...ex, load: logs[ex.id]?.load || ex.load })) }
      : wk));
    callback(prs);
  };

  const handleExport = () => {
    if (!currentProfile) return;
    downloadJSON(`gaiafit-${currentProfile.name.toLowerCase().replace(/\s+/g, "-")}-backup.json`, {
      exportedAt: new Date().toISOString(), app: "GaiaFit",
      profileId: currentProfile.id, profileName: currentProfile.name,
      workouts, sessions,
    });
  };
  const handleImport = (data) => {
    if (!data || !Array.isArray(data.workouts)) return;
    persistWorkouts(data.workouts);
    persistSessions(Array.isArray(data.sessions) ? data.sessions : []);
  };
  const retryStorage = () => {
    let okAll = sSet("gaiafit:profiles", profiles);
    for (const p of profiles) {
      const d = dataByProfile[p.id];
      if (d) {
        const okW = sSet(`gaiafit:workouts:${p.id}`, d.workouts);
        const okS = sSet(`gaiafit:sessions:${p.id}`, d.sessions);
        okAll = okAll && okW && okS;
      }
    }
    setStorageOk(okAll);
  };

  if (loading) {
    return (
      <div className="gf-root flex items-center justify-center" style={{ minHeight: "100vh" }}>
        <style>{STYLE}</style>
        <Loader2 className="animate-spin" color="var(--purple)" size={28} />
      </div>
    );
  }

  return (
    <div className="gf-root">
      <style>{STYLE}</style>
      <div className="gf-shell">
        <AppHeader right={currentProfile && (
          <button onClick={() => setShowSwitcher(true)} className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.14)" }}>
            <div className="gf-plate" style={{ width: 26, height: 26, background: "#fff" }}>
              <span className="gf-mono" style={{ fontSize: 9, color: "var(--purple-deep)" }}>{currentProfile.name.slice(0, 3).toUpperCase()}</span>
            </div>
            <span className="text-sm" style={{ color: "#fff" }}>{currentProfile.name}</span>
          </button>
        )} />
        {!storageOk && <StorageBanner onExport={handleExport} onRetry={retryStorage} />}

        {profileLoading && (
          <div className="flex items-center justify-center py-16"><Loader2 className="animate-spin" color="var(--purple)" size={24} /></div>
        )}

        {!profileLoading && currentProfile && (
          <>
            {view === "dashboard" && (
              <Dashboard profile={currentProfile} workouts={workouts} sessions={sessions}
                onOpen={(w) => { setActiveWorkoutId(w.id); setView("workout"); }}
                onNew={newWorkout} />
            )}
            {view === "workout" && activeWorkout && (
              <WorkoutDetail workout={activeWorkout} sessions={sessions}
                onBack={() => setView("dashboard")}
                onStart={() => setSessionWorkout(activeWorkout)}
                onSaveWorkout={saveWorkout}
                onDeleteWorkout={deleteWorkout}
                onHistory={() => setView("history")} />
            )}
            {view === "history" && activeWorkout && (
              <HistoryView workout={activeWorkout} sessions={sessions} onBack={() => setView("workout")} onDeleteSession={deleteSession} />
            )}
            {view === "dashboard" && (
              <div className="px-4 pb-6 flex flex-col gap-2">
                <button onClick={handleExport} className="gf-btn-outline w-full py-2.5 flex items-center justify-center gap-2 text-sm">
                  <Download size={14} /> Exportar backup deste perfil
                </button>
                <ImportButton onImport={handleImport} label="Importar backup para este perfil" />
              </div>
            )}
          </>
        )}

        {sessionWorkout && <SessionMode workout={sessionWorkout} onFinish={finishSession} onExit={() => setSessionWorkout(null)} />}
        {showSwitcher && (
          <ProfileSwitcher profiles={profiles} current={currentId}
            onSelect={(id) => { setCurrentId(id); setShowSwitcher(false); }}
            onAdd={addProfile}
            onClose={() => setShowSwitcher(false)} />
        )}
      </div>
    </div>
  );
}
