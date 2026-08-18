import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, LineChart, Line,
} from "recharts";
import {
  GraduationCap, Users, School, LogOut, LayoutDashboard, Wallet, PiggyBank,
  Wrench, PieChart as PieIcon, TrendingUp, Factory, ShoppingCart, Package,
  UserCog, Gauge, FileBarChart, Target, ClipboardList, History, MessageSquare,
  Plus, Trash2, ChevronRight, ChevronDown, CheckCircle2, Circle, AlertTriangle,
  Save, Copy, ArrowLeft, BookOpen, Building2, KeyRound, Mail, Lock, ShieldCheck,
  Clock, UserCheck, UserX, Eye, EyeOff, Crown, ScrollText, UserPlus, Upload,
  ListChecks, FileSpreadsheet, ClipboardCheck, X, Pencil, Menu,
  LifeBuoy, Send, Megaphone, RotateCcw, Printer, Play, Video,
} from "lucide-react";
import {
  observarSessao, entrarComGoogle, sair, traduzErroAuth, CODIGO_MESTRE,
} from "./firebaseAuth";
import { extrairAlunosDoPDF, normalizarNome } from "./rosterPdf";

// ============================================================================
// CONSTANTES / HELPERS
// ============================================================================

const MODULOS = [
  { id: "m1", n: 1, nome: "Investimentos Fixos", icon: Wrench },
  { id: "m2", n: 2, nome: "Capital de Giro", icon: PiggyBank },
  { id: "m3", n: 3, nome: "Invest. Pré-Operacionais", icon: ClipboardList },
  { id: "m4", n: 4, nome: "Investimento Total", icon: Wallet },
  { id: "m5", n: 5, nome: "Faturamento Mensal", icon: TrendingUp },
  { id: "m6", n: 6, nome: "Custo Unit. Matéria-Prima", icon: Factory },
  { id: "m7", n: 7, nome: "Custos de Comercialização", icon: ShoppingCart },
  { id: "m8", n: 8, nome: "CMD / CMV", icon: Package },
  { id: "m9", n: 9, nome: "Mão de Obra", icon: UserCog },
  { id: "m10", n: 10, nome: "Depreciação", icon: Gauge },
  { id: "m11", n: 11, nome: "Custos Fixos Mensais", icon: FileBarChart },
  { id: "m12", n: 12, nome: "Demonstrativo de Resultados", icon: FileBarChart },
  { id: "m13", n: 13, nome: "Indicadores de Viabilidade", icon: Target },
];

const TEORIA = {
  m1: { conceito: "Bens que a empresa precisa comprar para funcionar: máquinas, equipamentos, móveis, utensílios e veículos.", formula: "Total = Σ (Quantidade × Valor Unitário)" },
  m2: { conceito: "Recursos necessários para financiar a operação normal: estoque inicial e caixa mínimo (reserva para cobrir o descompasso entre pagar fornecedores e receber de clientes).", formula: "Necessidade Líquida (dias) = Prazo médio de vendas + Prazo de estoque − Prazo médio de compras\nCaixa Mínimo = Custo Total Diário × Necessidade Líquida (dias)" },
  m3: { conceito: "Gastos realizados antes de a empresa começar a vender: reformas, legalização, divulgação de lançamento, treinamentos.", formula: "Total = Σ dos gastos pré-operacionais" },
  m4: { conceito: "Soma dos três blocos de investimento e definição das fontes de recursos (próprios x terceiros).", formula: "Investimento Total = Invest. Fixos + Capital de Giro + Invest. Pré-Operacionais" },
  m5: { conceito: "Estimativa de receita mensal, baseada na quantidade vendida e no preço de mercado.", formula: "Faturamento = Σ (Quantidade × Preço de Venda Unitário)" },
  m6: { conceito: "Custo de materiais para cada unidade fabricada — detalhamento opcional, útil para negócios industriais.", formula: "Custo Unitário = Σ (Quantidade do material × Custo Unitário do material)" },
  m7: { conceito: "Gastos variáveis que incidem diretamente sobre as vendas: impostos e comissões.", formula: "Custo de Comercialização = Faturamento × (% Impostos + % Comissão)" },
  m8: { conceito: "Valor baixado do estoque em função da venda efetiva (CMD para indústria, CMV para comércio).", formula: "CMD/CMV = Σ (Quantidade Vendida × Custo Unitário de Aquisição/Produção)" },
  m9: { conceito: "Custo com salários e encargos sociais (FGTS, férias, 13º, INSS etc.) da equipe contratada.", formula: "Custo com Mão de Obra = Σ [ Salário × (1 + % Encargos Sociais) ]" },
  m10: { conceito: "Perda de valor dos bens do ativo fixo pelo uso ao longo do tempo.", formula: "Depreciação Mensal = (Valor do Bem ÷ Vida Útil em anos) ÷ 12" },
  m11: { conceito: "Gastos que não variam com o volume de produção/vendas: aluguel, energia, pró-labore etc. — inclui automaticamente a mão de obra e a depreciação.", formula: "Custo Fixo Total = Σ custos fixos + Mão de Obra + Depreciação" },
  m12: { conceito: "Consolida faturamento e custos para apurar se a empresa projeta lucro ou prejuízo.", formula: "Resultado Operacional = (Receita − Custos Variáveis) − Custos Fixos" },
  m13: { conceito: "Quatro indicadores que revelam a viabilidade econômico-financeira do negócio.", formula: "Ponto de Equilíbrio = Custo Fixo ÷ Índice da Margem de Contribuição\nLucratividade = (Lucro ÷ Receita) × 100\nRentabilidade = (Lucro ÷ Investimento Total) × 100\nPrazo de Retorno = Investimento Total ÷ Lucro" },
};


const OPERACIONAL_SECOES = [
  { titulo: "Operacionalização — quem faz o quê", paragrafos: [
    "Claude: escreve, corrige e revisa todo o código (App.jsx e arquivos auxiliares). O professor descreve em português o que precisa mudar; o Claude traduz em React/JSX e valida a sintaxe antes de entregar.",
    "GitHub: onde o código vive e é publicado. O repositório profjorgerg-gif/Plataforma-Plano-Financeiro-CEDUP-Hermann-Hering guarda os arquivos; a aba Actions publica o site automaticamente a cada atualização.",
    "Firebase: banco de dados (Firestore) e login (Authentication, somente Google), na região southamerica-east1. Guarda turmas, empresas, lançamentos e cadastros em tempo real.",
  ]},
  { titulo: "O caminho de uma alteração no código", lista: [
    "Pedido: o professor descreve a mudança ao Claude, de preferência anexando o App.jsx atual.",
    "Implementação: o Claude edita o código e valida a sintaxe antes de entregar.",
    "Upload: pelo navegador, em src → Add file → Upload files, substituindo o(s) arquivo(s) e confirmando o commit.",
    "Publicação automática: a aba Actions mostra uma bolinha amarela até ficar verde (1 a 3 minutos).",
    "Teste: sempre em aba anônima/InPrivate, para evitar cache do navegador.",
  ]},
  { titulo: "Histórico de melhorias — resumo", paragrafos: [
    "01/08: plataforma completa (v1) — autenticação, 13 módulos, Manual do Aluno, Análise do Negócio, Feedback, painel GESTÃO.",
    "02/08: reforço de segurança, registro individual por usuário, navegação entre módulos.",
    "03/08: categorias ilimitadas, menu mobile em gaveta, coluna \"O que falta\" nos relatórios.",
    "04/08 – 05/08: manuais ilustrados, caixa de links de referência.",
    "16/08: tela de login redesenhada, login exclusivo via conta Google (fim do cadastro por e-mail/senha), seletor de perfil integrado ao login, professor entra direto (sem aprovação), botão de auto-promoção a Mestre pelo código, aluno entra direto com a própria matrícula (a lista de alunos importada em PDF passou a ser o índice de acesso, com o código de turma como alternativa).",
  ]},
  { titulo: "Segurança da plataforma", paragrafos: [
    "Login exclusivo via Google: o provedor \"E-mail/senha\" foi desativado no Console do Firebase; só \"Google\" está ativo. É preciso conferir, em Authentication → Domínios autorizados, se o domínio do GitHub Pages está na lista.",
    "Regras do Firestore exigem login (request.auth != null) em qualquer leitura/escrita.",
    "Código de Usuário Mestre: como o repositório é público, esse código nunca deve ser divulgado em canais públicos. Trocar periodicamente pelo arquivo firebaseAuth.js.",
  ]},
  { titulo: "Referências do projeto", lista: [
    "Repositório: github.com/profjorgerg-gif/Plataforma-Plano-Financeiro-CEDUP-Hermann-Hering",
    "Site publicado: profjorgerg-gif.github.io/Plataforma-Plano-Financeiro-CEDUP-Hermann-Hering/",
    "Projeto Firebase: plataforma-plano-financeiro (Firestore + Authentication, southamerica-east1)",
    "Metodologia de referência: elaboração de plano de negócios, por módulos financeiros sequenciais.",
  ]},
];

const CHECKLIST_SECOES = [
  { titulo: "O que já temos (funcionalidade confirmada)", tom: "ok", itens: [
    "Login exclusivo via Google, com seletor de perfil (Aluno/Professor + código de Mestre)",
    "Professor entra direto; aluno entra direto com a própria matrícula (nome oficial e turma reconhecidos automaticamente)",
    "Os 13 módulos financeiros calculando e passando dados entre si",
    "Análise do Negócio com gráficos e alertas automáticos",
    "Feedback do Professor por módulo",
    "Relatórios e importação de lista de alunos em PDF",
    "Painel GESTÃO completo: Turmas, Usuários, Relatórios, Backup, Auditoria, Aprovações",
    "Regras de segurança do Firestore exigindo login",
  ]},
  { titulo: "Pendente de confirmação", tom: "warn", itens: [
    "Testar o login e a gravação de dados com uma conta de aluno real, de ponta a ponta",
    "Confirmar no Console do Firebase se o domínio do site está nos Domínios autorizados",
    "Repassar a lista real de turmas/alunos do semestre atual, se ainda não foi importada",
  ]},
];

function baixarArquivo(nome, conteudo, mime = "application/json") {
  try {
    const blob = new Blob([conteudo], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = nome;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (e) { alert("Não foi possível gerar o arquivo para download."); }
}

function defaultLancamentos() {
  return {
    m1: { itens: [] },
    m2: { estoqueInicial: 0, prazoVendasDias: 0, prazoComprasDias: 0, prazoEstoqueDias: 0 },
    m3: { itens: [] },
    m4: { pctProprio: 100 },
    m5: { itens: [] },
    m6: { itens: [] },
    m7: { pctImpostos: 0, pctComissao: 0 },
    m8: { custosUnit: {} },
    m9: { itens: [] },
    m10: { vidasUteis: {} },
    m11: { itens: [] },
  };
}

function mergeLancamentos(loaded) {
  const base = defaultLancamentos();
  if (!loaded) return base;
  const out = { ...base };
  Object.keys(base).forEach((k) => {
    out[k] = { ...base[k], ...(loaded[k] || {}) };
  });
  return out;
}

// ============================================================================
// MOTOR DE CÁLCULO
// ============================================================================

function calcular(lanc) {
  const l = mergeLancamentos(lanc);

  const investFixo = l.m1.itens.reduce((s, it) => s + (Number(it.qtd) || 0) * (Number(it.valorUnit) || 0), 0);
  const investPreOp = l.m3.itens.reduce((s, it) => s + (Number(it.valor) || 0), 0);
  const faturamento = l.m5.itens.reduce((s, it) => s + (Number(it.qtd) || 0) * (Number(it.precoUnit) || 0), 0);
  const custoComercializacao = faturamento * ((Number(l.m7.pctImpostos) || 0) + (Number(l.m7.pctComissao) || 0)) / 100;

  const cmv = l.m5.itens.reduce((s, it) => {
    const cu = Number(l.m8.custosUnit?.[it.id]) || 0;
    return s + (Number(it.qtd) || 0) * cu;
  }, 0);

  const maoDeObra = l.m9.itens.reduce((s, it) => {
    const sal = Number(it.salario) || 0;
    const enc = Number(it.pctEncargos) || 0;
    return s + (Number(it.qtd) || 0) * sal * (1 + enc / 100);
  }, 0);

  const depreciacaoLinhas = l.m1.itens.map((it) => {
    const valor = (Number(it.qtd) || 0) * (Number(it.valorUnit) || 0);
    const vidaRaw = l.m10.vidasUteis?.[it.id];
    const vidaUtil = vidaRaw === undefined || vidaRaw === null || vidaRaw === "" ? 5 : Number(vidaRaw) || 0;
    const anual = vidaUtil > 0 ? valor / vidaUtil : 0;
    const mensal = anual / 12;
    return { ...it, valor, vidaUtil, anual, mensal };
  });
  const depreciacaoMensal = depreciacaoLinhas.reduce((s, r) => s + r.mensal, 0);

  const custoFixoManual = l.m11.itens.reduce((s, it) => s + (Number(it.valor) || 0), 0);
  const custoFixoTotal = custoFixoManual + maoDeObra + depreciacaoMensal;

  const custoVariavelTotal = cmv + custoComercializacao;
  const margemContribuicao = faturamento - custoVariavelTotal;
  const resultadoOperacional = margemContribuicao - custoFixoTotal;

  // Capital de giro
  const necessidadeLiquidaDias =
    (Number(l.m2.prazoVendasDias) || 0) + (Number(l.m2.prazoEstoqueDias) || 0) - (Number(l.m2.prazoComprasDias) || 0);
  const custoTotalDiario = (custoFixoTotal + custoVariavelTotal) / 30;
  const caixaMinimo = Math.max(0, custoTotalDiario * necessidadeLiquidaDias);
  const estoqueInicial = Number(l.m2.estoqueInicial) || 0;
  const capitalGiroTotal = estoqueInicial + caixaMinimo;

  const investimentoTotal = investFixo + capitalGiroTotal + investPreOp;

  // Indicadores anuais
  const receitaAnual = faturamento * 12;
  const custoVariavelAnual = custoVariavelTotal * 12;
  const custoFixoAnual = custoFixoTotal * 12;
  const lucroAnual = resultadoOperacional * 12;

  const indiceMargemContribuicao = receitaAnual > 0 ? (receitaAnual - custoVariavelAnual) / receitaAnual : 0;
  const pontoEquilibrio = indiceMargemContribuicao > 0 ? custoFixoAnual / indiceMargemContribuicao : null;
  const lucratividade = receitaAnual > 0 ? (lucroAnual / receitaAnual) * 100 : 0;
  const rentabilidade = investimentoTotal > 0 ? (lucroAnual / investimentoTotal) * 100 : 0;
  const prazoRetorno = lucroAnual > 0 ? investimentoTotal / lucroAnual : null;

  // % de módulos com dados
  const preenchidos = [
    l.m1.itens.length > 0,
    (Number(l.m2.estoqueInicial) || 0) > 0 || necessidadeLiquidaDias !== 0,
    l.m3.itens.length > 0,
    true,
    l.m5.itens.length > 0,
    true,
    (Number(l.m7.pctImpostos) || 0) > 0 || (Number(l.m7.pctComissao) || 0) > 0,
    cmv > 0,
    l.m9.itens.length > 0,
    depreciacaoMensal > 0,
    l.m11.itens.length > 0,
    true,
    true,
  ];
  const progresso = Math.round((preenchidos.filter(Boolean).length / preenchidos.length) * 100);

  return {
    investFixo, investPreOp, faturamento, custoComercializacao, cmv, maoDeObra,
    depreciacaoLinhas, depreciacaoMensal, custoFixoManual, custoFixoTotal,
    custoVariavelTotal, margemContribuicao, resultadoOperacional,
    necessidadeLiquidaDias, custoTotalDiario, caixaMinimo, estoqueInicial, capitalGiroTotal,
    investimentoTotal, receitaAnual, custoVariavelAnual, custoFixoAnual, lucroAnual,
    indiceMargemContribuicao, pontoEquilibrio, lucratividade, rentabilidade, prazoRetorno,
    progresso, preenchidos,
  };
}

// ============================================================================
// STORAGE HOOK
// ============================================================================

// ============================================================================
// USUÁRIOS — um documento por pessoa (chave "usuario_{uid}"), em vez de uma
// lista única compartilhada por todo mundo.
//
// Por quê: guardar todos os cadastros numa lista única fazia cada ação
// (cadastro novo, aprovação, trocar de equipe...) ler a lista inteira,
// mudar uma pessoa e salvar a lista inteira de volta. Se duas dessas ações
// acontecessem próximas uma da outra, a segunda podia sobrescrever a lista
// com uma versão desatualizada, apagando sem querer mudanças feitas em OUTRAS
// contas — foi isso que fez contas de professor voltarem a aparecer como
// "pendente". Com um documento por pessoa, uma ação nunca mais consegue
// atropelar o registro de outra.
//
// Migração automática: contas antigas, criadas antes desta correção, só
// existem na lista única antiga ("usuarios_todos"). buscarUsuario() e
// listarUsuarios() enxergam as duas formas e "curam" a conta automaticamente
// (copiando para o novo formato) assim que ela é acessada — sem precisar de
// nenhuma ação manual.
// ============================================================================

async function buscarUsuarioListaAntiga(uid) {
  try {
    const r = await window.storage.get("usuarios_todos", true);
    const lista = r ? JSON.parse(r.value) : [];
    return lista.find((u) => u.uid === uid) || null;
  } catch { return null; }
}

// ============================================================================
// CENTRAL DE SUPORTE — chamados de "Sistema" (aluno/professor → Usuário
// Mestre, sobre problemas ou sugestões da plataforma) e "Pedagógico"
// (aluno ↔ o(a) professor(a) da própria turma, sobre dúvidas do plano de
// negócio). Cada chamado é gravado como um documento próprio
// (chamado_{id}), no mesmo padrão de usuario_{uid} — evita listas
// compartilhadas com condição de corrida.
// ============================================================================

function gerarProtocolo() {
  const d = new Date();
  const p2 = (n) => String(n).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `PPFCHH-${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}-${rand}`;
}

async function criarChamado(dados) {
  const registro = {
    id: uid(), numero: gerarProtocolo(), status: "Aberto",
    criadoEm: Date.now(), atualizadoEm: Date.now(),
    prazoResposta: null, encerradoPor: null, encerradoEm: null, reabrivelAte: null,
    ...dados,
  };
  await window.storage.set(`chamado_${registro.id}`, JSON.stringify(registro), true);
  return registro;
}

async function listarChamadosTodos() {
  try {
    const idx = await window.storage.list("chamado_", true);
    const chaves = idx?.keys || [];
    const resultados = await Promise.all(chaves.map(async (k) => {
      try { const r = await window.storage.get(k, true); return r ? JSON.parse(r.value) : null; } catch { return null; }
    }));
    return resultados.filter(Boolean).sort((a, b) => (b.criadoEm || 0) - (a.criadoEm || 0));
  } catch { return []; }
}

async function atualizarChamado(id, mudancas) {
  const r = await window.storage.get(`chamado_${id}`, true);
  const atual = r ? JSON.parse(r.value) : null;
  if (!atual) return null;
  const novo = { ...atual, ...mudancas, atualizadoEm: Date.now() };
  await window.storage.set(`chamado_${id}`, JSON.stringify(novo), true);
  return novo;
}

const SUPORTE_STATUS_TOM = {
  "Aberto": "amber", "Em análise": "blue", "Aguardando resposta": "rose",
  "Encaminhado para desenvolvimento": "violet", "Aprovado para desenvolvimento": "violet",
  "Resolvido": "emerald", "Encerrado": "slate",
};
const SUPORTE_TOM_CLASSE = {
  amber: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  blue: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  rose: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  violet: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  emerald: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  slate: "bg-slate-700/40 text-slate-400 border-slate-600",
};
function SuporteBadge({ status }) {
  const tom = SUPORTE_STATUS_TOM[status] || "slate";
  return <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border whitespace-nowrap ${SUPORTE_TOM_CLASSE[tom]}`}>{status}</span>;
}
const SUPORTE_FILTROS = ["Todos", "Abertos", "Em análise", "Encaminhados", "Encerrados"];
function chamadoPassaFiltro(c, filtro) {
  if (filtro === "Todos") return true;
  if (filtro === "Abertos") return c.status === "Aberto";
  if (filtro === "Em análise") return ["Em análise", "Aguardando resposta"].includes(c.status);
  if (filtro === "Encaminhados") return ["Encaminhado para desenvolvimento", "Aprovado para desenvolvimento"].includes(c.status);
  if (filtro === "Encerrados") return ["Resolvido", "Encerrado"].includes(c.status);
  return true;
}

// ============================================================================
// NOVIDADES E ATUALIZAÇÕES — histórico de versões visível dentro da
// plataforma, com aviso automático no primeiro acesso após cada atualização.
// Lista do mais recente para o mais antigo — o primeiro item é a versão vigente.
// ============================================================================
const VERSOES = [
  { versao: "2.0", data: "16/08/2026", itens: [
    "Login exclusivo via conta Google (fim do cadastro por e-mail/senha).",
    "Professor(a) entra direto, sem aprovação; código de Mestre agora só concede o nível extra de Usuário Mestre.",
    "Aluno(a) entra direto com a própria matrícula — a plataforma já reconhece a turma e o nome oficial da escola.",
    "Nova seção \"MANUAIS\" dentro da plataforma (Manual do Professor, do Aluno e, para o Mestre, Operacionalização e Checklist).",
    "Nova Central de Suporte (menu \"Suporte\"): fale com o Usuário Mestre sobre o sistema, ou com o(a) professor(a) sobre o plano de negócio.",
    "Nova área \"Novidades\", com o histórico completo de versões da plataforma.",
  ]},
  { versao: "1.3", data: "05/08/2026", itens: [
    "Manuais ilustrados com esquemas visuais em cada passo.",
    "Caixa de links de referência (repositório, site publicado, Firebase) no Manual de Operacionalização.",
  ]},
  { versao: "1.2", data: "03/08/2026", itens: [
    "Categorias de bem personalizadas em Investimentos Fixos.",
    "Menu lateral no celular em formato de gaveta deslizante.",
    "Relatório de Pendências mostrando os nomes dos módulos que faltam, não só um número.",
  ]},
  { versao: "1.1", data: "02/08/2026", itens: [
    "Reforço de segurança: regras do Firestore passaram a exigir login em qualquer leitura/escrita.",
    "Correção de uma condição de corrida no cadastro de usuários (cada pessoa passou a ter seu próprio registro).",
    "Navegação entre módulos com botões de avançar/voltar, e botão \"Voltar ao início\" em todas as telas.",
  ]},
  { versao: "1.0", data: "01/08/2026", itens: [
    "Primeira publicação da Plataforma do Plano Financeiro: autenticação, 13 módulos, Manual do Aluno, Análise do Negócio, Feedback do Professor e painel de Gestão completo.",
  ]},
];
const APP_VERSION = VERSOES[0].versao;

function versaoMaiorQue(a, b) { return parseFloat(a) > parseFloat(b); }

function NovidadesOverlay({ perfil, onFechar, onIrParaHistorico }) {
  if (!perfil || perfil.ultimaVersaoVista === APP_VERSION) return null;
  const vistas = perfil.ultimaVersaoVista;
  const novas = vistas ? VERSOES.filter((v) => versaoMaiorQue(v.versao, vistas)) : [VERSOES[0]];
  const mostrar = novas.length ? novas : [VERSOES[0]];
  return (
    <div className="fixed inset-0 bg-black/60 z-[998] flex items-center justify-center p-5">
      <div className="bg-slate-900 border border-amber-500/40 rounded-xl max-w-md w-full p-7 text-center shadow-2xl">
        <Megaphone size={32} className="mx-auto text-amber-500 mb-3" />
        <h2 className="text-lg font-bold text-slate-50 mb-4">Novidades na Plataforma</h2>
        <div className="text-left max-h-72 overflow-y-auto mb-5 space-y-4">
          {mostrar.map((v, i) => (
            <div key={i}>
              <div className="text-sm font-bold text-slate-100">Versão {v.versao} <span className="text-xs font-normal text-slate-500">— {v.data}</span></div>
              <ul className="list-disc list-inside mt-1 space-y-1">
                {v.itens.map((it, j) => <li key={j} className="text-xs text-slate-400 leading-relaxed">{it}</li>)}
              </ul>
            </div>
          ))}
        </div>
        <button onClick={onFechar} className="w-full bg-amber-500 text-slate-900 font-bold py-2.5 rounded-md hover:bg-amber-400">Entendi</button>
        <button onClick={onIrParaHistorico} className="w-full text-sm text-slate-400 hover:text-slate-100 mt-2">Ver histórico completo</button>
      </div>
    </div>
  );
}

function NovidadesView() {
  return (
    <div>
      <div className="mb-8">
        <div className="text-xs font-bold tracking-widest text-amber-500 mb-2">HISTÓRICO DE VERSÕES</div>
        <h1 className="text-3xl font-bold text-slate-50 mb-3">Novidades e Atualizações</h1>
        <p className="text-slate-400 max-w-2xl">Da mais recente para a mais antiga. Versão atual: <b className="text-slate-200">{APP_VERSION}</b>.</p>
      </div>
      <div className="space-y-4">
        {VERSOES.map((v, i) => (
          <Card key={i} className="p-5">
            <div className="flex items-baseline justify-between mb-2">
              <h3 className="font-bold text-slate-100">Versão {v.versao} {i === 0 && <span className="text-[10px] font-bold text-amber-500 ml-1.5 align-middle">· ATUAL</span>}</h3>
              <span className="text-xs text-slate-500">{v.data}</span>
            </div>
            <ul className="list-disc list-inside space-y-1.5">
              {v.itens.map((it, j) => <li key={j} className="text-sm text-slate-300">{it}</li>)}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}

async function salvarUsuario(perfil) {
  await window.storage.set(`usuario_${perfil.uid}`, JSON.stringify(perfil), true);
}

// ============================================================================
// MANUAIS EM PDF (Aluno/Professor) — guardados no Firestore como base64
// (chave manual_pdf_aluno / manual_pdf_professor), não dentro do código.
// Isso evita deixar o App.jsx gigante (o que já causou uma tela branca numa
// tentativa anterior) e permite que um Usuário Mestre troque o PDF a
// qualquer momento, sem precisar de uma atualização de código nova.
// ============================================================================
async function salvarManualPDF(chave, base64, nomeArquivo) {
  await window.storage.set(`manual_pdf_${chave}`, JSON.stringify({ base64, nomeArquivo, enviadoEm: Date.now() }), true);
}
async function buscarManualPDF(chave) {
  try {
    const r = await window.storage.get(`manual_pdf_${chave}`, true);
    return r ? JSON.parse(r.value) : null;
  } catch { return null; }
}
function useManualPDF(chave, versao) {
  const [dado, setDado] = useState(undefined); // undefined=carregando, null=não enviado ainda
  useEffect(() => {
    let ativo = true;
    setDado(undefined);
    buscarManualPDF(chave).then((r) => { if (ativo) setDado(r); });
    return () => { ativo = false; };
  }, [chave, versao]);
  return dado;
}
function base64ParaBlobUrl(base64) {
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const blob = new Blob([bytes], { type: "application/pdf" });
  return URL.createObjectURL(blob);
}

// ============================================================================
// TUTORIAIS EM VÍDEO — menu com vídeos curtos (hospedados como "não
// listados" no YouTube) mostrando como usar as principais funções.
// Para adicionar um vídeo novo: troque youtubeId de null para o código do
// vídeo (a parte depois de "watch?v=" no link do YouTube). Enquanto for
// null, o cartão mostra "Vídeo em breve" e fica desativado.
// ============================================================================
const TUTORIAIS = [
  { id: "prof-criar-turma", categoria: "professor", titulo: "Criar uma turma", descricao: "Como cadastrar uma nova turma e obter o código de acesso.", youtubeId: null },
  { id: "prof-importar-lista", categoria: "professor", titulo: "Importar a lista de alunos", descricao: "Como subir o PDF oficial da escola e habilitar o acesso por matrícula.", youtubeId: null },
  { id: "prof-aprovacoes", categoria: "professor", titulo: "Painel de Aprovações", descricao: "Como revisar cadastros, corrigir papel ou excluir por engano.", youtubeId: null },
  { id: "prof-relatorios", categoria: "professor", titulo: "Relatórios da turma", descricao: "Como acompanhar pendências e o progresso de cada equipe.", youtubeId: null },
  { id: "prof-suporte", categoria: "professor", titulo: "Central de Suporte", descricao: "Como abrir e responder chamados do sistema e pedagógicos.", youtubeId: null },
  { id: "aluno-entrar", categoria: "aluno", titulo: "Como entrar na plataforma", descricao: "Login com conta Google e acesso pela própria matrícula.", youtubeId: null },
  { id: "aluno-modulo", categoria: "aluno", titulo: "Como preencher um módulo", descricao: "Passo a passo dentro de um módulo financeiro, do início ao fim.", youtubeId: null },
  { id: "aluno-analise", categoria: "aluno", titulo: "Análise do Negócio", descricao: "Como interpretar os gráficos, os alertas e salvar uma versão.", youtubeId: null },
  { id: "aluno-suporte", categoria: "aluno", titulo: "Como usar o Suporte", descricao: "Como falar com o(a) professor(a) ou reportar um problema do sistema.", youtubeId: null },
];

function TutorialCard({ t }) {
  const [aberto, setAberto] = useState(false);
  const temVideo = !!t.youtubeId;
  return (
    <Card className="p-0 overflow-hidden">
      <button onClick={() => temVideo && setAberto((v) => !v)} disabled={!temVideo} className={`w-full text-left block ${temVideo ? "" : "cursor-default"}`}>
        <div className="aspect-video bg-slate-800 relative flex items-center justify-center">
          {temVideo ? (
            aberto ? (
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${t.youtubeId}`}
                title={t.titulo} allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            ) : (
              <>
                <img src={`https://img.youtube.com/vi/${t.youtubeId}/hqdefault.jpg`} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/25 hover:bg-black/40 transition">
                  <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center shadow-lg"><Play size={20} className="text-slate-900 ml-0.5" fill="currentColor" /></div>
                </div>
              </>
            )
          ) : (
            <div className="text-center text-slate-600 px-4">
              <Video size={26} className="mx-auto mb-2" />
              <span className="text-[11px] font-semibold tracking-wide">VÍDEO EM BREVE</span>
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="font-semibold text-slate-100 text-sm">{t.titulo}</div>
          <div className="text-xs text-slate-400 mt-1 leading-relaxed">{t.descricao}</div>
        </div>
      </button>
    </Card>
  );
}

function TutoriaisView({ categoria }) {
  const itens = TUTORIAIS.filter((t) => t.categoria === categoria);
  return (
    <div>
      <div className="mb-8">
        <div className="text-xs font-bold tracking-widest text-amber-500 mb-2">VÍDEOS CURTOS</div>
        <h1 className="text-3xl font-bold text-slate-50 mb-3">Tutoriais</h1>
        <p className="text-slate-400 max-w-2xl">Vídeos rápidos mostrando como usar as principais funções da plataforma. Ainda vamos gravando aos poucos — os que estiverem marcados "Vídeo em breve" chegam nas próximas atualizações.</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {itens.map((t) => <TutorialCard key={t.id} t={t} />)}
      </div>
    </div>
  );
}

// ============================================================================
// CENTRAL DE SUPORTE — telas (lista, novo chamado, detalhe, relatório).
// Um único componente serve tanto o aluno quanto o professor/Mestre; o que
// muda é o "contexto" recebido:
//   ctx = {
//     uid, nome, papel: "aluno" | "professor", mestre: bool,
//     professorUid, professorNome  (só para aluno — a quem falar no Pedagógico)
//   }
// Regra de visibilidade de cada chamado:
//   - tipo "sistema": o Usuário Mestre vê todos; qualquer outra pessoa só
//     vê os que ela mesma abriu.
//   - tipo "pedagogico": visível para quem abriu e para o destinatário
//     (o(a) professor(a) da turma do aluno).
// ============================================================================
function SuporteView({ ctx }) {
  const [aba, setAba] = useState(ctx.papel === "aluno" ? "pedagogico" : "sistema");
  const [modo, setModo] = useState("lista"); // 'lista' | 'novo' | 'detalhe'
  const [chamados, setChamados] = useState(undefined);
  const [chamadoAtualId, setChamadoAtualId] = useState(null);
  const [filtro, setFiltro] = useState("Todos");
  const [selecionados, setSelecionados] = useState(new Set());
  const [relatorio, setRelatorio] = useState(null); // array de chamados, quando aberto

  const carregar = async () => {
    const todos = await listarChamadosTodos();
    setChamados(todos);
  };
  useEffect(() => { carregar(); /* eslint-disable-next-line */ }, []);

  if (chamados === undefined) return <LoadingScreen />;

  const meus = chamados.filter((c) => {
    if (c.tipo === "sistema") return ctx.mestre || c.autorUid === ctx.uid;
    return c.destinatarioUid === ctx.uid || c.autorUid === ctx.uid;
  });
  const daAba = meus.filter((c) => c.tipo === aba);
  const ordenados = daAba.filter((c) => chamadoPassaFiltro(c, filtro));
  const chamadoAtual = chamados.find((c) => c.id === chamadoAtualId) || null;
  const isMestreDoSistema = aba === "sistema" && ctx.mestre;

  const abrirNovo = () => { setModo("novo"); };
  const abrirDetalhe = (id) => { setChamadoAtualId(id); setModo("detalhe"); };
  const voltarLista = () => { setModo("lista"); setChamadoAtualId(null); carregar(); };

  const criar = async (assunto, descricao) => {
    const base = {
      tipo: aba, autorUid: ctx.uid, autorNome: ctx.nome, autorPapel: ctx.papel,
      assunto,
      mensagens: [{ autor: ctx.papel, autorNome: ctx.nome, texto: descricao, criadoEm: Date.now() }],
    };
    if (aba === "pedagogico") {
      base.destinatarioUid = ctx.professorUid;
      base.destinatarioNome = ctx.professorNome;
      base.turmaNome = ctx.turmaNome;
    } else {
      base.destinatarioUid = null; // vai para qualquer Usuário Mestre
    }
    const novo = await criarChamado(base);
    await carregar();
    abrirDetalhe(novo.id);
  };

  const enviarMensagem = async (texto, novoStatus, prazoMs) => {
    if (!chamadoAtual) return;
    const autorPapel = ctx.mestre && aba === "sistema" ? "mestre" : ctx.papel;
    const patch = {
      mensagens: [...(chamadoAtual.mensagens || []), { autor: autorPapel, autorNome: ctx.nome, texto, criadoEm: Date.now() }],
      status: novoStatus || (ctx.mestre ? "Aguardando resposta" : (aba === "pedagogico" ? "Aguardando resposta" : "Em análise")),
      prazoResposta: prazoMs ? Date.now() + prazoMs : null,
    };
    await atualizarChamado(chamadoAtual.id, patch);
    await carregar();
  };

  const mudarStatus = async (status, extra = {}) => {
    if (!chamadoAtual) return;
    await atualizarChamado(chamadoAtual.id, { status, ...extra });
    await carregar();
  };

  const encerrar = async () => {
    await mudarStatus(ctx.mestre || (aba === "pedagogico" && ctx.papel === "professor") ? "Encerrado" : "Resolvido", {
      encerradoPor: ctx.papel, encerradoEm: Date.now(), reabrivelAte: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });
  };
  const reabrir = async () => { await mudarStatus("Aberto", { encerradoPor: null, encerradoEm: null, reabrivelAte: null }); };

  const gerarRelatorio = async (lista) => {
    setRelatorio(lista);
    const agora = Date.now();
    await Promise.all(lista.map((c) => atualizarChamado(c.id, {
      status: "Encaminhado para desenvolvimento",
      mensagens: [...(c.mensagens || []), { autor: "sistema", autorNome: "Sistema", texto: "Chamado encaminhado para desenvolvimento.", criadoEm: agora }],
    })));
    await carregar();
  };

  if (relatorio) {
    return <SuporteRelatorio chamados={relatorio} onFechar={() => setRelatorio(null)} />;
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs font-bold tracking-widest text-amber-500 mb-2">CENTRAL DE SUPORTE</div>
          <h1 className="text-3xl font-bold text-slate-50 mb-2">Suporte</h1>
          <p className="text-slate-400 max-w-2xl text-sm">
            {aba === "sistema"
              ? (ctx.mestre ? "Chamados sobre o sistema, abertos por professores e alunos." : "Fale com o Usuário Mestre sobre dúvidas, problemas ou sugestões da plataforma.")
              : (ctx.papel === "aluno" ? `Fale com o(a) professor(a) ${ctx.professorNome || ""} sobre o plano de negócio da equipe.` : "Conversas com os alunos das suas turmas sobre o plano de negócio.")}
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-5 border-b border-slate-800">
        <button onClick={() => { setAba("sistema"); setModo("lista"); }} className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition ${aba === "sistema" ? "border-amber-500 text-slate-100" : "border-transparent text-slate-500 hover:text-slate-300"}`}>
          {ctx.mestre ? "Chamados do Sistema" : "Sistema"}
        </button>
        {ctx.papel !== "professor" && (
          <button onClick={() => { setAba("pedagogico"); setModo("lista"); }} className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition ${aba === "pedagogico" ? "border-amber-500 text-slate-100" : "border-transparent text-slate-500 hover:text-slate-300"}`}>
            Falar com o professor
          </button>
        )}
        {ctx.papel === "professor" && (
          <button onClick={() => { setAba("pedagogico"); setModo("lista"); }} className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition ${aba === "pedagogico" ? "border-amber-500 text-slate-100" : "border-transparent text-slate-500 hover:text-slate-300"}`}>
            Suporte Pedagógico
          </button>
        )}
      </div>

      {modo === "novo" && (
        <SuporteFormNovo onCancelar={() => setModo("lista")} onCriar={criar} destinatario={aba === "pedagogico" ? ctx.professorNome : "um Usuário Mestre"} />
      )}

      {modo === "detalhe" && chamadoAtual && (
        <SuporteDetalhe
          chamado={chamadoAtual} ctx={ctx} aba={aba}
          onVoltar={voltarLista} onEnviar={enviarMensagem} onEncerrar={encerrar} onReabrir={reabrir}
          onMudarStatus={mudarStatus} onGerarRelatorio={() => gerarRelatorio([chamadoAtual])}
        />
      )}

      {modo === "lista" && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            {isMestreDoSistema ? (
              <div className="flex flex-wrap gap-2">
                {SUPORTE_FILTROS.map((f) => (
                  <button key={f} onClick={() => setFiltro(f)} className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${filtro === f ? "bg-amber-500 text-slate-900 border-amber-500" : "border-slate-700 text-slate-400 hover:border-slate-500"}`}>{f}</button>
                ))}
              </div>
            ) : <div />}
            <button onClick={abrirNovo} className="no-print bg-amber-500 text-slate-900 font-bold px-4 py-2 rounded-md hover:bg-amber-400 text-sm flex items-center gap-2 shrink-0">
              <Plus size={15} /> Novo chamado
            </button>
          </div>

          {isMestreDoSistema && selecionados.size > 0 && (
            <div className="no-print bg-slate-900 border border-amber-500/40 rounded-md p-3 flex items-center justify-between gap-3 mb-4 text-sm">
              <span className="text-slate-300">{selecionados.size} chamado(s) selecionado(s)</span>
              <button onClick={() => gerarRelatorio(chamados.filter((c) => selecionados.has(c.id)))} className="flex items-center gap-2 bg-amber-500 text-slate-900 font-bold px-3 py-1.5 rounded-md hover:bg-amber-400 text-xs">
                <Printer size={13} /> Gerar relatório para desenvolvimento
              </button>
            </div>
          )}

          {ordenados.length === 0 && <Card className="p-8 text-center text-slate-500 text-sm">Nenhum chamado {isMestreDoSistema ? `com o filtro "${filtro}"` : "por aqui ainda"}.</Card>}

          <div className="space-y-2.5">
            {ordenados.map((c) => (
              <Card key={c.id} className="p-4 flex items-center gap-3">
                {isMestreDoSistema && (
                  <input type="checkbox" checked={selecionados.has(c.id)} onChange={(e) => {
                    const novo = new Set(selecionados);
                    if (e.target.checked) novo.add(c.id); else novo.delete(c.id);
                    setSelecionados(novo);
                  }} className="accent-amber-500 shrink-0" />
                )}
                <button onClick={() => abrirDetalhe(c.id)} className="flex-1 min-w-0 text-left">
                  <div className="font-semibold text-slate-100 text-sm truncate">{c.assunto} <span className="text-slate-500 font-normal text-xs">#{c.numero}</span></div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {(ctx.mestre || ctx.papel === "professor") && c.autorUid !== ctx.uid ? `${c.autorNome} · ` : ""}
                    {new Date(c.criadoEm).toLocaleDateString("pt-BR")}
                  </div>
                </button>
                <SuporteBadge status={c.status} />
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SuporteFormNovo({ onCancelar, onCriar, destinatario }) {
  const [assunto, setAssunto] = useState("");
  const [descricao, setDescricao] = useState("");
  const [enviando, setEnviando] = useState(false);
  const enviar = async () => {
    if (!assunto.trim() || !descricao.trim()) return;
    setEnviando(true);
    await onCriar(assunto.trim(), descricao.trim());
    setEnviando(false);
  };
  return (
    <Card className="p-6">
      <SectionTitle icon={LifeBuoy} sub={`Sua mensagem vai para: ${destinatario}.`}>Novo chamado</SectionTitle>
      <Field label="Assunto">
        <TxtInput value={assunto} onChange={setAssunto} placeholder="Resuma em poucas palavras" />
      </Field>
      <Field label="Descrição">
        <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={5}
          className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 focus:border-amber-500 focus:outline-none"
          placeholder="Descreva com o máximo de detalhes possível…" />
      </Field>
      <div className="flex gap-2 mt-2">
        <button onClick={enviar} disabled={enviando || !assunto.trim() || !descricao.trim()} className="bg-amber-500 text-slate-900 font-bold px-5 py-2.5 rounded-md hover:bg-amber-400 disabled:opacity-40 text-sm">
          {enviando ? "Enviando…" : "Abrir chamado"}
        </button>
        <button onClick={onCancelar} className="border border-slate-600 text-slate-100 px-5 py-2.5 rounded-md hover:bg-slate-800 text-sm font-semibold">Cancelar</button>
      </div>
    </Card>
  );
}

function SuporteDetalhe({ chamado: c, ctx, aba, onVoltar, onEnviar, onEncerrar, onReabrir, onMudarStatus, onGerarRelatorio }) {
  const [msg, setMsg] = useState("");
  const estaEncerrado = c.status === "Resolvido" || c.status === "Encerrado";
  const podeReabrir = estaEncerrado && c.reabrivelAte && Date.now() < c.reabrivelAte;
  const souAutor = c.autorUid === ctx.uid;
  const ehMestreAqui = ctx.mestre && aba === "sistema";
  const ehProfessorPedagogico = aba === "pedagogico" && ctx.papel === "professor";

  const enviar = async (novoStatus, prazoMs) => {
    if (!msg.trim()) return;
    await onEnviar(msg.trim(), novoStatus, prazoMs);
    setMsg("");
  };

  return (
    <div>
      <button onClick={onVoltar} className="no-print flex items-center gap-2 text-sm text-slate-400 hover:text-slate-100 mb-4"><ArrowLeft size={15} /> Voltar</button>
      <Card className="p-6">
        <div className="flex items-start justify-between gap-3 mb-1">
          <h2 className="text-lg font-bold text-slate-100">{c.assunto}</h2>
          <SuporteBadge status={c.status} />
        </div>
        <div className="text-xs text-slate-500 mb-5">
          Protocolo #{c.numero} · Aberto em {new Date(c.criadoEm).toLocaleDateString("pt-BR")}
          {!souAutor ? ` · ${c.autorNome}` : ""}
          {c.prazoResposta && c.status === "Aguardando resposta" ? ` · Prazo para responder: ${new Date(c.prazoResposta).toLocaleDateString("pt-BR")}` : ""}
        </div>

        <div className="max-h-96 overflow-y-auto mb-5 space-y-3 pr-1">
          {(c.mensagens || []).map((m, i) => {
            const minha = m.autor === (ehMestreAqui ? "mestre" : ctx.papel) && (m.autorNome === ctx.nome);
            return (
              <div key={i} className={`flex ${minha ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-lg px-3.5 py-2.5 ${m.autor === "sistema" ? "bg-slate-800/60 border border-slate-700" : minha ? "bg-amber-500/15 border border-amber-500/30" : "bg-slate-800 border border-slate-700"}`}>
                  <div className="text-[11px] font-bold text-slate-400 mb-1">{m.autor === "sistema" ? "Sistema" : m.autorNome} <span className="font-normal text-slate-600">· {new Date(m.criadoEm).toLocaleString("pt-BR")}</span></div>
                  <div className="text-sm text-slate-200 whitespace-pre-wrap">{m.texto}</div>
                </div>
              </div>
            );
          })}
        </div>

        {!estaEncerrado ? (
          <>
            <Field label="Nova mensagem">
              <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={3}
                className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 focus:border-amber-500 focus:outline-none" />
            </Field>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => enviar(null, null)} disabled={!msg.trim()} className="no-print flex items-center gap-2 bg-amber-500 text-slate-900 font-bold px-4 py-2 rounded-md hover:bg-amber-400 disabled:opacity-40 text-sm"><Send size={14} /> Enviar mensagem</button>
              {(ehMestreAqui || ehProfessorPedagogico) && (
                <button onClick={() => msg.trim() && enviar("Aguardando resposta", 7 * 24 * 60 * 60 * 1000)} disabled={!msg.trim()} className="no-print border border-slate-600 text-slate-100 px-4 py-2 rounded-md hover:bg-slate-800 disabled:opacity-40 text-sm">Enviar e aguardar resposta (7 dias)</button>
              )}
              {ehMestreAqui && c.status === "Aberto" && (
                <button onClick={() => onMudarStatus("Em análise")} className="no-print border border-slate-600 text-slate-100 px-4 py-2 rounded-md hover:bg-slate-800 text-sm">Iniciar análise</button>
              )}
              {ehMestreAqui && !["Encaminhado para desenvolvimento", "Aprovado para desenvolvimento"].includes(c.status) && (
                <button onClick={onGerarRelatorio} className="no-print flex items-center gap-2 border border-slate-600 text-slate-100 px-4 py-2 rounded-md hover:bg-slate-800 text-sm"><Printer size={14} /> Encaminhar para desenvolvimento</button>
              )}
              {ehMestreAqui && c.status === "Encaminhado para desenvolvimento" && (
                <button onClick={() => onMudarStatus("Aprovado para desenvolvimento")} className="no-print border border-slate-600 text-slate-100 px-4 py-2 rounded-md hover:bg-slate-800 text-sm">Aprovar para desenvolvimento</button>
              )}
              <button onClick={onEncerrar} className="no-print border border-slate-600 text-slate-400 px-4 py-2 rounded-md hover:bg-slate-800 text-sm">{ehMestreAqui || ehProfessorPedagogico ? "Encerrar chamado" : "Marcar como resolvido"}</button>
            </div>
          </>
        ) : podeReabrir ? (
          <div>
            <button onClick={onReabrir} className="no-print bg-amber-500 text-slate-900 font-bold px-4 py-2 rounded-md hover:bg-amber-400 text-sm flex items-center gap-2"><RotateCcw size={14} /> Reabrir chamado</button>
            <p className="text-xs text-slate-500 mt-2">Pode ser reaberto até {new Date(c.reabrivelAte).toLocaleDateString("pt-BR")}.</p>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Este chamado está encerrado.</p>
        )}
      </Card>
    </div>
  );
}

function SuporteRelatorio({ chamados, onFechar }) {
  const agora = new Date();
  return (
    <div>
      <div className="no-print flex items-center justify-between mb-5">
        <button onClick={onFechar} className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-100"><ArrowLeft size={15} /> Voltar ao Suporte</button>
        <button onClick={() => window.print()} className="flex items-center gap-2 bg-amber-500 text-slate-900 font-bold px-4 py-2 rounded-md hover:bg-amber-400 text-sm"><Printer size={14} /> Imprimir / Baixar PDF</button>
      </div>
      <h1 className="text-2xl font-bold text-slate-50 mb-1">Relatório de Chamados para Desenvolvimento</h1>
      <p className="text-sm text-slate-500 mb-6">Gerado em {agora.toLocaleDateString("pt-BR")} às {agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} · {chamados.length} chamado(s)</p>
      <div className="space-y-5">
        {chamados.map((c) => (
          <Card key={c.id} className="p-5">
            <div className="text-sm mb-3">
              <div><b className="text-slate-200">Protocolo:</b> <span className="text-slate-400">#{c.numero}</span></div>
              <div><b className="text-slate-200">Assunto:</b> <span className="text-slate-400">{c.assunto}</span></div>
              <div><b className="text-slate-200">Autor(a):</b> <span className="text-slate-400">{c.autorNome}</span></div>
              <div><b className="text-slate-200">Aberto em:</b> <span className="text-slate-400">{new Date(c.criadoEm).toLocaleDateString("pt-BR")}</span></div>
              <div><b className="text-slate-200">Status no momento do relatório:</b> <span className="text-slate-400">{c.status}</span></div>
            </div>
            <div className="border-t border-slate-800 pt-3 space-y-2">
              {(c.mensagens || []).map((m, i) => (
                <div key={i} className="text-xs">
                  <b className="text-slate-300">{m.autor === "sistema" ? "Sistema" : m.autorNome}</b>
                  <span className="text-slate-600"> · {new Date(m.criadoEm).toLocaleString("pt-BR")}</span>
                  <div className="text-slate-400 whitespace-pre-wrap mt-0.5">{m.texto}</div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

async function buscarUsuario(uid) {
  try {
    const r = await window.storage.get(`usuario_${uid}`, true);
    if (r) return JSON.parse(r.value);
  } catch {}
  // Não achou no formato novo — tenta recuperar do formato antigo (lista
  // única) e, se achar, já migra para o formato novo automaticamente.
  const antigo = await buscarUsuarioListaAntiga(uid);
  if (antigo) { try { await salvarUsuario(antigo); } catch {} }
  return antigo;
}

async function atualizarUsuario(uid, mudancas) {
  const atual = await buscarUsuario(uid);
  if (!atual) return null;
  const novo = { ...atual, ...mudancas };
  await salvarUsuario(novo);
  return novo;
}

async function excluirUsuario(uid) {
  try { await window.storage.delete(`usuario_${uid}`, true); } catch {}
  // Remove também do formato antigo, senão a conta "reviveria" sozinha na
  // próxima vez que alguém chamasse buscarUsuario()/listarUsuarios().
  try {
    const r = await window.storage.get("usuarios_todos", true);
    const lista = r ? JSON.parse(r.value) : [];
    const restantes = lista.filter((u) => u.uid !== uid);
    if (restantes.length !== lista.length) await window.storage.set("usuarios_todos", JSON.stringify(restantes), true);
  } catch {}
}

async function listarUsuarios() {
  const porUid = new Map();
  try {
    const idx = await window.storage.list("usuario_", true);
    const chaves = idx?.keys || [];
    const resultados = await Promise.all(chaves.map(async (k) => {
      try { const r = await window.storage.get(k, true); return r ? JSON.parse(r.value) : null; } catch { return null; }
    }));
    resultados.filter(Boolean).forEach((u) => porUid.set(u.uid, u));
  } catch {}
  // Inclui também quem ainda só existe no formato antigo (ainda não foi
  // acessado individualmente, então não foi migrado ainda).
  try {
    const r = await window.storage.get("usuarios_todos", true);
    const lista = r ? JSON.parse(r.value) : [];
    lista.forEach((u) => { if (!porUid.has(u.uid)) porUid.set(u.uid, u); });
  } catch {}
  return [...porUid.values()];
}

// Hook para a tela de um único usuário (ex.: o perfil da pessoa logada).
function useUsuario(uid) {
  const [perfil, setPerfil] = useState(undefined);
  useEffect(() => {
    if (!uid) { setPerfil(null); return; }
    let alive = true;
    (async () => {
      setPerfil(undefined);
      const p = await buscarUsuario(uid);
      if (alive) setPerfil(p);
    })();
    return () => { alive = false; };
  }, [uid]);
  return perfil;
}

// Hook para telas de gestão que precisam ver todo mundo (Aprovações, Usuários...).
function useListaUsuarios(refreshKey) {
  const [lista, setLista] = useState(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      const r = await listarUsuarios();
      if (alive) setLista(r);
    })();
    return () => { alive = false; };
  }, [refreshKey]);
  return lista;
}

function useSharedList(key) {
  const [value, setValue] = useState(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await window.storage.get(key, true);
        if (alive) setValue(r ? JSON.parse(r.value) : []);
      } catch {
        if (alive) setValue([]);
      }
    })();
    return () => { alive = false; };
  }, [key]);

  const save = useCallback(async (next) => {
    setValue(next);
    try { await window.storage.set(key, JSON.stringify(next), true); } catch {}
  }, [key]);

  return [value, save];
}

function useSharedObject(key, fallback) {
  const [value, setValue] = useState(undefined);
  const ultimaEdicaoLocalRef = useRef(0);
  const ultimoEscritoRef = useRef(null);

  useEffect(() => {
    if (!key) { setValue(undefined); return; }
    let alive = true;

    const carregar = async (viaSincronizacao) => {
      try {
        const r = await window.storage.get(key, true);
        if (!alive) return;
        const carregado = r ? JSON.parse(r.value) : fallback;
        if (!viaSincronizacao) {
          setValue(carregado);
          ultimoEscritoRef.current = JSON.stringify(carregado);
          return;
        }
        // Sincronização em segundo plano: só aplica o que veio do servidor se
        // (a) realmente mudou desde a última vez que ESTE navegador escreveu, e
        // (b) esta pessoa não digitou nada nos últimos segundos — assim, quem
        // está com a equipe editando ao mesmo tempo não perde o que o colega
        // salvou em outro módulo, mas também não se sobrescreve no meio de uma
        // digitação em andamento.
        const textoCarregado = JSON.stringify(carregado);
        const inativoOk = Date.now() - ultimaEdicaoLocalRef.current > 4000;
        if (inativoOk && textoCarregado !== ultimoEscritoRef.current) {
          ultimoEscritoRef.current = textoCarregado;
          setValue(carregado);
        }
      } catch {
        if (alive && !viaSincronizacao) setValue(fallback);
      }
    };

    carregar(false);
    const intervalId = setInterval(() => carregar(true), 8000);
    const aoFocar = () => carregar(true);
    window.addEventListener("focus", aoFocar);
    document.addEventListener("visibilitychange", aoFocar);
    return () => {
      alive = false;
      clearInterval(intervalId);
      window.removeEventListener("focus", aoFocar);
      document.removeEventListener("visibilitychange", aoFocar);
    };
  }, [key]);

  const save = useCallback(async (next) => {
    ultimaEdicaoLocalRef.current = Date.now();
    setValue(next);
    const json = JSON.stringify(next);
    ultimoEscritoRef.current = json;
    try { await window.storage.set(key, json, true); } catch {}
  }, [key]);

  return [value, save];
}

// Carrega, para uma turma, a lista de equipes + os dados (lançamentos, histórico,
// comentários) e o cálculo já pronto de cada uma. Usado pelas telas de Gestão
// (Relatórios, Backup e Auditoria) que precisam olhar todas as equipes de uma vez.
function useEquipesComDados(turmaId, refreshKey) {
  const [estado, setEstado] = useState(null);
  useEffect(() => {
    if (!turmaId) { setEstado([]); return; }
    let alive = true;
    (async () => {
      setEstado(null);
      try {
        const r = await window.storage.get(`equipes_${turmaId}`, true);
        const equipes = r ? JSON.parse(r.value) : [];
        const resultados = await Promise.all(equipes.map(async (eq) => {
          let dados = { lancamentos: defaultLancamentos(), historico: [], comentarios: [] };
          try {
            const rd = await window.storage.get(`dados_equipe_${eq.id}`, true);
            if (rd) dados = JSON.parse(rd.value);
          } catch {}
          return { equipe: eq, dados, calc: calcular(dados.lancamentos) };
        }));
        if (alive) setEstado(resultados);
      } catch {
        if (alive) setEstado([]);
      }
    })();
    return () => { alive = false; };
  }, [turmaId, refreshKey]);
  return estado;
}

// ============================================================================
// PEQUENOS COMPONENTES DE UI
// ============================================================================

function Field({ label, children, hint }) {
  return (
    <label className="block mb-3">
      <span className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wide">{label}</span>
      {children}
      {hint && <span className="block text-xs text-slate-500 mt-1">{hint}</span>}
    </label>
  );
}

function NumInput({ value, onChange, placeholder, suffix }) {
  return (
    <div className="relative">
      <input
        type="number"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? 0 : parseFloat(e.target.value))}
        placeholder={placeholder}
        className="w-full border border-slate-600 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
      />
      {suffix && <span className="absolute right-3 top-2 text-xs text-slate-500">{suffix}</span>}
    </div>
  );
}

function TxtInput({ value, onChange, placeholder }) {
  return (
    <input
      type="text"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border border-slate-600 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
    />
  );
}

function Card({ children, className = "" }) {
  return <div className={`bg-slate-800 rounded-xl border border-slate-700 shadow-sm ${className}`}>{children}</div>;
}

function SectionTitle({ icon: Icon, children, sub }) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2">
        {Icon && <Icon size={20} className="text-slate-100" />}
        <h2 className="text-lg font-bold text-slate-100">{children}</h2>
      </div>
      {sub && <p className="text-sm text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

function TeoriaBox({ modId }) {
  const [open, setOpen] = useState(false);
  const t = TEORIA[modId];
  if (!t) return null;
  return (
    <div className="mb-5 border border-amber-800/60 bg-amber-950/30 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-amber-400 hover:bg-amber-900/30 transition"
      >
        <span className="flex items-center gap-2"><BookOpen size={16} /> Teoria do módulo</span>
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm text-amber-200 space-y-2">
          <p>{t.conceito}</p>
          <pre className="bg-black/20 border border-amber-800/60 rounded-md p-2 text-xs whitespace-pre-wrap font-mono text-slate-200">{t.formula}</pre>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, tone = "slate", small }) {
  const tones = {
    slate: "bg-slate-900 text-slate-200 border-slate-700",
    emerald: "bg-emerald-950/40 text-emerald-400 border-emerald-800/60",
    rose: "bg-rose-950/40 text-rose-400 border-rose-800/60",
    gold: "bg-amber-950/30 text-amber-400 border-amber-800/60",
    blue: "bg-sky-950/30 text-sky-400 border-sky-800/60",
  };
  return (
    <div className={`border rounded-lg p-3 ${tones[tone]}`}>
      <div className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</div>
      <div className={`font-bold ${small ? "text-base" : "text-xl"} mt-0.5`}>{value}</div>
    </div>
  );
}

function RemoveBtn({ onClick }) {
  return (
    <button onClick={onClick} className="text-slate-500 hover:text-rose-400 transition p-1" title="Remover">
      <Trash2 size={15} />
    </button>
  );
}

function AddBtn({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 text-sm font-semibold text-sky-400 hover:text-slate-100 transition mt-2"
    >
      <Plus size={16} /> {children}
    </button>
  );
}

// ============================================================================
// FORMULÁRIOS DE CADA MÓDULO
// ============================================================================

// Categorias padrão de bens do módulo "Investimentos Fixos". Além destas, o
// professor/aluno pode criar quantas categorias personalizadas quiser pelo
// botão "+ Nova categoria..." — elas ficam salvas junto dos lançamentos e
// continuam disponíveis na lista depois.
const CATEGORIAS_BEM_PADRAO = [
  "Máquinas", "Móveis", "Veículos", "Equipamentos de Informática",
  "Ferramentas", "Utensílios", "Instalações/Reformas", "Outros",
];

function M1Form({ data, update }) {
  const itens = data.itens;
  const setItens = (next) => update({ ...data, itens: next });
  const total = itens.reduce((s, it) => s + (Number(it.qtd) || 0) * (Number(it.valorUnit) || 0), 0);

  // Junta as categorias padrão com quaisquer categorias personalizadas que já
  // tenham sido usadas nesta lista de bens, para elas aparecerem no seletor.
  const categoriasUsadas = itens.map((it) => it.categoria).filter(Boolean);
  const categorias = [...new Set([...CATEGORIAS_BEM_PADRAO, ...categoriasUsadas])];

  const alterarCategoria = (itemId, valor) => {
    if (valor === "__nova__") {
      const nome = (prompt("Nome da nova categoria de bem:") || "").trim();
      if (!nome) return;
      setItens(itens.map((r) => (r.id === itemId ? { ...r, categoria: nome } : r)));
      return;
    }
    setItens(itens.map((r) => (r.id === itemId ? { ...r, categoria: valor } : r)));
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-slate-400 border-b border-slate-700">
              <th className="py-2 pr-2">Descrição</th>
              <th className="py-2 pr-2 w-32">Categoria</th>
              <th className="py-2 pr-2 w-20">Qtde.</th>
              <th className="py-2 pr-2 w-32">Valor Unit. (R$)</th>
              <th className="py-2 pr-2 w-32">Total (R$)</th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {itens.map((it) => (
              <tr key={it.id} className="border-b border-slate-800">
                <td className="py-1.5 pr-2"><TxtInput value={it.desc} onChange={(v) => setItens(itens.map((r) => (r.id === it.id ? { ...r, desc: v } : r)))} placeholder="Ex.: Máquina de costura" /></td>
                <td className="py-1.5 pr-2">
                  <select value={it.categoria || "Máquinas"} onChange={(e) => alterarCategoria(it.id, e.target.value)} className="w-full border border-slate-600 rounded-md px-2 py-2 text-sm">
                    {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
                    <option value="__nova__">+ Nova categoria…</option>
                  </select>
                </td>
                <td className="py-1.5 pr-2"><NumInput value={it.qtd} onChange={(v) => setItens(itens.map((r) => (r.id === it.id ? { ...r, qtd: v } : r)))} /></td>
                <td className="py-1.5 pr-2"><NumInput value={it.valorUnit} onChange={(v) => setItens(itens.map((r) => (r.id === it.id ? { ...r, valorUnit: v } : r)))} /></td>
                <td className="py-1.5 pr-2 font-semibold text-slate-200">{fmtBRL((Number(it.qtd) || 0) * (Number(it.valorUnit) || 0))}</td>
                <td><RemoveBtn onClick={() => setItens(itens.filter((r) => r.id !== it.id))} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AddBtn onClick={() => setItens([...itens, { id: uid(), desc: "", categoria: "Máquinas", qtd: 1, valorUnit: 0 }])}>Adicionar bem</AddBtn>
      <div className="mt-4 text-right">
        <StatCard label="Total dos Investimentos Fixos" value={fmtBRL(total)} tone="blue" />
      </div>
    </div>
  );
}

function M2Form({ data, update, calc }) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div>
        <Field label="Estoque inicial (R$)" hint="Materiais/mercadorias necessários para abrir a empresa">
          <NumInput value={data.estoqueInicial} onChange={(v) => update({ ...data, estoqueInicial: v })} />
        </Field>
        <Field label="Prazo médio de vendas (dias)" hint="Em média, quantos dias os clientes levam para pagar">
          <NumInput value={data.prazoVendasDias} onChange={(v) => update({ ...data, prazoVendasDias: v })} suffix="dias" />
        </Field>
        <Field label="Prazo médio de compras (dias)" hint="Em média, quantos dias os fornecedores concedem para pagamento">
          <NumInput value={data.prazoComprasDias} onChange={(v) => update({ ...data, prazoComprasDias: v })} suffix="dias" />
        </Field>
        <Field label="Necessidade média de estoque (dias)" hint="Tempo médio de permanência da mercadoria em estoque">
          <NumInput value={data.prazoEstoqueDias} onChange={(v) => update({ ...data, prazoEstoqueDias: v })} suffix="dias" />
        </Field>
      </div>
      <div className="space-y-3">
        <StatCard label="Necessidade Líquida de Capital de Giro" value={`${fmtNum(calc.necessidadeLiquidaDias)} dias`} tone="gold" />
        <StatCard label="Custo total diário (fixo + variável)" value={fmtBRL(calc.custoTotalDiario)} tone="slate" small />
        <StatCard label="Caixa Mínimo" value={fmtBRL(calc.caixaMinimo)} tone="blue" />
        <StatCard label="Capital de Giro Total (Estoque + Caixa Mínimo)" value={fmtBRL(calc.capitalGiroTotal)} tone="emerald" />
        <p className="text-xs text-slate-500">O custo fixo e variável usados aqui vêm automaticamente dos módulos 5 a 11 — quanto mais módulos você preencher, mais preciso fica este cálculo.</p>
      </div>
    </div>
  );
}

function M3Form({ data, update }) {
  const itens = data.itens;
  const setItens = (next) => update({ ...data, itens: next });
  const total = itens.reduce((s, it) => s + (Number(it.valor) || 0), 0);
  return (
    <div>
      {itens.map((it) => (
        <div key={it.id} className="flex gap-2 items-center mb-2">
          <div className="flex-1"><TxtInput value={it.desc} onChange={(v) => setItens(itens.map((r) => (r.id === it.id ? { ...r, desc: v } : r)))} placeholder="Ex.: Registro na Junta Comercial" /></div>
          <div className="w-40"><NumInput value={it.valor} onChange={(v) => setItens(itens.map((r) => (r.id === it.id ? { ...r, valor: v } : r)))} /></div>
          <RemoveBtn onClick={() => setItens(itens.filter((r) => r.id !== it.id))} />
        </div>
      ))}
      <AddBtn onClick={() => setItens([...itens, { id: uid(), desc: "", valor: 0 }])}>Adicionar despesa pré-operacional</AddBtn>
      <div className="mt-4 text-right"><StatCard label="Total de Investimentos Pré-Operacionais" value={fmtBRL(total)} tone="blue" /></div>
    </div>
  );
}

// Opções padrão de fonte de recursos de terceiros (Módulo 4). O usuário
// também pode digitar uma fonte personalizada pelo "+ Outra fonte...".
const FONTES_TERCEIROS_PADRAO = [
  "Empréstimo Bancário", "Financiamento para Empreendedores (ex.: BNDES, Sebraetec)",
  "Parceria com Pessoa Física", "Investidor-Anjo", "Cooperativa de Crédito",
  "Linha de Crédito de Fornecedor", "Familiares/Amigos",
];

function M4Form({ data, update, calc }) {
  const pctProprio = Number(data.pctProprio) || 0;
  const pctTerceiros = 100 - pctProprio;

  const fontesUsadas = (data.fontesTerceiros || []).map((f) => f.fonte).filter(Boolean);
  const fontesDisponiveis = [...new Set([...FONTES_TERCEIROS_PADRAO, ...fontesUsadas])];

  const fontes = data.fontesTerceiros && data.fontesTerceiros.length > 0
    ? data.fontesTerceiros
    : [{ id: uid(), fonte: "", obs: "" }];
  const setFontes = (next) => update({ ...data, fontesTerceiros: next });

  const alterarFonte = (id, valor) => {
    if (valor === "__nova__") {
      const nome = (prompt("Nome da fonte de recursos de terceiros:") || "").trim();
      if (!nome) return;
      setFontes(fontes.map((f) => (f.id === id ? { ...f, fonte: nome } : f)));
      return;
    }
    setFontes(fontes.map((f) => (f.id === id ? { ...f, fonte: valor } : f)));
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div>
        <table className="w-full text-sm mb-4">
          <tbody>
            <tr className="border-b border-slate-800"><td className="py-2">Investimentos Fixos</td><td className="py-2 text-right font-semibold">{fmtBRL(calc.investFixo)}</td></tr>
            <tr className="border-b border-slate-800"><td className="py-2">Capital de Giro</td><td className="py-2 text-right font-semibold">{fmtBRL(calc.capitalGiroTotal)}</td></tr>
            <tr className="border-b border-slate-800"><td className="py-2">Investimentos Pré-Operacionais</td><td className="py-2 text-right font-semibold">{fmtBRL(calc.investPreOp)}</td></tr>
            <tr><td className="py-2 font-bold">Investimento Total</td><td className="py-2 text-right font-bold text-slate-100">{fmtBRL(calc.investimentoTotal)}</td></tr>
          </tbody>
        </table>
      </div>
      <div>
        <Field label="Percentual de recursos próprios" hint="O restante será considerado recursos de terceiros">
          <NumInput value={data.pctProprio} onChange={(v) => update({ ...data, pctProprio: Math.min(100, Math.max(0, v)) })} suffix="%" />
        </Field>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <StatCard label="Recursos Próprios" value={fmtBRL((calc.investimentoTotal * pctProprio) / 100)} tone="emerald" small />
          <StatCard label="Recursos de Terceiros" value={fmtBRL((calc.investimentoTotal * pctTerceiros) / 100)} tone="gold" small />
        </div>

        {pctTerceiros > 0 && (
          <div className="mt-5">
            <SectionTitle icon={Building2} sub="De onde vai vir o dinheiro de terceiros? Isso ajuda a planejar juros e prazos de pagamento mais adiante.">
              Fonte dos recursos de terceiros
            </SectionTitle>
            {fontes.map((f) => (
              <div key={f.id} className="flex gap-2 items-center mb-2">
                <select value={f.fonte} onChange={(e) => alterarFonte(f.id, e.target.value)} className="flex-1 border border-slate-600 rounded-md px-2 py-2 text-sm">
                  <option value="">Selecione a fonte…</option>
                  {fontesDisponiveis.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                  <option value="__nova__">+ Outra fonte…</option>
                </select>
                {fontes.length > 1 && <RemoveBtn onClick={() => setFontes(fontes.filter((r) => r.id !== f.id))} />}
              </div>
            ))}
            <AddBtn onClick={() => setFontes([...fontes, { id: uid(), fonte: "", obs: "" }])}>Adicionar outra fonte</AddBtn>
          </div>
        )}
      </div>
    </div>
  );
}

function M5Form({ data, update }) {
  const itens = data.itens;
  const setItens = (next) => update({ ...data, itens: next });
  const total = itens.reduce((s, it) => s + (Number(it.qtd) || 0) * (Number(it.precoUnit) || 0), 0);
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-slate-400 border-b border-slate-700">
              <th className="py-2 pr-2">Produto / Serviço</th>
              <th className="py-2 pr-2 w-28">Qtde. estimada/mês</th>
              <th className="py-2 pr-2 w-32">Preço unit. (R$)</th>
              <th className="py-2 pr-2 w-32">Faturamento (R$)</th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {itens.map((it) => (
              <tr key={it.id} className="border-b border-slate-800">
                <td className="py-1.5 pr-2"><TxtInput value={it.nome} onChange={(v) => setItens(itens.map((r) => (r.id === it.id ? { ...r, nome: v } : r)))} placeholder="Ex.: Calça masculina" /></td>
                <td className="py-1.5 pr-2"><NumInput value={it.qtd} onChange={(v) => setItens(itens.map((r) => (r.id === it.id ? { ...r, qtd: v } : r)))} /></td>
                <td className="py-1.5 pr-2"><NumInput value={it.precoUnit} onChange={(v) => setItens(itens.map((r) => (r.id === it.id ? { ...r, precoUnit: v } : r)))} /></td>
                <td className="py-1.5 pr-2 font-semibold text-slate-200">{fmtBRL((Number(it.qtd) || 0) * (Number(it.precoUnit) || 0))}</td>
                <td><RemoveBtn onClick={() => setItens(itens.filter((r) => r.id !== it.id))} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AddBtn onClick={() => setItens([...itens, { id: uid(), nome: "", qtd: 1, precoUnit: 0 }])}>Adicionar produto/serviço</AddBtn>
      <div className="mt-4 text-right"><StatCard label="Faturamento Total Mensal" value={fmtBRL(total)} tone="blue" /></div>
    </div>
  );
}

function M6Form({ data, update, m5itens }) {
  const itens = data.itens;
  const setItens = (next) => update({ ...data, itens: next });
  return (
    <div>
      <p className="text-sm text-slate-400 mb-3">Detalhamento opcional — útil apenas para negócios industriais que fabricam o próprio produto. O resultado é apenas informativo; o cálculo oficial de custo (Módulo 8) usa o custo unitário que você definir lá.</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-slate-400 border-b border-slate-700">
              <th className="py-2 pr-2 w-36">Produto</th>
              <th className="py-2 pr-2">Material/Insumo</th>
              <th className="py-2 pr-2 w-24">Qtde.</th>
              <th className="py-2 pr-2 w-28">Custo Unit. (R$)</th>
              <th className="py-2 pr-2 w-28">Total (R$)</th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {itens.map((it) => (
              <tr key={it.id} className="border-b border-slate-800">
                <td className="py-1.5 pr-2">
                  <select value={it.produto || ""} onChange={(e) => setItens(itens.map((r) => (r.id === it.id ? { ...r, produto: e.target.value } : r)))} className="w-full border border-slate-600 rounded-md px-2 py-2 text-sm">
                    <option value="">Selecione…</option>
                    {m5itens.map((p) => <option key={p.id} value={p.nome}>{p.nome || "(sem nome)"}</option>)}
                  </select>
                </td>
                <td className="py-1.5 pr-2"><TxtInput value={it.material} onChange={(v) => setItens(itens.map((r) => (r.id === it.id ? { ...r, material: v } : r)))} placeholder="Ex.: Tecido" /></td>
                <td className="py-1.5 pr-2"><NumInput value={it.qtd} onChange={(v) => setItens(itens.map((r) => (r.id === it.id ? { ...r, qtd: v } : r)))} /></td>
                <td className="py-1.5 pr-2"><NumInput value={it.custoUnit} onChange={(v) => setItens(itens.map((r) => (r.id === it.id ? { ...r, custoUnit: v } : r)))} /></td>
                <td className="py-1.5 pr-2 font-semibold text-slate-200">{fmtBRL((Number(it.qtd) || 0) * (Number(it.custoUnit) || 0))}</td>
                <td><RemoveBtn onClick={() => setItens(itens.filter((r) => r.id !== it.id))} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AddBtn onClick={() => setItens([...itens, { id: uid(), produto: "", material: "", qtd: 1, custoUnit: 0 }])}>Adicionar material</AddBtn>
    </div>
  );
}

function M7Form({ data, update, faturamento }) {
  const pct = (Number(data.pctImpostos) || 0) + (Number(data.pctComissao) || 0);
  const total = (faturamento * pct) / 100;
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div>
        <Field label="Impostos sobre vendas (SIMPLES, ICMS, ISS...)"><NumInput value={data.pctImpostos} onChange={(v) => update({ ...data, pctImpostos: v })} suffix="%" /></Field>
        <Field label="Comissões / gastos com vendas (comissão, propaganda, taxa de cartão)"><NumInput value={data.pctComissao} onChange={(v) => update({ ...data, pctComissao: v })} suffix="%" /></Field>
      </div>
      <div className="space-y-3">
        <StatCard label="Faturamento do Módulo 5" value={fmtBRL(faturamento)} tone="slate" small />
        <StatCard label="Custo de Comercialização" value={fmtBRL(total)} tone="blue" />
      </div>
    </div>
  );
}

function M8Form({ data, update, m5itens }) {
  const custosUnit = data.custosUnit || {};
  const setCusto = (id, v) => update({ ...data, custosUnit: { ...custosUnit, [id]: v } });
  const total = m5itens.reduce((s, it) => s + (Number(it.qtd) || 0) * (Number(custosUnit[it.id]) || 0), 0);
  if (m5itens.length === 0) {
    return <p className="text-sm text-slate-400">Cadastre os produtos no Módulo 5 (Faturamento) para calcular o CMD/CMV aqui.</p>;
  }
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-slate-400 border-b border-slate-700">
              <th className="py-2 pr-2">Produto/Serviço</th>
              <th className="py-2 pr-2 w-32">Qtde. vendida</th>
              <th className="py-2 pr-2 w-36">Custo unit. de aquisição/produção (R$)</th>
              <th className="py-2 pr-2 w-32">CMD/CMV (R$)</th>
            </tr>
          </thead>
          <tbody>
            {m5itens.map((it) => (
              <tr key={it.id} className="border-b border-slate-800">
                <td className="py-1.5 pr-2">{it.nome || "(sem nome)"}</td>
                <td className="py-1.5 pr-2 text-slate-400">{fmtNum(it.qtd, 0)}</td>
                <td className="py-1.5 pr-2"><NumInput value={custosUnit[it.id]} onChange={(v) => setCusto(it.id, v)} /></td>
                <td className="py-1.5 pr-2 font-semibold text-slate-200">{fmtBRL((Number(it.qtd) || 0) * (Number(custosUnit[it.id]) || 0))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 text-right"><StatCard label="Total CMD/CMV" value={fmtBRL(total)} tone="blue" /></div>
    </div>
  );
}

function M9Form({ data, update }) {
  const itens = data.itens;
  const setItens = (next) => update({ ...data, itens: next });
  const total = itens.reduce((s, it) => s + (Number(it.qtd) || 0) * (Number(it.salario) || 0) * (1 + (Number(it.pctEncargos) || 0) / 100), 0);
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-slate-400 border-b border-slate-700">
              <th className="py-2 pr-2">Função</th>
              <th className="py-2 pr-2 w-20">Nº</th>
              <th className="py-2 pr-2 w-28">Salário (R$)</th>
              <th className="py-2 pr-2 w-24">Encargos (%)</th>
              <th className="py-2 pr-2 w-32">Total (R$)</th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {itens.map((it) => (
              <tr key={it.id} className="border-b border-slate-800">
                <td className="py-1.5 pr-2"><TxtInput value={it.funcao} onChange={(v) => setItens(itens.map((r) => (r.id === it.id ? { ...r, funcao: v } : r)))} placeholder="Ex.: Vendedor" /></td>
                <td className="py-1.5 pr-2"><NumInput value={it.qtd} onChange={(v) => setItens(itens.map((r) => (r.id === it.id ? { ...r, qtd: v } : r)))} /></td>
                <td className="py-1.5 pr-2"><NumInput value={it.salario} onChange={(v) => setItens(itens.map((r) => (r.id === it.id ? { ...r, salario: v } : r)))} /></td>
                <td className="py-1.5 pr-2"><NumInput value={it.pctEncargos} onChange={(v) => setItens(itens.map((r) => (r.id === it.id ? { ...r, pctEncargos: v } : r)))} /></td>
                <td className="py-1.5 pr-2 font-semibold text-slate-200">{fmtBRL((Number(it.qtd) || 0) * (Number(it.salario) || 0) * (1 + (Number(it.pctEncargos) || 0) / 100))}</td>
                <td><RemoveBtn onClick={() => setItens(itens.filter((r) => r.id !== it.id))} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AddBtn onClick={() => setItens([...itens, { id: uid(), funcao: "", qtd: 1, salario: 0, pctEncargos: 30 }])}>Adicionar função</AddBtn>
      <div className="mt-4 text-right"><StatCard label="Total com Mão de Obra" value={fmtBRL(total)} tone="blue" /></div>
    </div>
  );
}

function M10Form({ data, update, m1itens, depreciacaoLinhas, depreciacaoMensal }) {
  const vidasUteis = data.vidasUteis || {};
  const setVida = (id, v) => update({ ...data, vidasUteis: { ...vidasUteis, [id]: v } });
  if (m1itens.length === 0) {
    return <p className="text-sm text-slate-400">Cadastre os bens no Módulo 1 (Investimentos Fixos) para calcular a depreciação aqui.</p>;
  }
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-slate-400 border-b border-slate-700">
              <th className="py-2 pr-2">Bem</th>
              <th className="py-2 pr-2 w-28">Valor (R$)</th>
              <th className="py-2 pr-2 w-28">Vida útil (anos)</th>
              <th className="py-2 pr-2 w-28">Deprec. anual (R$)</th>
              <th className="py-2 pr-2 w-28">Deprec. mensal (R$)</th>
            </tr>
          </thead>
          <tbody>
            {depreciacaoLinhas.map((r) => (
              <tr key={r.id} className="border-b border-slate-800">
                <td className="py-1.5 pr-2">{r.desc || "(sem nome)"}</td>
                <td className="py-1.5 pr-2 text-slate-400">{fmtBRL(r.valor)}</td>
                <td className="py-1.5 pr-2"><NumInput value={vidasUteis[r.id] ?? 5} onChange={(v) => setVida(r.id, v)} suffix="anos" /></td>
                <td className="py-1.5 pr-2 text-slate-300">{fmtBRL(r.anual)}</td>
                <td className="py-1.5 pr-2 font-semibold text-slate-200">{fmtBRL(r.mensal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 text-right"><StatCard label="Depreciação Mensal Total" value={fmtBRL(depreciacaoMensal)} tone="blue" /></div>
    </div>
  );
}

function M11Form({ data, update, maoDeObra, depreciacaoMensal }) {
  const itens = data.itens;
  const setItens = (next) => update({ ...data, itens: next });
  const totalManual = itens.reduce((s, it) => s + (Number(it.valor) || 0), 0);
  const total = totalManual + maoDeObra + depreciacaoMensal;
  return (
    <div>
      {itens.map((it) => (
        <div key={it.id} className="flex gap-2 items-center mb-2">
          <div className="flex-1"><TxtInput value={it.desc} onChange={(v) => setItens(itens.map((r) => (r.id === it.id ? { ...r, desc: v } : r)))} placeholder="Ex.: Aluguel" /></div>
          <div className="w-40"><NumInput value={it.valor} onChange={(v) => setItens(itens.map((r) => (r.id === it.id ? { ...r, valor: v } : r)))} /></div>
          <RemoveBtn onClick={() => setItens(itens.filter((r) => r.id !== it.id))} />
        </div>
      ))}
      <AddBtn onClick={() => setItens([...itens, { id: uid(), desc: "", valor: 0 }])}>Adicionar custo fixo</AddBtn>
      <table className="w-full text-sm mt-4">
        <tbody>
          <tr className="border-t border-slate-700"><td className="py-2 text-slate-400">Mão de obra (Módulo 9) — automático</td><td className="py-2 text-right">{fmtBRL(maoDeObra)}</td></tr>
          <tr><td className="py-2 text-slate-400">Depreciação (Módulo 10) — automático</td><td className="py-2 text-right">{fmtBRL(depreciacaoMensal)}</td></tr>
        </tbody>
      </table>
      <div className="mt-4 text-right"><StatCard label="Custo Fixo Total Mensal" value={fmtBRL(total)} tone="blue" /></div>
    </div>
  );
}

function M12View({ calc }) {
  const rows = [
    ["1. Receita Total com Vendas", calc.faturamento, "100,0%"],
    ["2. Custos Variáveis Totais", -calc.custoVariavelTotal, calc.faturamento ? fmtPct((calc.custoVariavelTotal / calc.faturamento) * 100) : "—"],
    ["   (–) CMD/CMV", -calc.cmv, ""],
    ["   (–) Custos de comercialização", -calc.custoComercializacao, ""],
    ["3. Margem de Contribuição (1–2)", calc.margemContribuicao, calc.faturamento ? fmtPct((calc.margemContribuicao / calc.faturamento) * 100) : "—"],
    ["4. Custos Fixos Totais", -calc.custoFixoTotal, calc.faturamento ? fmtPct((calc.custoFixoTotal / calc.faturamento) * 100) : "—"],
    ["5. Resultado Operacional (3–4)", calc.resultadoOperacional, calc.faturamento ? fmtPct((calc.resultadoOperacional / calc.faturamento) * 100) : "—"],
  ];
  return (
    <div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase text-slate-400 border-b border-slate-700">
            <th className="py-2">Descrição</th><th className="py-2 text-right">R$ (mensal)</th><th className="py-2 text-right w-24">%</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([desc, val, pct], i) => (
            <tr key={i} className={`border-b border-slate-800 ${desc.startsWith("1.") || desc.startsWith("3.") || desc.startsWith("5.") ? "font-bold" : ""}`}>
              <td className="py-2">{desc}</td>
              <td className={`py-2 text-right ${val < 0 ? "text-rose-400" : "text-slate-100"}`}>{fmtBRL(val)}</td>
              <td className="py-2 text-right text-slate-400">{pct}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className={`mt-4 rounded-lg p-4 text-center font-bold text-lg ${calc.resultadoOperacional >= 0 ? "bg-emerald-950/40 text-emerald-400" : "bg-rose-950/40 text-rose-400"}`}>
        {calc.resultadoOperacional >= 0 ? "Resultado projetado: LUCRO" : "Resultado projetado: PREJUÍZO"} de {fmtBRL(Math.abs(calc.resultadoOperacional))}/mês
      </div>
    </div>
  );
}

function M13View({ calc }) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card className="p-4">
        <div className="text-xs font-bold uppercase text-slate-400 mb-1">Ponto de Equilíbrio (anual)</div>
        <div className="text-2xl font-bold text-slate-100">{calc.pontoEquilibrio != null ? fmtBRL(calc.pontoEquilibrio) : "—"}</div>
        <p className="text-xs text-slate-400 mt-1">Faturamento anual necessário para cobrir todos os custos.</p>
      </Card>
      <Card className="p-4">
        <div className="text-xs font-bold uppercase text-slate-400 mb-1">Lucratividade</div>
        <div className="text-2xl font-bold text-slate-100">{fmtPct(calc.lucratividade)}</div>
        <p className="text-xs text-slate-400 mt-1">Percentual do faturamento que vira lucro líquido.</p>
      </Card>
      <Card className="p-4">
        <div className="text-xs font-bold uppercase text-slate-400 mb-1">Rentabilidade (ao ano)</div>
        <div className="text-2xl font-bold text-slate-100">{fmtPct(calc.rentabilidade)}</div>
        <p className="text-xs text-slate-400 mt-1">Retorno anual sobre o investimento total.</p>
      </Card>
      <Card className="p-4">
        <div className="text-xs font-bold uppercase text-slate-400 mb-1">Prazo de Retorno (Payback)</div>
        <div className="text-2xl font-bold text-slate-100">{calc.prazoRetorno != null ? `${fmtNum(calc.prazoRetorno, 1)} anos` : "—"}</div>
        <p className="text-xs text-slate-400 mt-1">Tempo para recuperar o investimento total via lucro.</p>
      </Card>
    </div>
  );
}

// ============================================================================
// ANÁLISE DO NEGÓCIO (gráficos)
// ============================================================================

function alertasNegocio(calc) {
  const alerts = [];
  if (calc.resultadoOperacional < 0) alerts.push({ tone: "rose", texto: "O resultado operacional mensal está negativo. Reveja preços (Módulo 5) ou custos (Módulos 7 a 11)." });
  if (calc.pontoEquilibrio != null && calc.receitaAnual < calc.pontoEquilibrio) alerts.push({ tone: "gold", texto: "O faturamento projetado está abaixo do ponto de equilíbrio anual." });
  if (calc.prazoRetorno != null && calc.prazoRetorno > 5) alerts.push({ tone: "gold", texto: "O prazo de retorno do investimento está acima de 5 anos — considere reduzir o investimento inicial ou aumentar a margem de contribuição." });
  if (calc.investimentoTotal > 0 && calc.investFixo / calc.investimentoTotal > 0.8) alerts.push({ tone: "gold", texto: "Mais de 80% do investimento está concentrado em bens fixos — avalie se é possível alugar ou terceirizar parte dos equipamentos." });
  if (alerts.length === 0) alerts.push({ tone: "emerald", texto: "Os indicadores calculados até aqui não apontam alertas críticos. Continue detalhando os módulos para maior precisão." });
  return alerts;
}

function AnaliseNegocio({ calc, historico, onSalvarVersao, readOnly }) {
  const pieData = [
    { name: "Investimentos Fixos", value: calc.investFixo },
    { name: "Capital de Giro", value: calc.capitalGiroTotal },
    { name: "Pré-Operacionais", value: calc.investPreOp },
  ].filter((d) => d.value > 0);

  const barData = [
    { name: "Receita", valor: calc.faturamento },
    { name: "Custos Variáveis", valor: calc.custoVariavelTotal },
    { name: "Custos Fixos", valor: calc.custoFixoTotal },
    { name: "Resultado", valor: calc.resultadoOperacional },
  ];

  const histData = (historico || []).map((h, i) => ({
    versao: `V${i + 1}`,
    data: new Date(h.timestamp).toLocaleDateString("pt-BR"),
    lucro: h.indicadores.lucroAnual,
    pontoEquilibrio: h.indicadores.pontoEquilibrio || 0,
  }));

  const alerts = alertasNegocio(calc);

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Investimento Total" value={fmtBRL(calc.investimentoTotal)} tone="blue" />
        <StatCard label="Faturamento Mensal" value={fmtBRL(calc.faturamento)} tone="slate" />
        <StatCard label="Resultado Operacional/mês" value={fmtBRL(calc.resultadoOperacional)} tone={calc.resultadoOperacional >= 0 ? "emerald" : "rose"} />
        <StatCard label="Progresso dos módulos" value={`${calc.progresso}%`} tone="gold" />
      </div>

      <div className="space-y-2">
        {alerts.map((a, i) => (
          <div key={i} className={`flex items-start gap-2 text-sm rounded-lg p-3 border ${a.tone === "rose" ? "bg-rose-950/40 border-rose-800/60 text-rose-400" : a.tone === "gold" ? "bg-amber-950/30 border-amber-800/60 text-amber-400" : "bg-emerald-950/40 border-emerald-800/60 text-emerald-400"}`}>
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>{a.texto}</span>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-4">
          <SectionTitle icon={PieIcon}>Composição do Investimento Total</SectionTitle>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(e) => `${fmtNum((e.percent || 0) * 100, 0)}%`}>
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => fmtBRL(v)} contentStyle={CHART_TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: 12, color: "#8fa3b8" }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-slate-500 py-10 text-center">Preencha os módulos 1, 2 e 3 para ver o gráfico.</p>}
        </Card>

        <Card className="p-4">
          <SectionTitle icon={FileBarChart}>Receita x Custos x Resultado (mensal)</SectionTitle>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
              <XAxis dataKey="name" tick={CHART_TICK} />
              <YAxis tick={CHART_TICK} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => fmtBRL(v)} contentStyle={CHART_TOOLTIP_STYLE} />
              <Bar dataKey="valor">
                {barData.map((d, i) => <Cell key={i} fill={d.name === "Resultado" ? (d.valor >= 0 ? COLORS.emerald : COLORS.rose) : PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <SectionTitle icon={History} sub="Cada versão salva registra um retrato dos indicadores para acompanhar a evolução do negócio ao longo do projeto.">Evolução dos Ajustes</SectionTitle>
          {!readOnly && (
            <button onClick={onSalvarVersao} className="flex items-center gap-2 bg-amber-500 text-slate-900 text-sm font-bold px-4 py-2 rounded-lg hover:bg-amber-400 transition shrink-0">
              <Save size={16} /> Salvar versão atual
            </button>
          )}
        </div>
        {histData.length > 1 ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={histData}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
              <XAxis dataKey="versao" tick={CHART_TICK} />
              <YAxis tick={CHART_TICK} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => fmtBRL(v)} contentStyle={CHART_TOOLTIP_STYLE} labelFormatter={(l, p) => `${l} — ${p?.[0]?.payload?.data || ""}`} />
              <Legend wrapperStyle={{ fontSize: 12, color: "#8fa3b8" }} />
              <Line type="monotone" dataKey="lucro" name="Lucro anual" stroke={COLORS.emerald} strokeWidth={2} />
              <Line type="monotone" dataKey="pontoEquilibrio" name="Ponto de equilíbrio" stroke={COLORS.gold} strokeWidth={2} strokeDasharray="4 3" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-slate-500 py-6 text-center">Salve pelo menos duas versões para visualizar a evolução do negócio.</p>
        )}
        {historico && historico.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-700">
                  <th className="py-1.5 pr-3">Versão</th><th className="py-1.5 pr-3">Data</th><th className="py-1.5 pr-3">Lucro anual</th><th className="py-1.5 pr-3">Ponto de equilíbrio</th><th className="py-1.5 pr-3">Nota</th>
                </tr>
              </thead>
              <tbody>
                {historico.slice().reverse().map((h, i) => (
                  <tr key={h.timestamp} className="border-b border-slate-800">
                    <td className="py-1.5 pr-3 font-semibold">V{historico.length - i}</td>
                    <td className="py-1.5 pr-3">{new Date(h.timestamp).toLocaleString("pt-BR")}</td>
                    <td className={`py-1.5 pr-3 ${h.indicadores.lucroAnual >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{fmtBRL(h.indicadores.lucroAnual)}</td>
                    <td className="py-1.5 pr-3">{h.indicadores.pontoEquilibrio != null ? fmtBRL(h.indicadores.pontoEquilibrio) : "—"}</td>
                    <td className="py-1.5 pr-3 text-slate-400 italic">{h.nota || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ============================================================================
// COMENTÁRIOS DO PROFESSOR
// ============================================================================

function ComentariosPanel({ comentarios, onAdd, autor, readOnlyInput, moduloFixo, compact }) {
  const [texto, setTexto] = useState("");
  const [modulo, setModulo] = useState(moduloFixo || "Geral");
  const conteudo = (
    <>
      <div className={`space-y-3 overflow-y-auto mb-3 ${compact ? "max-h-40" : "max-h-72"}`}>
        {(comentarios || []).length === 0 && <p className="text-sm text-slate-500">{compact ? "Nenhum comentário neste módulo ainda." : "Nenhum comentário ainda."}</p>}
        {(comentarios || []).slice().reverse().map((c) => (
          <div key={c.timestamp} className="border border-slate-700 rounded-lg p-3 text-sm">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              {!moduloFixo && <span className="font-semibold text-sky-400">{c.modulo}</span>}
              <span className={moduloFixo ? "ml-auto" : ""}>{new Date(c.timestamp).toLocaleString("pt-BR")}</span>
            </div>
            <p className="text-slate-200">{c.texto}</p>
            <p className="text-xs text-slate-500 mt-1">— {c.autor}</p>
          </div>
        ))}
      </div>
      {!readOnlyInput && (
        <div className="flex gap-2">
          {!moduloFixo && (
            <select value={modulo} onChange={(e) => setModulo(e.target.value)} className="border border-slate-600 rounded-md px-2 text-sm">
              <option>Geral</option>
              {MODULOS.map((m) => <option key={m.id}>{`Módulo ${m.n}`}</option>)}
            </select>
          )}
          <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder={moduloFixo ? "Comentário sobre este módulo…" : "Escreva um comentário ou ajuste solicitado…"} className="flex-1 border border-slate-600 rounded-md px-3 py-2 text-sm" />
          <button
            onClick={() => { if (!texto.trim()) return; onAdd({ modulo: moduloFixo || modulo, texto, autor, timestamp: Date.now() }); setTexto(""); }}
            className="bg-slate-900 text-white px-4 rounded-md text-sm font-semibold hover:bg-slate-800"
          >Enviar</button>
        </div>
      )}
    </>
  );
  if (compact) return <div className="mt-3 border-t border-slate-800 pt-3">{conteudo}</div>;
  return (
    <Card className="p-4">
      <SectionTitle icon={MessageSquare}>Feedback e ajustes solicitados pelo professor</SectionTitle>
      {conteudo}
    </Card>
  );
}

// ============================================================================
// WORKSPACE DO ALUNO
// ============================================================================

// Visualizador de PDF: usa uma Blob URL (criada no navegador a partir do
// base64 guardado no Firestore) em vez de uma "data URI" gigante direto no
// código — mais leve para o código e mais robusto para o navegador exibir.
function VisualizadorPDF({ base64, titulo, nomeArquivo }) {
  const [blobUrl, setBlobUrl] = useState(null);
  useEffect(() => {
    if (!base64) return;
    let url;
    try {
      url = base64ParaBlobUrl(base64);
      setBlobUrl(url);
    } catch {}
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [base64]);

  if (!blobUrl) return <div className="text-sm text-slate-500 py-10 text-center">Carregando manual…</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-3 gap-3">
        <p className="text-xs text-slate-500">Se o visualizador não aparecer corretamente, use "Baixar PDF".</p>
        <a href={blobUrl} download={nomeArquivo || "manual.pdf"} className="no-print flex items-center gap-2 bg-slate-900 border border-slate-700 text-slate-100 text-sm font-semibold px-3 py-2 rounded-md hover:border-amber-500 shrink-0">
          <FileBarChart size={15} /> Baixar PDF
        </a>
      </div>
      <iframe src={blobUrl} title={titulo} className="w-full rounded-lg border border-slate-700" style={{ height: "78vh", background: "#1e293b" }} />
    </div>
  );
}

// Upload do PDF (só Usuário Mestre vê isso) — lê o arquivo escolhido, converte
// para base64 no navegador e guarda no Firestore. Não passa pelo código.
function UploadManualPDF({ chave, label, onEnviado }) {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  const escolherArquivo = (e) => {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    if (arquivo.type !== "application/pdf") { setErro("Escolha um arquivo PDF."); return; }
    if (arquivo.size > 900 * 1024) { setErro("Esse PDF está muito grande (máx. ~900 KB). Tente comprimir as imagens dele."); return; }
    setErro(""); setEnviando(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = String(reader.result).split(",")[1];
        await salvarManualPDF(chave, base64, arquivo.name);
        onEnviado?.();
      } catch {
        setErro("Não foi possível salvar o PDF. Tente novamente.");
      }
      setEnviando(false);
    };
    reader.onerror = () => { setErro("Não foi possível ler o arquivo."); setEnviando(false); };
    reader.readAsDataURL(arquivo);
  };

  return (
    <div className="bg-slate-900 border border-dashed border-amber-500/50 rounded-md p-4 text-center mb-4">
      <Upload size={22} className="mx-auto text-amber-500 mb-2" />
      <p className="text-sm text-slate-300 mb-1">{label}</p>
      <p className="text-xs text-slate-500 mb-3">Só Usuários Mestre veem esta opção.</p>
      <label className="inline-block bg-amber-500 text-slate-900 font-bold px-4 py-2 rounded-md hover:bg-amber-400 text-sm cursor-pointer">
        {enviando ? "Enviando…" : "Escolher arquivo PDF"}
        <input type="file" accept="application/pdf" onChange={escolherArquivo} disabled={enviando} className="hidden" />
      </label>
      {erro && <p className="text-xs text-rose-400 mt-2">{erro}</p>}
    </div>
  );
}

function ManualAlunoView({ equipe, onIrPara, contexto = "aluno", ehMestre = false }) {
  const [versao, setVersao] = useState(0);
  const manual = useManualPDF("aluno", versao);
  return (
    <div>
      <div className="mb-5">
        <div className="text-xs font-bold tracking-widest text-amber-500 mb-2">CURSO TÉCNICO EM ADMINISTRAÇÃO E CONTABILIDADE</div>
        <h1 className="text-3xl font-bold text-slate-50 mb-2">Manual do Aluno</h1>
        <p className="text-slate-400 max-w-2xl">
          {contexto === "aluno"
            ? `Consulte o guia completo para a equipe ${equipe?.nomeNegocio || ""} — diretamente aqui, ou baixe o PDF.`
            : "Consulte o guia completo que as equipes de alunos seguem — diretamente aqui, ou baixe o PDF."}
        </p>
        {contexto === "aluno" && (
          <div className="flex flex-wrap gap-3 mt-4">
            <button onClick={() => onIrPara("m1")} className="bg-amber-500 text-slate-900 font-bold px-5 py-2.5 rounded-md hover:bg-amber-400 text-sm">Ir para o Módulo 1</button>
            <button onClick={() => onIrPara("inicio")} className="border border-slate-600 text-slate-100 px-5 py-2.5 rounded-md hover:bg-slate-800 text-sm font-semibold">Ver índice de módulos</button>
          </div>
        )}
      </div>

      {ehMestre && <UploadManualPDF chave="aluno" label="Enviar/atualizar o Manual do Aluno em PDF" onEnviado={() => setVersao((v) => v + 1)} />}

      {manual === undefined && <div className="text-sm text-slate-500 py-10 text-center">Carregando…</div>}
      {manual === null && (
        <Card className="p-8 text-center text-slate-500 text-sm">
          <FileBarChart size={26} className="mx-auto mb-2 text-slate-600" />
          O Manual do Aluno em PDF ainda não foi enviado.
        </Card>
      )}
      {manual && <VisualizadorPDF base64={manual.base64} titulo="Manual do Aluno" nomeArquivo={manual.nomeArquivo} />}
    </div>
  );
}

function ManualProfessorView({ ehMestre = false }) {
  const [versao, setVersao] = useState(0);
  const manual = useManualPDF("professor", versao);
  return (
    <div>
      <div className="mb-5">
        <div className="text-xs font-bold tracking-widest text-amber-500 mb-2">CURSO TÉCNICO EM ADMINISTRAÇÃO E CONTABILIDADE</div>
        <h1 className="text-3xl font-bold text-slate-50 mb-2">Manual do Professor</h1>
        <p className="text-slate-400 max-w-2xl">Consulte o guia completo — diretamente aqui, ou baixe o PDF.</p>
      </div>

      {ehMestre && <UploadManualPDF chave="professor" label="Enviar/atualizar o Manual do Professor em PDF" onEnviado={() => setVersao((v) => v + 1)} />}

      {manual === undefined && <div className="text-sm text-slate-500 py-10 text-center">Carregando…</div>}
      {manual === null && (
        <Card className="p-8 text-center text-slate-500 text-sm">
          <FileBarChart size={26} className="mx-auto mb-2 text-slate-600" />
          O Manual do Professor em PDF ainda não foi enviado.
        </Card>
      )}
      {manual && <VisualizadorPDF base64={manual.base64} titulo="Manual do Professor" nomeArquivo={manual.nomeArquivo} />}
    </div>
  );
}

function ManualOperacionalView() {
  return (
    <div>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs font-bold tracking-widest text-amber-500 mb-2">CLAUDE · GITHUB · FIREBASE</div>
          <h1 className="text-3xl font-bold text-slate-50 mb-3">Manual de Operacionalização</h1>
          <p className="text-slate-400 max-w-2xl">Guia de referência para manter e evoluir o projeto — visível só para Usuários Mestre.</p>
        </div>
        <button onClick={() => window.print()} className="no-print flex items-center gap-2 bg-slate-900 border border-slate-700 text-slate-100 text-sm font-semibold px-3 py-2 rounded-md hover:border-amber-500 shrink-0"><FileBarChart size={15} /> Exportar PDF</button>
      </div>

      <div className="space-y-5">
        {OPERACIONAL_SECOES.map((sec, i) => (
          <Card key={i} className="p-6">
            <SectionTitle icon={ScrollText}>{`${i + 1} · ${sec.titulo}`}</SectionTitle>
            {sec.paragrafos?.map((p, j) => (
              <p key={j} className="text-sm text-slate-300 leading-relaxed mb-3 last:mb-0">{p}</p>
            ))}
            {sec.lista && (
              <ol className="list-decimal list-inside space-y-2 text-sm text-slate-300">
                {sec.lista.map((it, j) => <li key={j}>{it}</li>)}
              </ol>
            )}
          </Card>
        ))}
      </div>
      <p className="text-xs text-slate-500 mt-5">Esta é uma versão resumida, para consulta rápida dentro da plataforma. Peça ao Claude o PDF completo (com trechos de código-modelo) sempre que precisar de mais detalhe.</p>
    </div>
  );
}

function ChecklistStatusView() {
  return (
    <div>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs font-bold tracking-widest text-amber-500 mb-2">CLAUDE · GITHUB · FIREBASE</div>
          <h1 className="text-3xl font-bold text-slate-50 mb-3">Checklist de Status</h1>
          <p className="text-slate-400 max-w-2xl">O que já está funcionando e o que ainda precisa de atenção — visível só para Usuários Mestre.</p>
        </div>
        <button onClick={() => window.print()} className="no-print flex items-center gap-2 bg-slate-900 border border-slate-700 text-slate-100 text-sm font-semibold px-3 py-2 rounded-md hover:border-amber-500 shrink-0"><FileBarChart size={15} /> Exportar PDF</button>
      </div>

      <div className="space-y-5">
        {CHECKLIST_SECOES.map((sec, i) => (
          <Card key={i} className="p-6">
            <SectionTitle icon={sec.tom === "ok" ? CheckCircle2 : AlertTriangle}>{sec.titulo}</SectionTitle>
            <ul className="space-y-2">
              {sec.itens.map((it, j) => (
                <li key={j} className="flex items-start gap-2.5 text-sm text-slate-300">
                  {sec.tom === "ok"
                    ? <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    : <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />}
                  {it}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}

function AlunoWorkspace({ user, equipe, equipeKey, onSair, onTrocarEmpresa, professorUid, professorNome, turmaNome, ultimaVersaoVista, onVerNovidades }) {
  const [dados, setDados] = useSharedObject(equipeKey, { lancamentos: defaultLancamentos(), historico: [], comentarios: [] });
  const [aba, setAba] = useState("inicio");
  const [menuAberto, setMenuAberto] = useState(false);
  const [confirmSairAberto, setConfirmSairAberto] = useState(false);
  const irPara = (id) => { setAba(id); setMenuAberto(false); };

  const lanc = mergeLancamentos(dados?.lancamentos);
  const calc = useMemo(() => calcular(lanc), [JSON.stringify(lanc)]);

  // Contador de feedback novo: compara a data de cada comentário com a última
  // vez que esta pessoa abriu a aba "Feedback do Professor" neste navegador.
  const comentarios = dados?.comentarios || [];
  const [ultimaVista, setUltimaVista] = useState(() => {
    try { return Number(localStorage.getItem(`feedback_visto_${equipeKey}`) || 0); } catch { return 0; }
  });
  const naoLidos = comentarios.filter((c) => c.timestamp > ultimaVista).length;
  useEffect(() => {
    if (aba === "feedback" && comentarios.length > 0) {
      const agora = Date.now();
      try { localStorage.setItem(`feedback_visto_${equipeKey}`, String(agora)); } catch {}
      setUltimaVista(agora);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aba]);

  if (dados === undefined) return <LoadingScreen />;

  const updateModulo = (modId, val) => {
    const novo = { ...dados, lancamentos: { ...lanc, [modId]: val } };
    setDados(novo);
  };

  const salvarVersao = () => {
    const nota = prompt("Descreva brevemente o ajuste feito nesta versão (opcional):") || "";
    const snap = { timestamp: Date.now(), indicadores: calc, nota };
    setDados({ ...dados, historico: [...(dados.historico || []), snap] });
    alert("Versão salva! Veja a evolução na aba Análise do Negócio.");
  };

  const addComentario = () => {}; // aluno não comenta, apenas lê

  const menuItems = [
    { id: "manual", label: "Manual do Aluno", icon: BookOpen, num: "00" },
    { id: "inicio", label: "Início", icon: LayoutDashboard, num: null },
    ...MODULOS.map((m) => ({ id: m.id, label: m.nome, icon: m.icon, num: String(m.n).padStart(2, "0") })),
    { id: "analise", label: "Análise do Negócio", icon: TrendingUp, num: null },
    { id: "feedback", label: "Feedback do Professor", icon: MessageSquare, num: null },
    { id: "suporte", label: "Suporte", icon: LifeBuoy, num: null },
    { id: "novidades", label: "Novidades", icon: Megaphone, num: null },
    { id: "tutoriais", label: "Tutoriais", icon: Video, num: null },
  ];

  const baixarBackupEquipe = () => {
    const pacote = { versaoBackup: 1, geradoEm: new Date().toISOString(), equipe, dados };
    baixarArquivo(`backup_${equipe.nomeNegocio.replace(/\s+/g, "_")}.json`, JSON.stringify(pacote, null, 2));
  };

  return (
    <div className="min-h-screen flex bg-slate-950 relative">
      <header className="app-mobile-header md:hidden fixed top-0 inset-x-0 z-20 bg-slate-900 border-b border-white/10 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-white/80 font-semibold truncate"><Building2 size={16} className="shrink-0" /> <span className="truncate">{equipe.nomeNegocio}</span></div>
        <button onClick={() => setMenuAberto(true)} className="relative text-white/80 p-1 shrink-0">
          <Menu size={22} />
          {naoLidos > 0 && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-slate-900" />}
        </button>
      </header>

      {menuAberto && <div onClick={() => setMenuAberto(false)} className="md:hidden fixed inset-0 bg-black/60 z-30" />}

      <aside className={`app-sidebar w-72 bg-slate-900 text-white flex flex-col shrink-0 fixed inset-y-0 left-0 z-40 transition-transform duration-200 md:static md:translate-x-0 ${menuAberto ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-5 border-b border-white/10 flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 text-sm text-white/70"><Building2 size={16} /> {equipe.nomeNegocio}</div>
            <div className="text-xs text-white/50 mt-1">Equipe · {equipe.integrantes.join(", ")}</div>
          </div>
          <button onClick={() => setMenuAberto(false)} className="md:hidden text-white/60 hover:text-white shrink-0"><X size={18} /></button>
        </div>
        <nav className="flex-1 overflow-y-auto py-3">
          {menuItems.map((it) => {
            const Icon = it.icon;
            const active = aba === it.id;
            return (
              <button
                key={it.id}
                onClick={() => irPara(it.id)}
                className={`w-full flex items-center gap-2.5 px-5 py-2.5 text-sm text-left transition ${active ? "bg-white/10 text-white font-semibold border-l-4 border-amber-500" : "text-white/60 hover:bg-white/5 border-l-4 border-transparent"}`}
              >
                {it.num && <span className={`text-[10px] font-mono w-5 shrink-0 ${active ? "text-amber-500" : "text-white/30"}`}>{it.num}</span>}
                <Icon size={16} className="shrink-0" /> <span className="truncate flex-1">{it.label}</span>
                {it.id === "feedback" && naoLidos > 0 && (
                  <span className="text-[10px] font-bold bg-amber-500 text-slate-900 rounded-full px-1.5 py-0.5 shrink-0">{naoLidos}</span>
                )}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10">
          <div className="text-xs text-white/50 mb-2">Progresso geral</div>
          <div className="w-full bg-white/10 rounded-full h-2 mb-3"><div className="bg-amber-500 h-2 rounded-full transition-all" style={{ width: `${calc.progresso}%` }} /></div>
          {onTrocarEmpresa && (
            <button onClick={onTrocarEmpresa} className="flex items-center gap-2 text-sm text-white/70 hover:text-white mb-2"><Building2 size={15} /> Trocar de empresa</button>
          )}
          <button onClick={() => setConfirmSairAberto(true)} className="flex items-center gap-2 text-sm text-white/70 hover:text-white"><LogOut size={15} /> Sair</button>
        </div>
      </aside>

      {confirmSairAberto && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-5">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-sm w-full p-6 text-center">
            <Save size={30} className="mx-auto text-amber-500 mb-3" />
            <h3 className="font-bold text-slate-100 mb-2">Baixar um backup antes de sair?</h3>
            <p className="text-xs text-slate-400 mb-5">Baixa um arquivo com os lançamentos e o histórico de versões da equipe {equipe.nomeNegocio}. Recomendado, mas opcional.</p>
            <button onClick={() => { baixarBackupEquipe(); setConfirmSairAberto(false); onSair(); }} className="w-full bg-amber-500 text-slate-900 font-bold py-2.5 rounded-md hover:bg-amber-400 mb-2">Sim, baixar backup e sair</button>
            <button onClick={() => { setConfirmSairAberto(false); onSair(); }} className="w-full text-sm text-slate-400 hover:text-slate-100 py-1.5">Sair sem backup</button>
          </div>
        </div>
      )}

      {onVerNovidades && <NovidadesOverlay perfil={{ ultimaVersaoVista }} onFechar={onVerNovidades} onIrParaHistorico={() => { onVerNovidades(); irPara("novidades"); }} />}

      <main className="flex-1 overflow-y-auto p-4 pt-20 md:p-8 md:pt-8 max-w-5xl mx-auto w-full">
        {aba === "manual" && <ManualAlunoView equipe={equipe} onIrPara={setAba} />}

        {aba === "inicio" && (
          <div>
            <div className="mb-8">
              <div className="text-xs font-bold tracking-widest text-amber-500 mb-2">CURSO TÉCNICO EM ADMINISTRAÇÃO E CONTABILIDADE</div>
              <h1 className="text-3xl font-bold text-slate-50 mb-3">Plano Financeiro de Negócio</h1>

              <p className="text-slate-400 max-w-2xl">Bem-vindo(a), {user.nome}. Trabalhem módulo a módulo — os cálculos passam automaticamente de um para o outro até chegar aos indicadores de viabilidade do negócio {equipe.nomeNegocio}.</p>
              <div className="flex flex-wrap gap-3 mt-5">
                <button onClick={() => setAba("m1")} className="bg-amber-500 text-slate-900 font-bold px-5 py-2.5 rounded-md hover:bg-amber-400 text-sm">Ir para o módulo 1</button>
                <button onClick={() => setAba("manual")} className="border border-slate-600 text-slate-100 px-5 py-2.5 rounded-md hover:bg-slate-800 text-sm font-semibold">Ver Manual do Aluno</button>
              </div>
            </div>

            <div className="grid sm:grid-cols-4 gap-3 mb-6">
              <StatCard label="Módulos cadastrados" value="13" tone="blue" small />
              <StatCard label="Investimento Total" value={fmtBRL(calc.investimentoTotal)} tone="slate" small />
              <StatCard label="Resultado/mês" value={fmtBRL(calc.resultadoOperacional)} tone={calc.resultadoOperacional >= 0 ? "emerald" : "rose"} small />
              <StatCard label="Progresso" value={`${calc.progresso}%`} tone="gold" small />
            </div>

            <Card className="p-4">
              <SectionTitle icon={ClipboardList} sub="Cliquem em qualquer módulo para começar a preencher.">Índice de módulos</SectionTitle>
              <div className="grid sm:grid-cols-2 gap-2">
                {MODULOS.map((m) => {
                  const Icon = m.icon;
                  return (
                    <button key={m.id} onClick={() => setAba(m.id)} className="flex items-center gap-3 border border-slate-700 rounded-lg p-3 text-left hover:border-amber-500 hover:bg-slate-800 transition">
                      <div className="w-8 h-8 rounded-full bg-slate-900 border border-amber-500/40 text-amber-500 flex items-center justify-center text-xs font-bold shrink-0">{String(m.n).padStart(2, "0")}</div>
                      <Icon size={16} className="text-sky-400 shrink-0" />
                      <span className="text-sm font-medium text-slate-200">{m.nome}</span>
                      <ChevronRight size={15} className="ml-auto text-slate-600" />
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>
        )}

        {MODULOS.map((m) => aba === m.id && (
          <div key={m.id}>
            <button onClick={() => setAba("inicio")} className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-100 mb-4"><ArrowLeft size={15} /> Voltar ao início</button>
            <SectionTitle icon={m.icon} sub={`Módulo ${m.n} de 13`}>{m.nome}</SectionTitle>
            <TeoriaBox modId={m.id} />
            <Card className="p-5">
              {m.id === "m1" && <M1Form data={lanc.m1} update={(v) => updateModulo("m1", v)} />}
              {m.id === "m2" && <M2Form data={lanc.m2} update={(v) => updateModulo("m2", v)} calc={calc} />}
              {m.id === "m3" && <M3Form data={lanc.m3} update={(v) => updateModulo("m3", v)} />}
              {m.id === "m4" && <M4Form data={lanc.m4} update={(v) => updateModulo("m4", v)} calc={calc} />}
              {m.id === "m5" && <M5Form data={lanc.m5} update={(v) => updateModulo("m5", v)} />}
              {m.id === "m6" && <M6Form data={lanc.m6} update={(v) => updateModulo("m6", v)} m5itens={lanc.m5.itens} />}
              {m.id === "m7" && <M7Form data={lanc.m7} update={(v) => updateModulo("m7", v)} faturamento={calc.faturamento} />}
              {m.id === "m8" && <M8Form data={lanc.m8} update={(v) => updateModulo("m8", v)} m5itens={lanc.m5.itens} />}
              {m.id === "m9" && <M9Form data={lanc.m9} update={(v) => updateModulo("m9", v)} />}
              {m.id === "m10" && <M10Form data={lanc.m10} update={(v) => updateModulo("m10", v)} m1itens={lanc.m1.itens} depreciacaoLinhas={calc.depreciacaoLinhas} depreciacaoMensal={calc.depreciacaoMensal} />}
              {m.id === "m11" && <M11Form data={lanc.m11} update={(v) => updateModulo("m11", v)} maoDeObra={calc.maoDeObra} depreciacaoMensal={calc.depreciacaoMensal} />}
              {m.id === "m12" && <M12View calc={calc} />}
              {m.id === "m13" && <M13View calc={calc} />}
            </Card>
            <div className="flex justify-between mt-4">
              <button
                onClick={() => setAba(m.n > 1 ? MODULOS[m.n - 2].id : "inicio")}
                className="flex items-center gap-2 text-sm border border-slate-600 text-slate-100 px-4 py-2 rounded-md hover:bg-slate-800 font-semibold"
              ><ArrowLeft size={15} /> {m.n > 1 ? `Módulo ${m.n - 1}` : "Início"}</button>
              {m.n < MODULOS.length && (
                <button
                  onClick={() => setAba(MODULOS[m.n].id)}
                  className="flex items-center gap-2 text-sm bg-amber-500 text-slate-900 px-4 py-2 rounded-md hover:bg-amber-400 font-bold"
                >Módulo {m.n + 1} <ChevronRight size={15} /></button>
              )}
            </div>
          </div>
        ))}

        {aba === "analise" && (
          <div>
            <button onClick={() => setAba("inicio")} className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-100 mb-4"><ArrowLeft size={15} /> Voltar ao início</button>
            <SectionTitle icon={TrendingUp} sub="Acompanhe os indicadores consolidados e registre ajustes ao longo do projeto.">Análise do Negócio</SectionTitle>
            <AnaliseNegocio calc={calc} historico={dados.historico} onSalvarVersao={salvarVersao} />
          </div>
        )}

        {aba === "feedback" && (
          <div>
            <button onClick={() => setAba("inicio")} className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-100 mb-4"><ArrowLeft size={15} /> Voltar ao início</button>
            <SectionTitle icon={MessageSquare} sub="Comentários e ajustes solicitados pelo(a) professor(a).">Feedback do Professor</SectionTitle>
            <ComentariosPanel comentarios={dados.comentarios} onAdd={addComentario} autor={user.nome} readOnlyInput />
          </div>
        )}

        {aba === "suporte" && (
          <SuporteView ctx={{ uid: user.uid, nome: user.nome, papel: "aluno", mestre: false, professorUid, professorNome, turmaNome }} />
        )}

        {aba === "novidades" && <NovidadesView />}
      </main>
    </div>
  );
}

// ============================================================================
// PAINEL DO PROFESSOR
// ============================================================================

function ModuloLeitura({ mId, lanc, calc }) {
  // Reaproveita exatamente os mesmos formulários que o aluno usa, só que
  // "travados": update() não faz nada e pointer-events-none impede qualquer
  // clique/edição. Garante que o professor vê sempre o mesmo layout e os
  // mesmos cálculos do aluno, sem duplicar código nem risco de desalinhar.
  const noop = () => {};
  return (
    <div className="relative">
      <div className="absolute -top-1 right-0 z-10 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400 bg-slate-800 border border-slate-700 rounded-full px-2.5 py-1">
        <Eye size={11} /> Somente leitura
      </div>
      <div className="pointer-events-none select-none opacity-60 grayscale-[30%] pt-6">
        {mId === "m1" && <M1Form data={lanc.m1} update={noop} />}
        {mId === "m2" && <M2Form data={lanc.m2} update={noop} calc={calc} />}
        {mId === "m3" && <M3Form data={lanc.m3} update={noop} />}
        {mId === "m4" && <M4Form data={lanc.m4} update={noop} calc={calc} />}
        {mId === "m5" && <M5Form data={lanc.m5} update={noop} />}
        {mId === "m6" && <M6Form data={lanc.m6} update={noop} m5itens={lanc.m5.itens} />}
        {mId === "m7" && <M7Form data={lanc.m7} update={noop} faturamento={calc.faturamento} />}
        {mId === "m8" && <M8Form data={lanc.m8} update={noop} m5itens={lanc.m5.itens} />}
        {mId === "m9" && <M9Form data={lanc.m9} update={noop} />}
        {mId === "m10" && <M10Form data={lanc.m10} update={noop} m1itens={lanc.m1.itens} depreciacaoLinhas={calc.depreciacaoLinhas} depreciacaoMensal={calc.depreciacaoMensal} />}
        {mId === "m11" && <M11Form data={lanc.m11} update={noop} maoDeObra={calc.maoDeObra} depreciacaoMensal={calc.depreciacaoMensal} />}
        {mId === "m12" && <M12View calc={calc} />}
        {mId === "m13" && <M13View calc={calc} />}
      </div>
    </div>
  );
}

function ModuloAccordion({ m, aberto, onToggle, lanc, calc, completo, comentarios, onAddComentario, professorNome }) {
  const Icon = m.icon;
  const comentariosModulo = (comentarios || []).filter((c) => c.modulo === `Módulo ${m.n}`);
  return (
    <Card className="p-0 overflow-hidden" id={`prof-mod-${m.id}`}>
      <button onClick={onToggle} className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-800/40">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${completo ? "bg-emerald-950/40 text-emerald-400 border border-emerald-500/40" : "bg-slate-900 border border-amber-500/40 text-amber-500"}`}>
          {completo ? <CheckCircle2 size={14} /> : String(m.n).padStart(2, "0")}
        </div>
        <Icon size={16} className="text-sky-400 shrink-0" />
        <span className="text-sm font-semibold text-slate-100 flex-1">{m.nome}</span>
        {comentariosModulo.length > 0 && (
          <span className="text-[10px] font-bold text-sky-400 bg-sky-950/40 border border-sky-500/30 rounded-full px-2 py-0.5">{comentariosModulo.length} coment.</span>
        )}
        {aberto ? <ChevronDown size={16} className="text-slate-500 shrink-0" /> : <ChevronRight size={16} className="text-slate-500 shrink-0" />}
      </button>
      {aberto && (
        <div className="px-4 pb-4 border-t border-slate-800">
          <div className="pt-4"><ModuloLeitura mId={m.id} lanc={lanc} calc={calc} /></div>
          <ComentariosPanel
            comentarios={comentariosModulo}
            onAdd={onAddComentario}
            autor={professorNome}
            moduloFixo={`Módulo ${m.n}`}
            compact
          />
        </div>
      )}
    </Card>
  );
}

function EquipeReview({ turma, equipe, onVoltar, professorNome }) {
  const equipeKey = `dados_equipe_${equipe.id}`;
  const [dados, setDados] = useSharedObject(equipeKey, { lancamentos: defaultLancamentos(), historico: [], comentarios: [] });
  const [modulosAbertos, setModulosAbertos] = useState(new Set());
  if (dados === undefined) return <LoadingScreen />;
  const lanc = mergeLancamentos(dados.lancamentos);
  const calc = calcular(lanc);

  const addComentario = (c) => setDados({ ...dados, comentarios: [...(dados.comentarios || []), c] });

  const toggleModulo = (id) => {
    const next = new Set(modulosAbertos);
    next.has(id) ? next.delete(id) : next.add(id);
    setModulosAbertos(next);
  };
  const irEExpandir = (id) => {
    setModulosAbertos((prev) => new Set(prev).add(id));
    setTimeout(() => document.getElementById(`prof-mod-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };
  const comentariosGerais = (dados.comentarios || []).filter((c) => c.modulo === "Geral");

  return (
    <div>
      <button onClick={onVoltar} className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-100 mb-4"><ArrowLeft size={15} /> Voltar para {turma.nome}</button>
      <SectionTitle icon={Building2} sub={`Equipe: ${equipe.integrantes.join(", ") || "sem integrantes"} · veja cada módulo exatamente como a equipe preencheu, e deixe comentários direcionados`}>{equipe.nomeNegocio}</SectionTitle>

      <div className="space-y-6">
        <AnaliseNegocio calc={calc} historico={dados.historico} readOnly />

        <Card className="p-4">
          <SectionTitle icon={ClipboardList} sub="Clique em um módulo para abrir e ver o que a equipe preencheu, linha por linha.">Navegar pelos módulos</SectionTitle>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
            {MODULOS.map((m) => {
              const Icon = m.icon;
              const completo = !!calc.preenchidos?.[m.n - 1];
              return (
                <button key={m.id} onClick={() => irEExpandir(m.id)} className="flex items-center gap-2.5 border border-slate-700 rounded-lg p-2.5 text-left hover:border-amber-500 hover:bg-slate-800 transition">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${completo ? "bg-emerald-950/40 text-emerald-400 border border-emerald-500/40" : "bg-slate-900 border border-amber-500/40 text-amber-500"}`}>
                    {completo ? <CheckCircle2 size={12} /> : m.n}
                  </div>
                  <Icon size={14} className="text-sky-400 shrink-0" />
                  <span className="text-xs font-medium text-slate-200 truncate">{m.nome}</span>
                </button>
              );
            })}
          </div>
        </Card>

        <div className="space-y-3">
          {MODULOS.map((m) => (
            <ModuloAccordion
              key={m.id}
              m={m}
              aberto={modulosAbertos.has(m.id)}
              onToggle={() => toggleModulo(m.id)}
              lanc={lanc}
              calc={calc}
              completo={!!calc.preenchidos?.[m.n - 1]}
              comentarios={dados.comentarios}
              onAddComentario={addComentario}
              professorNome={professorNome}
            />
          ))}
        </div>

        <div>
          <div className="text-xs font-bold tracking-widest text-slate-500 mb-2">FEEDBACK GERAL (não ligado a um módulo específico)</div>
          <ComentariosPanel comentarios={comentariosGerais} onAdd={addComentario} autor={professorNome} moduloFixo="Geral" />
        </div>
      </div>
    </div>
  );
}

function FormNovaEmpresa({ turmaId, equipes, setEquipes }) {
  const [nome, setNome] = useState("");
  const [salvando, setSalvando] = useState(false);

  const adicionar = async () => {
    const limpo = nome.trim();
    if (!limpo) return;
    if ((equipes || []).some((e) => e.nomeNegocio.toLowerCase() === limpo.toLowerCase())) {
      setNome("");
      return;
    }
    setSalvando(true);
    const nova = { id: uid(), turmaId, nomeNegocio: limpo, integrantes: [] };
    await setEquipes([...(equipes || []), nova]);
    setNome("");
    setSalvando(false);
  };

  return (
    <div className="flex gap-2">
      <TxtInput value={nome} onChange={setNome} placeholder="Nome da empresa/negócio" />
      <button
        onClick={adicionar}
        disabled={!nome.trim() || salvando}
        className="bg-amber-500 text-slate-900 font-bold px-4 rounded-md text-sm hover:bg-amber-400 disabled:opacity-40 flex items-center gap-1.5 shrink-0"
      >
        <Plus size={15} /> Adicionar
      </button>
    </div>
  );
}

function LinhaRosterPreview({ item, onMudar, onRemover }) {
  return (
    <tr className="border-b border-slate-800">
      <td className="py-1.5 pr-2">
        <input type="checkbox" checked={item.incluir} onChange={(e) => onMudar({ ...item, incluir: e.target.checked })} className="accent-amber-500" />
      </td>
      <td className="py-1.5 pr-2">
        <input
          value={item.nome}
          onChange={(e) => onMudar({ ...item, nome: e.target.value })}
          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-slate-100"
        />
      </td>
      <td className="py-1.5 pr-2 text-slate-400 font-mono text-xs">{item.matricula}</td>
      <td className="py-1.5 pr-1 text-right">
        <button onClick={onRemover} className="text-slate-500 hover:text-rose-400"><Trash2 size={14} /></button>
      </td>
    </tr>
  );
}

function PainelRoster({ turmaId, turmaNome, professorUid, professorNome }) {
  const [roster, setRoster] = useSharedList(`roster_${turmaId}`);
  const [preview, setPreview] = useState(null);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState("");
  const [aberto, setAberto] = useState(false);
  const inputRef = useRef(null);

  const aoSelecionarArquivo = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setErro(""); setProcessando(true);
    try {
      const alunos = await extrairAlunosDoPDF(file);
      if (alunos.length === 0) {
        setErro("Não encontramos nenhum aluno nesse PDF. Confira se é o arquivo \"Estudantes da Turma\" exportado do sistema da escola.");
      } else {
        setPreview(alunos.map((a) => ({ ...a, incluir: true })));
      }
    } catch {
      setErro("Não foi possível ler esse arquivo. Confira se é um PDF válido.");
    }
    setProcessando(false);
  };

  const confirmarImportacao = async () => {
    const novos = preview.filter((a) => a.incluir && a.nome.trim());
    const atual = roster || [];
    const porMatricula = new Map(atual.map((a) => [a.matricula, a]));
    novos.forEach((a) => porMatricula.set(a.matricula, { nome: a.nome.trim().toUpperCase(), matricula: a.matricula }));
    await setRoster(Array.from(porMatricula.values()));
    // Índice matrícula → turma: permite o aluno entrar direto com a própria
    // matrícula (sem precisar de um código de turma compartilhado). Cada
    // matrícula é única, então essa chave já resolve turma + nome oficial.
    try {
      await Promise.all(novos.map((a) =>
        window.storage.set(`matricula_${a.matricula}`, JSON.stringify({
          turmaId, turmaNome, nome: a.nome.trim().toUpperCase(), matricula: a.matricula,
          professorUid, professorNome,
        }), true)
      ));
    } catch {}
    setPreview(null);
  };

  if (roster === null) return null;

  return (
    <Card className="p-4">
      <button onClick={() => setAberto(!aberto)} className="w-full flex items-center justify-between">
        <SectionTitle icon={ListChecks} sub="Importe a lista oficial da escola (PDF) para agilizar a aprovação de cadastros: quem estiver na lista é aprovado automaticamente.">
          Lista oficial de alunos ({roster.length})
        </SectionTitle>
        {aberto ? <ChevronDown size={18} className="text-slate-500 shrink-0 mt-1" /> : <ChevronRight size={18} className="text-slate-500 shrink-0 mt-1" />}
      </button>

      {aberto && (
        <div className="mt-3">
          {!preview && (
            <>
              <input ref={inputRef} type="file" accept="application/pdf" onChange={aoSelecionarArquivo} className="hidden" />
              <button
                onClick={() => inputRef.current?.click()}
                disabled={processando}
                className="flex items-center gap-2 bg-slate-900 border border-slate-700 hover:border-amber-500 text-slate-100 text-sm font-semibold px-4 py-2 rounded-md disabled:opacity-50"
              >
                <Upload size={15} /> {processando ? "Lendo PDF…" : "Importar lista (PDF)"}
              </button>
              {erro && <p className="text-sm text-rose-400 mt-2">{erro}</p>}
              {roster.length > 0 && (
                <div className="mt-3 max-h-52 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-slate-500 border-b border-slate-700">
                        <th className="py-1.5 pr-2">Nome</th><th className="py-1.5 pr-2">Matrícula</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roster.map((a) => (
                        <tr key={a.matricula} className="border-b border-slate-800">
                          <td className="py-1 pr-2 text-slate-300">{a.nome}</td>
                          <td className="py-1 pr-2 text-slate-500 font-mono">{a.matricula}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {preview && (
            <div>
              <p className="text-sm text-slate-400 mb-2">
                Encontramos {preview.length} aluno(s). Confira os nomes, desmarque quem não deve entrar, e confirme.
              </p>
              <div className="max-h-64 overflow-y-auto mb-3">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase text-slate-500 border-b border-slate-700">
                      <th className="py-1.5 pr-2 w-8"></th><th className="py-1.5 pr-2">Nome</th><th className="py-1.5 pr-2">Matrícula</th><th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((item, i) => (
                      <LinhaRosterPreview
                        key={item.matricula}
                        item={item}
                        onMudar={(novo) => setPreview(preview.map((p, j) => (j === i ? novo : p)))}
                        onRemover={() => setPreview(preview.filter((_, j) => j !== i))}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-2">
                <button onClick={confirmarImportacao} className="bg-amber-500 text-slate-900 font-bold px-4 py-2 rounded-md text-sm hover:bg-amber-400">
                  Confirmar importação ({preview.filter((a) => a.incluir).length} alunos)
                </button>
                <button onClick={() => setPreview(null)} className="text-sm text-slate-400 hover:text-slate-100 px-3">Cancelar</button>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function TurmaDetail({ turma, onVoltar, professorNome }) {
  const [equipes, setEquipes] = useSharedList(`equipes_${turma.id}`);
  const [equipeSel, setEquipeSel] = useState(null);

  if (equipeSel) {
    const eq = equipes.find((e) => e.id === equipeSel);
    return <EquipeReview turma={turma} equipe={eq} professorNome={professorNome} onVoltar={() => setEquipeSel(null)} />;
  }

  const renomearEmpresa = async (equipe) => {
    const novoNome = (prompt("Novo nome da empresa:", equipe.nomeNegocio) || "").trim();
    if (!novoNome || novoNome === equipe.nomeNegocio) return;
    if (equipes.some((e) => e.id !== equipe.id && e.nomeNegocio.toLowerCase() === novoNome.toLowerCase())) {
      alert("Já existe uma empresa com esse nome nesta turma.");
      return;
    }
    await setEquipes(equipes.map((e) => (e.id === equipe.id ? { ...e, nomeNegocio: novoNome } : e)));
  };

  const excluirEmpresa = async (equipe) => {
    const ok = window.confirm(
      `Excluir a empresa "${equipe.nomeNegocio}"?\n\nOs lançamentos dela serão apagados permanentemente, e os alunos vinculados a ela poderão escolher outra empresa da turma no próximo acesso.`
    );
    if (!ok) return;
    await setEquipes(equipes.filter((e) => e.id !== equipe.id));
    try { await window.storage.delete(`dados_equipe_${equipe.id}`, true); } catch {}
    await desvincularAlunosDaEquipe(turma.id, equipe.id);
  };

  return (
    <div className="space-y-5">
      <button onClick={onVoltar} className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-100"><ArrowLeft size={15} /> Minhas turmas</button>
      <div className="flex items-center justify-between">
        <SectionTitle icon={School} sub="O jeito preferido é a matrícula (via lista importada abaixo). Este código de turma é só uma alternativa, para quem ainda não está na lista:">{turma.nome}</SectionTitle>
        <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2">
          <KeyRound size={16} className="text-amber-400" />
          <span className="font-mono font-bold tracking-widest text-slate-100">{turma.codigo}</span>
        </div>
      </div>

      <PainelRoster turmaId={turma.id} turmaNome={turma.nome} professorUid={turma.professorUid} professorNome={turma.professor} />

      <Card className="p-4">
        <SectionTitle icon={Building2} sub="Cadastre aqui os nomes das empresas/negócios da turma — os alunos escolherão entre elas ao entrar (em vez de digitar um nome livre).">
          Empresas da turma
        </SectionTitle>
        {equipes !== null && <FormNovaEmpresa turmaId={turma.id} equipes={equipes} setEquipes={setEquipes} />}
      </Card>

      {equipes === null && <LoadingScreen />}
      {equipes && equipes.length === 0 && (
        <Card className="p-8 text-center text-slate-500">Nenhuma empresa cadastrada ainda. Use o formulário acima para adicionar.</Card>
      )}
      {equipes && equipes.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {equipes.map((eq) => (
            <EquipeCard
              key={eq.id}
              equipe={eq}
              onClick={() => setEquipeSel(eq.id)}
              onRenomear={() => renomearEmpresa(eq)}
              onExcluir={() => excluirEmpresa(eq)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Quando uma empresa é excluída (ou um aluno é movido para fora dela), os
// alunos que estavam nela ficam sem equipeId — no próximo acesso, caem de
// volta na tela "Escolher empresa" da mesma turma, sem perder o cadastro.
async function desvincularAlunosDaEquipe(turmaId, equipeId) {
  try {
    const todos = await listarUsuarios();
    const afetados = todos.filter((u) => u.papel === "aluno" && u.turmaId === turmaId && u.equipeId === equipeId);
    await Promise.all(afetados.map((u) => atualizarUsuario(u.uid, { equipeId: null })));
  } catch {}
}

function EquipeCard({ equipe, onClick, onRenomear, onExcluir }) {
  const equipeKey = `dados_equipe_${equipe.id}`;
  const [dados] = useSharedObject(equipeKey, { lancamentos: defaultLancamentos(), historico: [] });
  const calc = dados ? calcular(dados.lancamentos) : null;
  return (
    <div className="relative bg-slate-800 border border-slate-700 rounded-xl hover:border-amber-500 transition">
      {(onRenomear || onExcluir) && (
        <div className="absolute top-2 right-2 flex gap-1 z-10">
          {onRenomear && (
            <button onClick={(e) => { e.stopPropagation(); onRenomear(); }} title="Renomear empresa" className="p-1.5 rounded-md bg-slate-900/80 text-slate-400 hover:text-amber-400">
              <Pencil size={13} />
            </button>
          )}
          {onExcluir && (
            <button onClick={(e) => { e.stopPropagation(); onExcluir(); }} title="Excluir empresa" className="p-1.5 rounded-md bg-slate-900/80 text-slate-400 hover:text-rose-400">
              <Trash2 size={13} />
            </button>
          )}
        </div>
      )}
      <button onClick={onClick} className="text-left p-4 w-full">
      <div className="flex items-center gap-2 mb-1 pr-12">
        <Building2 size={16} className="text-sky-400 shrink-0" />
        <span className="font-bold text-slate-100 truncate">{equipe.nomeNegocio}</span>
      </div>
      <div className="text-xs text-slate-500 mb-3">{equipe.integrantes.join(", ") || "sem integrantes"}</div>
      {calc ? (
        <>
          <div className="w-full bg-slate-700 rounded-full h-1.5 mb-2">
            <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${calc.progresso}%` }} />
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">{calc.progresso}% preenchido</span>
            <span className={calc.resultadoOperacional >= 0 ? "text-emerald-400 font-semibold" : "text-rose-400 font-semibold"}>
              {fmtBRL(calc.resultadoOperacional)}/mês
            </span>
          </div>
        </>
      ) : <span className="text-xs text-slate-300">Carregando…</span>}
      </button>
    </div>
  );
}

function SeletorTurma({ turmas, value, onChange }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="border border-slate-600 bg-slate-900 text-slate-100 rounded-md px-3 py-2 text-sm">
      <option value="">Selecione uma turma…</option>
      {turmas.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
    </select>
  );
}

// Apaga permanentemente tudo que pertence a uma turma: empresas/equipes,
// lançamentos de cada uma, a lista oficial de alunos importada, o código de
// acesso e as contas dos alunos vinculados a ela. Não mexe na lista de
// turmas do professor — quem chama essa função cuida disso depois.
async function excluirTurmaCompleta(turma) {
  try {
    const r = await window.storage.get(`equipes_${turma.id}`, true);
    const equipes = r ? JSON.parse(r.value) : [];
    for (const equipe of equipes) {
      try { await window.storage.delete(`dados_equipe_${equipe.id}`, true); } catch {}
    }
  } catch {}
  try { await window.storage.delete(`equipes_${turma.id}`, true); } catch {}
  try {
    const rr = await window.storage.get(`roster_${turma.id}`, true);
    const roster = rr ? JSON.parse(rr.value) : [];
    await Promise.all(roster.map((a) => window.storage.delete(`matricula_${a.matricula}`, true).catch(() => {})));
  } catch {}
  try { await window.storage.delete(`roster_${turma.id}`, true); } catch {}
  try { await window.storage.delete(`turma_por_codigo_${turma.codigo}`, true); } catch {}
  try {
    const todos = await listarUsuarios();
    const afetados = todos.filter((u) => u.papel === "aluno" && u.turmaId === turma.id);
    await Promise.all(afetados.map((u) => excluirUsuario(u.uid)));
  } catch {}
}

function GestaoTurmasView({ turmas, onCriar, onAbrir, setTurmas }) {
  const [novoNome, setNovoNome] = useState("");
  const [excluindoId, setExcluindoId] = useState(null);
  const criar = () => { if (novoNome.trim()) { onCriar(novoNome.trim()); setNovoNome(""); } };

  const excluir = async (t) => {
    const ok = window.confirm(
      `Excluir a turma "${t.nome}"?\n\nIsso vai apagar permanentemente todas as empresas, lançamentos, a lista oficial de alunos e as contas dos alunos vinculados a ela. Essa ação não pode ser desfeita.\n\nDica: se quiser guardar uma cópia antes, cancele e use Gestão → Backup → Exportar.`
    );
    if (!ok) return;
    setExcluindoId(t.id);
    await excluirTurmaCompleta(t);
    await setTurmas(turmas.filter((x) => x.id !== t.id));
    setExcluindoId(null);
  };

  return (
    <div>
      <SectionTitle icon={School} sub="Crie turmas, compartilhe o código com os alunos e acompanhe o plano financeiro de cada equipe.">Turmas</SectionTitle>
      <Card className="p-4 mb-6 flex gap-2 items-end max-w-lg">
        <div className="flex-1">
          <Field label="Nova turma">
            <TxtInput value={novoNome} onChange={setNovoNome} placeholder="Ex.: Técnico em Administração — 2026/1" />
          </Field>
        </div>
        <button onClick={criar} className="bg-amber-500 text-slate-900 px-4 py-2 rounded-md text-sm font-bold hover:bg-amber-400 flex items-center gap-2 mb-3"><Plus size={16} /> Criar</button>
      </Card>

      {turmas.length === 0 ? (
        <Card className="p-10 text-center text-slate-500">Você ainda não criou nenhuma turma.</Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {turmas.map((t) => (
            <div key={t.id} className="relative bg-slate-800 border border-slate-700 rounded-xl hover:border-amber-500 transition">
              <button
                onClick={(e) => { e.stopPropagation(); excluir(t); }}
                disabled={excluindoId === t.id}
                title="Excluir turma"
                className="absolute top-2 right-2 z-10 p-1.5 rounded-md bg-slate-900/80 text-slate-400 hover:text-rose-400 disabled:opacity-40"
              >
                <Trash2 size={13} />
              </button>
              <button onClick={() => onAbrir(t.id)} className="text-left p-4 w-full">
                <div className="flex items-center gap-2 mb-2 pr-6"><School size={16} className="text-sky-400 shrink-0" /><span className="font-bold text-slate-100 truncate">{t.nome}</span></div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <KeyRound size={13} /> Código: <span className="font-mono font-bold text-amber-400">{t.codigo}</span>
                </div>
                {excluindoId === t.id && <div className="text-xs text-rose-400 mt-2">Excluindo…</div>}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Painel para o professor corrigir a turma e/ou empresa de um aluno — usado
// tanto para consertar um cadastro feito errado quanto para mudar alguém de
// turma ou de empresa no meio do período.
function EditarAlunoPanel({ aluno, turmas, onFechar, onSalvo }) {
  const [turmaId, setTurmaId] = useState(aluno.turmaId || "");
  const [empresaId, setEmpresaId] = useState(aluno.equipeId || "");
  const [empresas, setEmpresas] = useState(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    let alive = true;
    setEmpresas(null);
    // Se a turma escolhida for a mesma de antes, mantém a empresa atual
    // selecionada; se for outra turma, começa sem empresa (a lista é diferente).
    setEmpresaId(turmaId === aluno.turmaId ? (aluno.equipeId || "") : "");
    if (!turmaId) { setEmpresas([]); return; }
    (async () => {
      try {
        const r = await window.storage.get(`equipes_${turmaId}`, true);
        const lista = r ? JSON.parse(r.value) : [];
        if (alive) setEmpresas(lista);
      } catch { if (alive) setEmpresas([]); }
    })();
    return () => { alive = false; };
  }, [turmaId]);

  const salvar = async () => {
    setSalvando(true);
    try {
      // 1. Se já estava em alguma empresa (dessa turma ou de outra) e vai
      //    mudar, remove o nome dela primeiro.
      if (aluno.turmaId && aluno.equipeId && (aluno.turmaId !== turmaId || aluno.equipeId !== empresaId)) {
        try {
          const r = await window.storage.get(`equipes_${aluno.turmaId}`, true);
          const lista = r ? JSON.parse(r.value) : [];
          const nova = lista.map((e) => (e.id === aluno.equipeId ? { ...e, integrantes: e.integrantes.filter((n) => n !== aluno.nome) } : e));
          await window.storage.set(`equipes_${aluno.turmaId}`, JSON.stringify(nova), true);
        } catch {}
      }
      // 2. Se escolheu uma empresa nova, adiciona o nome nela.
      if (empresaId && (aluno.turmaId !== turmaId || aluno.equipeId !== empresaId)) {
        try {
          const r = await window.storage.get(`equipes_${turmaId}`, true);
          const lista = r ? JSON.parse(r.value) : [];
          const nova = lista.map((e) => (e.id === empresaId && !e.integrantes.includes(aluno.nome) ? { ...e, integrantes: [...e.integrantes, aluno.nome] } : e));
          await window.storage.set(`equipes_${turmaId}`, JSON.stringify(nova), true);
        } catch {}
      }
      // 3. Atualiza o cadastro do aluno com a turma/empresa definitivas.
      const turmaObj = turmas.find((t) => t.id === turmaId);
      await atualizarUsuario(aluno.uid, {
        turmaId: turmaId || null,
        turmaNome: turmaObj ? turmaObj.nome : null,
        equipeId: empresaId || null,
      });
      onSalvo();
    } catch {
      alert("Não foi possível salvar. Tente novamente.");
    }
    setSalvando(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) onFechar(); }}>
      <Card className="p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <SectionTitle icon={UserCog} sub="Corrija a turma e/ou a empresa desta pessoa — por exemplo, se o cadastro foi feito errado ou se ela mudou de turma/empresa.">
          Editar aluno(a)
        </SectionTitle>
        <div className="text-sm font-semibold text-slate-100 mb-1">{aluno.nome}</div>
        <div className="text-xs text-slate-500 mb-4">{aluno.email}</div>

        <Field label="Turma">
          <select value={turmaId} onChange={(e) => setTurmaId(e.target.value)} className="w-full border border-slate-600 bg-slate-900 text-slate-100 rounded-md px-3 py-2 text-sm">
            <option value="">Nenhuma (remove da turma)</option>
            {turmas.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
          </select>
        </Field>

        {turmaId && (
          <Field label="Empresa" hint={empresas && empresas.length === 0 ? "Essa turma ainda não tem empresas cadastradas." : "Deixe em branco para a pessoa escolher no próximo acesso."}>
            <select value={empresaId} onChange={(e) => setEmpresaId(e.target.value)} disabled={empresas === null} className="w-full border border-slate-600 bg-slate-900 text-slate-100 rounded-md px-3 py-2 text-sm disabled:opacity-40">
              <option value="">Nenhuma (escolherá depois)</option>
              {(empresas || []).map((eq) => <option key={eq.id} value={eq.id}>{eq.nomeNegocio}</option>)}
            </select>
          </Field>
        )}

        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onFechar} className="px-4 py-2 rounded-md text-sm font-semibold text-slate-300 hover:bg-slate-800">Cancelar</button>
          <button onClick={salvar} disabled={salvando} className="bg-amber-500 text-slate-900 font-bold px-4 py-2 rounded-md hover:bg-amber-400 disabled:opacity-40 text-sm">
            {salvando ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </Card>
    </div>
  );
}

function GestaoUsuariosView({ turmas }) {
  const [turmaId, setTurmaId] = useState("");
  const turma = turmas.find((t) => t.id === turmaId);
  const [refreshKey, setRefreshKey] = useState(0);
  const equipesComDados = useEquipesComDados(turmaId, refreshKey);
  const usuarios = useListaUsuarios(refreshKey);
  const [editando, setEditando] = useState(null);

  const alunosDaTurma = (usuarios || []).filter((u) => u.papel === "aluno" && u.turmaId === turmaId);
  const nomeEmpresa = (equipeId) => equipesComDados?.find((d) => d.equipe.id === equipeId)?.equipe?.nomeNegocio;

  return (
    <div>
      <SectionTitle icon={Users} sub="Veja quem está participando de cada turma e corrija a turma/empresa de um aluno quando necessário.">Usuários</SectionTitle>
      <SeletorTurma turmas={turmas} value={turmaId} onChange={setTurmaId} />
      {!turmaId && <Card className="p-8 text-center text-slate-500 mt-4">Selecione uma turma para ver os usuários.</Card>}
      {turmaId && (
        <Card className="p-4 mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-500 border-b border-slate-700">
                <th className="py-2 pr-3">Nome</th><th className="py-2 pr-3">Papel</th><th className="py-2 pr-3">Empresa</th><th className="py-2 pr-3"></th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-800">
                <td className="py-2 pr-3 font-semibold text-slate-100">{turma?.professor}</td>
                <td className="py-2 pr-3 text-amber-400">Professor(a)</td>
                <td className="py-2 pr-3 text-slate-500">—</td>
                <td className="py-2 pr-3"></td>
              </tr>
              {(usuarios === null || equipesComDados === null) && <tr><td colSpan={4} className="py-4 text-slate-500">Carregando…</td></tr>}
              {usuarios !== null && alunosDaTurma.length === 0 && <tr><td colSpan={4} className="py-4 text-slate-500">Nenhum aluno nesta turma ainda.</td></tr>}
              {usuarios !== null && equipesComDados !== null && alunosDaTurma.map((u) => (
                <tr key={u.uid} className="border-b border-slate-800">
                  <td className="py-2 pr-3 text-slate-100">{u.nome}</td>
                  <td className="py-2 pr-3 text-sky-400">Aluno(a)</td>
                  <td className="py-2 pr-3">
                    {nomeEmpresa(u.equipeId) || <span className="text-slate-600 italic">Sem empresa escolhida</span>}
                  </td>
                  <td className="py-2 pr-3 text-right">
                    <button onClick={() => setEditando(u)} className="flex items-center gap-1.5 ml-auto bg-slate-900 border border-slate-700 hover:border-amber-500 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-md">
                      <Pencil size={13} /> Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {editando && (
        <EditarAlunoPanel
          aluno={editando}
          turmas={turmas}
          onFechar={() => setEditando(null)}
          onSalvo={() => { setEditando(null); setRefreshKey((k) => k + 1); }}
        />
      )}
    </div>
  );
}

function ResumoComparativo({ turma, dadosEquipes }) {
  const exportarCSV = () => {
    if (!dadosEquipes || !turma) return;
    const linhas = [["Equipe", "Integrantes", "Faturamento Mensal", "Investimento Total", "Resultado/mês", "Ponto de Equilíbrio (anual)", "Progresso (%)"]];
    dadosEquipes.forEach(({ equipe, calc }) => {
      linhas.push([
        equipe.nomeNegocio,
        equipe.integrantes.join(" | "),
        calc.faturamento.toFixed(2).replace(".", ","),
        calc.investimentoTotal.toFixed(2).replace(".", ","),
        calc.resultadoOperacional.toFixed(2).replace(".", ","),
        calc.pontoEquilibrio != null ? calc.pontoEquilibrio.toFixed(2).replace(".", ",") : "",
        String(calc.progresso),
      ]);
    });
    const csv = linhas.map((l) => l.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";")).join("\n");
    baixarArquivo(`relatorio_${turma.nome.replace(/\s+/g, "_")}.csv`, csv, "text/csv;charset=utf-8");
  };

  if (dadosEquipes === null) return <LoadingScreen />;
  if (dadosEquipes.length === 0) return <Card className="p-8 text-center text-slate-500">Nenhuma empresa nesta turma ainda.</Card>;

  return (
    <div>
      <div className="flex justify-end gap-2 mb-3 no-print">
        <button onClick={() => window.print()} className="flex items-center gap-2 bg-slate-900 border border-slate-700 text-slate-100 text-sm font-semibold px-3 py-2 rounded-md hover:border-amber-500"><FileBarChart size={15} /> Exportar PDF</button>
        <button onClick={exportarCSV} className="flex items-center gap-2 bg-slate-900 border border-slate-700 text-slate-100 text-sm font-semibold px-3 py-2 rounded-md hover:border-amber-500"><Save size={15} /> Exportar CSV</button>
      </div>
      <Card className="p-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-slate-500 border-b border-slate-700">
              <th className="py-2 pr-3">Equipe</th><th className="py-2 pr-3">Faturamento/mês</th><th className="py-2 pr-3">Investimento Total</th><th className="py-2 pr-3">Resultado/mês</th><th className="py-2 pr-3">Ponto de Equilíbrio</th><th className="py-2 pr-3">Progresso</th>
            </tr>
          </thead>
          <tbody>
            {dadosEquipes.map(({ equipe, calc }) => (
              <tr key={equipe.id} className="border-b border-slate-800">
                <td className="py-2 pr-3 font-semibold text-slate-100">{equipe.nomeNegocio}</td>
                <td className="py-2 pr-3">{fmtBRL(calc.faturamento)}</td>
                <td className="py-2 pr-3">{fmtBRL(calc.investimentoTotal)}</td>
                <td className={`py-2 pr-3 ${calc.resultadoOperacional >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{fmtBRL(calc.resultadoOperacional)}</td>
                <td className="py-2 pr-3">{calc.pontoEquilibrio != null ? fmtBRL(calc.pontoEquilibrio) : "—"}</td>
                <td className="py-2 pr-3">{calc.progresso}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

const TIPOS_RELATORIO = [
  { id: "dre", label: "Demonstrativo de Resultado", icon: FileBarChart },
  { id: "indicadores", label: "Indicadores de Viabilidade", icon: Target },
  { id: "analise", label: "Análise do Negócio", icon: TrendingUp },
  { id: "gerencial", label: "Relatório Gerencial (completo)", icon: FileSpreadsheet },
];

function RelatorioPorEmpresa({ dadosEquipes }) {
  const [equipeId, setEquipeId] = useState("");
  const [tipo, setTipo] = useState("gerencial");

  if (dadosEquipes === null) return <LoadingScreen />;
  if (dadosEquipes.length === 0) return <Card className="p-8 text-center text-slate-500">Nenhuma empresa nesta turma ainda.</Card>;

  const selecionada = dadosEquipes.find((d) => d.equipe.id === equipeId);

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4">
        <select value={equipeId} onChange={(e) => setEquipeId(e.target.value)} className="border border-slate-600 bg-slate-900 text-slate-100 rounded-md px-3 py-2 text-sm">
          <option value="">Selecione a empresa…</option>
          {dadosEquipes.map(({ equipe }) => <option key={equipe.id} value={equipe.id}>{equipe.nomeNegocio}</option>)}
        </select>
      </div>

      {!selecionada && <Card className="p-8 text-center text-slate-500">Escolha uma empresa para ver o relatório.</Card>}

      {selecionada && (
        <div>
          <div className="flex flex-wrap gap-2 mb-5">
            {TIPOS_RELATORIO.map((t) => {
              const Icon = t.icon;
              const ativo = tipo === t.id;
              return (
                <button key={t.id} onClick={() => setTipo(t.id)}
                  className={`flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-md border transition ${ativo ? "bg-amber-500 text-slate-900 border-amber-500" : "bg-slate-900 text-slate-300 border-slate-700 hover:border-amber-500"}`}>
                  <Icon size={15} /> {t.label}
                </button>
              );
            })}
          </div>

          <div className="mb-4">
            <div className="text-xs font-bold tracking-widest text-amber-500 uppercase">{selecionada.equipe.nomeNegocio}</div>
            <div className="text-xs text-slate-500">{selecionada.equipe.integrantes.join(", ") || "sem integrantes"}</div>
          </div>

          {(tipo === "dre" || tipo === "gerencial") && (
            <div className="mb-8">
              {tipo === "gerencial" && <h3 className="text-sm font-bold text-slate-200 mb-2">1. Demonstrativo de Resultado</h3>}
              <Card className="p-4"><M12View calc={selecionada.calc} /></Card>
            </div>
          )}
          {(tipo === "indicadores" || tipo === "gerencial") && (
            <div className="mb-8">
              {tipo === "gerencial" && <h3 className="text-sm font-bold text-slate-200 mb-2">2. Indicadores de Viabilidade</h3>}
              <M13View calc={selecionada.calc} />
            </div>
          )}
          {(tipo === "analise" || tipo === "gerencial") && (
            <div>
              {tipo === "gerencial" && <h3 className="text-sm font-bold text-slate-200 mb-2">3. Análise do Negócio</h3>}
              <AnaliseNegocio calc={selecionada.calc} historico={selecionada.dados.historico} readOnly />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RelatorioPendencias({ turma, dadosEquipes }) {
  const [roster] = useSharedList(`roster_${turma.id}`);
  const usuarios = useListaUsuarios();

  if (roster === null || usuarios === null || dadosEquipes === null) return <LoadingScreen />;

  const alunosDaTurma = usuarios.filter((u) => u.papel === "aluno" && u.turmaId === turma.id);
  const nomesRegistrados = new Set(alunosDaTurma.map((u) => normalizarNome(u.nome)));
  const faltando = roster.filter((a) => !nomesRegistrados.has(normalizarNome(a.nome)));

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-bold text-slate-200 mb-2">
          Alunos da lista oficial que ainda não se cadastraram
          {roster.length > 0 && ` (${faltando.length} de ${roster.length})`}
        </h3>
        {roster.length === 0 && (
          <Card className="p-6 text-center text-slate-500 text-sm">Nenhuma lista oficial importada para esta turma ainda (Gestão → Turmas → abra a turma → "Lista oficial de alunos").</Card>
        )}
        {roster.length > 0 && faltando.length === 0 && (
          <Card className="p-6 text-center text-emerald-400 text-sm flex items-center justify-center gap-2"><CheckCircle2 size={16} /> Todos os alunos da lista já se cadastraram.</Card>
        )}
        {faltando.length > 0 && (
          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-slate-500 border-b border-slate-700 bg-slate-900/40">
                  <th className="py-2 px-4">Nome</th><th className="py-2 px-4">Matrícula</th>
                </tr>
              </thead>
              <tbody>
                {faltando.map((a) => (
                  <tr key={a.matricula} className="border-b border-slate-800">
                    <td className="py-2 px-4 text-slate-200">{a.nome}</td>
                    <td className="py-2 px-4 text-slate-500 font-mono text-xs">{a.matricula}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </Card>
        )}
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-200 mb-2">Progresso das empresas</h3>
        {dadosEquipes.length === 0 && <Card className="p-6 text-center text-slate-500 text-sm">Nenhuma empresa cadastrada nesta turma ainda.</Card>}
        {dadosEquipes.length > 0 && (
          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="text-left text-xs uppercase text-slate-500 border-b border-slate-700 bg-slate-900/40">
                  <th className="py-2 px-4">Empresa</th><th className="py-2 px-4">Integrantes</th><th className="py-2 px-4">Progresso</th><th className="py-2 px-4">O que falta</th>
                </tr>
              </thead>
              <tbody>
                {dadosEquipes.map(({ equipe, calc }) => {
                  const nomesFaltando = MODULOS.filter((_, i) => !calc.preenchidos?.[i]).map((m) => `${m.n}. ${m.nome}`);
                  return (
                    <tr key={equipe.id} className="border-b border-slate-800">
                      <td className="py-2 px-4 font-semibold text-slate-100">{equipe.nomeNegocio}</td>
                      <td className="py-2 px-4 text-slate-400">{equipe.integrantes.join(", ") || "sem integrantes"}</td>
                      <td className="py-2 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-slate-700 rounded-full h-1.5"><div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${calc.progresso}%` }} /></div>
                          <span className="text-xs text-slate-400">{calc.progresso}%</span>
                        </div>
                      </td>
                      <td className="py-2 px-4 text-xs text-slate-400 max-w-xs">
                        {nomesFaltando.length === 0
                          ? <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 size={13} /> Completo</span>
                          : nomesFaltando.join(", ")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

const ABAS_RELATORIO = [
  { id: "resumo", label: "Resumo Comparativo", icon: FileBarChart },
  { id: "empresa", label: "Relatório por Empresa", icon: Building2 },
  { id: "pendencias", label: "Pendências", icon: ClipboardCheck },
];

function GestaoRelatoriosView({ turmas }) {
  const [turmaId, setTurmaId] = useState("");
  const [aba, setAba] = useState("resumo");
  const turma = turmas.find((t) => t.id === turmaId);
  const dadosEquipes = useEquipesComDados(turmaId);

  return (
    <div>
      <SectionTitle icon={FileBarChart} sub="Escolha a turma e o tipo de relatório para acompanhar o desempenho das equipes.">Relatórios</SectionTitle>
      <div className="mb-4">
        <SeletorTurma turmas={turmas} value={turmaId} onChange={setTurmaId} />
      </div>

      {!turmaId && <Card className="p-8 text-center text-slate-500">Selecione uma turma para ver os relatórios.</Card>}

      {turmaId && (
        <div>
          <div className="flex flex-wrap gap-2 mb-5 border-b border-slate-800 pb-4">
            {ABAS_RELATORIO.map((a) => {
              const Icon = a.icon;
              const ativo = aba === a.id;
              return (
                <button key={a.id} onClick={() => setAba(a.id)}
                  className={`flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-md transition ${ativo ? "bg-white/10 text-amber-400" : "text-slate-400 hover:text-slate-100"}`}>
                  <Icon size={15} /> {a.label}
                </button>
              );
            })}
          </div>
          {aba === "resumo" && <ResumoComparativo turma={turma} dadosEquipes={dadosEquipes} />}
          {aba === "empresa" && <RelatorioPorEmpresa dadosEquipes={dadosEquipes} />}
          {aba === "pendencias" && <RelatorioPendencias turma={turma} dadosEquipes={dadosEquipes} />}
        </div>
      )}
    </div>
  );
}

function GestaoBackupView({ turmas, setTurmas }) {
  const [turmaId, setTurmaId] = useState("");
  const turma = turmas.find((t) => t.id === turmaId);
  const dadosEquipes = useEquipesComDados(turmaId);
  const [status, setStatus] = useState("");
  const [excluindo, setExcluindo] = useState(false);

  // Apaga permanentemente uma turma: empresas/equipes, lançamentos de cada uma,
  // a lista oficial de alunos importada e as contas dos alunos que estavam
  // vinculados a ela. Usado ao final do ano/semestre letivo, depois de já ter
  // sido feito o backup, para abrir espaço para as turmas do próximo período.
  const excluirTurma = async () => {
    if (!turma) return;
    const ok = window.confirm(
      `Tem certeza que deseja excluir a turma "${turma.nome}"?\n\nIsso vai apagar permanentemente todas as empresas, lançamentos, a lista oficial de alunos e as contas dos alunos vinculados a ela. Essa ação não pode ser desfeita.`
    );
    if (!ok) return;

    setExcluindo(true);
    setStatus("Excluindo turma…");
    try {
      await excluirTurmaCompleta(turma);
      await setTurmas(turmas.filter((t) => t.id !== turma.id));
      setTurmaId("");
      setStatus(`Turma "${turma.nome}" excluída com sucesso.`);
    } catch {
      setStatus("Não foi possível concluir a exclusão. Tente novamente.");
    }
    setExcluindo(false);
  };

  const exportarBackup = () => {
    if (!turma || !dadosEquipes) return;
    const pacote = { versaoBackup: 1, geradoEm: new Date().toISOString(), turma, equipes: dadosEquipes.map(({ equipe, dados }) => ({ equipe, dados })) };
    baixarArquivo(`backup_${turma.nome.replace(/\s+/g, "_")}.json`, JSON.stringify(pacote, null, 2));
    setStatus("Backup exportado com sucesso.");
  };

  const importarBackup = async (file) => {
    if (!turma) return;
    const ok = window.confirm(
      `Importar este backup vai SUBSTITUIR todos os dados atuais da turma "${turma.nome}" (empresas e lançamentos). Essa ação não pode ser desfeita. Deseja continuar?`
    );
    if (!ok) return;
    setStatus("Importando…");
    try {
      const texto = await file.text();
      const pacote = JSON.parse(texto);
      if (!pacote.equipes) throw new Error("Arquivo inválido");
      const listaEquipes = pacote.equipes.map((e) => e.equipe);
      await window.storage.set(`equipes_${turma.id}`, JSON.stringify(listaEquipes), true);
      for (const { equipe, dados } of pacote.equipes) {
        await window.storage.set(`dados_equipe_${equipe.id}`, JSON.stringify(dados), true);
      }
      setStatus("Backup importado com sucesso. Troque de aba e volte para ver os dados restaurados.");
    } catch (e) {
      setStatus("Não foi possível importar este arquivo. Confira se é um backup válido, gerado por esta plataforma.");
    }
  };

  return (
    <div>
      <SectionTitle icon={Save} sub="Exporte os dados de uma turma para guardar uma cópia de segurança, ou restaure um backup anterior.">Backup</SectionTitle>
      <SeletorTurma turmas={turmas} value={turmaId} onChange={setTurmaId} />
      {!turmaId && <Card className="p-8 text-center text-slate-500 mt-4">Selecione uma turma para exportar ou importar um backup.</Card>}
      {turmaId && (
        <div className="grid sm:grid-cols-2 gap-4 mt-4">
          <Card className="p-5">
            <h3 className="font-bold text-slate-100 mb-2">Exportar</h3>
            <p className="text-sm text-slate-400 mb-3">Gera um arquivo .json com a turma, as equipes e todos os lançamentos, histórico e comentários.</p>
            <button onClick={exportarBackup} disabled={!dadosEquipes} className="bg-amber-500 text-slate-900 font-bold px-4 py-2 rounded-md hover:bg-amber-400 disabled:opacity-40 text-sm">Exportar backup (.json)</button>
          </Card>
          <Card className="p-5">
            <h3 className="font-bold text-slate-100 mb-2">Importar</h3>
            <p className="text-sm text-slate-400 mb-3">Restaura equipes e lançamentos a partir de um backup gerado por esta plataforma. Os dados atuais da turma serão substituídos.</p>
            <input type="file" accept="application/json" onChange={(e) => e.target.files[0] && importarBackup(e.target.files[0])} className="text-sm text-slate-300" />
          </Card>
        </div>
      )}
      {status && <p className="text-sm text-amber-400 mt-3">{status}</p>}

      {turmaId && (
        <Card className="p-5 mt-4 border-rose-900/60 bg-rose-950/10">
          <h3 className="font-bold text-rose-400 mb-2 flex items-center gap-2"><Trash2 size={16} /> Excluir turma (fim de ano/semestre letivo)</h3>
          <p className="text-sm text-slate-400 mb-3">
            Apaga permanentemente as empresas, os lançamentos, a lista oficial de alunos e as contas dos alunos vinculados a esta turma — use depois de já ter exportado o backup acima, para liberar espaço para as turmas do próximo período.
          </p>
          <button
            onClick={excluirTurma}
            disabled={excluindo || !dadosEquipes}
            className="bg-rose-600 text-white font-bold px-4 py-2 rounded-md hover:bg-rose-500 disabled:opacity-40 text-sm flex items-center gap-2"
          >
            <Trash2 size={15} /> {excluindo ? "Excluindo…" : "Excluir turma"}
          </button>
        </Card>
      )}
    </div>
  );
}

function GestaoAuditoriaView({ turmas }) {
  const [turmaId, setTurmaId] = useState("");
  const dadosEquipes = useEquipesComDados(turmaId);

  const eventos = useMemo(() => {
    if (!dadosEquipes) return [];
    const lista = [];
    dadosEquipes.forEach(({ equipe, dados }) => {
      (dados.historico || []).forEach((h) => lista.push({ tipo: "Versão salva", equipe: equipe.nomeNegocio, autor: equipe.integrantes.join(", ") || "equipe", timestamp: h.timestamp, detalhe: h.nota || "Sem nota" }));
      (dados.comentarios || []).forEach((c) => lista.push({ tipo: "Comentário do professor", equipe: equipe.nomeNegocio, autor: c.autor, timestamp: c.timestamp, detalhe: `${c.modulo}: ${c.texto}` }));
    });
    return lista.sort((a, b) => b.timestamp - a.timestamp);
  }, [dadosEquipes]);

  return (
    <div>
      <SectionTitle icon={History} sub="Linha do tempo com as versões salvas pelas equipes e os comentários feitos pelo professor em uma turma.">Auditoria</SectionTitle>
      <SeletorTurma turmas={turmas} value={turmaId} onChange={setTurmaId} />
      {!turmaId && <Card className="p-8 text-center text-slate-500 mt-4">Selecione uma turma para ver a auditoria.</Card>}
      {turmaId && dadosEquipes === null && <LoadingScreen />}
      {turmaId && dadosEquipes && eventos.length === 0 && <Card className="p-8 text-center text-slate-500 mt-4">Nenhuma atividade registrada ainda nesta turma.</Card>}
      {turmaId && eventos.length > 0 && (
        <Card className="p-4 mt-4 max-h-[32rem] overflow-y-auto">
          <div className="space-y-3">
            {eventos.map((ev, i) => (
              <div key={i} className="flex gap-3 border-b border-slate-800 pb-3 last:border-0">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${ev.tipo === "Versão salva" ? "bg-amber-500" : "bg-sky-400"}`} />
                <div className="flex-1 text-sm">
                  <div className="flex justify-between text-xs text-slate-500 gap-2">
                    <span className="font-semibold text-slate-300">{ev.tipo} — {ev.equipe}</span>
                    <span className="shrink-0">{fmtData(ev.timestamp)}</span>
                  </div>
                  <p className="text-slate-300 mt-0.5">{ev.detalhe}</p>
                  <p className="text-xs text-slate-500 italic">{ev.autor}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function ProfessorInicio({ user, turmas, onIrPara }) {
  return (
    <div>
      <div className="mb-8">
        <div className="text-xs font-bold tracking-widest text-amber-500 mb-2">CURSO TÉCNICO EM ADMINISTRAÇÃO E CONTABILIDADE</div>
        <h1 className="text-3xl font-bold text-slate-50 mb-3">Painel do(a) Professor(a)</h1>
        <p className="text-slate-400 max-w-2xl">Bem-vindo(a), {user.nome}. Crie turmas, acompanhe o plano financeiro de cada equipe e gerencie usuários, relatórios, backups e auditoria — tudo em um só lugar.</p>
        <div className="flex flex-wrap gap-3 mt-5">
          <button onClick={() => onIrPara("turmas")} className="bg-amber-500 text-slate-900 font-bold px-5 py-2.5 rounded-md hover:bg-amber-400 text-sm">Ir para Turmas</button>
          <button onClick={() => onIrPara("relatorios")} className="border border-slate-600 text-slate-100 px-5 py-2.5 rounded-md hover:bg-slate-800 text-sm font-semibold">Ver relatórios</button>
        </div>
      </div>
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Turmas criadas" value={turmas.length} tone="blue" />
        <StatCard label="Itens de Gestão" value={`${GESTAO_ITENS.length} módulos`} tone="gold" />
        <StatCard label="Papel" value="Professor(a)" tone="slate" small />
      </div>
      <Card className="p-4">
        <SectionTitle icon={ClipboardList}>Índice de Gestão</SectionTitle>
        <div className="grid sm:grid-cols-2 gap-2">
          {GESTAO_ITENS.map((it, i) => {
            const Icon = it.icon;
            return (
              <button key={it.id} onClick={() => onIrPara(it.id)} className="flex items-center gap-3 border border-slate-700 rounded-lg p-3 text-left hover:border-amber-500 hover:bg-slate-800 transition">
                <div className="w-8 h-8 rounded-full bg-slate-900 border border-amber-500/40 text-amber-500 flex items-center justify-center text-xs font-bold shrink-0">{String(i + 1).padStart(2, "0")}</div>
                <Icon size={16} className="text-sky-400 shrink-0" />
                <span className="text-sm font-medium text-slate-200">{it.label}</span>
                <ChevronRight size={15} className="ml-auto text-slate-600" />
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function ProfessorDashboard({ user, onSair, ultimaVersaoVista, onVerNovidades }) {
  const chaveMinhas = `turmas_prof_${user.uid}`;
  const [turmas, setTurmas] = useSharedList(chaveMinhas);
  const [aba, setAba] = useState("inicio");
  const [turmaAtivaId, setTurmaAtivaId] = useState(null);
  const [menuAberto, setMenuAberto] = useState(false);

  if (turmas === null) return <LoadingScreen />;

  const criarTurma = async (nome) => {
    const nova = { id: uid(), nome, codigo: codigoTurma(), professor: user.nome, professorUid: user.uid, criadaEm: Date.now() };
    setTurmas([...(turmas || []), nova]);
    // registra o código para os alunos conseguirem encontrar a turma
    try { await window.storage.set(`turma_por_codigo_${nova.codigo}`, JSON.stringify(nova), true); } catch {}
  };

  const turmaAtiva = turmas.find((t) => t.id === turmaAtivaId) || null;
  const irPara = (id) => { setAba(id); if (id !== "turmas") setTurmaAtivaId(null); setMenuAberto(false); };

  const itensMenu = user.mestre ? [...GESTAO_ITENS, ITEM_APROVACOES] : GESTAO_ITENS;
  const itensManuais = user.mestre ? [...MANUAIS_ITENS_BASE, ...MANUAIS_ITENS_MESTRE] : MANUAIS_ITENS_BASE;

  return (
    <div className="min-h-screen flex bg-slate-950 relative">
      <style>{`
        @media print {
          .app-sidebar, .app-mobile-header, .no-print { display: none !important; }
          main { padding: 0 !important; max-width: 100% !important; overflow: visible !important; }
          body, .min-h-screen { background: #fff !important; }
        }
      `}</style>
      <header className="app-mobile-header md:hidden fixed top-0 inset-x-0 z-20 bg-slate-900 border-b border-white/10 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2 font-bold text-amber-500 text-sm"><GraduationCap size={18} /> Painel do Professor</div>
        <button onClick={() => setMenuAberto(true)} className="text-white/80 p-1 shrink-0"><Menu size={22} /></button>
      </header>

      {menuAberto && <div onClick={() => setMenuAberto(false)} className="md:hidden fixed inset-0 bg-black/60 z-30" />}

      <aside className={`app-sidebar w-72 bg-slate-900 text-white flex flex-col shrink-0 fixed inset-y-0 left-0 z-40 transition-transform duration-200 md:static md:translate-x-0 ${menuAberto ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-5 border-b border-white/10 flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 font-bold text-amber-500"><GraduationCap size={20} /> Painel do Professor</div>
            <div className="text-xs text-white/50 mt-1 truncate flex items-center gap-1.5">
              {user.nome}
              {user.mestre && <span title="Usuário Mestre"><Crown size={12} className="text-amber-400 shrink-0" /></span>}
            </div>
          </div>
          <button onClick={() => setMenuAberto(false)} className="md:hidden text-white/60 hover:text-white shrink-0"><X size={18} /></button>
        </div>
        <nav className="flex-1 overflow-y-auto py-3">
          <button onClick={() => irPara("inicio")} className={`w-full flex items-center gap-2.5 px-5 py-2.5 text-sm text-left transition ${aba === "inicio" ? "bg-white/10 text-white font-semibold border-l-4 border-amber-500" : "text-white/60 hover:bg-white/5 border-l-4 border-transparent"}`}>
            <LayoutDashboard size={16} className="shrink-0" /> Início
          </button>
          <div className="px-5 pt-5 pb-2 text-[10px] font-bold tracking-widest text-white/40">GESTÃO</div>
          {itensMenu.map((it) => {
            const Icon = it.icon;
            const active = aba === it.id;
            return (
              <button key={it.id} onClick={() => irPara(it.id)} className={`w-full flex items-center gap-2.5 px-5 py-2.5 text-sm text-left transition ${active ? "bg-white/10 text-white font-semibold border-l-4 border-amber-500" : "text-white/60 hover:bg-white/5 border-l-4 border-transparent"}`}>
                <Icon size={16} className="shrink-0" /> {it.label}
              </button>
            );
          })}
          <div className="px-5 pt-5 pb-2 text-[10px] font-bold tracking-widest text-white/40">MANUAIS</div>
          {itensManuais.map((it) => {
            const Icon = it.icon;
            const active = aba === it.id;
            return (
              <button key={it.id} onClick={() => irPara(it.id)} className={`w-full flex items-center gap-2.5 px-5 py-2.5 text-sm text-left transition ${active ? "bg-white/10 text-white font-semibold border-l-4 border-amber-500" : "text-white/60 hover:bg-white/5 border-l-4 border-transparent"}`}>
                <Icon size={16} className="shrink-0" /> {it.label}
              </button>
            );
          })}
          <div className="px-5 pt-5 pb-2 text-[10px] font-bold tracking-widest text-white/40">OUTROS</div>
          <button onClick={() => irPara("suporte")} className={`w-full flex items-center gap-2.5 px-5 py-2.5 text-sm text-left transition ${aba === "suporte" ? "bg-white/10 text-white font-semibold border-l-4 border-amber-500" : "text-white/60 hover:bg-white/5 border-l-4 border-transparent"}`}>
            <LifeBuoy size={16} className="shrink-0" /> Suporte
          </button>
          <button onClick={() => irPara("novidades")} className={`w-full flex items-center gap-2.5 px-5 py-2.5 text-sm text-left transition ${aba === "novidades" ? "bg-white/10 text-white font-semibold border-l-4 border-amber-500" : "text-white/60 hover:bg-white/5 border-l-4 border-transparent"}`}>
            <Megaphone size={16} className="shrink-0" /> Novidades
          </button>
          <button onClick={() => irPara("tutoriais")} className={`w-full flex items-center gap-2.5 px-5 py-2.5 text-sm text-left transition ${aba === "tutoriais" ? "bg-white/10 text-white font-semibold border-l-4 border-amber-500" : "text-white/60 hover:bg-white/5 border-l-4 border-transparent"}`}>
            <Video size={16} className="shrink-0" /> Tutoriais
          </button>
        </nav>
        <div className="p-4 border-t border-white/10">
          <button onClick={onSair} className="flex items-center gap-2 text-sm text-white/70 hover:text-white"><LogOut size={15} /> Sair</button>
        </div>
      </aside>

      {onVerNovidades && <NovidadesOverlay perfil={{ ultimaVersaoVista }} onFechar={onVerNovidades} onIrParaHistorico={() => { onVerNovidades(); irPara("novidades"); }} />}

      <main className="flex-1 overflow-y-auto p-4 pt-20 md:p-8 md:pt-8 max-w-6xl mx-auto w-full">
        {aba === "inicio" && <ProfessorInicio user={user} turmas={turmas} onIrPara={irPara} />}
        {aba === "turmas" && (
          turmaAtiva

            ? <TurmaDetail turma={turmaAtiva} professorNome={user.nome} onVoltar={() => setTurmaAtivaId(null)} />
            : <GestaoTurmasView turmas={turmas} onCriar={criarTurma} onAbrir={setTurmaAtivaId} setTurmas={setTurmas} />
        )}
        {aba === "usuarios" && <GestaoUsuariosView turmas={turmas} />}
        {aba === "relatorios" && <GestaoRelatoriosView turmas={turmas} />}
        {aba === "backup" && <GestaoBackupView turmas={turmas} setTurmas={setTurmas} />}
        {aba === "auditoria" && <GestaoAuditoriaView turmas={turmas} />}
        {aba === "aprovacoes" && user.mestre && <GestaoAprovacoesView usuarioAtualUid={user.uid} />}
        {aba === "manualProfessor" && <ManualProfessorView ehMestre={!!user.mestre} />}
        {aba === "manualAlunoRef" && <ManualAlunoView contexto="professor" ehMestre={!!user.mestre} />}
        {aba === "manualOperacional" && user.mestre && <ManualOperacionalView />}
        {aba === "checklistStatus" && user.mestre && <ChecklistStatusView />}
        {aba === "suporte" && (
          <SuporteView ctx={{ uid: user.uid, nome: user.nome, papel: "professor", mestre: !!user.mestre }} />
        )}
        {aba === "novidades" && <NovidadesView />}
        {aba === "tutoriais" && <TutoriaisView categoria="professor" />}
      </main>
    </div>
  );
}

// ============================================================================
// APROVAÇÕES (só para Usuários Mestre)
// ============================================================================

function LinhaUsuarioPendente({ usuario, onAprovar, onRejeitar, onMudarPapel, onExcluir }) {
  const [tornarMestre, setTornarMestre] = useState(false);
  return (
    <Card className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-slate-100">{usuario.nome}</span>
          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${usuario.papel === "professor" ? "bg-sky-950/40 text-sky-400" : "bg-amber-950/30 text-amber-400"}`}>
            {usuario.papel === "professor" ? "Professor(a)" : "Aluno(a)"}
          </span>
          {onMudarPapel && (
            <button onClick={() => onMudarPapel(usuario)} title="Cadastrou-se com o papel errado por engano? Clique para corrigir." className="text-[10px] font-semibold text-slate-500 hover:text-amber-400 underline">
              corrigir para {usuario.papel === "professor" ? "Aluno(a)" : "Professor(a)"}
            </button>
          )}
        </div>
        <div className="text-xs text-slate-400 mt-0.5">{usuario.email}</div>
        <div className="text-xs text-slate-500">Cadastrado em {fmtData(usuario.criadoEm)}</div>
        {usuario.turmaNome && <div className="text-xs text-sky-400 mt-0.5">Tentou entrar na turma: <b>{usuario.turmaNome}</b></div>}
      </div>
      {usuario.papel === "professor" && (
        <label className="flex items-center gap-2 text-xs text-slate-300 shrink-0">
          <input type="checkbox" checked={tornarMestre} onChange={(e) => setTornarMestre(e.target.checked)} className="accent-amber-500" />
          Também tornar Mestre
        </label>
      )}
      <div className="flex gap-2 shrink-0">
        <button onClick={() => onAprovar(usuario, tornarMestre)} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-2 rounded-md"><UserCheck size={14} /> Aprovar</button>
        <button onClick={() => onRejeitar(usuario)} className="flex items-center gap-1.5 bg-rose-950/40 border border-rose-800/60 hover:bg-rose-900/40 text-rose-400 text-xs font-semibold px-3 py-2 rounded-md"><UserX size={14} /> Recusar</button>
        {onExcluir && (
          <button onClick={() => onExcluir(usuario)} title="Excluir esta conta permanentemente" className="flex items-center gap-1.5 text-slate-500 hover:text-rose-400 text-xs font-semibold px-2 py-2 rounded-md"><Trash2 size={14} /></button>
        )}
      </div>
    </Card>
  );
}

function GestaoAprovacoesView({ usuarioAtualUid }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const usuarios = useListaUsuarios(refreshKey);
  if (usuarios === null) return <LoadingScreen />;

  const pendentes = usuarios.filter((u) => u.status === "pendente");
  const aprovados = usuarios.filter((u) => u.status === "aprovado");

  const atualizar = async (uidAlvo, mudancas) => {
    await atualizarUsuario(uidAlvo, mudancas);
    setRefreshKey((k) => k + 1);
  };
  const aprovar = (u, tornarMestre) => atualizar(u.uid, { status: "aprovado", mestre: u.papel === "professor" ? !!tornarMestre : false });
  const rejeitar = (u) => atualizar(u.uid, { status: "rejeitado" });
  const alternarMestre = (u) => atualizar(u.uid, { mestre: !u.mestre });
  const mudarPapel = (u) => {
    const novoPapel = u.papel === "professor" ? "aluno" : "professor";
    const ok = window.confirm(`Corrigir o cadastro de "${u.nome}" de ${u.papel === "professor" ? "Professor(a)" : "Aluno(a)"} para ${novoPapel === "professor" ? "Professor(a)" : "Aluno(a)"}?`);
    if (!ok) return;
    atualizar(u.uid, { papel: novoPapel, mestre: novoPapel === "professor" ? u.mestre : false });
  };
  const excluir = async (u) => {
    const ok = window.confirm(`Excluir permanentemente a conta de "${u.nome}" (${u.email})?\n\nEssa ação não pode ser desfeita.`);
    if (!ok) return;
    await excluirUsuario(u.uid);
    setRefreshKey((k) => k + 1);
  };

  return (
    <div>
      <SectionTitle icon={Crown} sub="Aprove ou recuse os cadastros novos. Esta tela só aparece para Usuários Mestre.">Aprovações</SectionTitle>

      <h3 className="text-sm font-bold text-slate-200 mb-2 mt-2">Pendentes ({pendentes.length})</h3>
      <div className="space-y-3 mb-8">
        {pendentes.length === 0 && <Card className="p-6 text-center text-slate-500 text-sm">Nenhum cadastro aguardando aprovação.</Card>}
        {pendentes.map((u) => (
          <LinhaUsuarioPendente key={u.uid} usuario={u} onAprovar={aprovar} onRejeitar={rejeitar} onMudarPapel={mudarPapel} onExcluir={excluir} />
        ))}
      </div>

      <h3 className="text-sm font-bold text-slate-200 mb-2">Usuários aprovados ({aprovados.length})</h3>
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="text-left text-xs uppercase text-slate-500 border-b border-slate-700 bg-slate-900/40">
              <th className="py-2 px-4">Nome</th><th className="py-2 px-4">Papel</th><th className="py-2 px-4">E-mail</th><th className="py-2 px-4">Mestre</th><th className="py-2 px-4"></th>
            </tr>
          </thead>
          <tbody>
            {aprovados.map((u) => (
              <tr key={u.uid} className="border-b border-slate-800">
                <td className="py-2 px-4 text-slate-100">{u.nome}</td>
                <td className="py-2 px-4 text-slate-400">{u.papel === "professor" ? "Professor(a)" : "Aluno(a)"}</td>
                <td className="py-2 px-4 text-slate-400">{u.email}</td>
                <td className="py-2 px-4">{u.mestre ? <Crown size={14} className="text-amber-400" /> : "—"}</td>
                <td className="py-2 px-4 text-right whitespace-nowrap">
                  {u.uid !== usuarioAtualUid && (
                    <button onClick={() => mudarPapel(u)} className="text-xs font-semibold text-slate-500 hover:text-amber-400 mr-3">
                      Corrigir para {u.papel === "professor" ? "Aluno(a)" : "Professor(a)"}
                    </button>
                  )}
                  {u.papel === "professor" && u.uid !== usuarioAtualUid && (
                    <button onClick={() => alternarMestre(u)} className="text-xs font-semibold text-sky-400 hover:text-sky-300 mr-3">
                      {u.mestre ? "Remover Mestre" : "Tornar Mestre"}
                    </button>
                  )}
                  {u.uid !== usuarioAtualUid && (
                    <button onClick={() => excluir(u)} title="Excluir esta conta permanentemente" className="text-slate-500 hover:text-rose-400 align-middle"><Trash2 size={14} /></button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </Card>
    </div>
  );
}

// ============================================================================
// LOGIN / CADASTRO / APROVAÇÃO
// ============================================================================

function LoadingScreen() {
  return <div className="min-h-screen flex items-center justify-center text-slate-500 text-sm bg-slate-950">Carregando…</div>;
}

function useEquipeSalva(turmaId, equipeId) {
  const [estado, setEstado] = useState(turmaId && equipeId ? undefined : null);
  useEffect(() => {
    if (!turmaId || !equipeId) { setEstado(null); return; }
    let alive = true;
    setEstado(undefined);
    (async () => {
      try {
        const r = await window.storage.get(`equipes_${turmaId}`, true);
        const lista = r ? JSON.parse(r.value) : [];
        const eq = lista.find((e) => e.id === equipeId) || null;
        if (alive) setEstado(eq);
      } catch { if (alive) setEstado(null); }
    })();
    return () => { alive = false; };
  }, [turmaId, equipeId]);
  return estado;
}

// Passo 1 do fluxo do aluno: informar a matrícula (o jeito preferido — já
// identifica a turma certa e traz o nome oficial da lista importada pelo
// professor) ou, alternativamente, o código da turma (para quando o
// professor ainda não importou a lista). Em qualquer um dos dois casos, o
// cadastro já entra aprovado na hora.
function TelaInformarTurma({ perfil, onSair, onResultado }) {
  const [valor, setValor] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState("");

  const buscar = async () => {
    setErro(""); setBuscando(true);
    const termo = valor.trim();
    try {
      // 1) tenta como matrícula — resolve turma e nome oficial de uma vez.
      const rm = await window.storage.get(`matricula_${termo}`, true);
      if (rm) {
        const registro = JSON.parse(rm.value);
        await onResultado({ turmaId: registro.turmaId, turmaNome: registro.turmaNome, nome: registro.nome, status: "aprovado", professorUid: registro.professorUid || null, professorNome: registro.professorNome || null });
        setBuscando(false);
        return;
      }
      // 2) alternativa: código da turma (6 caracteres).
      const rt = await window.storage.get(`turma_por_codigo_${termo.toUpperCase()}`, true);
      if (rt) {
        const turma = JSON.parse(rt.value);
        await onResultado({ turmaId: turma.id, turmaNome: turma.nome, status: "aprovado", professorUid: turma.professorUid || null, professorNome: turma.professor || null });
        setBuscando(false);
        return;
      }
      setErro("Não encontramos essa matrícula nem esse código de turma. Confira com o professor.");
    } catch {
      setErro("Não foi possível concluir. Tente novamente.");
    }
    setBuscando(false);
  };

  return (
    <div className="max-w-md mx-auto w-full">
      <button onClick={onSair} className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-100 mb-4"><LogOut size={15} /> Sair</button>
      <Card className="p-6">
        <SectionTitle icon={KeyRound} sub={`Olá, ${perfil.nome}! Informe sua matrícula para continuar.`}>Entrar em uma turma</SectionTitle>
        <Field label="Matrícula (ou, se não tiver, o código da turma)">
          <div className="flex gap-2">
            <TxtInput value={valor} onChange={setValor} placeholder="Ex.: 2024001 ou A1B2C3" />
            <button onClick={buscar} disabled={buscando || !valor.trim()} className="bg-slate-900 text-white px-4 rounded-md text-sm font-semibold hover:bg-slate-800 disabled:opacity-40">
              {buscando ? "Buscando…" : "Buscar"}
            </button>
          </div>
        </Field>
        {erro && <p className="text-sm text-rose-400 mb-2">{erro}</p>}
      </Card>
    </div>
  );
}

// Passo 2 do fluxo do aluno (já aprovado): escolher, numa lista, a empresa
// cadastrada pelo professor dentro da turma — evita nomes digitados errado
// ou duplicados, e permite que vários alunos entrem na mesma empresa.
function EscolherEmpresa({ perfil, turmaId, turmaNome, onSair, onEscolhida }) {
  const [equipes, setEquipes] = useSharedList(`equipes_${turmaId}`);
  const [entrando, setEntrando] = useState(null);

  if (equipes === null) return <LoadingScreen />;

  const entrarNaEmpresa = async (equipe) => {
    setEntrando(equipe.id);
    const jaEsta = equipe.integrantes.includes(perfil.nome);
    const atualizada = jaEsta ? equipe : { ...equipe, integrantes: [...equipe.integrantes, perfil.nome] };
    const nova = equipes.map((e) => (e.id === equipe.id ? atualizada : e));
    await setEquipes(nova);
    setEntrando(null);
    onEscolhida(atualizada);
  };

  return (
    <div className="max-w-md mx-auto w-full">
      <button onClick={onSair} className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-100 mb-4"><LogOut size={15} /> Sair</button>
      <Card className="p-6">
        <SectionTitle icon={Building2} sub={`Turma: ${turmaNome}. Escolha a empresa/negócio da sua equipe.`}>Escolher empresa</SectionTitle>

        {equipes.length === 0 && (
          <div className="text-sm text-slate-400 bg-slate-900 border border-slate-700 rounded-md p-4">
            Nenhuma empresa cadastrada nesta turma ainda. Peça ao professor(a) para cadastrar as empresas (Gestão → Turmas → abrir a turma → "Empresas da turma") antes de continuar.
          </div>
        )}

        <div className="space-y-2">
          {equipes.map((eq) => (
            <button
              key={eq.id}
              onClick={() => entrarNaEmpresa(eq)}
              disabled={entrando === eq.id}
              className="w-full flex items-center justify-between border border-slate-700 hover:border-amber-500 bg-slate-900 rounded-md px-4 py-3 text-left transition disabled:opacity-50"
            >
              <div>
                <div className="font-semibold text-slate-100">{eq.nomeNegocio}</div>
                <div className="text-xs text-slate-500">{eq.integrantes.length > 0 ? eq.integrantes.join(", ") : "Nenhum integrante ainda"}</div>
              </div>
              <ChevronRight size={16} className="text-slate-500 shrink-0" />
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

function AlunoWorkspaceCarregado({ userSessao, turmaId, equipeId, onSair, onTrocarEmpresa, professorUid, professorNome, turmaNome, ultimaVersaoVista, onVerNovidades }) {
  const equipe = useEquipeSalva(turmaId, equipeId);
  if (!equipe) return <LoadingScreen />;
  return <AlunoWorkspace user={userSessao} equipe={equipe} equipeKey={`dados_equipe_${equipe.id}`} onSair={onSair} onTrocarEmpresa={() => onTrocarEmpresa(equipe)} professorUid={professorUid} professorNome={professorNome} turmaNome={turmaNome} ultimaVersaoVista={ultimaVersaoVista} onVerNovidades={onVerNovidades} />;
}

function AlunoRoteador({ perfil, onSair }) {
  const [over, setOver] = useState({});
  const efetivo = { ...perfil, ...over };

  const atualizarPerfil = async (mudancas) => {
    try { await atualizarUsuario(perfil.uid, mudancas); } catch {}
    setOver((prev) => ({ ...prev, ...mudancas }));
  };

  if (efetivo.status === "rejeitado") {
    return <TelaAguardandoAprovacao perfil={efetivo} onSair={onSair} rejeitado />;
  }

  if (!efetivo.turmaId) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <TelaInformarTurma perfil={efetivo} onSair={onSair} onResultado={atualizarPerfil} />
      </div>
    );
  }

  if (efetivo.status === "pendente") {
    return (
      <TelaAguardandoAprovacao
        perfil={efetivo}
        onSair={onSair}
        onTrocarTurma={() => atualizarPerfil({ turmaId: null, turmaNome: null })}
      />
    );
  }

  if (!efetivo.equipeId) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <EscolherEmpresa
          perfil={efetivo}
          turmaId={efetivo.turmaId}
          turmaNome={efetivo.turmaNome}
          onSair={onSair}
          onEscolhida={(equipe) => atualizarPerfil({ equipeId: equipe.id })}
        />
      </div>
    );
  }

  const userSessao = { uid: efetivo.uid, nome: efetivo.nome, email: efetivo.email, papel: "aluno" };
  const trocarDeEmpresa = async (equipeAtual) => {
    const ok = window.confirm(`Sair da empresa "${equipeAtual.nomeNegocio}" e escolher outra na turma?`);
    if (!ok) return;
    try {
      const r = await window.storage.get(`equipes_${efetivo.turmaId}`, true);
      const lista = r ? JSON.parse(r.value) : [];
      const nova = lista.map((e) => (e.id === equipeAtual.id ? { ...e, integrantes: e.integrantes.filter((i) => i !== efetivo.nome) } : e));
      await window.storage.set(`equipes_${efetivo.turmaId}`, JSON.stringify(nova), true);
    } catch {}
    await atualizarPerfil({ equipeId: null });
  };
  return <AlunoWorkspaceCarregado userSessao={userSessao} turmaId={efetivo.turmaId} equipeId={efetivo.equipeId} onSair={onSair} onTrocarEmpresa={trocarDeEmpresa} professorUid={efetivo.professorUid} professorNome={efetivo.professorNome} turmaNome={efetivo.turmaNome} ultimaVersaoVista={efetivo.ultimaVersaoVista} onVerNovidades={() => atualizarPerfil({ ultimaVersaoVista: APP_VERSION })} />;
}

function TelaAguardandoAprovacao({ perfil, onSair, rejeitado, onTrocarTurma, onVirarMestre }) {
  const [codigoMestre, setCodigoMestre] = useState("");
  const [erroMestre, setErroMestre] = useState("");
  const [verificando, setVerificando] = useState(false);

  const tentarVirarMestre = async () => {
    setErroMestre(""); setVerificando(true);
    if (codigoMestre.trim() !== CODIGO_MESTRE) {
      setErroMestre("Código incorreto.");
      setVerificando(false);
      return;
    }
    try {
      await onVirarMestre();
    } catch {
      setErroMestre("Não foi possível concluir. Tente novamente.");
    }
    setVerificando(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <Card className="p-8 max-w-md text-center">
        {rejeitado ? (
          <>
            <UserX size={40} className="mx-auto text-rose-400 mb-3" />
            <h2 className="text-lg font-bold text-slate-100 mb-2">Cadastro não aprovado</h2>
            <p className="text-sm text-slate-400 mb-5">
              Olá, {perfil.nome}. Seu cadastro não foi aprovado por um Usuário Mestre. Fale com o(a) professor(a) responsável para mais informações.
            </p>
          </>
        ) : (
          <>
            <Clock size={40} className="mx-auto text-amber-500 mb-3" />
            <h2 className="text-lg font-bold text-slate-100 mb-2">Cadastro em análise</h2>
            <p className="text-sm text-slate-400 mb-1">
              Olá, {perfil.nome}! Seu cadastro como {perfil.papel === "professor" ? "professor(a)" : "aluno(a)"}
              {perfil.turmaNome ? <> para a turma <b>{perfil.turmaNome}</b></> : ""} foi enviado e está aguardando aprovação de um Usuário Mestre.
            </p>
            <p className="text-xs text-slate-500 mb-3">Assim que for aprovado, é só entrar novamente com sua conta Google.</p>
            {onTrocarTurma && (
              <button onClick={onTrocarTurma} className="text-xs text-amber-500 hover:text-amber-400 mb-3 block mx-auto">Errei a matrícula/código — tentar de novo</button>
            )}
            {perfil.papel === "professor" && onVirarMestre && (
              <div className="text-left bg-slate-900 border border-slate-700 rounded-md p-3 mb-3">
                <label className="block text-[11px] text-slate-400 mb-1.5">Tem um código de Usuário Mestre? Digite aqui para liberar seu acesso na hora.</label>
                <div className="flex gap-2">
                  <TxtInput value={codigoMestre} onChange={setCodigoMestre} placeholder="Código de Mestre" />
                  <button onClick={tentarVirarMestre} disabled={verificando || !codigoMestre.trim()} className="bg-amber-500 text-slate-900 px-3 rounded-md text-xs font-bold hover:bg-amber-400 disabled:opacity-40 flex-none">
                    {verificando ? "…" : "Confirmar"}
                  </button>
                </div>
                {erroMestre && <p className="text-xs text-rose-400 mt-1.5">{erroMestre}</p>}
              </div>
            )}
          </>
        )}
        <button onClick={onSair} className="text-sm text-slate-400 hover:text-slate-100 flex items-center gap-2 mx-auto"><LogOut size={14} /> Sair</button>
      </Card>
    </div>
  );
}

// Primeiro acesso: aparece só uma vez, logo após a pessoa entrar com a
// conta Google pela primeira vez (ainda não existe um cadastro dela na
// plataforma). Depois disso, o papel só pode ser alterado por um Usuário
// Mestre, no painel de Usuários.
// Ícone oficial do Google (multicolorido), como no botão "Continuar com o
// Google" — mantido como SVG embutido para não depender de outro pacote.
function GoogleIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4c-7.7 0-14.4 4.4-17.7 10.7z"/>
      <path fill="#4CAF50" d="M24 44c5.5 0 10.5-2.1 14.3-5.6l-6.6-5.6C29.6 34.7 26.9 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.6 5.6C41.6 36.6 44 30.9 44 24c0-1.3-.1-2.7-.4-3.5z"/>
    </svg>
  );
}

// Tela de entrada: escolha de perfil (Professor(a)/Aluno(a)) seguida do
// botão "Continuar com o Google" — tudo em uma única tela, sem cadastro nem
// senha. O perfil escolhido aqui só é usado se for a primeira vez que essa
// conta Google entra no sistema (via onEscolherPerfil, repassado ao App());
// contas que já têm cadastro mantêm o papel definido anteriormente, que só
// um Usuário Mestre pode alterar depois, no painel de Usuários.
function TelaLogin({ onEscolherPerfil }) {
  const [papel, setPapel] = useState("aluno");
  const [codigoMestre, setCodigoMestre] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const entrarComGoogleClick = async () => {
    setErro(""); setCarregando(true);
    onEscolherPerfil?.(papel, codigoMestre.trim());
    try {
      await entrarComGoogle();
      // o App() detecta a sessão automaticamente pelo observador do Firebase
    } catch (e) {
      setErro(traduzErroAuth(e));
      setCarregando(false);
    }
  };

  return (
    <Card className="p-6">
      <SectionTitle icon={Lock}>Entrar no sistema</SectionTitle>
      <p className="text-sm text-slate-400 mb-5">Entre com sua conta Google para acessar a Plataforma do Plano Financeiro.</p>

      <Field label="Perfil de acesso" hint="Só é usado na primeira vez que esta conta entra no sistema. Depois disso, o perfil só pode ser alterado por um Usuário Mestre, no painel de Usuários.">
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setPapel("aluno")} className={`flex items-center justify-center gap-2 py-2 rounded-md text-sm font-semibold border ${papel === "aluno" ? "bg-amber-500 text-slate-900 border-amber-500" : "border-slate-600 text-slate-300 hover:border-slate-400"}`}>
            <GraduationCap size={15} /> Aluno(a)
          </button>
          <button type="button" onClick={() => setPapel("professor")} className={`flex items-center justify-center gap-2 py-2 rounded-md text-sm font-semibold border ${papel === "professor" ? "bg-amber-500 text-slate-900 border-amber-500" : "border-slate-600 text-slate-300 hover:border-slate-400"}`}>
            <UserCog size={15} /> Professor(a)
          </button>
        </div>
      </Field>

      {papel === "professor" && (
        <Field label="Código de Mestre (opcional)" hint="Só preencha se você recebeu um código de Usuário Mestre. Deixe em branco para entrar direto como professor(a) comum, sem privilégios de Usuário Mestre.">
          <TxtInput value={codigoMestre} onChange={setCodigoMestre} placeholder="Deixe em branco se não tiver" />
        </Field>
      )}

      {erro && <p className="text-sm text-rose-400 mb-3">{erro}</p>}

      <button
        onClick={entrarComGoogleClick}
        disabled={carregando}
        className="w-full flex items-center justify-center gap-3 bg-white text-slate-800 py-2.5 rounded-md font-bold hover:bg-slate-100 disabled:opacity-40 transition mt-1"
      >
        <GoogleIcon size={18} />
        {carregando ? "Entrando…" : "Continuar com o Google"}
      </button>
      <p className="text-[11px] text-slate-500 mt-4 text-center">Autenticado via Firebase Authentication — somente conta Google.</p>
    </Card>
  );
}

function TelaEntrada({ onEscolherPerfil }) {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <div className="flex-1 flex flex-col md:flex-row">
      {/* Painel de identidade — visível a partir de telas médias */}
      <div className="hidden md:flex md:w-1/2 relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex-col justify-center px-14 py-12">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-full bg-slate-900 border-2 border-amber-500 flex items-center justify-center flex-none">
              <GraduationCap size={22} className="text-amber-500" />
            </div>
            <div>
              <div className="text-[11px] font-bold tracking-widest text-amber-500">CEDUP HERMANN HERING</div>
              <div className="text-xs text-slate-500">Curso Técnico em Administração e Contabilidade</div>
            </div>
          </div>

          <h1 className="text-4xl font-bold text-slate-50 leading-tight mb-4">
            Plataforma do<br />Plano Financeiro
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-10 max-w-sm">
            Construção guiada do plano financeiro do negócio, módulo a módulo — cada etapa preenchida é um passo real do plano de negócio da equipe, não apenas uma tarefa a cumprir.
          </p>

          {/* Elemento de assinatura: trilha dos 13 módulos até a conclusão */}
          <div className="flex items-end gap-1.5 mb-10">
            {Array.from({ length: 13 }).map((_, i) => (
              <div
                key={i}
                className="w-2.5 rounded-t-sm bg-gradient-to-t from-amber-700 to-amber-400"
                style={{ height: 14 + i * 5 }}
              />
            ))}
            <CheckCircle2 size={22} className="text-amber-400 ml-2 mb-0.5 flex-none" />
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <ClipboardList size={16} className="text-amber-500 flex-none" />
              13 módulos guiados, da ideia à viabilidade do negócio
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <MessageSquare size={16} className="text-amber-500 flex-none" />
              Feedback do professor a cada etapa
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <TrendingUp size={16} className="text-amber-500 flex-none" />
              Análise do negócio atualizada em tempo real
            </div>
          </div>
        </div>
      </div>

      {/* Painel de acesso */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Cabeçalho compacto — substitui o painel da esquerda no celular */}
          <div className="md:hidden text-center mb-8">
            <div className="w-14 h-14 rounded-full bg-slate-900 border-2 border-amber-500 flex items-center justify-center mx-auto mb-4">
              <GraduationCap size={26} className="text-amber-500" />
            </div>
            <div className="text-xs font-bold tracking-widest text-amber-500 mb-2">CURSO TÉCNICO EM ADMINISTRAÇÃO E CONTABILIDADE</div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-50 mb-2">Plataforma do Plano Financeiro</h1>
            <p className="text-slate-400 text-sm">Construção guiada do plano financeiro do negócio, módulo a módulo · uso didático</p>
          </div>

          <TelaLogin onEscolherPerfil={onEscolherPerfil} />
        </div>
      </div>
      </div>

      <footer className="text-center py-4 px-6 border-t border-slate-900 text-[11px] text-slate-600">
        © {new Date().getFullYear()} Jorge Lima Cardoso. Todos os direitos reservados. Plataforma didática desenvolvida para o CEDUP Hermann Hering — Curso Técnico em Administração e Contabilidade.
      </footer>
    </div>
  );
}

export default function App() {
  const [firebaseUser, setFirebaseUser] = useState(undefined); // undefined=carregando, null=deslogado
  const [perfilRecemCriado, setPerfilRecemCriado] = useState(null);
  const [criandoPerfil, setCriandoPerfil] = useState(false);
  // Guarda o perfil (Aluno/Professor + código de Mestre) escolhido na tela
  // de login, ANTES de entrar com o Google — só é usado se for a primeira
  // vez que essa conta acessa o sistema (ver useEffect abaixo).
  const escolhaRef = useRef({ papel: "aluno", codigoMestre: "" });

  useEffect(() => {
    const cancelar = observarSessao((u) => setFirebaseUser(u || null));
    return cancelar;
  }, []);

  const efetuarSaida = async () => {
    try { await sair(); } catch {}
    setPerfilRecemCriado(null);
    escolhaRef.current = { papel: "aluno", codigoMestre: "" };
  };

  const perfilCarregado = useUsuario(firebaseUser?.uid);

  // Primeiro acesso: assim que confirmamos que essa conta Google ainda não
  // tem cadastro na plataforma, criamos o perfil automaticamente com o
  // papel escolhido na tela de login (sem uma segunda tela de confirmação).
  useEffect(() => {
    if (!firebaseUser || perfilCarregado === undefined || perfilCarregado || perfilRecemCriado || criandoPerfil) return;
    setCriandoPerfil(true);
    const { papel, codigoMestre } = escolhaRef.current;
    const souMestre = papel === "professor" && codigoMestre !== "" && codigoMestre === CODIGO_MESTRE;
    // Professor(a) sempre entra aprovado direto — o código de Mestre só dá o
    // nível extra de Usuário Mestre (quem pode aprovar alunos e gerenciar
    // usuários), não é mais um portão de aprovação. Só o fluxo do aluno
    // continua com status "pendente" até aprovação (por PDF importado ou
    // por um Usuário Mestre).
    const perfil = {
      uid: firebaseUser.uid,
      nome: firebaseUser.displayName || firebaseUser.email,
      email: firebaseUser.email,
      papel,
      status: papel === "professor" ? "aprovado" : "pendente",
      mestre: souMestre,
      turmaId: null, turmaNome: null, equipeId: null,
      criadoEm: Date.now(),
    };
    (async () => {
      try {
        await salvarUsuario(perfil);
        setPerfilRecemCriado(perfil);
      } catch {}
      setCriandoPerfil(false);
    })();
  }, [firebaseUser, perfilCarregado, perfilRecemCriado, criandoPerfil]);

  if (firebaseUser === undefined) return <LoadingScreen />;

  if (!firebaseUser) {
    return <TelaEntrada onEscolherPerfil={(papel, codigoMestre) => { escolhaRef.current = { papel, codigoMestre }; }} />;
  }

  if (perfilCarregado === undefined) return <LoadingScreen />;

  // perfilRecemCriado tem prioridade sobre perfilCarregado: além de servir de
  // "ponte" logo após o primeiro acesso, também reflete correções feitas
  // localmente nesta sessão (ex.: virar Usuário Mestre pelo código, na tela
  // de aguardando aprovação) sem precisar recarregar a página — e só é
  // usado se for realmente da conta que está logada agora, para nunca
  // "vazar" o perfil de uma conta antiga ao trocar de usuário na mesma aba.
  const perfil = (perfilRecemCriado?.uid === firebaseUser.uid ? perfilRecemCriado : null) || perfilCarregado;

  if (!perfil) return <LoadingScreen />;

  if (perfil.papel === "aluno") {
    return <AlunoRoteador perfil={perfil} onSair={efetuarSaida} />;
  }

  // professor
  if (perfil.status === "pendente") {
    const virarMestre = async () => {
      const atualizado = await atualizarUsuario(perfil.uid, { status: "aprovado", mestre: true });
      if (atualizado) setPerfilRecemCriado(atualizado);
    };
    return <TelaAguardandoAprovacao perfil={perfil} onSair={efetuarSaida} onVirarMestre={virarMestre} />;
  }
  if (perfil.status === "rejeitado") {
    return <TelaAguardandoAprovacao perfil={perfil} onSair={efetuarSaida} rejeitado />;
  }

  const userSessao = { uid: perfil.uid, nome: perfil.nome, email: perfil.email, papel: perfil.papel, mestre: !!perfil.mestre };
  return (
    <ProfessorDashboard
      user={userSessao} onSair={efetuarSaida}
      ultimaVersaoVista={perfil.ultimaVersaoVista}
      onVerNovidades={() => atualizarUsuario(perfil.uid, { ultimaVersaoVista: APP_VERSION }).then((p) => p && setPerfilRecemCriado(p))}
    />
  );
}
