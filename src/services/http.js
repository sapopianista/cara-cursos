import { API_TIMEOUT, API_URL } from '../config/ambiente';
import { salvarBlob } from '../lib/download';

/**
 * Cliente HTTP único da aplicação (fetch + JSON + token + timeout).
 *
 * Contrato de erro esperado do backend Java (qualquer status >= 400):
 *   { "mensagem": "Texto para o usuário", "codigo": "EMAIL_DUPLICADO",
 *     "campos": { "email": "Já existe um colaborador com este e-mail." } }
 * `campos` é opcional e alimenta os erros por campo dos formulários.
 */
export class ErroApi extends Error {
  constructor(mensagem, { status = 0, codigo = null, campos = null } = {}) {
    super(mensagem);
    this.name = 'ErroApi';
    this.status = status;
    this.codigo = codigo;
    this.campos = campos;
  }
}

const MENSAGENS_PADRAO = {
  0: 'Não foi possível conectar ao servidor. Verifique sua conexão.',
  400: 'Alguns dados enviados são inválidos.',
  401: 'Sua sessão expirou. Entre novamente.',
  403: 'Você não tem permissão para esta ação.',
  404: 'O conteúdo solicitado não foi encontrado.',
  408: 'O servidor demorou para responder. Tente novamente.',
  409: 'Este registro entra em conflito com outro existente.',
  422: 'Alguns dados enviados são inválidos.',
  500: 'Ocorreu um erro no servidor. Tente novamente em instantes.',
};

let tokenAtual = null;
let aoNaoAutorizado = null;

/** Chamado pelo AuthContext ao entrar/sair. */
export const definirToken = (token) => {
  tokenAtual = token;
};

/** Registra o callback executado quando a API responde 401 (sessão expirada). */
export const definirAoNaoAutorizado = (callback) => {
  aoNaoAutorizado = callback;
};

const montarUrl = (caminho, params) => {
  const url = `${API_URL}${caminho}`;
  if (!params) return url;
  const busca = new URLSearchParams();
  Object.entries(params).forEach(([chave, valor]) => {
    if (valor !== undefined && valor !== null && valor !== '') busca.append(chave, valor);
  });
  const qs = busca.toString();
  return qs ? `${url}?${qs}` : url;
};

/** Lê o nome do arquivo de `Content-Disposition: attachment; filename="x.pdf"`. */
const nomeDoArquivo = (resposta, padrao) => {
  const cabecalho = resposta.headers.get('Content-Disposition') ?? '';
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(cabecalho);
  if (utf8) return decodeURIComponent(utf8[1]);
  const simples = /filename="?([^";]+)"?/i.exec(cabecalho);
  return simples ? simples[1] : padrao;
};

/**
 * @param {string} caminho  ex.: "/cursos/12"
 * @param {{ metodo?: string, corpo?: any, params?: object, sinal?: AbortSignal, tipo?: 'json'|'blob' }} opcoes
 */
export async function requisicao(caminho, { metodo = 'GET', corpo, params, sinal, tipo = 'json' } = {}) {
  const controlador = new AbortController();
  const tempo = setTimeout(() => controlador.abort('timeout'), API_TIMEOUT);
  sinal?.addEventListener('abort', () => controlador.abort(sinal.reason));

  const headers = { Accept: tipo === 'json' ? 'application/json' : '*/*' };
  if (corpo !== undefined) headers['Content-Type'] = 'application/json';
  if (tokenAtual) headers.Authorization = `Bearer ${tokenAtual}`;

  let resposta;
  try {
    resposta = await fetch(montarUrl(caminho, params), {
      method: metodo,
      headers,
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
      signal: controlador.signal,
    });
  } catch (erro) {
    if (sinal?.aborted) throw erro; // cancelado por quem chamou: não é falha
    const timeout = controlador.signal.reason === 'timeout';
    throw new ErroApi(MENSAGENS_PADRAO[timeout ? 408 : 0], { status: timeout ? 408 : 0 });
  } finally {
    clearTimeout(tempo);
  }

  if (!resposta.ok) {
    let corpoErro = {};
    try {
      corpoErro = await resposta.json();
    } catch {
      /* corpo vazio ou não-JSON */
    }
    if (resposta.status === 401) aoNaoAutorizado?.();
    throw new ErroApi(corpoErro.mensagem || MENSAGENS_PADRAO[resposta.status] || MENSAGENS_PADRAO[500], {
      status: resposta.status,
      codigo: corpoErro.codigo ?? null,
      campos: corpoErro.campos ?? null,
    });
  }

  if (tipo === 'blob') {
    return { blob: await resposta.blob(), nome: nomeDoArquivo(resposta, 'arquivo') };
  }
  if (resposta.status === 204) return null;
  const texto = await resposta.text();
  return texto ? JSON.parse(texto) : null;
}

export const http = {
  get: (caminho, params, opcoes) => requisicao(caminho, { ...opcoes, params }),
  post: (caminho, corpo, opcoes) => requisicao(caminho, { ...opcoes, metodo: 'POST', corpo }),
  put: (caminho, corpo, opcoes) => requisicao(caminho, { ...opcoes, metodo: 'PUT', corpo }),
  patch: (caminho, corpo, opcoes) => requisicao(caminho, { ...opcoes, metodo: 'PATCH', corpo }),
  delete: (caminho, opcoes) => requisicao(caminho, { ...opcoes, metodo: 'DELETE' }),
};

/**
 * Baixa um arquivo protegido (envia o token) e dispara o download.
 * `url` pode ser absoluta (ex.: link assinado de storage) ou relativa à API.
 */
export async function baixarArquivo(url, nomePadrao = 'arquivo', params) {
  if (/^https?:\/\//.test(url)) {
    const link = document.createElement('a');
    link.href = url;
    link.download = nomePadrao;
    link.rel = 'noopener';
    link.click();
    return;
  }
  const { blob, nome } = await requisicao(url, { params, tipo: 'blob' });
  salvarBlob(blob, nome === 'arquivo' ? nomePadrao : nome);
}
