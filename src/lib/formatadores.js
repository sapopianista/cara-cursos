/**
 * Formatação de valores vindos da API. O backend envia dados "crus"
 * (datas ISO 8601, minutos/segundos inteiros, valores em centavos) e toda a
 * apresentação fica aqui.
 */
const LOCALE = 'pt-BR';

const moedaFmt = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: 'BRL' });
const numeroFmt = new Intl.NumberFormat(LOCALE);
const dataFmt = new Intl.DateTimeFormat(LOCALE, { day: '2-digit', month: '2-digit', year: 'numeric' });
const dataCurtaFmt = new Intl.DateTimeFormat(LOCALE, { day: '2-digit', month: 'short' });
const dataLongaFmt = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'long', year: 'numeric' });
const horaFmt = new Intl.DateTimeFormat(LOCALE, { hour: '2-digit', minute: '2-digit' });
const mesAnoFmt = new Intl.DateTimeFormat(LOCALE, { month: 'long', year: 'numeric' });
const relativoFmt = new Intl.RelativeTimeFormat(LOCALE, { numeric: 'auto' });

const paraData = (valor) => (valor instanceof Date ? valor : new Date(valor));
const valida = (d) => !Number.isNaN(d.getTime());

/** Valor em centavos (inteiro) -> "R$ 1.234,56". */
export const moeda = (centavos) => moedaFmt.format((Number(centavos) || 0) / 100);

export const numero = (n) => numeroFmt.format(Number(n) || 0);

export const percentual = (n, casas = 0) =>
  `${(Number(n) || 0).toLocaleString(LOCALE, { maximumFractionDigits: casas })}%`;

export const data = (iso) => {
  const d = paraData(iso);
  return valida(d) ? dataFmt.format(d) : '—';
};

/** "28 de out." */
export const dataCurta = (iso) => {
  const d = paraData(iso);
  return valida(d) ? dataCurtaFmt.format(d) : '—';
};

/** "15 de dezembro de 2026" */
export const dataLonga = (iso) => {
  const d = paraData(iso);
  return valida(d) ? dataLongaFmt.format(d) : '—';
};

/** "Outubro de 2026" */
export const mesAno = (iso) => {
  const d = paraData(iso);
  if (!valida(d)) return '—';
  const texto = mesAnoFmt.format(d);
  return texto.charAt(0).toUpperCase() + texto.slice(1);
};

const inicioDoDia = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const diferencaDias = (d, base = new Date()) => Math.round((inicioDoDia(d) - inicioDoDia(base)) / 86_400_000);

/** "Hoje, 14:15" · "Ontem, 18:20" · "12/10/2026" */
export const dataHora = (iso) => {
  const d = paraData(iso);
  if (!valida(d)) return '—';
  const dias = diferencaDias(d);
  if (dias === 0) return `Hoje, ${horaFmt.format(d)}`;
  if (dias === -1) return `Ontem, ${horaFmt.format(d)}`;
  return dataFmt.format(d);
};

/** "há 5 minutos" · "há 2 dias" · "em 3 dias" */
export const relativo = (iso, base = new Date()) => {
  const d = paraData(iso);
  if (!valida(d)) return '—';
  const segundos = Math.round((d - base) / 1000);
  const abs = Math.abs(segundos);
  if (abs < 60) return 'agora mesmo';
  if (abs < 3600) return relativoFmt.format(Math.round(segundos / 60), 'minute');
  if (abs < 86_400) return relativoFmt.format(Math.round(segundos / 3600), 'hour');
  if (abs < 86_400 * 30) return relativoFmt.format(diferencaDias(d, base), 'day');
  return dataFmt.format(d);
};

/** Dias inteiros entre hoje e a data (negativo = atrasado). */
export const diasAte = (iso) => diferencaDias(paraData(iso));

/** 150 -> "2h30min" · 45 -> "45 min" · 120 -> "2h" */
export const duracao = (minutos) => {
  const total = Math.max(0, Math.round(Number(minutos) || 0));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}min`;
};

/** 754 -> "12:34" · 3725 -> "1:02:05" */
export const tempoVideo = (segundos) => {
  const total = Math.max(0, Math.floor(Number(segundos) || 0));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
};

/** 1536 -> "1,5 KB" */
export const tamanhoArquivo = (bytes) => {
  const n = Number(bytes) || 0;
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toLocaleString(LOCALE, { maximumFractionDigits: 1 })} KB`;
  return `${(n / 1024 ** 2).toLocaleString(LOCALE, { maximumFractionDigits: 1 })} MB`;
};

/** "1 curso" / "3 cursos" */
export const plural = (n, singular, pluralTexto = `${singular}s`) =>
  `${numero(n)} ${n === 1 ? singular : pluralTexto}`;
