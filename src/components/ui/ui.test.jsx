import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from './Button';
import { CampoTexto } from './Campo';
import SegmentedControl from './SegmentedControl';
import Switch from './Switch';
import Accordion from './Accordion';

describe('Button', () => {
  it('fica desabilitado e ocupado enquanto carrega', () => {
    render(<Button carregando>Salvar</Button>);
    const botao = screen.getByRole('button', { name: 'Salvar' });
    expect(botao).toBeDisabled();
    expect(botao).toHaveAttribute('aria-busy', 'true');
  });
});

describe('CampoTexto', () => {
  it('liga rótulo, obrigatoriedade e mensagem de erro ao input', () => {
    render(
      <CampoTexto
        rotulo="E-mail"
        obrigatorio
        erro="Informe um e-mail válido."
        value=""
        onChange={() => {}}
      />,
    );
    const input = screen.getByLabelText(/E-mail/);
    expect(input).toBeRequired();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Informe um e-mail válido.');
  });

  it('marca campos opcionais no rótulo', () => {
    render(<CampoTexto rotulo="Apelido" value="" onChange={() => {}} />);
    expect(screen.getByText('(opcional)')).toBeInTheDocument();
  });
});

describe('SegmentedControl', () => {
  it('indica a opção ativa com aria-pressed e avisa a troca', async () => {
    const onChange = vi.fn();
    render(
      <SegmentedControl
        rotulo="Período"
        valor="a"
        onChange={onChange}
        opcoes={[
          { valor: 'a', rotulo: 'A' },
          { valor: 'b', rotulo: 'B' },
        ]}
      />,
    );
    expect(screen.getByRole('button', { name: 'A' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'B' }));
    expect(onChange).toHaveBeenCalledWith('b');
  });
});

describe('Switch', () => {
  it('alterna pelo clique no texto', async () => {
    const onChange = vi.fn();
    render(<Switch rotulo="Resumo semanal" ativo={false} onChange={onChange} />);
    expect(screen.getByRole('switch', { name: 'Resumo semanal' })).toHaveAttribute('aria-checked', 'false');
    await userEvent.click(screen.getByText('Resumo semanal'));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});

describe('Accordion', () => {
  it('expande e recolhe com aria-expanded', async () => {
    render(<Accordion itens={[{ id: 1, titulo: 'Pergunta', conteudo: 'Resposta' }]} />);
    const botao = screen.getByRole('button', { name: 'Pergunta' });
    expect(botao).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(botao);
    expect(botao).toHaveAttribute('aria-expanded', 'true');
  });
});
