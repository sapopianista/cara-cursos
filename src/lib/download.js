/** Dispara o download de um Blob no navegador. */
export function salvarBlob(blob, nomeArquivo) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Alguns navegadores precisam do URL vivo até o download começar.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Escapa um valor para CSV (aspas duplas, separador e quebras de linha). */
const celulaCsv = (valor) => {
  const texto = valor == null ? '' : String(valor);
  return /[",;\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
};

/**
 * Gera CSV compatível com o Excel em português: separador `;` e BOM UTF-8
 * (sem o BOM, os acentos aparecem quebrados).
 * colunas: [{ titulo, valor: (linha) => any }]
 */
export function gerarCsv(linhas, colunas) {
  const cabecalho = colunas.map((c) => celulaCsv(c.titulo)).join(';');
  const corpo = linhas.map((l) => colunas.map((c) => celulaCsv(c.valor(l))).join(';'));
  return new Blob(['﻿' + [cabecalho, ...corpo].join('\r\n')], { type: 'text/csv;charset=utf-8' });
}
