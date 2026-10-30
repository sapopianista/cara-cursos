import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Download, Pencil, Plus, Search, UserCheck, UserX, Users } from 'lucide-react';
import useApi from '../../hooks/useApi';
import useMutacao from '../../hooks/useMutacao';
import { useDebounce } from '../../hooks/utilitarios';
import {
  alterarStatusColaborador,
  atualizarColaborador,
  criarColaborador,
  exportarColaboradores,
  getOpcoesColaboradores,
  getProgressoColaborador,
  getResumoColaboradores,
  listarColaboradores,
} from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { relativo } from '../../lib/formatadores';
import { STATUS_COLABORADOR, STATUS_CURSO } from '../../lib/rotulos';
import { email, obrigatorio, validar } from '../../lib/validacao';
import Pagina from '../../components/ui/Pagina';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import DataTable from '../../components/ui/DataTable';
import MenuAcoes from '../../components/ui/MenuAcoes';
import Modal, { ConfirmDialog } from '../../components/ui/Modal';
import Pagination from '../../components/ui/Pagination';
import ProgressBar from '../../components/ui/ProgressBar';
import SegmentedControl from '../../components/ui/SegmentedControl';
import { StatusBadge } from '../../components/ui/Badge';
import { CampoSelecao, CampoTexto } from '../../components/ui/Campo';
import { StatCard, StatGrid } from '../../components/ui/StatCard';
import { ErroCarregamento, Skeleton, SkeletonPagina, Vazio } from '../../components/ui/Estados';

const POR_PAGINA = 10;
const FORM_VAZIO = { nome: '', email: '', cargo: '', departamento: '', nivel: '1' };
const REGRAS = {
  nome: [obrigatorio('Informe o nome completo.')],
  email: [obrigatorio('Informe o e-mail corporativo.'), email()],
  cargo: [obrigatorio('Escolha um cargo.')],
  departamento: [obrigatorio('Escolha um departamento.')],
};

/** Cadastro e edição (mesmo formulário). Remontado (key) a cada abertura: começa sempre limpo. */
function FormColaborador({ aberto, onFechar, colaborador, opcoes, onSalvo }) {
  const editando = Boolean(colaborador);
  const [valores, setValores] = useState(() =>
    colaborador ? { ...colaborador, nivel: String(colaborador.nivel) } : FORM_VAZIO,
  );
  const [errosLocais, setErrosLocais] = useState({});
  const { executar, executando, erro, errosCampos } = useMutacao((d) =>
    editando ? atualizarColaborador(colaborador.id, d) : criarColaborador(d),
  );

  const erros = { ...errosCampos, ...errosLocais };
  const alterar = (campo) => (e) => {
    setValores((v) => ({ ...v, [campo]: e.target.value }));
    setErrosLocais((x) => ({ ...x, [campo]: undefined }));
  };

  const enviar = async (e) => {
    e.preventDefault();
    const encontrados = validar(valores, REGRAS);
    setErrosLocais(encontrados);
    if (Object.keys(encontrados).length) return;
    const salvo = await executar({ ...valores, nivel: Number(valores.nivel) });
    if (salvo) onSalvo(salvo, editando);
  };

  const formId = 'form-colaborador';
  return (
    <Modal
      aberto={aberto}
      onFechar={() => !executando && onFechar()}
      titulo={editando ? `Editar ${colaborador.nome}` : 'Adicionar colaborador'}
      descricao={
        editando ? undefined : 'A pessoa recebe um convite por e-mail para criar a senha. Usa 1 licença.'
      }
      rodape={
        <>
          <Button variante="ghost" onClick={onFechar} disabled={executando}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} carregando={executando}>
            {editando ? 'Salvar alterações' : 'Enviar convite'}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={enviar} noValidate className="space-y-4">
        {erro && !Object.keys(errosCampos).length && (
          <p role="alert" className="rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
            {erro.message}
          </p>
        )}
        <CampoTexto
          rotulo="Nome completo"
          obrigatorio
          data-autofocus
          value={valores.nome}
          onChange={alterar('nome')}
          erro={erros.nome}
          autoComplete="off"
        />
        <CampoTexto
          rotulo="E-mail corporativo"
          obrigatorio
          type="email"
          placeholder="nome@empresa.com"
          value={valores.email}
          onChange={alterar('email')}
          erro={erros.email}
          autoComplete="off"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <CampoSelecao
            rotulo="Cargo"
            obrigatorio
            placeholder="Escolha"
            opcoes={opcoes.cargos.map((c) => ({ valor: c, rotulo: c }))}
            value={valores.cargo}
            onChange={alterar('cargo')}
            erro={erros.cargo}
          />
          <CampoSelecao
            rotulo="Departamento"
            obrigatorio
            placeholder="Escolha"
            opcoes={opcoes.departamentos.map((d) => ({ valor: d, rotulo: d }))}
            value={valores.departamento}
            onChange={alterar('departamento')}
            erro={erros.departamento}
          />
        </div>
        <CampoSelecao
          rotulo="Nível de desenvolvimento inicial"
          obrigatorio
          opcoes={opcoes.niveis.map((n) => ({ valor: String(n), rotulo: `Nível ${n}` }))}
          value={valores.nivel}
          onChange={alterar('nivel')}
          dica="Define quais cursos ficam liberados no início."
        />
      </form>
    </Modal>
  );
}

function ModalProgresso({ colaborador, onFechar }) {
  const { dados, carregando, erro } = useApi(
    () => (colaborador ? getProgressoColaborador(colaborador.id) : Promise.resolve(null)),
    [colaborador?.id],
  );
  return (
    <Modal
      aberto={Boolean(colaborador)}
      onFechar={onFechar}
      titulo={colaborador ? `Progresso de ${colaborador.nome}` : ''}
      largura="lg"
    >
      {carregando || !dados ? (
        erro ? (
          <p className="text-sm text-danger">{erro.message}</p>
        ) : (
          <div className="space-y-3" role="status" aria-label="Carregando progresso">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
        )
      ) : dados.cursos.length === 0 ? (
        <Vazio
          titulo="Ainda sem cursos"
          descricao="Esta pessoa ainda não aceitou o convite ou não começou nenhum curso."
        />
      ) : (
        <ul className="space-y-3">
          {dados.cursos.map(({ curso, progresso, status }) => (
            <li key={curso.id} className="rounded-xl border border-line p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-ink">{curso.titulo}</p>
                <StatusBadge mapa={STATUS_CURSO} valor={status} />
              </div>
              <div className="mt-3 flex items-center gap-3">
                <ProgressBar valor={progresso} rotulo={`Progresso em ${curso.titulo}`} />
                <span className="w-10 shrink-0 text-right text-sm tabular-nums text-muted">{progresso}%</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}

export default function Colaboradores() {
  const toast = useToast();
  const [busca, setBusca] = useState('');
  const buscaDebounced = useDebounce(busca.trim(), 350);
  const [status, setStatus] = useState('todos');
  const [pagina, setPagina] = useState(1);
  const [form, setForm] = useState({ aberto: false, colaborador: null, versao: 0 });
  const abrirForm = (colaborador = null) =>
    setForm((f) => ({ aberto: true, colaborador, versao: f.versao + 1 }));
  const fecharForm = () => setForm((f) => ({ ...f, aberto: false }));
  const [verProgresso, setVerProgresso] = useState(null);
  const [confirmarStatus, setConfirmarStatus] = useState(null);
  const [exportando, setExportando] = useState(false);

  const resumo = useApi(getResumoColaboradores);
  const { dados: opcoes } = useApi(getOpcoesColaboradores);
  const lista = useApi(
    () => listarColaboradores({ busca: buscaDebounced, status, pagina, porPagina: POR_PAGINA }),
    [buscaDebounced, status, pagina],
  );
  const mudarStatus = useMutacao(alterarStatusColaborador, { onErro: (e) => toast.erro(e.message) });

  const recarregarTudo = () => {
    lista.recarregar();
    resumo.recarregar();
  };

  const aoSalvar = (salvo, editando) => {
    fecharForm();
    toast.sucesso(editando ? 'Dados atualizados.' : `Convite enviado para ${salvo.email}.`);
    recarregarTudo();
  };

  const confirmarMudancaStatus = async () => {
    const { colaborador, novoStatus } = confirmarStatus;
    const ok = await mudarStatus.executar(colaborador.id, novoStatus);
    setConfirmarStatus(null);
    if (!ok) return;
    toast.sucesso(
      novoStatus === 'inativo'
        ? `${colaborador.nome} foi desativado(a).`
        : `${colaborador.nome} foi reativado(a).`,
    );
    recarregarTudo();
  };

  const exportar = async () => {
    setExportando(true);
    try {
      await exportarColaboradores({ busca: buscaDebounced, status });
      toast.sucesso('Planilha gerada. Confira seus downloads.');
    } catch (e) {
      toast.erro(e.message || 'Não foi possível exportar.');
    } finally {
      setExportando(false);
    }
  };

  if (resumo.carregando || lista.carregando) return <SkeletonPagina variante="tabela" />;
  if (resumo.erro || lista.erro) {
    return (
      <ErroCarregamento
        erro={resumo.erro ?? lista.erro}
        onTentarNovamente={recarregarTudo}
        className="mt-10"
      />
    );
  }

  const r = resumo.dados;
  const p = lista.dados;
  const semLicenca = r.licencas.emUso >= r.licencas.contratadas;

  const colunas = [
    {
      id: 'nome',
      titulo: 'Colaborador',
      render: (c) => (
        <div className="flex items-center gap-3 text-left">
          <Avatar nome={c.nome} />
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink">{c.nome}</p>
            <p className="truncate text-xs text-muted">{c.email}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'cargo',
      titulo: 'Cargo e área',
      render: (c) => (
        <span>
          <span className="block text-ink">{c.cargo}</span>
          <span className="block text-xs text-muted">{c.departamento}</span>
        </span>
      ),
    },
    {
      id: 'progresso',
      titulo: 'Progresso',
      render: (c) => (
        <div className="flex w-36 items-center gap-2 max-[759px]:ml-auto">
          <ProgressBar valor={c.progresso} rotulo={`Progresso de ${c.nome}`} />
          <span className="w-9 shrink-0 text-right text-xs tabular-nums text-muted">{c.progresso}%</span>
        </div>
      ),
    },
    {
      id: 'acesso',
      titulo: 'Último acesso',
      render: (c) => (
        <span className="text-muted">{c.ultimoAcesso ? relativo(c.ultimoAcesso) : 'Nunca acessou'}</span>
      ),
    },
    {
      id: 'status',
      titulo: 'Status',
      render: (c) => <StatusBadge mapa={STATUS_COLABORADOR} valor={c.status} />,
    },
    {
      id: 'acoes',
      titulo: 'Ações',
      tituloOculto: true,
      alinhar: 'direita',
      render: (c) => (
        <MenuAcoes
          rotulo={`Ações para ${c.nome}`}
          acoes={[
            { rotulo: 'Ver progresso', icone: BarChart3, onClick: () => setVerProgresso(c) },
            { rotulo: 'Editar dados', icone: Pencil, onClick: () => abrirForm(c) },
            {
              rotulo: 'Desativar acesso',
              icone: UserX,
              perigoso: true,
              oculto: c.status === 'inativo',
              onClick: () => setConfirmarStatus({ colaborador: c, novoStatus: 'inativo' }),
            },
            {
              rotulo: 'Reativar acesso',
              icone: UserCheck,
              oculto: c.status !== 'inativo',
              onClick: () => setConfirmarStatus({ colaborador: c, novoStatus: 'ativo' }),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <Pagina
      titulo="Colaboradores"
      descricao="Quem tem acesso à plataforma e como está o progresso de cada pessoa."
      largura="larga"
      acoes={
        <>
          <Button variante="secondary" iconeEsquerda={Download} onClick={exportar} carregando={exportando}>
            Exportar CSV
          </Button>
          <Button iconeEsquerda={Plus} onClick={() => abrirForm()} disabled={!opcoes || semLicenca}>
            Adicionar colaborador
          </Button>
        </>
      }
    >
      <StatGrid colunas={4}>
        <StatCard rotulo="Ativos" valor={r.ativos} detalhe={`de ${r.total} cadastrados`} />
        <StatCard
          rotulo="Convites pendentes"
          valor={r.pendentes}
          detalhe="Ainda não criaram a senha"
          tomDetalhe={r.pendentes ? 'alerta' : 'muted'}
        />
        <StatCard
          rotulo="Conclusão média"
          valor={`${r.conclusaoMedia}%`}
          detalhe="Entre colaboradores ativos"
        />
        <StatCard
          rotulo="Licenças em uso"
          valor={`${r.licencas.emUso}/${r.licencas.contratadas}`}
          detalhe={
            semLicenca ? (
              <Link to="/admin/faturamento" className="font-medium text-warn hover:underline">
                Sem licenças livres — contratar
              </Link>
            ) : (
              `${r.licencas.contratadas - r.licencas.emUso} disponíveis`
            )
          }
        />
      </StatGrid>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <CampoTexto
          rotulo="Buscar colaborador"
          rotuloOculto
          icone={Search}
          type="search"
          placeholder="Buscar por nome, e-mail, cargo ou área"
          value={busca}
          onChange={(e) => {
            setBusca(e.target.value);
            setPagina(1);
          }}
          className="w-full lg:max-w-sm"
        />
        <SegmentedControl
          variante="chips"
          rotulo="Filtrar por status"
          valor={status}
          onChange={(v) => {
            setStatus(v);
            setPagina(1);
          }}
          opcoes={[
            { valor: 'todos', rotulo: 'Todos', contador: r.total },
            { valor: 'ativo', rotulo: 'Ativos', contador: r.ativos },
            { valor: 'pendente', rotulo: 'Pendentes', contador: r.pendentes },
            { valor: 'inativo', rotulo: 'Inativos', contador: r.inativos },
          ]}
        />
      </div>

      {p.total === 0 && !buscaDebounced && status === 'todos' ? (
        <Vazio
          icone={Users}
          titulo="Nenhum colaborador cadastrado"
          descricao="Adicione as pessoas da empresa para liberar o acesso aos cursos."
          acao={<Button onClick={() => abrirForm()}>Adicionar colaborador</Button>}
        />
      ) : (
        <div className="space-y-4">
          <DataTable
            colunas={colunas}
            linhas={p.itens}
            legenda="Lista de colaboradores"
            atualizando={lista.atualizando}
            vazio={
              <span>
                Ninguém encontrado{buscaDebounced ? ` para “${buscaDebounced}”` : ''}.{' '}
                <button
                  type="button"
                  className="font-medium text-primary hover:underline"
                  onClick={() => {
                    setBusca('');
                    setStatus('todos');
                    setPagina(1);
                  }}
                >
                  Limpar filtros
                </button>
              </span>
            }
          />
          <Pagination
            pagina={p.pagina}
            totalPaginas={p.totalPaginas}
            total={p.total}
            porPagina={p.porPagina}
            onChange={setPagina}
          />
        </div>
      )}

      {opcoes && (
        <FormColaborador
          key={form.versao}
          aberto={form.aberto}
          colaborador={form.colaborador}
          opcoes={opcoes}
          onFechar={fecharForm}
          onSalvo={aoSalvar}
        />
      )}

      <ModalProgresso colaborador={verProgresso} onFechar={() => setVerProgresso(null)} />

      <ConfirmDialog
        aberto={Boolean(confirmarStatus)}
        onFechar={() => setConfirmarStatus(null)}
        onConfirmar={confirmarMudancaStatus}
        carregando={mudarStatus.executando}
        perigoso={confirmarStatus?.novoStatus === 'inativo'}
        titulo={
          confirmarStatus?.novoStatus === 'inativo'
            ? `Desativar ${confirmarStatus?.colaborador.nome}?`
            : `Reativar ${confirmarStatus?.colaborador.nome}?`
        }
        textoConfirmar={confirmarStatus?.novoStatus === 'inativo' ? 'Desativar acesso' : 'Reativar acesso'}
        descricao={
          confirmarStatus?.novoStatus === 'inativo'
            ? 'A pessoa perde o acesso imediatamente e a licença fica livre. Certificados e histórico são mantidos; você pode reativar depois.'
            : 'A pessoa volta a ter acesso e passa a usar 1 licença.'
        }
      />
    </Pagina>
  );
}
