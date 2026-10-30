/**
 * Variáveis de ambiente lidas em UM só lugar (ver .env.example).
 */
export const API_URL = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '');

/** `true` usa src/services/mock; `false` chama a API REST real. */
export const USAR_MOCK = import.meta.env.VITE_USAR_MOCK !== 'false';

export const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 15000;

export const NOME_APP = 'Cara Cursos';
