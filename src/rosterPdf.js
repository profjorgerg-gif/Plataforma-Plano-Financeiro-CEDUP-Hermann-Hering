// ============================================================================
// Extrai Nome + Matrícula do PDF "Estudantes da Turma" exportado pelo sistema
// da escola (professoronline.sed.sc.gov.br). Lê o texto do PDF no navegador
// (sem enviar o arquivo para nenhum servidor) e tenta reconhecer as linhas
// no formato: "Nº  NOME DO ALUNO  MATRÍCULA  DD/MM/AA".
//
// Como a extração de texto de PDF nunca é 100% perfeita (fontes, tabelas),
// o resultado é sempre mostrado numa prévia editável antes de ser
// confirmado — o(a) professor(a) pode corrigir ou remover linhas erradas.
// ============================================================================

import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

// Remove acentos e padroniza maiúsculas/espaços, para comparar nomes com segurança.
export function normalizarNome(s) {
  return (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim()
    .replace(/\s+/g, " ");
}

async function extrairLinhasDoPDF(file) {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const linhas = [];

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();

    // O PDF exportado pelo sistema da escola tem cada célula de texto
    // duplicada (mesma string, posição quase idêntica) — um artefato comum
    // de páginas web exportadas em PDF. Remove esses pares adjacentes antes
    // de reconstruir as linhas da tabela.
    const itens = [];
    content.items.forEach((it) => {
      const anterior = itens[itens.length - 1];
      const duplicado =
        anterior &&
        it.str === anterior.str &&
        it.str.trim() !== "" &&
        Math.abs(it.transform[4] - anterior.transform[4]) < 2 &&
        Math.abs(it.transform[5] - anterior.transform[5]) < 2;
      if (!duplicado) itens.push(it);
    });

    const porLinha = new Map();
    itens.forEach((item) => {
      const y = Math.round(item.transform[5]);
      if (!porLinha.has(y)) porLinha.set(y, []);
      porLinha.get(y).push(item);
    });

    const ys = Array.from(porLinha.keys()).sort((a, b) => b - a); // topo → base
    ys.forEach((y) => {
      const linhaItens = porLinha.get(y).sort((a, b) => a.transform[4] - b.transform[4]);
      const texto = linhaItens.map((it) => it.str).join(" ").replace(/\s+/g, " ").trim();
      if (texto) linhas.push(texto);
    });
  }
  return linhas;
}

// Reduz repetições como "CARL CARLOS ALBER OS ALBERTO" → "CARLOS ALBERTO",
// um artefato comum de extração de texto de PDFs com fontes específicas.
function limparRepeticoes(nome) {
  const palavras = nome.split(" ").filter(Boolean);
  const limpo = [];
  for (let i = 0; i < palavras.length; i++) {
    const atual = palavras[i];
    const jaTem = limpo.some((p) => p === atual && limpo.length > 0);
    // remove apenas repetições consecutivas próximas (não remove nomes repetidos legítimos, ex: "DA SILVA SILVA" é raro)
    if (i > 0 && palavras[i - 1] === atual) continue;
    limpo.push(atual);
  }
  return limpo.join(" ");
}

const LINHA_REGEX = /^(?:\d+\s+)?([A-ZÀ-Úa-zà-ú'\-\s]{3,}?)\s+(\d{6,12})\s+\d{1,2}\/\d{1,2}\/\d{2,4}/;

export async function extrairAlunosDoPDF(file) {
  const linhas = await extrairLinhasDoPDF(file);
  const encontrados = [];
  const vistos = new Set();

  linhas.forEach((linha) => {
    const m = linha.match(LINHA_REGEX);
    if (!m) return;
    const nome = limparRepeticoes(m[1].trim().toUpperCase());
    const matricula = m[2].trim();
    if (nome.length < 3 || vistos.has(matricula)) return;
    vistos.add(matricula);
    encontrados.push({ nome, matricula });
  });

  return encontrados;
}
