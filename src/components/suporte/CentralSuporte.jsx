import { useState } from 'react';
import { Mail, Send } from 'lucide-react';
import useApi from '../../hooks/useApi';
import useMutacao from '../../hooks/useMutacao';
import { abrirChamado, getSuporte } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { dataHora } from '../../lib/formatadores';
import { STATUS_CHAMADO } from '../../lib/rotulos';
import { Secao } from '../ui/Pagina';
import Accordion from '../ui/Accordion';
import Button from '../ui/Button';
import Card from '../ui/Card';
import DataTable from '../ui/DataTable';
import { StatusBadge } from '../ui/Badge';
import { CampoArea, CampoSelecao, CampoTexto } from '../ui/Campo';
import { ErroCarregamento, SkeletonPagina } from '../ui/Estados';

const VAZIO = { assunto: '', titulo: '', cursoId: '', descricao: '' };

function FormularioChamado({ escopo, assuntos, cursos, contato, onCriado }) {
  const [valores, setValores] = useState(VAZIO);
  const { executar, executando, erro, errosCampos, limpar } = useMutacao((d) => abrirChamado(escopo, d));
  const toast = useToast();
  const alterar = (campo) => (e) => {
    setValores((v) => ({ ...v, [campo]: e.target.value }));
    if (erro) limpar();
  };

  const enviar = async (e) => {
    e.preventDefault();
    const chamado = await executar(valores);
    if (!chamado) return;
    setValores(VAZIO);
    toast.sucesso(`Chamado #${chamado.id} aberto. ${contato.tempoResposta}`);
    onCriado(chamado);
  };

  return (
    <Card as="section" espacamento="lg" aria-labelledby="form-chamado" className="lg:sticky lg:top-20">
      <h2 id="form-chamado" className="text-lg font-semibold text-ink">
        Abrir chamado
      </h2>
      <p className="mt-1 text-sm text-muted">{contato.tempoResposta}</p>

      <form onSubmit={enviar} noValidate className="mt-5 space-y-4">
        <CampoSelecao
          rotulo="Assunto"
          obrigatorio
          placeholder="Escolha um assunto"
          opcoes={assuntos.map((a) => ({ valor: a, rotulo: a }))}
          value={valores.assunto}
          onChange={alterar('assunto')}
          erro={errosCampos.assunto}
        />
        <CampoTexto
          rotulo="Resumo"
          obrigatorio
          placeholder={
            escopo === 'aluno' ? 'Ex.: o vídeo da aula 3 não carrega' : 'Ex.: sincronização de usuários SSO'
          }
          value={valores.titulo}
          onChange={alterar('titulo')}
          erro={errosCampos.titulo}
          maxLength={120}
        />
        {cursos.length > 0 && (
          <CampoSelecao
            rotulo="Curso relacionado"
            placeholder="Nenhum curso específico"
            opcoes={cursos.map((c) => ({ valor: String(c.id), rotulo: c.titulo }))}
            value={valores.cursoId}
            onChange={alterar('cursoId')}
          />
        )}
        <CampoArea
          rotulo="Descrição"
          obrigatorio
          rows={5}
          placeholder="Conte o que aconteceu e o que você esperava que acontecesse."
          value={valores.descricao}
          onChange={alterar('descricao')}
          erro={errosCampos.descricao}
        />
        {erro && !Object.keys(errosCampos).length && (
          <p role="alert" className="text-sm text-danger">
            {erro.message}
          </p>
        )}
        <Button type="submit" blocoInteiro iconeEsquerda={Send} carregando={executando}>
          Enviar chamado
        </Button>
      </form>
    </Card>
  );
}

const COLUNAS = (escopo) => [
  {
    id: 'id',
    titulo: 'Protocolo',
    render: (c) => <span className="font-mono text-xs font-semibold text-muted">#{c.id}</span>,
  },
  {
    id: 'titulo',
    titulo: 'Assunto',
    render: (c) => (
      <span>
        <span className="block font-medium text-ink">{c.titulo}</span>
        <span className="block text-xs text-muted">{c.assunto}</span>
      </span>
    ),
  },
  {
    id: 'curso',
    titulo: 'Curso',
    oculto: escopo !== 'aluno',
    render: (c) => <span className="text-muted">{c.curso?.titulo ?? '—'}</span>,
  },
  {
    id: 'atualizadoEm',
    titulo: 'Atualizado',
    render: (c) => <span className="text-muted">{dataHora(c.atualizadoEm)}</span>,
  },
  { id: 'status', titulo: 'Status', render: (c) => <StatusBadge mapa={STATUS_CHAMADO} valor={c.status} /> },
];

/**
 * FAQ + abertura de chamado + histórico. Mesmo componente para
 * colaboradores (escopo "aluno") e gestores (escopo "gestor").
 */
export default function CentralSuporte({ escopo }) {
  const { dados, carregando, erro, recarregar, setDados } = useApi(() => getSuporte(escopo), [escopo]);

  if (carregando) return <SkeletonPagina variante="lista" cabecalho={false} />;
  if (erro) return <ErroCarregamento erro={erro} onTentarNovamente={recarregar} />;

  const { faq, contato, assuntos, cursos, chamados } = dados;

  return (
    <div className="space-y-12">
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <Secao titulo="Perguntas frequentes">
            <Accordion itens={faq.map((f) => ({ id: f.id, titulo: f.pergunta, conteudo: f.resposta }))} />
          </Secao>

          {contato.email && (
            <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-muted">{contato.canal}</p>
                <p className="font-semibold text-ink">{contato.nome}</p>
              </div>
              <Button href={`mailto:${contato.email}`} variante="secondary" iconeEsquerda={Mail}>
                Enviar e-mail
              </Button>
            </Card>
          )}
        </div>

        <div className="lg:col-span-5">
          <FormularioChamado
            escopo={escopo}
            assuntos={assuntos}
            cursos={cursos}
            contato={contato}
            onCriado={(novo) => setDados((d) => ({ ...d, chamados: [novo, ...d.chamados] }))}
          />
        </div>
      </div>

      <Secao titulo={escopo === 'aluno' ? 'Meus chamados' : 'Chamados da empresa'}>
        <DataTable
          colunas={COLUNAS(escopo)}
          linhas={chamados}
          legenda="Chamados de suporte"
          vazio="Nenhum chamado aberto até agora."
        />
      </Secao>
    </div>
  );
}
