import { describe, expect, it } from 'vitest';
import { duracao, moeda, plural, tempoVideo, diasAte } from './formatadores';
import { cnpjValido, emailValido, mascararCnpj, obrigatorio, email, validar } from './validacao';
import { paginasVisiveis } from '../components/ui/Pagination';

const normalizarEspacos = (t) => t.replace(/\s/g, ' ');

describe('formatadores', () => {
  it('formata centavos como reais', () => {
    expect(normalizarEspacos(moeda(222000))).toBe('R$ 2.220,00');
    expect(normalizarEspacos(moeda(0))).toBe('R$ 0,00');
  });

  it('formata durações em minutos', () => {
    expect(duracao(45)).toBe('45 min');
    expect(duracao(120)).toBe('2h');
    expect(duracao(150)).toBe('2h30min');
  });

  it('formata tempo de vídeo', () => {
    expect(tempoVideo(754)).toBe('12:34');
    expect(tempoVideo(3725)).toBe('1:02:05');
  });

  it('pluraliza', () => {
    expect(plural(1, 'curso')).toBe('1 curso');
    expect(plural(3, 'curso')).toBe('3 cursos');
  });

  it('calcula dias até uma data', () => {
    const amanha = new Date(Date.now() + 86_400_000).toISOString();
    expect(diasAte(amanha)).toBe(1);
  });
});

describe('validação', () => {
  it('valida CNPJ pelos dígitos verificadores', () => {
    expect(cnpjValido('11.222.333/0001-81')).toBe(true);
    expect(cnpjValido('11.222.333/0001-80')).toBe(false);
    expect(cnpjValido('11.111.111/1111-11')).toBe(false);
  });

  it('aplica a máscara de CNPJ ao digitar', () => {
    expect(mascararCnpj('11222333000181')).toBe('11.222.333/0001-81');
    expect(mascararCnpj('11222')).toBe('11.222');
  });

  it('valida e-mail', () => {
    expect(emailValido('ana@oscorp.com')).toBe(true);
    expect(emailValido('ana@oscorp')).toBe(false);
  });

  it('retorna só os campos inválidos, com a primeira mensagem', () => {
    const erros = validar(
      { nome: ' ', email: 'x' },
      { nome: [obrigatorio('Nome!')], email: [obrigatorio(), email('E-mail!')] },
    );
    expect(erros).toEqual({ nome: 'Nome!', email: 'E-mail!' });
  });
});

describe('paginação', () => {
  it('mostra todas as páginas quando são poucas', () => {
    expect(paginasVisiveis(2, 4)).toEqual([1, 2, 3, 4]);
  });
  it('resume com reticências mantendo vizinhas', () => {
    expect(paginasVisiveis(7, 15)).toEqual([1, '…', 6, 7, 8, '…', 15]);
    expect(paginasVisiveis(1, 15)).toEqual([1, 2, 3, '…', 15]);
  });
});
