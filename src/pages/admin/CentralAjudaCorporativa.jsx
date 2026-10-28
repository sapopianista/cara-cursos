import { useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronUp, Send } from 'lucide-react';

/**
 * Dados simulados para integração futura com a API REST Java/JDBC:
 * - GET  /api/admin/ajuda/overview
 * - GET  /api/admin/ajuda/tickets
 * - POST /api/admin/ajuda/tickets
 */
const GERENTE_CONTAS = {
  nome: 'Camila Fontes',
  cargo: 'Gerente de Sucesso do Cliente • Oscorp Enterprise',
  email: 'camila.fontes@caracursos.com.br',
  horario: 'Segunda a sexta, das 09h às 18h (SLA de 1 hora útil)',
};

const ARTIGOS_FAQ = [
  {
    id: 'faq-admin-1',
    pergunta: 'Como emitir o relatório consolidado de horas de treinamento para o RH?',
    resposta:
      'Acesse o menu Relatórios no painel lateral, escolha o modelo "Conclusão de Cursos e Trilhas" ou "Engajamento e Frequência" e clique em Gerar arquivo.',
  },
  {
    id: 'faq-admin-2',
    pergunta: 'Como importar ou exportar a base de colaboradores via planilha CSV?',
    resposta:
      'No menu Funcionários, utilize o botão "Exportar CSV" no topo da página para baixar a relação atualizada ou cadastre novos membros pelo formulário.',
  },
  {
    id: 'faq-admin-3',
    pergunta: 'Como revogar o acesso de um colaborador desligado?',
    resposta:
      'Acesse a listagem de Funcionários ou Contas e altere o status do usuário. O histórico de certificados permanece preservado para fins de auditoria.',
  },
  {
    id: 'faq-admin-4',
    pergunta: 'Como exigir autenticação em duas etapas (2FA) para gestores?',
    resposta:
      'No menu Configurações, ative a chave "Exigir autenticação em duas etapas (2FA) para gestores" e salve as alterações.',
  },
];

const CHAMADOS_INICIAIS = [
  {
    id: 'TK-8492',
    titulo: 'Dúvida sobre integração de webhook de conclusão',
    categoria: 'Integrações e API',
    atualizacao: 'Hoje, 14:32',
    status: 'Em análise',
  },
  {
    id: 'TK-8120',
    titulo: 'Liberação de novas licenças para Engenharia',
    categoria: 'Faturamento e Licenças',
    atualizacao: '02/06/2025',
    status: 'Resolvido',
  },
];

export default function CentralAjudaCorporativa() {
  const [faqAbertaId, setFaqAbertaId] = useState('faq-admin-1');
  const [chamados, setChamados] = useState(CHAMADOS_INICIAIS);
  const [titulo, setTitulo] = useState('');
  const [categoria, setCategoria] = useState('Gestão de Trilhas e Cursos');
  const [descricao, setDescricao] = useState('');
  const [protocoloCriado, setProtocoloCriado] = useState('');

  const handleAbrirChamado = (evento) => {
    evento.preventDefault();
    if (!titulo.trim() || !descricao.trim()) return;

    const novoId = `TK-${Math.floor(8500 + Math.random() * 500)}`;
    const novoTicket = {
      id: novoId,
      titulo: titulo.trim(),
      categoria,
      atualizacao: 'Agora mesmo',
      status: 'Em análise',
    };

    setChamados((atuais) => [novoTicket, ...atuais]);
    setTitulo('');
    setDescricao('');
    setProtocoloCriado(novoId);
  };

  return (
    <div className="animate-entrada mx-auto max-w-5xl space-y-12 py-4">
      <header className="flex flex-col justify-between gap-6 border-b border-line pb-8 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            Suporte Corporativo • SLA 1 Hora
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Central de Ajuda do Gestor
          </h1>
          <p className="mt-2 max-w-2xl text-base text-muted">
            Consulte as orientações de administração da plataforma ou acione o suporte dedicado.
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-surface px-5 py-4 text-sm">
          <p className="font-semibold text-ink">{GERENTE_CONTAS.nome}</p>
          <p className="text-xs text-muted">{GERENTE_CONTAS.cargo}</p>
          <a
            href={`mailto:${GERENTE_CONTAS.email}`}
            className="mt-2 inline-block text-xs font-semibold text-primary hover:underline"
          >
            {GERENTE_CONTAS.email}
          </a>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        {/* Coluna Esquerda: Dúvidas frequentes do gestor */}
        <section aria-labelledby="faq-gestor-titulo" className="space-y-4 lg:col-span-7">
          <h2 id="faq-gestor-titulo" className="text-xl font-semibold text-ink">
            Dúvidas frequentes de administração
          </h2>

          <div className="space-y-3">
            {ARTIGOS_FAQ.map((artigo) => {
              const aberta = faqAbertaId === artigo.id;
              const respostaId = `${artigo.id}-painel`;
              return (
                <div
                  key={artigo.id}
                  className="overflow-hidden rounded-2xl border border-line bg-surface"
                >
                  <h3>
                    <button
                      type="button"
                      aria-expanded={aberta}
                      aria-controls={respostaId}
                      onClick={() => setFaqAbertaId(aberta ? null : artigo.id)}
                      className="flex w-full items-center justify-between gap-4 p-5 text-left text-base font-semibold text-ink transition-colors hover:bg-surface2"
                    >
                      <span>{artigo.pergunta}</span>
                      {aberta ? (
                        <ChevronUp size={18} className="shrink-0 text-muted" aria-hidden />
                      ) : (
                        <ChevronDown size={18} className="shrink-0 text-muted" aria-hidden />
                      )}
                    </button>
                  </h3>

                  {aberta && (
                    <div
                      id={respostaId}
                      className="border-t border-line px-5 py-4 text-sm leading-relaxed text-muted"
                    >
                      {artigo.resposta}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Coluna Direita: Abrir chamado corporativo */}
        <section
          aria-labelledby="abrir-chamado-admin-titulo"
          className="rounded-2xl border border-line bg-surface p-6 lg:col-span-5"
        >
          <h2 id="abrir-chamado-admin-titulo" className="text-xl font-semibold text-ink">
            Abrir chamado prioritário
          </h2>
          <p className="mt-1 text-sm text-muted">{GERENTE_CONTAS.horario}</p>

          {protocoloCriado && (
            <div
              role="status"
              className="mt-4 flex items-center gap-2 rounded-xl border border-accent/40 bg-accent/10 p-3.5 text-sm text-ink"
            >
              <CheckCircle2 size={18} className="shrink-0 text-accent" aria-hidden />
              <span>
                Chamado <strong>#{protocoloCriado}</strong> registrado com sucesso.
              </span>
            </div>
          )}

          <form onSubmit={handleAbrirChamado} className="mt-5 space-y-4">
            <div>
              <label htmlFor="ticket-titulo" className="mb-1.5 block text-sm font-medium text-ink">
                Assunto
              </label>
              <input
                id="ticket-titulo"
                type="text"
                required
                placeholder="Ex.: Sincronização de usuários SSO"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="w-full rounded-xl border border-line bg-surface2 px-3.5 py-2.5 text-sm text-ink placeholder:text-subtle focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="ticket-categoria"
                className="mb-1.5 block text-sm font-medium text-ink"
              >
                Categoria
              </label>
              <select
                id="ticket-categoria"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full rounded-xl border border-line bg-surface2 px-3.5 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
              >
                <option value="Gestão de Trilhas e Cursos">Gestão de Trilhas e Cursos</option>
                <option value="Faturamento e Licenças">Faturamento e Licenças</option>
                <option value="Integrações e API">Integrações e API</option>
                <option value="Segurança e LGPD">Segurança e LGPD</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="ticket-descricao"
                className="mb-1.5 block text-sm font-medium text-ink"
              >
                Descrição da solicitação
              </label>
              <textarea
                id="ticket-descricao"
                rows={4}
                required
                placeholder="Detalhe como podemos ajudar..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="w-full rounded-xl border border-line bg-surface2 px-3.5 py-2.5 text-sm text-ink placeholder:text-subtle focus:border-primary focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-onprimary transition-colors hover:bg-primary-hover"
            >
              <Send size={16} aria-hidden />
              Enviar chamado
            </button>
          </form>
        </section>
      </div>

      {/* Tabela de chamados corporativos */}
      <section aria-labelledby="historico-chamados-admin-titulo" className="space-y-4">
        <h2 id="historico-chamados-admin-titulo" className="text-xl font-semibold text-ink">
          Chamados recentes da organização
        </h2>

        <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-surface2/60 text-xs font-semibold uppercase tracking-wider text-subtle">
              <tr>
                <th scope="col" className="px-5 py-3.5">
                  Protocolo
                </th>
                <th scope="col" className="px-5 py-3.5">
                  Assunto
                </th>
                <th scope="col" className="px-5 py-3.5">
                  Categoria
                </th>
                <th scope="col" className="px-5 py-3.5">
                  Última atualização
                </th>
                <th scope="col" className="px-5 py-3.5">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {chamados.map((chamado) => (
                <tr key={chamado.id}>
                  <td className="px-5 py-4 font-mono text-xs font-semibold text-muted">
                    #{chamado.id}
                  </td>
                  <td className="px-5 py-4 font-medium text-ink">{chamado.titulo}</td>
                  <td className="px-5 py-4 text-muted">{chamado.categoria}</td>
                  <td className="px-5 py-4 text-muted">{chamado.atualizacao}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        chamado.status === 'Resolvido'
                          ? 'bg-accent/15 text-accent'
                          : 'bg-warn/15 text-warn'
                      }`}
                    >
                      {chamado.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
