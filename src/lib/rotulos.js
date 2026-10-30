/**
 * Vocabulário único da interface. A API envia enums (ex.: "em_andamento") e
 * as telas exibem sempre o mesmo texto para o mesmo conceito.
 */
import { CheckCircle2, Clock, LoaderCircle, ShieldAlert, ShieldCheck } from 'lucide-react';

export const NIVEL_CURSO = {
  iniciante: 'Iniciante',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
  todos: 'Todos os níveis',
};

/** Ação principal de um curso conforme o progresso: Começar → Continuar → Revisar. */
export const CTA_CURSO = {
  nao_iniciado: 'Começar',
  em_andamento: 'Continuar',
  concluido: 'Revisar',
};

export const STATUS_CURSO = {
  nao_iniciado: { rotulo: 'Não iniciado', tom: 'neutro' },
  em_andamento: { rotulo: 'Em andamento', tom: 'info' },
  concluido: { rotulo: 'Concluído', tom: 'sucesso', icone: CheckCircle2 },
};

export const STATUS_COLABORADOR = {
  ativo: { rotulo: 'Ativo', tom: 'sucesso' },
  pendente: { rotulo: 'Convite pendente', tom: 'alerta' },
  inativo: { rotulo: 'Inativo', tom: 'neutro' },
};

export const STATUS_GESTOR = {
  ativo: { rotulo: 'Ativo', tom: 'sucesso' },
  pendente: { rotulo: 'Convite pendente', tom: 'alerta' },
};

export const MFA = {
  true: { rotulo: '2FA ativo', tom: 'sucesso', icone: ShieldCheck },
  false: { rotulo: 'Sem 2FA', tom: 'alerta', icone: ShieldAlert },
};

export const STATUS_CHAMADO = {
  em_analise: { rotulo: 'Em análise', tom: 'alerta' },
  respondido: { rotulo: 'Respondido', tom: 'info' },
  resolvido: { rotulo: 'Resolvido', tom: 'sucesso' },
};

export const STATUS_RELATORIO = {
  processando: { rotulo: 'Gerando…', tom: 'info', icone: LoaderCircle },
  pronto: { rotulo: 'Pronto', tom: 'sucesso' },
  erro: { rotulo: 'Falhou', tom: 'erro' },
};

export const STATUS_FATURA = {
  paga: { rotulo: 'Paga', tom: 'sucesso' },
  aberta: { rotulo: 'Em aberto', tom: 'alerta', icone: Clock },
  vencida: { rotulo: 'Vencida', tom: 'erro' },
};

export const STATUS_ATIVIDADE = {
  pendente: { rotulo: 'Pendente', tom: 'alerta' },
  entregue: { rotulo: 'Entregue', tom: 'sucesso', icone: CheckCircle2 },
};

export const PERIODOS_DASHBOARD = [
  { valor: '7dias', rotulo: '7 dias' },
  { valor: '30dias', rotulo: '30 dias' },
  { valor: 'trimestre', rotulo: 'Trimestre' },
];

export const PERIODOS_RELATORIO = [
  { valor: '7dias', rotulo: 'Últimos 7 dias' },
  { valor: '30dias', rotulo: 'Últimos 30 dias' },
  { valor: 'trimestre', rotulo: 'Últimos 3 meses' },
  { valor: 'ano', rotulo: 'Últimos 12 meses' },
];

export const rotuloPeriodo = (valor) => PERIODOS_RELATORIO.find((p) => p.valor === valor)?.rotulo ?? valor;

export const FUSOS_HORARIOS = [
  { valor: 'America/Sao_Paulo', rotulo: 'Brasília (GMT-3)' },
  { valor: 'America/Manaus', rotulo: 'Manaus (GMT-4)' },
  { valor: 'America/Rio_Branco', rotulo: 'Rio Branco (GMT-5)' },
  { valor: 'America/Noronha', rotulo: 'Fernando de Noronha (GMT-2)' },
  { valor: 'Europe/Lisbon', rotulo: 'Lisboa (GMT+0)' },
];
