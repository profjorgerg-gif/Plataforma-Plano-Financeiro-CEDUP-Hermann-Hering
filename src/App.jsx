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

// Complementa a TEORIA (conceito + fórmula, já usada dentro de cada módulo)
// com "o que lançar" e um exemplo numérico — usado no Guia dos 13 Módulos,
// dentro do Manual do Aluno.
const GUIA_MODULOS_EXTRA = {
  m1: {
    lancamento: "Para cada bem: descrição, categoria (Máquinas, Móveis, Utensílios, Veículos ou uma categoria própria), quantidade e valor unitário.",
    exemplo: "1 forno industrial, categoria Máquinas, quantidade 1, valor unitário R$ 8.500 → contribui R$ 8.500 ao Investimento Fixo.",
  },
  m2: {
    lancamento: "Estoque inicial (R$), prazo médio de vendas (dias), prazo médio de estoque (dias) e prazo médio de compras (dias).",
    exemplo: "Prazo de vendas 30 dias + prazo de estoque 15 dias − prazo de compras 20 dias = necessidade líquida de 25 dias. Com custo diário de R$ 400, o Caixa Mínimo fica em R$ 10.000.",
  },
  m3: {
    lancamento: "Para cada despesa pré-operacional: descrição e valor.",
    exemplo: "Registro do CNPJ R$ 400 + Reforma da loja R$ 3.000 + Divulgação de lançamento R$ 600 = R$ 4.000 de Investimento Pré-Operacional.",
  },
  m4: {
    lancamento: "Percentual de recursos próprios (o restante vira automaticamente \"recursos de terceiros\", com a fonte: empréstimo, financiamento, investidor-anjo, etc.).",
    exemplo: "Investimento Total de R$ 24.500, com 60% de recursos próprios: R$ 14.700 próprios + R$ 9.800 de terceiros (ex.: empréstimo bancário).",
  },
  m5: {
    lancamento: "Para cada produto/serviço vendido: nome, quantidade média vendida por mês e preço de venda unitário.",
    exemplo: "600 kg de pão francês por mês, a R$ 14,90/kg → R$ 8.940 de faturamento só com esse produto.",
  },
  m6: {
    lancamento: "Para cada material usado num produto: nome do produto, nome do material, quantidade usada e custo unitário do material.",
    exemplo: "1 pão usa 0,5 kg de farinha a R$ 4,50/kg → custo de matéria-prima de R$ 2,25 por pão.",
  },
  m7: {
    lancamento: "Percentual de impostos sobre vendas (Simples, ICMS, ISS…) e percentual de comissões/gastos com vendas (comissão, propaganda, taxa de cartão) — aplicados sobre o Faturamento do Módulo 5.",
    exemplo: "8% de impostos + 3% de comissão = 11% sobre R$ 8.940 de faturamento = R$ 983,40 de Custo de Comercialização.",
  },
  m8: {
    lancamento: "Não precisa digitar de novo — a plataforma calcula automaticamente a partir da quantidade vendida (Módulo 5) e do custo de matéria-prima por unidade (Módulo 6).",
    exemplo: "600 pães vendidos × R$ 2,25 de custo de matéria-prima cada = R$ 1.350 de CMD no mês.",
  },
  m9: {
    lancamento: "Para cada função/cargo da equipe: nome da função, quantidade de pessoas, salário e percentual de encargos sociais (FGTS, férias, 13º, INSS…).",
    exemplo: "1 padeiro, salário R$ 1.800, encargos de 35% → custo real de R$ 2.430/mês com essa função.",
  },
  m10: {
    lancamento: "Não precisa digitar de novo — usa os bens já lançados no Módulo 1. Só é preciso informar a vida útil (em anos) de cada categoria de bem.",
    exemplo: "Forno de R$ 8.500 com vida útil de 10 anos → R$ 8.500 ÷ 10 ÷ 12 = R$ 70,83 de depreciação por mês.",
  },
  m11: {
    lancamento: "Para cada custo fixo (aluguel, água, luz, internet, contador…): descrição e valor. A Mão de Obra (Módulo 9) e a Depreciação (Módulo 10) entram automaticamente na soma.",
    exemplo: "Aluguel R$ 1.200 + Água/Luz R$ 400 + Mão de Obra R$ 2.430 + Depreciação R$ 70,83 = R$ 4.100,83 de Custo Fixo Total.",
  },
  m12: {
    lancamento: "Não precisa digitar nada — a plataforma monta o Demonstrativo de Resultados sozinha, juntando tudo que já foi lançado nos módulos anteriores.",
    exemplo: "Faturamento R$ 8.940 − Custos Variáveis (Comercialização + CMD) R$ 2.333,40 − Custos Fixos R$ 4.100,83 = Resultado Operacional de R$ 2.505,77/mês.",
  },
  m13: {
    lancamento: "Também é automático — a plataforma calcula os 4 indicadores a partir de tudo que já foi preenchido.",
    exemplo: "Com Custo Fixo de R$ 4.100,83 e margem de contribuição de 63%, o Ponto de Equilíbrio fica perto de R$ 6.500/mês de faturamento.",
  },
};

const uid = () => Math.random().toString(36).slice(2, 10);
const codigoTurma = () => Math.random().toString(36).slice(2, 8).toUpperCase();

const fmtBRL = (n) =>
  (Number.isFinite(n) ? n : 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtNum = (n, d = 1) => (Number.isFinite(n) ? n : 0).toLocaleString("pt-BR", { maximumFractionDigits: d });
const fmtPct = (n) => `${fmtNum(n, 1)}%`;
const fmtData = (ts) => new Date(ts).toLocaleString("pt-BR");

const COLORS = { navy: "#0f1e30", blue: "#4f83c9", gold: "#c9972e", emerald: "#2dd4a8", rose: "#f87171", bg: "#0a1420" };
const PIE_COLORS = ["#c9972e", "#4f83c9", "#5c7186"];
const CHART_GRID = "#1c2f45";
const CHART_TICK = { fontSize: 11, fill: "#8fa3b8" };
const CHART_TOOLTIP_STYLE = { background: "#0f1e30", border: "1px solid #22344a", borderRadius: 10, color: "#e8edf3", fontSize: 12 };

const GESTAO_ITENS = [
  { id: "turmas", label: "Turmas", icon: School },
  { id: "usuarios", label: "Usuários", icon: Users },
  { id: "relatorios", label: "Relatórios", icon: FileBarChart },
  { id: "backup", label: "Backup", icon: Save },
  { id: "auditoria", label: "Auditoria", icon: History },
];

// Só aparece para professores com mestre:true — fica separado do GESTAO_ITENS
// porque a visibilidade depende do usuário logado, não é fixa.
const ITEM_APROVACOES = { id: "aprovacoes", label: "Aprovações", icon: Crown };

// Itens da seção MANUAIS: todo professor vê o Manual do Professor e o do
// Aluno; só o Usuário Mestre vê também o Manual de Operacionalização e o
// Checklist de Status (conteúdo mais técnico, de bastidor do projeto).
const MANUAIS_ITENS_BASE = [
  { id: "manualProfessor", label: "Manual do Professor", icon: BookOpen },
  { id: "manualAlunoRef", label: "Manual do Aluno", icon: GraduationCap },
];
const MANUAIS_ITENS_MESTRE = [
  { id: "manualOperacional", label: "Manual de Operacionalização", icon: ScrollText },
  { id: "checklistStatus", label: "Checklist de Status", icon: ClipboardCheck },
];

const TELAS_MANUAL = {
  aluno_google: "data:image/webp;base64,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",
  aluno_codigo: "data:image/webp;base64,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",
  aluno_team: "data:image/webp;base64,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",
  aluno_steps13: "data:image/webp;base64,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",
  aluno_theory: "data:image/webp;base64,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",
  aluno_chart: "data:image/webp;base64,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",
  aluno_versions: "data:image/webp;base64,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",
  aluno_feedback: "data:image/webp;base64,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",
  aluno_finish: "data:image/webp;base64,UklGRk4eAABXRUJQVlA4IEIeAACQlACdASoIAmQBPmEwlUgkIyIhoZM5IIAMCWdu8WMUBUd8CgZFCbQEXXd6IpJ5HxwuzTQn/u/V3/gv8B6G/Td8wH7GesX+QHud9AD+2f3f1af+H7DP9v/33sAfsb61P/e/bP4PP79/0vTH9QD/58D15h/y3bL/bvx889fxb6F+9fk3yo+hv+x6Dfyn7o/pfy6/KP5b/z/gb8H/7/1AvXn+S/Mn3UvieyD0P/c+gF60fOf9J4MP9x+XXuH+gf3D/Yfbp9gH8l/p3+0/Nj4c/rn/L8Sn7r/p/9h7gP8s/sv+2/uf+P/an6S/6P/xf5/83fa5+ef6L/z/534B/5v/bf+32MPRmDefwEs78wXRyIZiDRdtPLVm7n43L5pijQxANY7kH4u2RbDcFyitVzjRKe+rnGclXjAwero5W4K59M0Un7+TGXtJ9PyjSeXmJz1uS82OVDbXiWjmQczjDstBapWpD7XoMOfh1I0mrPCf9mxDg/6+jJ2SF5/9y60OtEp76ucaQ9N9XtdmEUWlI6W50weinHKpv2T/rOWYm9LTAHpKCC6Z3w8I+K33xwBPT20qBAOdR4uLHZ4v1hpW4bJwJjNrHZLSXpu0bF3fSySzmIaLVVRhBnsB/r25pprpFtlV9g1rapWFNAMvhPul9K+qZf4ZXAbx4p7ldaOgB44Jwzz+ucFYeXPaqCLFgqBOw8yssr5I9SH0DVyswNvd/xjVdGVDbj+XHulJNyFyp3RVfS6MEpeLxCBe5WfXNygLYRQRoG+fAcpA4nJzLGUhIMnUegke4bMVeKug2OdDpfNYnJI4rcf//m1zbsnDAwZjFSxqtbcPkoUBiHBEcevfIU5vmValbmvqlAOaY3XpzxbrrC1f5uXY1mFiCJOzTMQg9wZ17fp24yOyifPrwGcBf8DL+sg4i3TmCx2Cf9DfHhc0XjfzGaDY9ag2dp84+QL7vHO21BFB87D+hcVL1a/zAMSz85iGSqcickqsZam0zEtk27/K5SIi2kP+4YZFYSVUCCwIr5Gjf1yZIDeI9H0mQARm4Fpp8TpwbgVjzwOEnSof2KaOWWiCitVzjRL+lloaQbx/7dRC9kGTgfp+dE6ca/6AJVRdKbL2xSCjjMwfodDc+lioPbSTRkARXZZ3Oe36luReWfajNYi5VaZR6PR6PR6PR5wbubqkWB95h5npmszw+N7LgZtyTXXAm6Y49D9q3P831C4Rgge6ARiIqW7RY6mNQHlUBJoIEA0k4JuQCCZ+Pt+9E92oSYt2OHVWbhMr3BUlpBQIFRbGK0U6dBgAwzMWm8UkjhVhCZ4NXxaWiU99XONEp72zi80pr/GiVa3sfbz2WfnMQ0W4yTklV8Wu/OYhoXPfokp78fFoitVzjRKe+rnGiU99XPuIkp76ucaJT31c40Snvq8SFolPfVzjRKe+rnGiU99bV+NEp76ucaJT31c40Snvxy5xolPfVzjRKe+rnGiU+Iqy0tEp76ucaJT31c40SoCRq5xolPfVzjRKe+rnGiVdE1XONEp76ucaJT31c40TbJWq5xolPfVzjRKe+rnGjrE99XONEp76ucaJT31c42hKnvq5xolPfVzjQ6AA/vVYSqGO11YjBeo2dpBNw0/uI9dMFh0dq/p/joJ9gperKXPrzgzgLt0KoiBHl44IEOUvPrcHifM7E0ZTtOWC5ieA8oncBHjM1jBa8F/yJpwSbl6HDjl70kdXW9lWV2d4k4GQXbeplY+O9SquzyDwQlRdGbfZ8RlfxerM2HL7PYAXm//pmw6QJ1CMWBWH1051FOB1s4+NvYW7SmdOTmZZhjKzvNxT19UYZsH0LGMudnrfsSTj4DEJkSIIs3Zd90/q1YfjQonQQ2KbX4/qmvbX8BF4HoCraS8jTrDK1wMYwaGIdq+2Cz/XOTe79W8Ap0tPSvkxDPmsMLsOapFucBDLeHPxOkiZiWxCkMhEAtF1jcJC84pFZTkkZEedHu9Z3xB/8h0Ff5ibCdOnjHxsVlD9wvZUItuVPH+Gf0v7d3j27+0jLx0//uRytrEAAnOU4lTutoFCdeJ4dNtXaGx/17Tlh7h4kUHvYzGu1deR7o1mnadjOvg0rfSyRegT2BXRBlBVuLg1KBElGhA/aisg+w/N4nM5HBIZ43kCE18egKB70NyLf8z72cbFANMOOl62yxsEqZetKKHowX2O1ij1XULSfSUB8T4WDl/AtpnLIWeHYBoLfr1uPmkYPp5bolXx87WyTQZWGW1uueuqSzCqytFmSji2qV4Tjm1e5x6n97NT6oOmZjGwuemhNtmJWZDFKfjxJUn2e4iT0270EL9iA/w7ZujIe9cZy+GkQGSFh/Zysk/fTbbC1TXVe/2mxRJISLXN75/5vtK814hRrJXHx+FVGDZRdsuEfQKzZ91qE4cnGY1gWVAn+E72BPnN4lW6i5nL3WglGleAJrzsAvXHxLm3dhV5rREt4/Fzcvya1bbXYsCigLY9WRtMuVXLF73Yyhk4oBic8q4TA7rT+U9gvjWfukqy69uEAZwJQqJaoZ2YRjh3CYcncqVfEucpSz/MlTpz/u0Tf4CYHOHTvZ+wEVsMiYNKYPxB3X+/MTpD5bK1QqiXILuri3T5Vlhg6v9PAjssY5wXJ727uVmB48Vq057ANOGKO5KYmRVetZVLXFvAARP1onM2oBPncwr1DstcL8n2/gr3smavN7hKJvyCuVkhNZetQAC5IhsbEcI96l9Wg3nIWZ7MpDEMSStlTp0RSkdUpRzHaycXWvBcDFCTQsXkHBWm+O2tAIegtbvwZoyLiK0ctdj0385XNxXneh6QNLHiUf62a8Z/IVhuAPWIIcrTIdJK5Y/nz72cSSB5VC1sSztbBbmchZZIkcCTL8cTsN8xZzkNafP+bqTcKnpQ17pBNJAYfhg0r/qhF6F7Z5/z9c9k9ZmFYaPzzPRtG7UZfbYFlFiRdHmuTRxidTmfMfcoUsdoXH6gAg7CumJUQrMFjaf5INcYZ3oX+YVFRma/INh8Dhfygktae/k6FuIdhBQKJcuwJNzzY60N4Uol+hcJ5h2EfkgGf94XtFQBMTqCFc7zwDzE9+RDHi4RhWSn3curjZhi0qYW2jVfF9GYk8X/GAKoDLtbPRnVUjMZ+UimaAoC3rdlnO1zjozS9pYQJUHUn4o7P43ap/9RW5YeLdLrSWEgO25sv9KcatAwk62WJ7caQEVXuCF15p500iqKeX5Z/zp597+1l2t+WpWO9bobbQxcri023tTzwT4DdVWo8y4mDg6aUDzdD+TFSTrtHminiuKcM7xAIjbzcJpBtB+N4DadQdMJSPU8CoRn0axOnC9RrwIrxnW/MEuJod3WnSRvBZzD/KHfVxiXdRgS3mX7+BaBP/uPn70fEj1H8rPlK6DC1FTjU0KRX6U32NZ2yUlhKNZ4IyjJ+fT3isELhKNQCK6Yt3yF2AMRG9l6TG5iTA/u8HOJTNH95TTrkMlWzOfXa3y+Y4jSMofCxcDHJGN3veq4nmeVxt0ZvXJEQvqUVd3h7gr9s7WK0qOQqhNz0VWkCQ0YNrSj4kRZfIFtcOpAoNfZT37JkHk52fj6W5tksMWc9UJL6wSCUmr8FlD0KJev5wTQRJV9Vmadc3OYnjPhVK0YilNcxnis1aqtqloj8KUCxdLuq/UYjXPlGC6dIKTq8UseMMQLvUKuyU11yW0d5ZwMBOeTXVHGHNCJdiLRj2/0iOZnNpXFnPkbkwQojmNcPuqHqdPp9uqAwH8X+Ex75ZrWg6d4vbHqwShJx453Qd4vkaTI2CaYADTiSavTNe93IRWOjzn2+4Guo1kauMn/Qr7Mb1sLIbG+3U1r1p4RpsPsScilQD4suBuOMK5EEBPEsvjt33xI1nSmXsP3Idu6hehoiFwYw2o7obSH9pO7hol5B2CVwTJ+cxqMPBb7LLRspHqCllHqCGpY63mvt8iU6X5fw45vngpqcZ1f89FYVQGrVOjS/qR+Xe1+0c6ue4pGrR5Ui9vMoXmED/6j6XEI38PFs3p7UL6Et1wf1joFncCGb9VC7ZJmloTRUWFeXzVeG4dGyIZ+G4D6g+DJpB81iQ3XKKxQSNgxdxjF06GJeu0pmI6wIZnUvEO0QzXMsJaIqserTvgpDzJd8tVITe8bxUNfb1jvnr85vgGIfjtr5uL7ncsnUQVlBwag8zacMtbScC98Ba2+Oedt5cvAZiZ2VqyJAjqmFkKY7DYSnTevgpaFHTkD0dpntVslpp/Luq13VwcLLyDrqQpt6rDU+e9QxRjVslBuPD07P0+MuvTNIH5S2Vb+I15d+Z9OeAHwrBW7Q71eCQiDuIYUd2Gs2qJPN4q/+mtVW9+u2Yeu98ob1LDalhRf/Snuac9l/+LVy84K8tGohkCxkAulyOnBe+3s1jxFBYGH/Q8oohRqtgv8gimTTdq5Aj4pUqm0f1maerJvCC6EVzHadeSlWZwf7u3RdL4ew1lpucTsIVuCdRBTQzDfDys3QQRt1SmvhF/KQGIAvOGhaiOaLw/KwE6J0NUp6X8WQL/IzeUvNS1IpRai0dIxEB8auqno8T/06Fh2fYCBDd+wbAak6EiGXIRaHtkbANnTHpggSxg0knaDJsBqBf/7+8tPrPqUWqzf5rJK8OFHvOca2rQdr8T748p99l9D0IhbRSs3rGdyP8Jxlh3LbTJv6FopE0ciUs/Y4pCYCUG1OiTIQef1/5MbEQiY4LnJi2AKNu+6+BJA5WbsxN6vRLTcLKle4QZVBu91pjktvPUGdumdgVQRYN+oUxJcnxsIaAdQAslaUVgtso+CzSyVSw2ciABSkYDo2KDDpgoqf6WhSTN/TXhhuZpTplwE83SK39jSkqcJQ5uYz4YF583sn/ykRTUmrPXDGIPOfL+gGZcpJKA+oa0OpvnmL0S9CalKDV2HNPdM3p2+UKkqzDSfjukeI26fP6z8X8Ob1hK5CzroIL80CvPpY5l7ToCivEDH5PwVEuhf08iFcPi0y00lE69eF/JGIZ+d7ClfJb/UqUNHYAbmwBTyCetmd9etztS7sXCgyPHoGksLyTRdvKPtrHUZJ0yt8iY+4gJo8YBGxjJmL6d/wROit/IhyV6+bdWjTkeQNZA0ZX+yv5HIaAEXmjrisn1BgM5g5MBTGGMwxuxW80kjkBoQUZ9PVqZDa7xcdnGNMwKgtVZ7+PU0+3xy8ow6t0AbIEP8h/hYPUb44VfKWIMfWP+1fwxZudKX2/exv+qsOg/USWDiH+grNQPdW5Tp6kGPMS9Pw9j/EUsb7NOwI9NNvJQt4N/PtdQAvxmzgZALBBcGs1nQT4FMASssgHzX0DzlTRnal+t7RM5qPPaHzMoNT182HGgF4/wwfTBCwA5vGCE6/kabZ/GhSU5Zxxsg9SzLVKl96vgEpl+IuGB0724qQnyU0rYjTFjZW6CVbpNkPfk+yHpWblT+pmokSNxGMNKga2RyMGVRUxu58Tmm7ICdOzWbvvavWO+gCRfliTfK/8TjckokuvYgvTtMZTOqo064QSu4QJCIxXXivOFWfhv0GNyT9HnQ+vMejEsZQjR5fUK2QBfqXZ8FhLpw9RzoquuCyHwJZhBSTXbvzEWCGHZqJoAESTZTdPHUlZDKH8a2SbSYiZFXI6tOSkEYEBWczWkFp12EuBYRiaBFmCh95a7mWwdQqPtVcGSYYInOUVWVljeF5gHZQTKNrshbGzHeJRpOLn5UotfKQJS/zvTpkrxSybhZIrFYqLnX0gge8CEf6prOW+NxSskVR0mevFZhit+04v+URi3UC6qDHR3fpu7mYzAiI4fJmnh+b3Y4H7ocB1v9z6MKr1lnwHZjo24a1aq1sLKtiuPc43BC1LH5mh4Wa5BJXko4ChhkkuRrmKpS6fLxbhGh7JK09H++MQuZUlni6CV56A8+8+aGfxSQ4aT0umgOnm3t6sIFpRy8l7lTd66ULtX+REfUHzSKEfK0x0CltW7u/f4Wny16m8MDaiKMqXv5wN+aP5GKABJnCX+B2+uCySG1vDBlzhZbltbdG9MxgDFN+5uDKIMdmecNwWoVmLToh7SmadFH6ga76WInEob2DongZjakevxoEc1IgOL2zvsAkfWGRfA3HqEK6QsLIwuCBNmV0FAtokcwsvbfTvCXeP6e/Ix+t7aTvmyXgJZ7uEWu3lKTwFqoWZ3xc4ppqsjMSn9anWp1Xu+X3/H6jHPP0z1HrZ2p3iIxMhxIHUOxfMC6gb8rJFdQngDKS2/riV+ZCidmJ0Y8DLPTJLnu92AeP25Nd7QXxyy+8Jx+RBKaovq1UYhB6SLJTSY/ioQ3eVS+TCAmK3gbdXChGkQUXymFOabD2JggGapiLYkFbQ2QscY5nthBYCCi6tuDm0s9O0wFgvb2g6VZWWgkkoAn5EAU985nWoqtpK+3mGxSQXIg3xxz+DfEL3Qtb4ij/AqX5TkUhDlOGp526BPtINoW5wB10cga1e5N6TbVoLDmSOHhHK0NvnrQmTr4yMTnow3CyuFYx/+I3K8CXUyWvFm+ejWTaE8Kric8d7K0wgeHY2Fc2sG/lts3P/xWkzGNGKuxqwdL8vYDx2IpZpd/4GiTLpfUP2FlWumN/MTYuXTuc3lL16uNbzRUG8ykhUHs0CO8UmVft4bhWnAtro7xFH0OdLq4povus9YeA33TttyXyQWhAj63drujvx8mSFRuiAn4dGTfE5Ldb653xySZw+QqonP6PrazTu1Yh1rBXomLoMrZG4E+7SIvVrNj609gu1ZDdcgd0+GYBF679u6BDpXbt3sNoFJT3n94bp1Fb39YTH4QM5dDYCV0fPb0o8jmd9xN2+APHKy5x5tE02OcC9tBpjYAmsQcA9jphxiAtj0HF2ja5kFOAipDyciFpIUzYUIvVlDc6AJ0O0OVo0hylO2fJVYXG/DgIO3sXGR8bGQ42TGoS9yE4U0DhsEd3ktHVqTfNBnLnw+ZSbLpv0LJOgxDNjZtQR09LYN77WVLv/yNJLz0gloU4qrWWuwlbs2n+ErqHvEc5KOjk4SQtghuQtouB3RiShJghU70PpdmyRNPn+X7vJCAZQm7zulEZ5Qy+yMounmenf6sYP+Fr7nXd0K1UFbR+k8VSxQHg6VwTQBANFTRFb6Pr+3ICmtLZyHQsfM4nlv6cqXmrWZdH32DAPYF8fH75mzMbs7zorE1ZbCcdbpfnOOFg4enilbh6PtGZyfT/DjXgEGiLbZQR5i7eSmqX6FcCDg6u2NzdgtN3kSv+QzIMvDDXnCPLEgqh9o30iA5j0f7o15KUB3V6/8sdnp6G/DKW6dAltnZXIqlgmSD5S3+sif2+iAOycq8HNtA8Jtzmkbk6CNO3I00XvHASwUvM0BGz7DoOsbm7wIFblHwhKIxUSG1m68/wu7MYTbyx6s0dLz9lDjgpaUSAZ0kewmYV8hQpQ9pzDtwD5W1+Cv098pJqYJBaSCojSkBcreHEeWPVpNYGDu9L4kQTATZSwluD922jxkmAabsYL8y3cvwzpOhe0Fq19HcivDLYbKRramLFo5vBZIROJEFHlwy0SH/wHDUmwO7pN7j1FoZ6pxvXT7MH3i2uZpo+tIpfoWq/q+8Fr6e7MRWGgYeMhRnL3K3IhORurjD0kNcuxqOlzuLkVywMkd4sZcEbBj30cNbIi7DhsHUbTzb+lOSVV4LyPO7CX1ufUd98Tn4pC4IOjDAE7gOtR/Q0dt5v84vTlR7984IXh7zyZX/97cpcShugGxAIGIaJYuOT9VDHvTIoWKqzIcB9x+regzTCwzF0fBHB3WoNKTWhZRQ+OkUEMqwS1/cfZ9vihImnB4YD0d1thFfLH2X7qW34GsX6xKo7yJ4DhMDgyFA7cOojzqc0qB0aqoax5B+yDLnnr568ffkB9hmFpuqm8uwS+kREl9ElFPFIjdWEH+aaa/SVRTeRjRRvVL/vm02GwbON2A0VZ1LoxYjiIPrDqtaCHtu24oZTIUVCkrm0WWAAcizMDhXKX5yn/PhNzXQLWtnEdRN+b0r+PlyWQ8s+XA7pJYAKscrwatfJ4jvdXhweQWq7FqLhYt3WuA9POra1xZRmMF+GgGUHD/mjzVBotRbYECS58NQBoYb5+xFWau8mp6qcvSFTGgOkDO4wqTG7aXWAsmJH/WaayBcExWW95qveQ2DBXusW/qWwMV2RBaThaLdpfyeb+OFocA7x5fuKy7PQMqtpB4QULmgzYdgBG/jbA/+Djo5HqP0giT2KEptNL66WDdtL5qjse47BnB9eLAZiaev3mYXp/46TizaJr1MEy5Jg9296F9DEhNPBKhRe4yjYwGpc2TFcc4EgWq9Th+LGzt5jcxewuFHgql2o6/4god84Qmjz+H+5AnvITnmBG/wIs5OY8iRa2OVtrrgJL865MUJKvsPxVfMe8MVIeYn2hrBu1SHRjFIpak5cqQsWaZ+RTkwDO4LCRCX4CU1FCmG5EDZ4Zv6g26m7p9Lo2B6dGSx/CoNLg/7CLF4DSQFlLavxKYmBKX4lMTAlL8SmJgSl+JTEwJS9YvSe8qEYbZn0mpRBfw5dQBcfx0Rl8aeD2teuOl0dZXlVM+Rh2/j95Ko+LDWMz/YAMLpWbACJH8r+NR3jch/X9KIDoVpi+jHxbzj5Wwj520siqFWA2nCCKdVrvFyi9QWfJK2kiM/b2Un3UYuJHk5up8CQMsv1Gt9RuZEQQOI6glRypNtOXhrknsrbN7ygaQWs8VKMO9ANbxcBtqUez2Kx2TaTJUFlnoum1o9cr02GBN/6gxmnV7R11O/ma9IK03y1/c8PWmp50rmi6eoQ9fYikJnwGrlIk45V/e0LhaEqhvFbEZD3UrL0fe731peHfoS3xk9ZRUv7Bi4FJVcNN//e0hP/Dx3/f6EVDrHrsK/YUBjhPi2qlywCEdVF6ye9HXVxY/4D1+E/yfyWrL86lP/jve/AxF9NrIbzZ8VGK64mmFv5xGRvKGPygB46M4qKdNgzSE2qToVooAKRSTKT5Iti5Q1vmT+mOckT4PY+yeUS9Y2jjIF3JkaDbHGl+ql6Dpu0TsJrpzzpbMyys9anV+VGAVecRNKIbxHBur3Z3GHHZ0SRYUkJivtzpvPnsuwmaD8hAAlQIQDLHsbCnWwK/2xPPQCB+3HnH3/XRqVxZUUrRAoP/+dnfyia5fgU//5wu0nXnnkSUccLBuKddGMknp/vs66QUYQd7BvK7G6sXYbDe43ywuaRYubfdjofXWPq+6WWNfQsquCQfBFw5NGBElgat5suNLKtqq8MDFlcfxMmEExERzG3rYEId3vFN0b5dCsr15GnzRXpLNFRevqUJdUkM4M6bIwg46njX7ltqkscJl1U8irkA6z5a5nhFtp/4XMkAQvzXLJUzGkOe7miG5uqefqEAlSnmFKWqn1hOkzcB3jJr5lG2uoDGQ1roaYs5usiCrsA0TwasvSd80eWbqg1OMXFhsu7E+L5ZoY8EQV4tM5W7Nbe/M2HDh7kJfjXyXpwAMH+hjDZ6oSEw4x9CfcMNVG/1yhmLNdw6Ua/8XOaaHstZZC0wUvJDDewnahTSLywA3RETjnCzulufxTdyfoR+qbGUiy8aUK9hhX6KdR1WITAb4GFelly30opwSswPj7IDCnyZxqjMnG8dt6KvHBx6eIEnWfJFlG9AybPGvvFGzxFM21bwnIzZh9/5TzHk9VDPDx+ywHiOU1jsNmFSDdz8CErtGR8XTvCceFeFWb9KnZeKg+NXg+zO2u7usxayBOJkmmAPOubbWkDNw8qBHggH8Wc4n6E8QJCG3vKuUjUpqp6aIZOCzocwlWG/G+3JqCXlAOirlWY0NghC/G8FmDEsolo5AZPoRB3tplY5Gj5PoIlwzX0Nj2oKdSgRgtqMviCAET5vlOGJqs8/SLiCxi3j6/rSRwuIlAbEoSyNWT90p0t7SsPt0G541NnSx9iRttDNwfRk1Tva7GUZVAKifZQsMP1gQ4WpopbIy9DgPA0Il1KmFShCQNLLlH4LNm63FWGzDJ3ymAKlOL1YJZ1v8+HWsBiiWAo4sPu7YfX9aQXZwZVHJWseOvGMZzRCrLQ5QHGO1NewMVY/B/CxzKmEkzkihU2dhqVg+t8/D2G8hL07qE/a56GUlXVN75eBp1XKzz/deNgN4vOzrrUfomNqP0SHpRCAXvoMEe5va/Lnu3IcqoBLk3aAktxjZ6U3E1zhGz3SbM40urA+Svd1gYrfdOT+EKbYAAAHmz7KWdRiVoX/FXDF+8vEVTwezw7KLJM9bUU4sWLFixYsWLFixYsWLFjhoFQFj7wO44HAAAAACGiAAAg0AAAIaIAACDQAAAhogAAINAAACGiAAAg0AAAIaIAACDQAAAAAA=",
  prof_login: "data:image/webp;base64,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",
  prof_upload: "data:image/webp;base64,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",
  prof_companies: "data:image/webp;base64,UklGRkwlAABXRUJQVlA4IEAlAADQtACdASoIArEBPmEwlUgkIqIhIdRZGIAMCWdu4XU0hl68l2YDrP9b3mClXeZGn7edFv+W/4Xsj/uPqC/qn66fRF+1vqA/Zz/kf473g/+R+3fuq/wH+j9gD+hf4b1iP+37DP9s/3H//9wr9qPWo/8f7dfBn/hP+7+6ftleoB/9vUA///W/9Zv9J2sf3v8sP656V/jXzD9u/rn7Mcrznf/eeg38n+536n82PXb/k+BPvd/t/7r7Av5R/Lv8Z6YHrv+c7WLQv9//xvUC9TfmX+v/uH7s/7X0N/7L/GeoH59/a/9b7gH8m/oH+39NP67/u/Ew+2f6j9m/gB/mH9Z/3X+N/Lv6UP5T/yf5b/Qfu57XPzX/L/+r/Ifk39gv82/s//Y/yHtwe0X0Y/21//4dRAK27ldULUV00Bgswta8GfH/Zy0r6F7mZXROySXjD0bG7T3gUT4aWd8onw0rvD7BhK12m7FcrUjBjGnmm4S5EBi3q+y5jRXqvJPFwwIX1ssh0u+mTFwbVdaHsmfkFAvZlKQCaP6BhH5UZJDz5Tr3L3ecsbEMkDJeBRPhpZ3xV8jNxzKSFfgoY/H+ASoptTAu0aKFdB9pj+pzlgS6ErILDiPBRFLBCMIJARhOv14WhnFmp7HOcgEOzMjYW/Rqw5FfzOYAmhWPS1yYIY2VbV5Tj1CJafB0Aaj8yTBCLgSHFO1W2O73hReBOKI537SbS4xyWlTrv8XrfYpNgnIsSUXiH6C3KMPSncsgHNd+cxCIiDRKyy26mZ9KGRPc4ywvHLihb5RQS6/Yzf5xQE/bl6IDUvDOGkStEHufbXNFsXQdCe0zaVLqdJghzyXEv5NroRApqucaJT4fryyIJNKszViZK0TzACOHFJKjbXf4wucLanRe8lONJ/01662c3+fJ3tLbnYA12ujB/W2uDru3FZebr3H0YOPL8bFisVNBTvR1V/kwp2gMrrJ06Y/4QekuTtXZJMlyKgkuiQvz7qi2VvHqayRK7ufvuvQq0eeBdBeQMdE8kjkdG3wT596jSiuK8NmY+QmaQ4iDP33LSRbmcpgIdmVhhXLSpr556yXTVYr7qRvm9Y1soycFv+vXss8QIf0VjtdLd8qm4g1QxoKJ8NHEuQxQ5k3VarQWBchOzih90cKPyFF1QSCGZ6v6SLOSrtD1i03pa785iGi4HTehMPzl/o0ArSjKcz1T9fVo3MA5HZIX6j9L+wT+IJQiZ7hquwQCH9nP/yfqr/H64RYfz/bmEaJACFIHdhUreIcbiTwKtaHgCDc42O0zSf0ALpC3RpuA69+YCnKtL5X64RX2b/9triAgVrgqaWc8OIWpF2+rRxUCO71l/LYqb+R/OEk42O0z0gk2AU88GMeoFDIPachOorue+GVPeV47WR+/Uhlt+Kt/DztouM8Ph9ch768wgcCWghDnEUbdQclYZryxg8psjIbTj/FUUTFW3eHmNr7XGWdtwn7hXzOR1nbunJx6Ci15L55+ylMDGiw6qsBYOMBuxwdfrQcw0wLGPXieM3Z8f553he6kas6TpXwPXFVpZsITHqBITuuMiR9ENXeO+UT5WGbpksCAf2xGwp7HZLb/sdxMd8HevdQwFSuL5CzimuHuDE0Rh6xf0O2G+HMQjwZXWjaWd8prTA4eX6XSz85HmirvTeloNBeIaLYWTKRob4KcHfKJ8rB7NjDNLzKGaY/4svqGNBRPhpaXCecCifDSzvlE+GlnfKJ8rB3tLO+UT4aWd8onw0s75s4pRPhpZ3yifDSzvlE+GmBXlnfKJ8NLO+UT4aWd8ooJcXw0s75RPhpZ3yifDSzv7+dT31c40Snvq5xolPfVz4ZV+d8onw0s75RPhpZ3yizbq5DSzvlE+GlnfKJ8NLPRUTgUT4aWd8onw0s75RPh7NBpZ3yifDSzvlE+GlnfKa4m0tEp76ucaJT3kAAA/vi8Jh//1c//X23YQeF+LDH9w8MNPxiSsgW+olHwuy4CRQ8ZrYST4GDxFrAavp3kHUKAMJgUEb9WGFBrR6wbItlc6pUrWQ6Or6w/f1IBn5ic/JwFH1Z+4mKTc0cl9q5Xx0lRwP7WzuZvHgcjP2Um+mEAX9Mk2NjlvY1nWPIte4EW6kfckFd19ecytWo8BQj0/aY96xtrDi/fhSqC39kSqyzvp0qz9PcbHgDkv96FZ6QqKXHov+/tClmp0KDPjtBo32iRuNpSo2Dh+I9AoLQBW6MRxKum2HwvJjVstMznDkAYBOKNsUWFCes47gOpKIpyCgcMwNgX+aiLQm0MM/aMpXoNDvfqC8giRuJzE8/72sQn/AlnoeGV9tt8zZQAXRtiqvoCw+usgaGZaIsOftuR1fqtDQTN6qiQHBL7rCiNuZaXWt/rvaHexRlI0amcQYCEUtCPP01jW1mjSaMXwIxGwdo2vgq2P6yEAKkX+SsHoexjE3sIlzrHYgkFZqttKyDh7ytj51DOSJUXA37XqIY2xoroYAvedgJl/4AGPqo66X7L2hBl8Fm6Qj7aRKkwq1+eG60DL1dP5UcFM9JsS4Hymqq+eiSRYKocKsj2fV/9p3JSHLQn/SWgJ1U7+PdTY5Fqtvgcf9vMMR/g925EZVMvF5Xn0ofLcp8NdRMR++vmASNCcY3+4n8ylc1Mu40/uzjp7BNh3MJXMmqc/LXpl0ovbUKJNV+IiIl0k+zmq5HfVN/s3DT3OXlwW8VN2nV+N3A2BcLguW2W47PlfMcSIrYqoBoLlgqyJusT6JXpx0ED9beEA/i3uI45IT0pqnuy6br/Abkvo1bpB5H0T9w4wHyaSZO5wT3ISnhrfctSsjsG3lDBURmgBdR7nguQ/ti1R6Wumr2vikegYpo75Z3TyEay+fRXettonAEzmAVjIio5e/iPkYyr2hXeYLgesjnaBARsgytREhbpL0GsPLBveTQV5IyRdlqDbKXhcAgjQ27Y1ubeqs3CvbdKOcb7v4RrrdTlZnqAsIiBZMSasTSYkxUtICud/qbdEjvc3ZOpFl5aicA7oY5VyegwZE4WlMvL0yclK8USV9TcMtFbRhDuZv76398xcurbCEsP30vb8RGDWRj+50cWDE7tuMjRjoE5JerJa0Gj8wGajG7ULUPhPjTDtF3LEWHhBSdkMjYNMK5VfdWeJoLNHmMK4LP0ScqatgPeM0OtJqaKjMM1ituK8RlAqjhL7KqH97aabJjOd4FMchZZttDCwsltzajT1x1fxeyovt7ucfwg3m3Y/C3eluAmnDFvjFPG6L1juigHGUDvU2PBkJib8LafXkqZUxLtHSkz5pR9R+NA8DNzXZ7+SwcAZgMpcoyad91bIQ6kYtyKXLT/w2Wen4oPrubWY5fXRpNXr+VNIbm72mZjfvQ+OBBmeeN9OeR426sJg1WIWfw0VUtTj+8kEKUE4+OjsQht0Yl2hGrWhzwLSUBes30DnrrV/c+qBnCUt6WMUHjWI/Q6APlU49O0T+xOITnHaGrfNiEHA3VHrYWv9YxzpLydAIv6pu9FaXesPfx6RAOaiC61rKM6mQw4FS2APokKV38HCZQatExdLwGPe9RHGttyevm2C5pl7EM2029mQMu+0MBa+iIgTQ+Ae3nV3rEftMSqBSXyAAde9C4BRf8FuhFwIusNIDlALE4DreqKtJ1Rm7Zxo2z5+s8maxiElxXp/LNB4BioXDvrem8xs8xucetu1c+hLhyohqeQoYvF4S3TkdxdLCRhQGIGAuMLI9/ccw6JJUQRL8bT7cb+d9U5WkMzvFJUIDt/Op9khFbg0zoN+PR52Ogrs5pgykMCCAgpYjFMfLd5rrh10PGNarHdFqnTPN712zxhk7KRFyrP7ROTGb/mP+WHwNKI4A5xwY5rhtqKdRIxZev9ZpZG12sRqWQm2MXx5fllmXfTwzOuegR+E2w0KUi3y9Nkuio0wLHAOlgdUUuKd4p5O4wHz/4NI71E+WZ+DN1mrelv5i3iuoXxSFKVNZoVX6JUTn+K7ERIjS4dN3yt+Bf0uL+vp/tYg/Rj6zAuzzmML/3cCzBDiMp7QNWzTknxhlc/Rgmn7C3bUimB0fJxWqudm4/lLyvhYpJhgJvunKfUlP5/hVLb/++tD4b/KUfPCGmkneSHlWSpMh84yC6g3mNwzOusYufyIgj68/GX47eNfmGQvIZTktr3Zf8rSHIpvTD8lqLLvTw6p+oLSMie4lXh+Y3rV/Jvjdlho3UHm+BS7QTD/ND9Ebb/SdfLc2Wg1iJks+z6VCYPD0l9Z43AAaPxzN21LRWqdJEXiY/hZPGf4s2+FKAtEOR4izfwpL3BLe8I7Bb88WHmyYJCZvcif+Cen8stMiSMRTe82qOiwCTIMccEnj4L4vYI97TnomLzH99uyKI4Gp7HVylx4ocORs/3vIJyF/VGTh6WKEizsW3OHV7Zxh4sCt7zCqw4/Gp0uqlhvgclPUufoiV3y+xdUHu33RNZKZm11m0AoWwbLm9qxAwnFGNxJASMl8AAGZtp697iD8o5EtiL+3h5qQ3xmgL9Qut4Aa1aZv0R+9/GzQEWlLCDUIXWPreE/f3Dwsnfoayut9GYxLHKxJBdUVxWfYS8pLy9n2ED478MkHUmhRF2ekx1K400/xHa3koSOGpnnIcs7BYMw8SNQpN55ZwRPYxyjaeNzRzxa95NK0EeHhwi13VtX6dtAAA0i7HtmC+op9z7IZ93VrL2zNTlPjrmA2PG4BXNx82hZfzigsyE8viU16iajZrMh/b/KluX/BCx5wv1QunEk+GPdy5WDcJWO/1IJKp4EYyKOPvLCOpY/t4ErI7Q5aIBOkYd5aldumjaT542v16HuXkIGCq/VhVSYXPv77bCcaJcoq2+ZjtyQ7naqnjcx4Pv985i6bE2qwvA8n9dx65dgovpVG4Hz1XX4018jKdPUVs2Yo3EFJ72W3galrQfo0bTe9JNeKvE6XkCZiXRdis7Si9/JpFnostZuoVoxDBsccIlgyBCcL7TbcIx47pvLpOIHoIvtCFiuDEUKFL7FwAWbBGcBrvqbLP/m/OIGWX7D/ep99pEvNCm6SeTd+f4zcjB22vqxNXZRSC6gqICVTNGiqLp/Dfihporm/TKjFt/KIUyL1umvGvUptjshHh/jX+F2Rk3CCEPTqJNILgEr7fDW1nszCtOEs1khHX5nxsJ1klcwio+jCtbbhyqO2xijHE6w6mGGGRuyKT/e3OfpqajHj3SS8kewGhStsX8cJdzvl/210mNHygWNsHN78Eb4ZtkaPDcQ7R8O53lOEsWPvHE6pQrNxryA1oxeu3BCL8D3kIqN+AfuZACslPRoRdoThcEKt4Xj1mybXmN7n8+gkrS4w+1MgGx3iL/L5XOr2UjdoIPJOjzbQxP1oFXXE8lN/3FCu2rVfSH5VJLZlMe1HRso/o6YJlNXPZAvwG2lY3b6xyTqaLJ4H1CbxEq9/b7GDnOBTURkoJZ4CgdlMYDGB2Icq6tHHQSHJjs6yQS0EVHNfT3iKC7RiRonJV/05fbwpE1uDnsC44KHFWDPH0vjQQAi8dX4uQMIUWOiYfJzYxRtqIxAEWfb6WYbYsx51Qf7HhV6Zfqq5eyYxG/bomBKssL/EFI7DrEHNCqKkHe+QKMm7+agQFZnUVAH6Fa9Z2ZOb3ll8Rrpvzc2wu25Gj8fILRK/f/pXHt/Emqbz7vUiwmPsGLk3fDYlh4rsGKVMmFGp73cPi6nyN2r3exsj1FiLZLwGYnJuGFSV/9jlUXLpJpdGln6MT7ux8fklg+y3W56HP1Kh+W/Khv2NWyCQ5zwTATbMlmB2NSHhk50Kov1BF/+QnbwiXHS2akfuc7OAn6RaFEtv1leM5NHTd7O8Fvx8AsVOb7oxqg2gyto6qfxmv+M0w1JbeVhZzdkLNaGivE3JGz9/Yod1vNkdtP8ubDxeOpDckYdRwHNjgM4ccAAF/To8kdgQg3C3JWEF5wf9VXi/sHshOFt9tHv1d2/WJhA2MWabXp/T4gbC40ma9gcwAoNx69sastN59914+wVjULI270ec/gw1Li3zmPavigZN02G0XNlgxKhsaPPG1pHArFC6fmvOc4zoiasYiUCkw/eVxI2qmw5i+g+XusAtwneFXSJXSs+DOw0whXPMqedGqqxScoz9O3w6yn7kxCkOwYK0A4Q39Mwv2dojesU3TEWDAz94yUM18tzcUOtxcwm54FiJHBf/4O0GpyCrVHuiuS4B4GrREQUJcBw+tHLyX6yJTi96dnvaTPmYKGXyhJnt8oT3L4ym3/sjKcSyLJU3HA/LweBp+to8v9Usvt+uIh2ciWm8TjV5BWevihQCwRiM1ReclJlX11l8GCN6Id8RlUCGFGXFp7TT4EjACBrSzLHv2kjqVvM8DNhkWOs3NEU6DezVpheq5iOFt5t+mYJiDfWxwxXbA87wWSL+KQA0Sz0+x6IrGtHq4oJdZOK33OZ5CPoDWXvq0/7rPV9o8bUnnJ/I7ashSB/RDGGBI9bPjX6T71GD/U6LTHHdKUfLHH9OOyQcp8poDF5IXMTupi2yFHaBW5w7vIcLZtqRA67pi6yrdSTCeIGnYtdaq6tydJp9uB3efXFAOSS4PFXcQZRcl8FzXhA3GmQ72yRKzHTRyocqKxkL8rOlKYTSqO/5E1Mm8vjobe65VqLNBouRfVVHctf9fekwEwzytRgp5cMXHak3c0xaQJtADY9cwj9dNBOWuG0C9BflLpRwidsobAQ7gBzO3E4Y2OpxvR2sef/273RqkQmO1EO69W/Dw1NSK5UW666BDYiAgPBtm2m/H/0B6q2l6kZFtdVwflznnf8ClzULLQDp0apRSxcsGjipZV44KdGVBSiqZrVgcnFXMZe2m11G8Nr9WtmeW1lTPd9DwQKmr1hGY72F/7UEkS5rORt77GwN6EYQPwLT1KgAHnsn2z+5qzWRNPbFctHi5IC8XJryiXGqi5i2sDY5CP0DXvndtlUdmc6ohjbSrvN8SZkMvPX57n1pvjFgUOU1DP0RgPZM9vQStk6xPlp58NQZIV6uWLDjvJNpeuBRSzpXPl59buxTxzCoJw9L3mccXU6xWy3WTfLBXHA84Uriru1NfQPGHGo+PJD62tv0CIEygA5YEfkv96x7c25ubikF1FxLbP7t8HJ9gkHhuBell2qPZr86vzKnt0XqVm6OHlPglM587ook1r9DlToRBJPeprAjD0B1S9zAkfFQ/JpmM6TEGCWpPmy0KCP4zIYGpabeQrB9gBjCjTAOEGp7gW9XNVcDfwl5PQSNgUEAcW4ppM8JIEHbj/8s/mF3n2Cf+JrJ6nq42ofAwB4nSo7ifetptL0nP4NIoRHn+m7/tciSvfKY47H10959dn5Ey5HRgNmSnZwf+aJ6rTj5bcfKqqyA27ApOCcsaYzTqkv0zT74GnfWv5D/E6m/u+T8YvFjeH8wf2DPaCAg8WR4sG2P7dkkKrc3sQOPVZ/sR92syXI2DfQsnCLdUpXORdSY5N0lEjaWNdcdV2Jg6H+R4SIg8Zb1eYbhtMS+x3wGbxY5rifx7xJrPxt15Ip8IbTVgP2VbWdrW/B4TeJJlX0f2KxlT+6v2wm8fHak2zGe+ZRynb8YLNJhXPy7IagcZoQnfQCrfIubFIpGwMMQ0JWidw8oz1EL2d+KGtbMl1no+z0h2x/hhupoiW55dGua/ymBEasUySiwTM+mTeSvt1kFjfi1Huxy4cd2LizLdqhY9OJ0K04Ewx8r7vTXiEmn9K+ewOkhuPo7qlY0DpiLO6DDYIDgJr5NCLlATm0jkvsoPO9zI3RITk4Xf4gtUHqCvkxCGGjzGBeoZliOCROboaicbj923mwBL5gHSGc5TwJACcrajHzNQKDSr0OnL4URtEHkBRXLiO9lxIoQC2sqIkdXXyNwAPP+Fu2DDO1IDH5i+ZNnkDTIuEMG96R77iFLlIKm5QnqryILtWKat7mkv7HHJ/l+AiJRGdKmOsiQ3qf+3hAwP6ItDZFpTc5XZDX6z5khrKqGxLHIAmmU+OGplf9qV1+UC20ZS50Y0E9HgF6nN0EqOfl/3f2ZEHUtFNtiUIFj2p2YC1bxnT3e6nk7IDV4/x8sUPsETLSWQWeyVMr031oHtTfdYLbTgoId9aaQWWtT/eGds6JY5DyhW+0TSLlda/1GGnGL9WddbEGSaakKG0OpQKsx97//XWVpA0q3ZeLI9q+N3idDTpQuctV7C5oUfaJhf/mLXl3CUCzSkAEG+KMWpqfgBqv3hnhJW+k6nFtM9aV+90VTXn+FE5SfRFduTJS7PwIS9eX3auWeil+zfymY1aF9Dn9rKHornFa8imdxeqXAozZ7r7gaDv8xDBUL0JSwkUKytTH25Auw+9eADCOaNQT4hHhc1k3m98fhCyE6RN9O+JSxT3mGQbbOkuY9XUtLAOXeynXfpnWZRsX0U3Npj4ANLjto4VCyfCyAdVdF7rgpDbfArxtlH4ab415OC+IpOPYRKfkDgrFgpED0VD/8ef5H9E43Nz7NJn94d58+r5YNhfUe6Px0LOVnezcJKpxAzJ3yo5KBwsNDkMQoMt8QQYXwxOTxyY2eHCxLH6LzfD/Ssb6XFuvFvrazglz5CFIvh4zUQp5c6v0CUi7xyzbms1CQUN8sSM7SLIlQ4wnllVuyi2TFZJatWxMUH8DKc79CO0ulQ2tKnY4xqznc55AAvI46NABGkgrq6pVk5N3I0k8P2AzzQV/yCt8wGlna+rMVfwQ/XWqMVfwH6FuseAe78s1Sn/jwkfTs+ME4+ngGFn7qL8e5DVKRzf667h8+ZM2Gtmn8ZuMjDdXnyP7qHcqD1Z+laf0sfijNHvaIfv+reUw6WnC62yOjNgYXg0aTamC+sM1ViPwkwACIpwIehOLf+hidmjXkYM0WRLgmuVOTyJrvpHx7PMifOdqvTXtzA4kmyT9DQkuA6HZH+bW5SZ2vZIo+/yikGYtShDb0wFqDDsiuNPnmolTFiEmYC04FftNFAL35qGWs8p88ZIb0aGP9WnhwkR5H9W5QJjznXlbR9asVl/y9k50CAUTEoh8RAAdBPAZFb9m6w8vhurT0canKzF3hd+AKmFAkE/TmxIdmhw1rF1J/xZdljV8cUhFOmMrJll+nHVGar1WsHvvanGSLZgWMqf8SqlYBs5WgIgAwzV1c/DpQjvI1iCgmnQM3ImbhvxKO/HMrzn7cCbsAGC0mSvE/4yXL4QXuxnJAxEIxFk4CD8eD4oAbN3+ZZl0sNxgbO0XtI9tiR0DxgwPAXWYVe+ssf8MzLlZfFBmHGe+OA9vKPKo2r+yzxNQVi9fnwi8VBTdvjn96/DB4ofHRb3Kgj+J1AXUDmaf2AeIllP7dnCzzODVb15aa4KKkVwUrG/B5c8yPpRCz5uNDYso7RGqLBKkZBmtzyKMGD+HZVmGzu3TJewtHRde3alI4898/qLNhxjISSivW213rR8O1zAZrZP//WtX1/A2Pb0DGm3JaY/QKBhABpnsNGqfLDPwCxLECTDU1Q6A4msAX7CTy0apaKlA6I+ACiPrJnqMOLaGAA6vlmeZDCD7yCobftsa5Fq+rJX30cSWZugC9kZs0qvQQhrjSJP/7WD7VxLjiYfyOwd0eEv7NlX+3lRMnU+8r86cSt3yU2RVgJ2rKBJeuiDVqiOL0qfQOFAHL8rbFJRMgy+zyzQstOXPb4Q7hMviv/CIH6/zf6nE4eefElitsOq9xqQA4dEElVPAP/l18Qsaawi5d7DIRGR2iBSaEguxjtj5kYebkTJBizUJLVwJaJLADvTXiaK2fnYcsCWR5C/EtgIWER+e6mWTFTnsbOPzAlPJ/xmQbkhVKt17WjS5SD0HrQ2fxMOglRXcD//kOPMlhqTw2R73Z4PJ3ycykQ5Hry8HC5Em4AEhvAJVTXg+a+4pzXqROMF7PQP/zAqtn3uVThiH03x2r0TzqaZncoN3fpddcjNPMm1PMJirMO64K1xTZc4Q/AXQYC1OOkXlklNO3bMPPOO4q5rcgirRILznwhUznTO+UuAeEFoWSYunBltPcOiHwghMG9gzsIjSGxlEn6iPusn+7kYcoWBXhMX+hZXn1ahia9oe/fsy/ia+Smdp2tfShh0a5lmDv/QHVtIOdELefEmBB0rfBHqgovE5CzYt1QHJy2OlYXRzyltwbHBbSr/IdIGDN7gavw3Kdkon/stmOpJWP1ahEk6qETG4zz087SYqEj6A+UE0T5yjA/7bzDTem3OmKyEDZiFzuhIr3SFP8V1hLgU+ZBj3AM7COLuVOVf8sf/DJy9dg21Zxgrhs0pt6B0d+/UPGFNuottBn06tUbIJmd1hRK53D9wz5LQRrjYqWVJ8uU2znGss3io6oZtsi4PtA0Yk7skTs6U5KDu7BITBwiPDNlkORuA76tmYeVWu/KxPFFtu9ve3M2kE9KYygX26n/7+BZ942JmH0rU07A7aS6Z13jn9XBoM9AjdZmf39EVsZhpc8kF3X1MNVIWvtlJ9KaGIzdisBwVMxfiPZDAE0Ss2lD4ibhWexHMWVoJtZ45LOywda5ihiivDDq3HPdlHIwkuWOSwfSe6E6z0i0NyIEjMXnTVc3ieavr/JOGfO0ZwNyHkEBkGI6pxAvA1wpwBmYFn2tfhJhJ/Zk/n4j21bdtsHxHLvL7UvjhwGDV+Yid2gKg83SlHj6vRPbZzKAfEkr4EEGkMwFBl5T1MC+YkE9XeeiFQk32zC0v3fKQhsvHatNAxAhds2pHT7GtWAlZrWPfjZgi7dQSMdLMogE4EYHue4DXnZIh3Hghowx/r8BKMA0V7g/K2Dud2kEIWMzL77Kl5i1CL+P2lAZ9bptX4H5AB8vVnnF7i9eZkrNq8EaT53QBpHhorjLe8xPs/JJnZNS3c3Ktg5QXyX8FRmV8J3s+GjUBj5OZOjnBFR2mx5j8hT6Xyx5XQyoIJ8j8JCeBntPc2TjdUfFfMwGYyn3YSOjHmZkMbjjcdc9xGBmQGl5SfblW0hN9REr+JOJUyHA8pZpcrREIjo9AyG8l8TwShOOJp9DlJLjmQI6ElaxlJzCJYd8revzw4rnQ8XzJtfaKYymzkQZ9VmF5zzvjxYY9l4KMGJGd/AhayEnwkE8BI5ayCqkNrOtwtNydc3giWcX+0vFtmcTK1h6Jc/IgMSnpjrGOMnMBzlrEVouctGbg/x/AHtbsPcklxqaoAjhwG93soyNsw/ENifpF025GMbadXhAx58A/w1zeXu6mF+pfyxOF0dFBNr257vIqb7GTYF2y6V9/bRvOAmBtaI8mZEVDo5L9nxn4d4qK8Plk2owmTbFdQQA4OZoWjBR2J5ARv6DbwOWx9BMYAmYduzeFEaxRZbpIAxwrgA+PfuwcgVbI89K9qA/Cd6ab3YqTpTUqEYvbmrz2kE7Va+Rowq8gYqleAx6BIuMSvsgLGyhAlFiJKTs3uM9rjOHYxOeCJoX3yNqiGCfEsiu53R/tfjtARad4GGZhqFbY9OcWDOVLOf7Cy2yD1VUPjyXdbJj3Y/GMmc5oyx61H4439b1y4rpQiVsy7Jpm4lkP7ROGEAxQ88rO3dLjNUpxXZNySz8QpeA6SqK8ic+QGSfk9mtiLMRA3hENRKcYWeE/Lz9uGNvrgCfaKzgIPS0IKFnSgVL7zln/OGAK1pXQ6gvby44iHe8JdfZ6ARuGAhKbLfWCJnLeM9MoTSXbTEL7nAn3Uo5QGRAaGOOZFa94wCCjtkO5ZU82ec9GxI2wuctof9iOw5YkPtYxKfDe78adu7fingKMydPIDHkNT675zU0EuwZ3UoHZbn/HXD09y7JlQYuKuxCOWcj45Vi9R0Bw6Y0PC46X5v9LRxg3FCD0wRIhF4bXe7DiAiY6/EHMp8WpAPDnPaJlkNPSLnHjcAp+jGVg8Yiu14yb8DWBaXx8ut48WN4NqwLcXB5HhAFxNmIjTwPZfGekTgm5atSPfD+3Z4a8aHjMapiDxqQBHNEwguwcvtyYUCt93lP/B0ls0AUGl87fh/+WdtS7OMQBX4VV9DRL/YzInZfZNWaD6wT/1bZFxXrF7AKIQHLU442ZeX2igZiPFj1zbvMstfgiRdkWax6ls6afAkc9dgfBbeicAkhWdPP1BP4RjRhqce4Ga/H09F6PF4HP2/W5Mq8G+HMAZMloza0WZKb6Vm60OzlRCb1H/pI3nHKIZ08KxNnyFdLsi2H27MXpOVsqf/txyl6FrnuuKPzuG7pUSh3txLFRCnbwyRBAuRYJvCF9w/TnnKRVg1RvKy9uYpOkG7RgKJCSrB+rw7Gx4Tiy+o6itab88v67Gu6wX6cOxWByXijn+uZ8THVRE1bAgFmRphhUvinmnMESypGYwLZNu6N5oVCkyFAtdQ1ATTeeY7kGbmF0F73xRAhrMsKthQC3MDSgBMAQFdUtLJh1RimP+0m0uAEUIIoJO6RcCiRIpKU4EXVsx2NW+bEGX3E8FJbEgWwHEAlrjt8M5gEQ6X3a0aL+Pux8KHjvlP2tVz9EW4vGEKuXn3LFsNgBBnwVEhBL8GDVSwfg9xs4ATXatwzMJCevs8XyAbQgqucurlIw88UJvRSzSYWQqg5i3qI8WO2zNQ86wgok/2vhjviFPXVIT6OGz4Z2HMru6837VFa30x8KfSmUidTquQRwuUPdAj/tNnmdUT+T6Gj8zP5i5YSxWF4j5vnmgVQx+/0n755KcRxPJTh//kiqV0MdVCUAAAAaEAAAAAAvPAAAAABF5AAAAABrQAAAAAC88AAAAAEXkAAAAA==",
  prof_approve: "data:image/webp;base64,UklGRj4TAABXRUJQVlA4IDITAAAQdQCdASoIAmQBPmEwlUgkIqIhIRK4oIAMCWlu4XYBDOyT/n2PJw9V3J6ct9t30f/0fqs8R3pVeYDzrP876m/QA82f/cexF/Tv+R7AH7Aetd/1/20+EL+6/930rvUA///A5+ZP832vf2/8pPPXx4e1vZD1msY/XX/fehX0u/febfeTwAvW3+29Fx6ZwIoA/I/6F3xH+t6C/Zj/ee4B/LP7N/w/UD/EeA39v/zH/D/vn5R/YB/Kv6t/pv7t+U30qf2f/t/2nnc/Qv9r/7P8x8Av85/uf/e7KPox/uyERRJhDm7SVRzNI8gJoY8TH52LNGB5WHnB6Me05GFu2ZV4ns5fLqXLS+3M+3M+3M+3JZYKZ9NoZk+WSnXjXQDbr/TWRtkC8+zTQKJrVOhojU6XgpHgkSBFS2n7UNASSU9F8jEosE8KhsQ+5cMJL4xXhS3hS3hTEf91OOQ9BJapwzhR46nX5bSAowc39MYDdMhm/iA3YibJsJs7XN8sU8qqjzfM+3MaEXanMVFC4mhfC6KX/fZNh6AunlHLDivsoyYc6XflXuOEGzIn0/g0/jMF8RqqYzdmn7sVnCjFaOZoiyTdkmPWmYtwpop//qO0/oVx9t2LyVs1Bf2BVnWixAWJpG7GJKw56UpgkXsG7z9whxrrMOtp+Skuo7q6mCiBomK5o+u0zoHmh0EAIOHD0umU7CeFJa41d8uha1JcfL/pAr3KEOsjseXA3qay+NiAcq3VJfQQ8bkkyPtzQeZbk+1/ktX4gz7rQfdXyfPzyIphAI5UhehiXhAoLqbuxbI+ftxxi+b7X1XklN6xNz3Amrmah4CHDFhISpyrgM1Np+Skw+HPXdiHKt91apTBNan4f5cfJEikPXd/bsBcuLzPtzPtzPtzK+2hkpLqVtWZvL+ST1FW1W49l8lP9uZ9uZ9uZ9uZ6Vgw9aI8wuroY23+qOhy+W4kYVhDWjqiS44eUBWyhOXF5n25n25n2zphNlZJQvj6J9hFDUp3Gs/oYlqoYhcRgFxCBpuxeZ9uZ9uZ9uZ9uZ9uwFy4vM+3M+3M+3M+3M+3YC5cXmfbmfbmfbmfbmfbsBcuLzPtzPtzPtzPtzPt2AuXF5n25n25n25n25n27AXLi8z7cz7cz7cz7cz7dgLlxeZ9uZ9uZ9uZ9uZ9uwFy4vM+3M+3M+3M+3M+3YC5cXmfbmfbmfbmfbmfbsBcuLzPtzPtzPtzPtzPt2AuXF5n25n25n25n25n27AXLi8z7cz7cz7cyoAA/vVYZp1ezZmUNcXsoNnDYNH+A/H0B6Wctfn/hrib1SDaUhtAeskcVrN+vJLX+8UPaCFoO4p85+r4UhNhv+UwKe7l+9ZShokx5C68a452k+N3z1kofFJSJx1MypiWqSN6wgR9RpErgmKwKT2d0t/dk4ly82tqfXmW9j2Pkt8CJW2yt+yK6ANiAEGb7NxAs5ESEbM2OOJtd82YFAvckm8X90Hyv7wBdJnvAAYV/Wot0w59LWRyNAXzjTsbDNm7fQyKsRiqe0j3ywNrRvk1n1e8bdEmce52fCxmEKFwBRk4qq0HQx9MwIFpAofUhD7exerOlVfx5xv//EfI5ovQuG115C8QR+Q+TQ5NnSu/45mJYTpn3+PKccS02Hi0HsegC1isYIrzCizPvBePHEfgAWFTvmdSNKcYQ9RLq3TcnJsnenjcyp2EhRf8jAnbEA1/F03MRVmd5HDXXqAd5inljSXPKv7wQQ9IqxlgvKhpRH90gEBm/5c6tv0PtbWZTrv81GanFUWMFaYL7RTT7fAIHXcrhpibMt/2qaKILSuSlLYNw8QuBgTskNbWEQOFfAhU67sYC8OUkw7TISXKzKa/QqQ45cWpuGr+LZKkPkl6Jg7Ha2GGVYno/A67l3nrOTwcyHBh+A3NQMeIGXZUmC3UapC9BXCzULUhVr2iMP05R2AWwtShcciPlzKlKbXkPZZZR1BIn1zRvwxQTkyuUInf2O2godL5l++8yc47lBGuXLOj0bot54kqMGKeGKO9M26JcDbkFpdLitC7vmnPS7eShy7ZoccVJePxVXpBvESpMWRVRu6l6ByRLgluGMzNgEtGWJGl84ev6+XBpGVBOh7jH1UmH+dRJBCggZ3lygP3Cyldxa8/thWRi+NQ4E/y7Sh1Lo8inbuLkUvX3s8Ure2okHwRERvPscIgzNkNk8tvUlP7vRMbXt+9Igvsmc0d0iRalCMqSVOLdVLPo7BkRpVBN3+D16NjhQACBoVg4/WmtFVUuPBvupwZwS8IW3kZ35EO4njTyP/Lv62yaFXvQ+fNuiPZLtOpMNruOpO6jnAhxR/JgnW2b6sBcY7LlPZPC/iT9kZ5gZFNJY/8RzYjBvmj8CHNrfC7ZyUWeIhvL95BScVFKDY0ptNdWYoZY603pGj4hw+U5/YmMS9YXQTEBF+qDy/Pb+c/udjEdKpP+006ldt2nDaXo4u16E3ov71BeH3fbdEVoYqNJtITTUtbWwtCguWyrUmLmvT1J+c4E05nP2zUUxXq2kC5XcDvV/25LV6OkHt8+4rPSJJXvXljKmUs6ylU3T2cQ0QVu4V0rhp7XOLouUu/nJji8A1ZxCNb4ghreM8dGfhW2/JpAFkpn1StoOX1itHIV6LyXhxs1lHyv5sr1CjNxzXqd5IUSh0yORFG4ozWQeceODysD8HRtLJoK1vcxw4PBTi0+Eu7VeQn4naf6rhgEEnLmqJgKBK9u93SN0HnGwGGvP857lArGh49Y7UPAEgN9mTeUIPw4GlRZ2CPAg900HSoEP3PPis4ZVQen6BvP/ntbruLSoG5UojRDTCSDdjhq/OP51Jt6Fgfdxf9YXQXV5DnZD9X+n1BvBZPOBmyWz0wmOCC+HWrZ4JOAMN99m51i/7BGp39ET1HZcB8w9bqZ+Yv9SQEGqtGbGtaL0WCXwOxmAfTvcFiQILe3Xt+746PXwYh6vSFFD29Cxuh6Khp6ZRxx0/alTvHK4szWB3Ut3awnq3ZvqUHvg9LrhpBIxm2fJ0lCBWTvgZLV/F/i5HN6d57qd/KV3YGJ42BCAFvIsEL4BqeKmKxWV8iSlNVCH/4PO6Wk6BY2VWEk6q1PrhueEVkaoUe8EqfMLCgtqx20AsfhHY+/z5Xb4PN5r/sQp5Bb4udrs/qR595Nq+5MXjDjnpkvR7zOzvjD8a/B18qMF2cnltbfqg1zY/bBdpWcZp5FVx29JWwSWHlyfT0sFg9xLKaDTihebcsHzjxP0f4ffuY+cnnj1WmPNKUGYP/UEb+VVZ/mvSp7lNvQhFPZivog8WYenOJGD10n2duGeZUnU9sIIaIfN9ixev8NI7DDDYSLiKG6naSOdUD5y+WD3SzSrF1hUvcpAzDm3YhyxK/oQRlw9L9j8sTLORmbaGlmrUQef9z62TmW74dg5iIDY1hqD5lARR3/8FVgxR6D2YRViw9eG2pfE8D5QYFHNf2tyAPnQDwCHBS0WQT5M/Ety3dc6N8U6hcg1meeTpfqCWMakimlgdNhcdwO9DEz+KrRu3O01oqRrvpaNZus1aNnG1VAd+l4rHaTHcDJo92BK9yLYMKOsv9bs+eNG6sN8okoQZlcwLyY8l/WqeBY8/cqZNGzRW7a6KZKt1j7iITtLEZXL9gXWwlFjsaePXlxdLNErwDCfT4tMTA9vbEamTDN8PxDqQXbvLNnOXLr3Dlooso7ET436bnzY/oWQufCImk1wqGdp9+qc/B16dkcRDwLzuca2hpMb6s/Cio2i3ZwPjEF9ww4+r8v6qk3ghbUNNiBEck+05Q0nkrSpCyxe0KXIvg7XE0VUNRtsh7MFm1Trl4HkR2dEOJ3SbpAFEyDzni4UlPqUp14ribxSYCMh8N7CT+KQ5ohvfC66IqhQUhRbpQML9SqlCzwM9QTa7jG0yJVP6vJigAnJhkd+Q6vlJerblAfpS4pGPngBJoak6a8n5Y6N0i5JTPV+Wen46e3wSEYjO9bzsowQhLH5w4Z2gawKGR2QBJCfexhwlTlsJg4cBjsQeRbII7n1xBVQy7srRABs1SHYcSc7NrAFYa0KvmuDu999VkeMWhBtHcT7/fa6nkYnm+KzGF1ClxvtTL3b0xEI0T0kLpQjE5kOtWBe7ylMBitgNnv1278CeGuNdf2olxGc+3X3T2GiJNTcqu3o3DJW9csoFBIGYfBvBJYAj/ZoSyXa8Mqmfic5j9gOjf6lZNFOVQfo1c9ZzXHP6knWS8vs2AkqHkSPb9wmDIJJp/CvHYNatpfpUshXfek5dozZB0/pncnhLYzqWx6LckqwlOwWaErwviqFwK6vwlIfPJ8KrdzaMU2TTZdyfoL3lUbnwUnQYCHdGAR45ZJ6zed/V3vgPiYinY62qeZjzSSv7SwlpOtotiFvoA4e+sU8LeovTW+Uyb1wg486YbOhhzB/AxujvKAfdvqz4qbk4VAGqgrGTv7AwaVagSCFouHdVjOvrhkpAFgJOgGrhcHSJfNKJKhGDmL8fNr1OtEGha/aPXyJw7nZO0AW2NRurYkMHWJEr+PuEkuduEkyKDp9dcwYDvQT5RWXo4pJtWhf5j6ksDQYAXrr87/IlXYj/T//2BXZkVTaSi9gvAEAiG3/zBPJ5PPhVK8pFnuoy+4bPbZyXZvC7STtcRKhDl1WQgRc2V+n1t+pGXo+/Y3JjviLEEJ1NQzQosx6VGbvgMQgKybXAi8ahBcYwLxeM/wZZ85YDkx+yyLW6CW+Y4RxRTELSr0s8sw/BPpu7nJg3wJL9LwtWenpz+QX9u08CDWqhZIEk3pSITv2mpUbgxPZ7MoJkbyqHI7TK1a3a6oZqisHpXP8sr/mCNyOpAzGJr+OFK+rXGrH83x/fdshrGXsG0Bg25fiWh7AyRyEkBAGLI7baQkO8cZk4U/GWzdGPjl3SCfrfBtI68lmDNL1jrZL5ruXj0rzg4lThlAKZsK0UF4BRT9M3MEsi603Ti4CpQLYvJyRTION3u7ljKOFli5WFdI3odx/rxxhT/7pRRnV4RuyqxI3JiVBEAnq0E1GdDl2SoR5tNwGW2atqeQQSGPi69YVpX7Dwf6fW9Yg00HUIT5p6Jl/KwpFkQZNutb4dP5nX6ChGGJoUdgCav6ijgojAqldbIC0UsTI8J9tmNSRmb5eTNeqJ4699S8Ik4/JoiS1Nr11WZbowhLF22C7SYaIXq51fOB2JrRa+8M7jqFFoorWgxQqZ16QYIL2iWYMvalVbubA2Yz18ovuq+JFkLeX5UcvKPD2ZPvaI2EsFbupBvLjRsy0CiaJyFXVBCyFBIbHKiOHfWfjiYR10EwFa4XzwnHXARDb/YBkMMoFgZ2BmJ/hHuo1AXcnUPp0vVodd3GqelhCboxXVqM54OkMYXzm53htlRz4nDjXv084X3N6VmyjcO8p22AA+EbIEdsW5rwhXS1fQGtwmbnZuqHhcohYiDVbSlZF4VVpm4DMWqWIlBYFCeCuDWBYxKU92cvQGOuu5MOmSp0Emp5rAsA8M1pBPKng2ILymmSLDat+S7ihWq9wjeaBeh8UsrQyzUK6NJmcaqvARuZ/U8hFA6K8tapz09QDrBjYh7QSDo3WYgUAhq4QaOBdgTHK2nuqd2pH7gvfxANscb2AIh9GkkeilgYrWQAKDU1dMI8PWTsJgTM4c3AEL4+4y78Po9sIZ7FkSIsTgq0QYH+XJLJ5vGPmZdX9q7bD8STGQA1l3KmgMvNmQ06sb/5jUPDkjf0x/Ic+9JO28idHxXl757hENuX5d4///ttTl0MZ4wcYiejDBvRuaPc0TXKErcqU665La/b4BWHitsASID1lQEGUcNHsYQymTCnpHGp7SajLyHb9EP22PGdzNjKoBgFOgBCQk4HYEEyf0UsDPOHLKfg01ymHhupiyKaignwUmJg2fN0VMJd4/MdEKAMdYwriit54r6VKYuyum7SYvRHDAHvMryUwNCpmNtc3+Um5bYPO08GhXhLPDi1CObpvwrKyBkOeobVjqtX+zhnO/JlnVAw39sGhbEG9IusI0Rdc+o7IXGXyehq3DuCm5dUIJ9jEU2xkNdK2M/tD02XG0Dc7E24t/Ml3mtCv49l1ifhGx3UyvkJyv04ExMQIKUsENYVFVzJqcrRSE8brElKjN0FQpM8doAQScjlynD7l9r37j5vRqV+bRxVBOrXju2j/M8x11GQzINnoQMbC1JHI9CP9kUBe61Exi+Blzj8k/2grJd+O1Xn23XwMqo6RXqrxG4kNRnG55xuGIhQtKd1tJumQkApPxSlo9WbLdFwhv/9tB1Wqo22qf5lbHpUwHQfhjHWDxi82Zwu1J8GqXvvEv035gXJ/lERDuir5dAJju7XeZWf/vml+Mv4ilnd8m7Wqj/8DORG4HlQJxGph6AdFIST6IUdZFZsvJH8U66n5x6ZTiygjaIyY1JWYzqkFVcLdyP7nJW69ZuX/WvNha238zFc99W6vJwQNtkiQJVJxX7vQAI7DW1fz1rRsFViky5HP7006B7afNGH38j5AIEbeRP/tvgMVMlfYAFDgAc3gCRkALTAA5vAEjIAWmABzeAJGQAAAA=",
  prof_team: "data:image/webp;base64,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",
  prof_feedback: "data:image/webp;base64,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",
  prof_chart: "data:image/webp;base64,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",
  prof_download: "data:image/webp;base64,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",
  prof_delete: "data:image/webp;base64,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",
};

const MANUAL_ALUNO_PASSOS = [
  { titulo: "Entrem com a conta Google", texto: "Na tela inicial, escolham o perfil \"Aluno(a)\" e cliquem em \"Continuar com o Google\". Pode ser qualquer conta Google que vocês tiverem — não precisa ser uma conta específica da escola.", imagem: "aluno_google" },
  { titulo: "Informem sua matrícula", texto: "Digitem o número de matrícula de vocês (o mesmo da lista oficial da escola). A plataforma já reconhece automaticamente a turma certa e o nome oficial de vocês — não precisa mais de código de turma nem de digitar o nome.", imagem: "aluno_codigo" },
  { titulo: "Escolham a empresa da equipe", texto: "Escolham, na lista de empresas já cadastradas pelo professor, o negócio da equipe de vocês. Se um colega já entrou na mesma empresa, vocês se juntam automaticamente a ela — combinem com o grupo qual escolher, para não se dividirem por engano.", imagem: "aluno_team" },
  { titulo: "Sigam a ordem dos 13 módulos", texto: "Preencham os módulos na sequência 1 a 13: cada um utiliza dados calculados no módulo anterior — por exemplo, o Módulo 8 usa os produtos cadastrados no Módulo 5, e o Módulo 11 já soma automaticamente os totais dos Módulos 9 e 10.", imagem: "aluno_steps13" },
  { titulo: "Leiam a teoria antes de lançar dados", texto: "Todo módulo tem uma caixa \"Teoria do módulo\" — abram-na antes de preencher. Ela traz o conceito e a fórmula que a plataforma está usando nos cálculos.", imagem: "aluno_theory" },
  { titulo: "Acompanhem a Análise do Negócio", texto: "A cada rodada de ajustes, confiram os gráficos e os alertas automáticos dessa aba para entender se o negócio está indo bem — ela reúne o que foi lançado em todos os módulos.", imagem: "aluno_chart" },
  { titulo: "Salvem versões ao longo do projeto", texto: "Sempre que fizerem um ajuste relevante (novo preço, novo custo, nova equipe de trabalho), cliquem em \"Salvar versão\" na Análise do Negócio. Isso registra a evolução do projeto para vocês e para o professor.", imagem: "aluno_versions" },
  { titulo: "Leiam o feedback do professor", texto: "Verifiquem regularmente a aba \"Feedback do Professor\": lá aparecem os comentários e ajustes solicitados, organizados por módulo.", imagem: "aluno_feedback" },
  { titulo: "Finalizem o projeto", texto: "O plano financeiro está concluído quando os 13 módulos estiverem preenchidos, o resultado operacional analisado e pelo menos duas versões salvas mostrando a evolução dos ajustes feitos pela equipe.", imagem: "aluno_finish" },
];

const MANUAL_PROFESSOR_PASSOS = [
  { titulo: "Criem a turma", texto: "Em GESTÃO → Turmas, cadastrem o nome da turma e o período letivo. A plataforma gera um código de 6 caracteres — é ele que os alunos vão usar para entrar.", imagem: "prof_login" },
  { titulo: "Importem a lista de alunos", texto: "Em GESTÃO → Usuários (ou dentro da turma), usem o botão de importar PDF para subir a lista oficial de alunos da turma. Isso é o que permite cada aluno entrar direto com a própria matrícula — sem isso, eles só conseguem entrar pelo código da turma.", imagem: "prof_upload" },
  { titulo: "Pré-cadastrem as empresas", texto: "Ainda em GESTÃO, cadastrem os nomes dos negócios que as equipes vão trabalhar. Isso faz com que, na hora de entrar na plataforma, o aluno escolha a empresa numa lista pronta em vez de digitar o nome livremente.", imagem: "prof_companies" },
  { titulo: "Aprovações (uso raro agora)", texto: "Em GESTÃO → Aprovações, fiquem de olho só por precaução: como o código da turma já libera o aluno na hora, essa tela normalmente fica vazia. Ainda serve para corrigir o papel de alguém ou excluir um cadastro feito por engano.", imagem: "prof_approve" },
  { titulo: "Gerenciem os usuários", texto: "Em GESTÃO → Usuários, acompanhem a lista de alunos com a empresa atual de cada um. Usem o botão \"Editar\" para corrigir a turma ou a empresa de um aluno a qualquer momento.", imagem: "prof_team" },
  { titulo: "Revisem os módulos e comentem", texto: "Abram o painel de revisão por módulo de cada equipe (modo somente leitura) e deixem comentários e ajustes solicitados. Os alunos veem esse feedback organizado por módulo na aba \"Feedback do Professor\" deles.", imagem: "prof_feedback" },
  { titulo: "Consultem os relatórios", texto: "Em GESTÃO → Relatórios, acompanhem a visão consolidada da turma: um relatório de pendências e outros três relatórios complementares por empresa.", imagem: "prof_chart" },
  { titulo: "Exportem um backup", texto: "Em GESTÃO → Backup, gerem um backup dos dados da turma sempre que quiserem guardar um retrato do trabalho.", imagem: "prof_download" },
  { titulo: "Excluam a turma ao final do período", texto: "Quando o período letivo terminar e o backup já estiver salvo, excluam a turma pelo ícone de lixeira. Essa ação libera a plataforma para a próxima turma e não pode ser desfeita.", imagem: "prof_delete" },
];

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

function GuiaModulosView() {
  const [aberto, setAberto] = useState(null);
  return (
    <Card className="p-6 mt-6">
      <SectionTitle icon={ListChecks} sub="O que cada módulo pede, a fórmula usada e um exemplo com números — clique num módulo para abrir.">Guia dos 13 módulos</SectionTitle>
      <div className="divide-y divide-slate-800">
        {MODULOS.map((m) => {
          const Icon = m.icon;
          const t = TEORIA[m.id];
          const extra = GUIA_MODULOS_EXTRA[m.id];
          const aberto_ = aberto === m.id;
          return (
            <div key={m.id}>
              <button onClick={() => setAberto(aberto_ ? null : m.id)} className="w-full flex items-center gap-3 py-3 text-left">
                <div className="w-8 h-8 rounded-full bg-slate-900 border border-amber-500/40 text-amber-500 flex items-center justify-center text-[11px] font-bold shrink-0">{String(m.n).padStart(2, "0")}</div>
                <Icon size={16} className="text-sky-400 shrink-0" />
                <span className="text-sm font-semibold text-slate-200 flex-1">{m.nome}</span>
                {aberto_ ? <ChevronDown size={16} className="text-slate-500 shrink-0" /> : <ChevronRight size={16} className="text-slate-500 shrink-0" />}
              </button>
              {aberto_ && (
                <div className="pb-5 pl-11 pr-2 space-y-3">
                  <div>
                    <div className="text-[11px] font-bold text-amber-500 uppercase tracking-wide mb-1">O que é</div>
                    <p className="text-sm text-slate-300 leading-relaxed">{t.conceito}</p>
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-amber-500 uppercase tracking-wide mb-1">O que lançar</div>
                    <p className="text-sm text-slate-300 leading-relaxed">{extra.lancamento}</p>
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-amber-500 uppercase tracking-wide mb-1">Fórmula</div>
                    <pre className="text-xs text-sky-300 bg-slate-900 border border-slate-700 rounded-md px-3 py-2 whitespace-pre-wrap font-mono">{t.formula}</pre>
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-amber-500 uppercase tracking-wide mb-1">Exemplo</div>
                    <p className="text-sm text-slate-400 leading-relaxed italic">{extra.exemplo}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function ManualAlunoView({ equipe, onIrPara, contexto = "aluno" }) {
  return (
    <div>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs font-bold tracking-widest text-amber-500 mb-2">CURSO TÉCNICO EM ADMINISTRAÇÃO E CONTABILIDADE</div>
          <h1 className="text-3xl font-bold text-slate-50 mb-3">Manual do Aluno</h1>
          <p className="text-slate-400 max-w-2xl">
            {contexto === "aluno"
              ? `Orientações para a equipe ${equipe?.nomeNegocio || ""} seguir, passo a passo, até finalizar o plano financeiro do negócio.`
              : "Orientações que as equipes de alunos seguem, passo a passo, até finalizar o plano financeiro do negócio."}
          </p>
          {contexto === "aluno" && (
            <div className="flex flex-wrap gap-3 mt-5">
              <button onClick={() => onIrPara("m1")} className="bg-amber-500 text-slate-900 font-bold px-5 py-2.5 rounded-md hover:bg-amber-400 text-sm">Ir para o Módulo 1</button>
              <button onClick={() => onIrPara("inicio")} className="border border-slate-600 text-slate-100 px-5 py-2.5 rounded-md hover:bg-slate-800 text-sm font-semibold">Ver índice de módulos</button>
            </div>
          )}
        </div>
        <button onClick={() => window.print()} className="no-print flex items-center gap-2 bg-slate-900 border border-slate-700 text-slate-100 text-sm font-semibold px-3 py-2 rounded-md hover:border-amber-500 shrink-0"><FileBarChart size={15} /> Exportar PDF</button>
      </div>

      <Card className="p-6">
        <SectionTitle icon={BookOpen} sub="Sigam a ordem abaixo — cada etapa prepara a equipe para a seguinte.">Passo a passo</SectionTitle>
        <div className="space-y-0">
          {MANUAL_ALUNO_PASSOS.map((p, i) => (
            <div key={i} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-9 h-9 rounded-full bg-slate-900 border border-amber-500/50 text-amber-500 flex items-center justify-center text-xs font-bold shrink-0">{String(i + 1).padStart(2, "0")}</div>
                {i < MANUAL_ALUNO_PASSOS.length - 1 && <div className="w-px flex-1 bg-slate-700 my-1" />}
              </div>
              <div className="pb-6 flex-1 flex flex-col sm:flex-row gap-4 items-start">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-100">{p.titulo}</div>
                  <p className="text-sm text-slate-400 mt-1 leading-relaxed">{p.texto}</p>
                </div>
                {p.imagem && TELAS_MANUAL[p.imagem] && (
                  <img src={TELAS_MANUAL[p.imagem]} alt={p.titulo} className="w-full sm:w-56 rounded-lg border border-slate-700 shrink-0" />
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <GuiaModulosView />

      <div className="grid sm:grid-cols-3 gap-3 mt-6">
        <StatCard label="Módulos a preencher" value="13" tone="blue" small />
        <StatCard label="Ordem de trabalho" value="Sequencial (1 → 13)" tone="gold" small />
        <StatCard label="Conclusão" value="13/13 + 2 versões salvas" tone="slate" small />
      </div>
    </div>
  );
}

function ManualProfessorView() {
  return (
    <div>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs font-bold tracking-widest text-amber-500 mb-2">CURSO TÉCNICO EM ADMINISTRAÇÃO E CONTABILIDADE</div>
          <h1 className="text-3xl font-bold text-slate-50 mb-3">Manual do Professor</h1>
          <p className="text-slate-400 max-w-2xl">O ciclo completo de uso da plataforma com uma turma, do início ao fim do período letivo.</p>
        </div>
        <button onClick={() => window.print()} className="no-print flex items-center gap-2 bg-slate-900 border border-slate-700 text-slate-100 text-sm font-semibold px-3 py-2 rounded-md hover:border-amber-500 shrink-0"><FileBarChart size={15} /> Exportar PDF</button>
      </div>

      <div className="bg-slate-900 border border-amber-500/60 rounded-md p-4 text-sm text-slate-300 mb-6">
        <b className="text-amber-500">Acesso via Google:</b> não existe mais cadastro com e-mail e senha. Na tela inicial, escolha o perfil "Professor(a)" e clique em "Continuar com o Google" — o acesso já é liberado na hora. Se você for Usuário Mestre, informe o código de Mestre nesse mesmo momento.
      </div>

      <Card className="p-6">
        <SectionTitle icon={ClipboardList} sub="O passo a passo de uma turma, do início ao fim do período.">Passo a passo</SectionTitle>
        <div className="space-y-0">
          {MANUAL_PROFESSOR_PASSOS.map((p, i) => (
            <div key={i} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-9 h-9 rounded-full bg-slate-900 border border-amber-500/50 text-amber-500 flex items-center justify-center text-xs font-bold shrink-0">{String(i + 1).padStart(2, "0")}</div>
                {i < MANUAL_PROFESSOR_PASSOS.length - 1 && <div className="w-px flex-1 bg-slate-700 my-1" />}
              </div>
              <div className="pb-6 flex-1 flex flex-col sm:flex-row gap-4 items-start">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-100">{p.titulo}</div>
                  <p className="text-sm text-slate-400 mt-1 leading-relaxed">{p.texto}</p>
                </div>
                {p.imagem && TELAS_MANUAL[p.imagem] && (
                  <img src={TELAS_MANUAL[p.imagem]} alt={p.titulo} className="w-full sm:w-56 rounded-lg border border-slate-700 shrink-0" />
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
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
        {aba === "manualProfessor" && <ManualProfessorView />}
        {aba === "manualAlunoRef" && <ManualAlunoView contexto="professor" />}
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
