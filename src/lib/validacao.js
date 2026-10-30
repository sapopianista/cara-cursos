/** Validações de formulário (mensagens em português, prontas para exibir). */

export const somenteDigitos = (v = '') => String(v).replace(/\D/g, '');

/** "12345678000190" -> "12.345.678/0001-90" (aplica parcialmente enquanto digita). */
export function mascararCnpj(valor) {
  const d = somenteDigitos(valor).slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

/** Valida CNPJ pelos dígitos verificadores. */
export function cnpjValido(valor) {
  const d = somenteDigitos(valor);
  if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false;
  const calcular = (base) => {
    const pesos =
      base.length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const soma = [...base].reduce((acc, n, i) => acc + Number(n) * pesos[i], 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  const d1 = calcular(d.slice(0, 12));
  const d2 = calcular(d.slice(0, 12) + d1);
  return d.endsWith(`${d1}${d2}`);
}

export const emailValido = (v = '') => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim());

/**
 * Executa regras sobre um objeto de valores.
 * regras: { campo: [(valor, todos) => mensagemOuVazio] }
 * Retorna { campo: 'mensagem' } apenas para campos inválidos.
 */
export function validar(valores, regras) {
  const erros = {};
  for (const [campo, lista] of Object.entries(regras)) {
    for (const regra of lista) {
      const msg = regra(valores[campo], valores);
      if (msg) {
        erros[campo] = msg;
        break;
      }
    }
  }
  return erros;
}

export const obrigatorio =
  (msg = 'Campo obrigatório.') =>
  (v) =>
    (typeof v === 'string' ? v.trim() : v) ? '' : msg;

export const email =
  (msg = 'Informe um e-mail válido.') =>
  (v) =>
    !v || emailValido(v) ? '' : msg;

export const cnpj =
  (msg = 'CNPJ inválido. Confira os 14 dígitos.') =>
  (v) =>
    !v || cnpjValido(v) ? '' : msg;

export const minimo = (n, msg) => (v) =>
  v === '' || v == null || Number(v) >= n ? '' : (msg ?? `O valor mínimo é ${n}.`);
