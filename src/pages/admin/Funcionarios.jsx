import { useMemo, useState } from 'react';
import { CircleAlert, Download, Plus, Search } from 'lucide-react';
import useApi from '../../hooks/useApi';
import { adicionarFuncionario, getFuncionarios } from '../../services/api';
import Avatar from '../../components/ui/Avatar';
import Modal from '../../components/ui/Modal';

const STATUS_OPCOES = [
  { valor: 'todos', rotulo: 'Todos' },
  { valor: 'ativo', rotulo: 'Ativos' },
  { valor: 'pendente', rotulo: 'Pendentes' },
  { valor: 'inativo', rotulo: 'Inativos' },
];

export default function Funcionarios() {
  const { dados, carregando, erro } = useApi(getFuncionarios);

  const [busca, setBusca] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('todos');
  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [novoColab, setNovoColab] = useState({
    nome: '',
    email: '',
    cargo: 'Analista Pleno',
    departamento: 'Tecnologia',
    nivel: 'Nível 1',
  });

  const colaboradoresFiltrados = useMemo(() => {
    if (!dados?.lista) return [];
    const termo = busca.trim().toLowerCase();

    return dados.lista.filter((colab) => {
      const matchBusca =
        !termo ||
        colab.nome.toLowerCase().includes(termo) ||
        colab.email.toLowerCase().includes(termo) ||
        colab.departamento.toLowerCase().includes(termo);
      const matchStatus = statusFiltro === 'todos' || colab.status === statusFiltro;
      return matchBusca && matchStatus;
    });
  }, [dados, busca, statusFiltro]);

  const salvarNovoColaborador = async (evento) => {
    evento.preventDefault();
    if (!novoColab.nome || !novoColab.email) return;

    setSalvando(true);
    try {
      await adicionarFuncionario(novoColab);
      setModalAberto(false);
      setNovoColab({
        nome: '',
        email: '',
        cargo: 'Analista Pleno',
        departamento: 'Tecnologia',
        nivel: 'Nível 1',
      });
    } finally {
      setSalvando(false);
    }
  };

  const exportarCSV = () => {
    const cabecalho = 'ID,Nome,Email,Cargo,Departamento,Ultimo Acesso,Status';
    const linhas = colaboradoresFiltrados.map(
      (c) =>
        `"${c.id}","${c.nome}","${c.email}","${c.cargo}","${c.departamento}","${c.ultimoAcesso}","${c.status}"`,
    );
    const blob = new Blob([[cabecalho, ...linhas].join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'funcionarios_oscorp.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (carregando) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 py-4 animate-pulse" aria-busy="true">
        <div className="h-14 w-1/3 rounded-xl bg-surface2" />
        <div className="grid gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-surface2" />
          ))}
        </div>
        <div className="h-80 rounded-2xl bg-surface2" />
      </div>
    );
  }

  if (erro || !dados) {
    return (
      <div
        role="alert"
        className="mx-auto mt-10 flex max-w-5xl items-center gap-3 rounded-2xl border border-danger/40 bg-danger/10 p-5 text-base text-ink"
      >
        <CircleAlert size={20} className="shrink-0 text-danger" aria-hidden />
        Não foi possível carregar a lista de funcionários.
      </div>
    );
  }

  const { metricas, departamentos, cargos, empresa } = dados;

  return (
    <div className="animate-entrada mx-auto max-w-5xl space-y-10 py-4">
      <header className="flex flex-col justify-between gap-4 border-b border-line pb-8 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            Gestão de Pessoas • {empresa}
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Funcionários
          </h1>
          <p className="mt-2 max-w-xl text-base text-muted">
            Acompanhe os colaboradores cadastrados e o progresso nas trilhas corporativas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={exportarCSV}
            className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-xs font-semibold text-ink transition-colors hover:bg-surface2"
          >
            <Download size={15} aria-hidden />
            Exportar CSV
          </button>

          <button
            type="button"
            onClick={() => setModalAberto(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-onprimary transition-colors hover:bg-primary-hover"
          >
            <Plus size={16} aria-hidden />
            Adicionar colaborador
          </button>
        </div>
      </header>

      {/* Resumo de métricas */}
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-line bg-surface p-5">
          <dt className="text-xs font-semibold uppercase tracking-wider text-subtle">
            Total de membros
          </dt>
          <dd className="mt-2 text-2xl font-bold text-ink">{metricas.totalMembros}</dd>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-5">
          <dt className="text-xs font-semibold uppercase tracking-wider text-subtle">
            Colaboradores ativos
          </dt>
          <dd className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-ink">{metricas.colaboradoresAtivos}</span>
            <span className="text-xs font-semibold text-accent">{metricas.percentualAtivos}%</span>
          </dd>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-5">
          <dt className="text-xs font-semibold uppercase tracking-wider text-subtle">
            Em treinamento
          </dt>
          <dd className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-ink">{metricas.emTreinamento}</span>
            <span className="text-xs font-semibold text-warn">
              {metricas.percentualTreinamento}%
            </span>
          </dd>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-5">
          <dt className="text-xs font-semibold uppercase tracking-wider text-subtle">
            Conclusão média
          </dt>
          <dd className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-ink">{metricas.conclusaoMedia}%</span>
            <span className="text-xs font-semibold text-accent">{metricas.variacaoConclusao}</span>
          </dd>
        </div>
      </dl>

      {/* Busca e filtro simples por status */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-sm">
          <label htmlFor="busca-colaboradores" className="sr-only">
            Buscar colaborador por nome, e-mail ou departamento
          </label>
          <Search
            size={16}
            aria-hidden
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle"
          />
          <input
            id="busca-colaboradores"
            type="search"
            placeholder="Buscar por nome, e-mail ou área..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full rounded-xl border border-line bg-surface py-2.5 pl-10 pr-4 text-sm text-ink placeholder:text-subtle focus:border-primary focus:outline-none"
          />
        </div>

        <div
          role="group"
          aria-label="Filtrar colaboradores por status"
          className="flex flex-wrap gap-2"
        >
          {STATUS_OPCOES.map((opcao) => {
            const ativo = statusFiltro === opcao.valor;
            return (
              <button
                key={opcao.valor}
                type="button"
                aria-pressed={ativo}
                onClick={() => setStatusFiltro(opcao.valor)}
                className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors ${
                  ativo
                    ? 'bg-primary text-onprimary'
                    : 'border border-line bg-surface text-muted hover:text-ink'
                }`}
              >
                {opcao.rotulo}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tabela de Colaboradores */}
      <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-surface2/60 text-xs font-semibold uppercase tracking-wider text-subtle">
            <tr>
              <th scope="col" className="px-5 py-3.5">
                Colaborador
              </th>
              <th scope="col" className="px-5 py-3.5">
                Cargo
              </th>
              <th scope="col" className="px-5 py-3.5">
                Departamento
              </th>
              <th scope="col" className="px-5 py-3.5">
                Último acesso
              </th>
              <th scope="col" className="px-5 py-3.5">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {colaboradoresFiltrados.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-muted">
                  Nenhum colaborador encontrado.
                </td>
              </tr>
            ) : (
              colaboradoresFiltrados.map((colab) => (
                <tr key={colab.id}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar nome={colab.nome} tamanho="sm" />
                      <div>
                        <p className="font-semibold text-ink">{colab.nome}</p>
                        <p className="text-xs text-muted">{colab.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-ink">{colab.cargo}</td>
                  <td className="px-5 py-4 text-muted">{colab.departamento}</td>
                  <td className="px-5 py-4 text-muted">{colab.ultimoAcesso}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        colab.status === 'ativo'
                          ? 'bg-accent/15 text-accent'
                          : colab.status === 'pendente'
                            ? 'bg-warn/15 text-warn'
                            : 'bg-surface2 text-muted'
                      }`}
                    >
                      {colab.status === 'ativo'
                        ? 'Ativo'
                        : colab.status === 'pendente'
                          ? 'Pendente'
                          : 'Inativo'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal acessível para Adicionar Colaborador */}
      <Modal
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        titulo="Adicionar colaborador"
        descricao="Preencha os dados abaixo para liberar o acesso às trilhas corporativas."
      >
        <form onSubmit={salvarNovoColaborador} className="space-y-4">
          <div>
            <label htmlFor="colab-nome" className="mb-1.5 block text-sm font-medium text-ink">
              Nome completo
            </label>
            <input
              id="colab-nome"
              type="text"
              required
              placeholder="Ex.: Amanda Silva"
              value={novoColab.nome}
              onChange={(e) => setNovoColab({ ...novoColab, nome: e.target.value })}
              className="w-full rounded-xl border border-line bg-surface2 px-3.5 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="colab-email" className="mb-1.5 block text-sm font-medium text-ink">
              E-mail corporativo
            </label>
            <input
              id="colab-email"
              type="email"
              required
              placeholder="Ex.: amanda@oscorp.com"
              value={novoColab.email}
              onChange={(e) => setNovoColab({ ...novoColab, email: e.target.value })}
              className="w-full rounded-xl border border-line bg-surface2 px-3.5 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="colab-cargo" className="mb-1.5 block text-sm font-medium text-ink">
                Cargo
              </label>
              <select
                id="colab-cargo"
                value={novoColab.cargo}
                onChange={(e) => setNovoColab({ ...novoColab, cargo: e.target.value })}
                className="w-full rounded-xl border border-line bg-surface2 px-3 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
              >
                {cargos
                  .filter((c) => !c.includes('Todos'))
                  .map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label htmlFor="colab-depto" className="mb-1.5 block text-sm font-medium text-ink">
                Departamento
              </label>
              <select
                id="colab-depto"
                value={novoColab.departamento}
                onChange={(e) => setNovoColab({ ...novoColab, departamento: e.target.value })}
                className="w-full rounded-xl border border-line bg-surface2 px-3 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
              >
                {departamentos
                  .filter((d) => !d.includes('Todos'))
                  .map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-line pt-4">
            <button
              type="button"
              onClick={() => setModalAberto(false)}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-muted hover:bg-surface2 hover:text-ink"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-onprimary transition-colors hover:bg-primary-hover disabled:opacity-60"
            >
              {salvando ? 'Salvando...' : 'Cadastrar colaborador'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
