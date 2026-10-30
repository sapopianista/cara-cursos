import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { renderizarApp, TOKEN_ADMIN, TOKEN_COLABORADOR, violacoesA11y } from './utils';

describe('autenticação', () => {
  it('manda para o login quem não tem sessão', async () => {
    renderizarApp('/progresso');
    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument();
  });

  it('valida campos vazios sem chamar a API', async () => {
    const { usuario } = renderizarApp('/login');
    await usuario.click(await screen.findByRole('button', { name: 'Entrar' }));
    expect(screen.getByText('Informe seu e-mail corporativo.')).toBeInTheDocument();
    expect(screen.getByText('Informe sua senha.')).toBeInTheDocument();
  });

  it('mostra erro com credenciais inválidas', async () => {
    const { usuario } = renderizarApp('/login');
    await usuario.type(await screen.findByLabelText(/E-mail corporativo/), 'ninguem@oscorp.com');
    await usuario.type(screen.getByLabelText(/^Senha/), 'qualquer123');
    await usuario.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha incorretos.');
  });

  it('entra e chega ao Início', async () => {
    const { usuario } = renderizarApp('/login');
    await usuario.type(await screen.findByLabelText(/E-mail corporativo/), 'tiago.vieira@oscorp.com');
    await usuario.type(screen.getByLabelText(/^Senha/), 'demo1234');
    await usuario.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Olá, Tiago' })).toBeInTheDocument();
  });

  it('bloqueia o painel da empresa para colaboradores', async () => {
    renderizarApp('/admin', { token: TOKEN_COLABORADOR });
    expect(await screen.findByRole('heading', { name: 'Acesso restrito' })).toBeInTheDocument();
  });
});

describe('catálogo', () => {
  it('filtra pela busca vinda da URL', async () => {
    renderizarApp('/explorar?q=excel', { token: TOKEN_COLABORADOR });
    expect(await screen.findByRole('link', { name: 'Excel para o Dia a Dia' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Gestão do Tempo e Prioridades' })).not.toBeInTheDocument();
    expect(screen.getByText('2 cursos encontrados')).toBeInTheDocument();
  });

  it('mostra estado vazio com opção de limpar filtros', async () => {
    const { usuario } = renderizarApp('/explorar?q=zzzz', { token: TOKEN_COLABORADOR });
    expect(await screen.findByText('Nenhum curso para “zzzz”')).toBeInTheDocument();
    const botoes = screen.getAllByRole('button', { name: 'Limpar filtros' });
    await usuario.click(botoes[botoes.length - 1]);
    expect(await screen.findByText('16 cursos encontrados')).toBeInTheDocument();
  });

  it('redireciona endereços antigos', async () => {
    renderizarApp('/destaques', { token: TOKEN_COLABORADOR });
    expect(await screen.findByText('Destaque do mês')).toBeInTheDocument();
  });
});

describe('colaboradores (RH)', () => {
  it('cadastra um colaborador e ele aparece na lista', async () => {
    const { usuario } = renderizarApp('/admin/colaboradores', { token: TOKEN_ADMIN });
    await usuario.click(await screen.findByRole('button', { name: 'Adicionar colaborador' }));

    const dialogo = await screen.findByRole('dialog', { name: 'Adicionar colaborador' });
    const d = within(dialogo);
    await usuario.type(d.getByLabelText(/Nome completo/), 'Aaron Teste');
    await usuario.type(d.getByLabelText(/E-mail corporativo/), 'aaron.teste@oscorp.com');
    await usuario.selectOptions(d.getByLabelText(/^Cargo/), 'Analista de Dados');
    await usuario.selectOptions(d.getByLabelText(/^Departamento/), 'Tecnologia');
    await usuario.click(screen.getByRole('button', { name: 'Enviar convite' }));

    expect(await screen.findByText('Convite enviado para aaron.teste@oscorp.com.')).toBeInTheDocument();
    const tabela = await screen.findByRole('table', { name: 'Lista de colaboradores' });
    expect(await within(tabela).findByText('Aaron Teste')).toBeInTheDocument();
  });

  it('impede e-mail duplicado com mensagem no campo', async () => {
    const { usuario } = renderizarApp('/admin/colaboradores', { token: TOKEN_ADMIN });
    await usuario.click(await screen.findByRole('button', { name: 'Adicionar colaborador' }));
    const d = within(await screen.findByRole('dialog'));
    await usuario.type(d.getByLabelText(/Nome completo/), 'Ana Duplicada');
    await usuario.type(d.getByLabelText(/E-mail corporativo/), 'ana.silveira@oscorp.com');
    await usuario.selectOptions(d.getByLabelText(/^Cargo/), 'Recrutadora');
    await usuario.selectOptions(d.getByLabelText(/^Departamento/), 'Recursos Humanos');
    await usuario.click(screen.getByRole('button', { name: 'Enviar convite' }));
    expect(await d.findByText('Já existe um colaborador com este e-mail.')).toBeInTheDocument();
  });

  it('filtra por status', async () => {
    const { usuario } = renderizarApp('/admin/colaboradores', { token: TOKEN_ADMIN });
    await usuario.click(await screen.findByRole('button', { name: /^Inativos/ }));
    const tabela = screen.getByRole('table', { name: 'Lista de colaboradores' });
    const linhas = await within(tabela).findAllByText('Inativo');
    expect(linhas.length).toBeGreaterThan(0);
    expect(within(tabela).queryByText('Ativo')).not.toBeInTheDocument();
  });
});

describe('acessibilidade (axe)', () => {
  it('login sem violações', async () => {
    const { container } = renderizarApp('/login');
    await screen.findByRole('heading', { name: 'Entrar' });
    expect(await violacoesA11y(container)).toEqual([]);
  });

  it('início sem violações', async () => {
    const { container } = renderizarApp('/', { token: TOKEN_COLABORADOR });
    await screen.findByRole('heading', { level: 1, name: 'Olá, Ana' });
    expect(await violacoesA11y(container)).toEqual([]);
  });

  it('colaboradores sem violações', async () => {
    const { container } = renderizarApp('/admin/colaboradores', { token: TOKEN_ADMIN });
    await screen.findByRole('table', { name: 'Lista de colaboradores' });
    expect(await violacoesA11y(container)).toEqual([]);
  });
});
