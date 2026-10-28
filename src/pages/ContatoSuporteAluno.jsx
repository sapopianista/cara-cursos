import { useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronUp, Send } from 'lucide-react';

/**
 * Dados simulados para integração futura com a API REST Java/JDBC:
 * - GET  /api/aluno/suporte/faq
 * - GET  /api/aluno/suporte/tickets
 * - POST /api/aluno/suporte/tickets
 */
const FAQS = [
  {
    id: 'faq-1',
    pergunta: 'Como emitir meu certificado após concluir 100% da trilha?',
    resposta:
      'Após completar todas as videoaulas e atingir a nota mínima de 7,0 nas avaliações de cada módulo, o certificado fica disponível automaticamente para download em PDF na página Níveis de Desenvolvimento.',
  },
  {
    id: 'faq-2',
    pergunta: 'Posso refazer a avaliação final caso não atinja a nota mínima?',
    resposta:
      'Sim. A política educacional permite até 3 tentativas por módulo. Recomendamos revisar o material complementar antes de iniciar uma nova tentativa.',
  },
  {
    id: 'faq-3',
    pergunta: 'Como as horas estudadas são registradas no meu plano de carreira?',
    resposta:
      'A plataforma sincroniza automaticamente cada curso concluído com o sistema de RH da empresa em até 24 horas úteis.',
  },
  {
    id: 'faq-4',
    pergunta: 'O que fazer se o vídeo travar na rede corporativa?',
    resposta:
      'Reduza a qualidade de reprodução para 720p no player de vídeo ou abra um chamado técnico ao lado informando o horário do incidente.',
  },
];

const CHAMADOS_INICIAIS = [
  {
    protocolo: 'TK-4109',
    assunto: 'Dúvida no exercício prático do Módulo 2',
    curso: 'Comunicação Assertiva no Trabalho',
    dataAbertura: 'Ontem',
    status: 'Respondido',
  },
  {
    protocolo: 'TK-3984',
    assunto: 'Validação de certificado de conclusão',
    curso: 'Data Analytics para Decisões Estratégicas',
    dataAbertura: '14/05/2024',
    status: 'Concluído',
  },
  {
    protocolo: 'TK-3712',
    assunto: 'Ajuste de legenda em português na aula 02',
    curso: 'Liderança Ágil e Gestão de Pessoas',
    dataAbertura: '28/04/2024',
    status: 'Concluído',
  },
];

export default function ContatoSuporteAluno() {
  const [faqAbertaId, setFaqAbertaId] = useState('faq-1');
  const [chamados, setChamados] = useState(CHAMADOS_INICIAIS);
  const [assunto, setAssunto] = useState('');
  const [cursoRelacionado, setCursoRelacionado] = useState('Comunicação Assertiva no Trabalho');
  const [mensagem, setMensagem] = useState('');
  const [protocoloGerado, setProtocoloGerado] = useState('');

  const handleSubmit = (evento) => {
    evento.preventDefault();
    if (!assunto || !mensagem.trim()) return;

    const novoProtocolo = `TK-${Math.floor(4200 + Math.random() * 800)}`;
    const novoChamado = {
      protocolo: novoProtocolo,
      assunto,
      curso: cursoRelacionado || 'Geral',
      dataAbertura: 'Hoje',
      status: 'Em análise',
    };

    setChamados((atuais) => [novoChamado, ...atuais]);
    setAssunto('');
    setMensagem('');
    setProtocoloGerado(novoProtocolo);
  };

  return (
    <div className="animate-entrada mx-auto max-w-5xl space-y-12 py-4">
      <header className="border-b border-line pb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent">
          Atendimento ao Aluno
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          Contato e Suporte
        </h1>
        <p className="mt-2 max-w-2xl text-base text-muted">
          Consulte as dúvidas frequentes ou envie uma solicitação para a equipe pedagógica e técnica.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        {/* Coluna Esquerda: Perguntas Frequentes */}
        <section aria-labelledby="faq-titulo" className="space-y-4 lg:col-span-7">
          <h2 id="faq-titulo" className="text-xl font-semibold text-ink">
            Perguntas frequentes
          </h2>

          <div className="space-y-3">
            {FAQS.map((faq) => {
              const aberta = faqAbertaId === faq.id;
              const respostaId = `${faq.id}-resposta`;
              return (
                <div
                  key={faq.id}
                  className="overflow-hidden rounded-2xl border border-line bg-surface"
                >
                  <h3>
                    <button
                      type="button"
                      aria-expanded={aberta}
                      aria-controls={respostaId}
                      onClick={() => setFaqAbertaId(aberta ? null : faq.id)}
                      className="flex w-full items-center justify-between gap-4 p-5 text-left text-base font-semibold text-ink transition-colors hover:bg-surface2"
                    >
                      <span>{faq.pergunta}</span>
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
                      {faq.resposta}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Coluna Direita: Formulário de abertura de chamado */}
        <section
          aria-labelledby="form-suporte-titulo"
          className="rounded-2xl border border-line bg-surface p-6 lg:col-span-5"
        >
          <h2 id="form-suporte-titulo" className="text-xl font-semibold text-ink">
            Abrir chamado
          </h2>
          <p className="mt-1 text-sm text-muted">
            Tempo médio de resposta: até 2 horas úteis no seu e-mail corporativo.
          </p>

          {protocoloGerado && (
            <div
              role="status"
              className="mt-4 flex items-center gap-2 rounded-xl border border-accent/40 bg-accent/10 p-3.5 text-sm text-ink"
            >
              <CheckCircle2 size={18} className="shrink-0 text-accent" aria-hidden />
              <span>
                Chamado <strong>#{protocoloGerado}</strong> enviado com sucesso.
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label htmlFor="campo-assunto" className="mb-1.5 block text-sm font-medium text-ink">
                Assunto
              </label>
              <select
                id="campo-assunto"
                required
                value={assunto}
                onChange={(e) => setAssunto(e.target.value)}
                className="w-full rounded-xl border border-line bg-surface2 px-3.5 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
              >
                <option value="">Selecione o tipo de solicitação...</option>
                <option value="Dúvida no conteúdo da aula">Dúvida no conteúdo da aula</option>
                <option value="Problema técnico com vídeo">Problema técnico com vídeo</option>
                <option value="Emissão de certificado">Emissão de certificado</option>
                <option value="Outro assunto">Outro assunto</option>
              </select>
            </div>

            <div>
              <label htmlFor="campo-curso" className="mb-1.5 block text-sm font-medium text-ink">
                Curso relacionado
              </label>
              <input
                id="campo-curso"
                type="text"
                value={cursoRelacionado}
                onChange={(e) => setCursoRelacionado(e.target.value)}
                className="w-full rounded-xl border border-line bg-surface2 px-3.5 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="campo-mensagem"
                className="mb-1.5 block text-sm font-medium text-ink"
              >
                Descrição
              </label>
              <textarea
                id="campo-mensagem"
                required
                rows={4}
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                placeholder="Descreva sua dúvida ou problema..."
                className="w-full rounded-xl border border-line bg-surface2 px-3.5 py-2.5 text-sm text-ink placeholder:text-subtle focus:border-primary focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-onprimary transition-colors hover:bg-primary-hover"
            >
              <Send size={16} aria-hidden />
              Enviar solicitação
            </button>
          </form>
        </section>
      </div>

      {/* Histórico de chamados */}
      <section aria-labelledby="chamados-recentes-titulo" className="space-y-4">
        <h2 id="chamados-recentes-titulo" className="text-xl font-semibold text-ink">
          Meus chamados recentes
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
                  Curso
                </th>
                <th scope="col" className="px-5 py-3.5">
                  Data
                </th>
                <th scope="col" className="px-5 py-3.5">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {chamados.map((ticket) => (
                <tr key={ticket.protocolo}>
                  <td className="px-5 py-4 font-mono text-xs font-semibold text-muted">
                    #{ticket.protocolo}
                  </td>
                  <td className="px-5 py-4 font-medium text-ink">{ticket.assunto}</td>
                  <td className="px-5 py-4 text-muted">{ticket.curso}</td>
                  <td className="px-5 py-4 text-muted">{ticket.dataAbertura}</td>
                  <td className="px-5 py-4">
                    <span className="inline-block rounded-full bg-surface2 px-3 py-1 text-xs font-semibold text-ink">
                      {ticket.status}
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
