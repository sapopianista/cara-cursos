import { useMemo, useState } from 'react';
import { CheckCircle2, Search, ShieldCheck, UserPlus } from 'lucide-react';
import Avatar from '../../components/ui/Avatar';
import Modal from '../../components/ui/Modal';

/**
 * Dados simulados para integração futura com a API REST Java/JDBC:
 * - GET  /api/admin/contas/usuarios
 * - POST /api/admin/contas/convite
 */
const USUARIOS_INICIAIS = [
  {
    id: 'usr-1',
    nome: 'Tiago Vieira',
    email: 'tiago@oscorp.com',
    papel: 'Super Admin',
    departamento: 'Diretoria de Pessoas',
    mfaAtivo: true,
    ultimoAcesso: 'Hoje, 14:15',
    status: 'Ativo',
  },
  {
    id: 'usr-2',
    nome: 'Mariana Valente',
    email: 'mariana.v@oscorp.com',
    papel: 'Gestor de RH',
    departamento: 'Recursos Humanos',
    mfaAtivo: true,
    ultimoAcesso: 'Hoje, 11:30',
    status: 'Ativo',
  },
  {
    id: 'usr-3',
    nome: 'Carlos Eduardo',
    email: 'carlos.e@oscorp.com',
    papel: 'Líder de Equipe',
    departamento: 'Engenharia e Tech',
    mfaAtivo: true,
    ultimoAcesso: 'Ontem, 18:20',
    status: 'Ativo',
  },
  {
    id: 'usr-4',
    nome: 'Juliana Mendonça',
    email: 'juliana.m@oscorp.com',
    papel: 'Líder de Equipe',
    departamento: 'Operações',
    mfaAtivo: true,
    ultimoAcesso: '04/06/2025',
    status: 'Ativo',
  },
  {
    id: 'usr-5',
    nome: 'Rodrigo Caetano',
    email: 'rodrigo.c@oscorp.com',
    papel: 'Gestor Financeiro',
    departamento: 'Controladoria',
    mfaAtivo: false,
    ultimoAcesso: '01/06/2025',
    status: 'Pendente',
  },
];

const EVENTOS_AUDITORIA = [
  {
    id: 'evt-1',
    titulo: 'Atualização de chaves SSO SAML',
    descricao: 'Tiago Vieira realizou a rotação periódica de certificado corporativo.',
    dataHora: 'Hoje, 13:40',
  },
  {
    id: 'evt-2',
    titulo: 'Permissão concedida a Carlos Eduardo',
    descricao: 'Mariana Valente adicionou o escopo "Engenharia de Dados" ao líder.',
    dataHora: 'Hoje, 10:15',
  },
  {
    id: 'evt-3',
    titulo: 'Solicitação de redefinição de 2FA',
    descricao: 'Rodrigo Caetano iniciou verificação por e-mail corporativo.',
    dataHora: 'Ontem, 20:05',
  },
];

export default function GerenciamentoContas() {
  const [usuarios, setUsuarios] = useState(USUARIOS_INICIAIS);
  const [busca, setBusca] = useState('');
  const [modalConvidarAberto, setModalConvidarAberto] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [novoUsuario, setNovoUsuario] = useState({
    nome: '',
    email: '',
    papel: 'Líder de Equipe',
    departamento: 'Engenharia e Tech',
  });

  const usuariosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return usuarios;
    return usuarios.filter(
      (u) =>
        u.nome.toLowerCase().includes(termo) ||
        u.email.toLowerCase().includes(termo) ||
        u.papel.toLowerCase().includes(termo) ||
        u.departamento.toLowerCase().includes(termo),
    );
  }, [usuarios, busca]);

  const handleConvidar = (evento) => {
    evento.preventDefault();
    if (!novoUsuario.nome || !novoUsuario.email) return;

    const criado = {
      id: `usr-${Date.now()}`,
      nome: novoUsuario.nome,
      email: novoUsuario.email,
      papel: novoUsuario.papel,
      departamento: novoUsuario.departamento,
      mfaAtivo: true,
      ultimoAcesso: 'Convite enviado',
      status: 'Pendente',
    };

    setUsuarios((atuais) => [criado, ...atuais]);
    setModalConvidarAberto(false);
    setNovoUsuario({
      nome: '',
      email: '',
      papel: 'Líder de Equipe',
      departamento: 'Engenharia e Tech',
    });
    setFeedback(`Convite administrativo enviado para ${criado.email}.`);
  };

  return (
    <div className="animate-entrada mx-auto max-w-5xl space-y-10 py-4">
      <header className="flex flex-col justify-between gap-4 border-b border-line pb-8 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            Governança e Acessos • Oscorp
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Contas e Permissões
          </h1>
          <p className="mt-2 max-w-2xl text-base text-muted">
            Gerencie administradores, líderes de equipe e registros de auditoria da plataforma.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalConvidarAberto(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-onprimary transition-colors hover:bg-primary-hover"
        >
          <UserPlus size={16} aria-hidden />
          Convidar gestor
        </button>
      </header>

      {/* Resumo de contas */}
      <dl className="grid gap-5 sm:grid-cols-3">
        <div className="rounded-2xl border border-line bg-surface p-5">
          <dt className="text-xs font-semibold uppercase tracking-wider text-subtle">
            Super Admins
          </dt>
          <dd className="mt-2 text-3xl font-bold text-ink">3</dd>
          <p className="mt-1 text-xs text-muted">Acesso total à governança e faturamento</p>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-5">
          <dt className="text-xs font-semibold uppercase tracking-wider text-subtle">
            Líderes e Gestores
          </dt>
          <dd className="mt-2 text-3xl font-bold text-ink">12</dd>
          <p className="mt-1 text-xs text-muted">Acompanham o progresso de suas equipes</p>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-5">
          <dt className="text-xs font-semibold uppercase tracking-wider text-subtle">
            Sessões ativas
          </dt>
          <dd className="mt-2 text-3xl font-bold text-accent">18</dd>
          <p className="mt-1 text-xs text-muted">Todas as conexões com 2FA verificado</p>
        </div>
      </dl>

      {feedback && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-ink"
        >
          <CheckCircle2 size={18} className="shrink-0 text-accent" aria-hidden />
          <span>{feedback}</span>
        </div>
      )}

      {/* Tabela de gestores */}
      <section aria-labelledby="gestores-cadastrados-titulo" className="space-y-4">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <h2 id="gestores-cadastrados-titulo" className="text-xl font-semibold text-ink">
            Gestores e administradores ({usuariosFiltrados.length})
          </h2>

          <div className="relative w-full sm:max-w-xs">
            <label htmlFor="busca-contas" className="sr-only">
              Buscar gestor por nome, e-mail ou papel
            </label>
            <Search
              size={16}
              aria-hidden
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle"
            />
            <input
              id="busca-contas"
              type="search"
              placeholder="Buscar gestor..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full rounded-xl border border-line bg-surface py-2 pl-10 pr-4 text-sm text-ink placeholder:text-subtle focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-surface2/60 text-xs font-semibold uppercase tracking-wider text-subtle">
              <tr>
                <th scope="col" className="px-5 py-3.5">
                  Usuário
                </th>
                <th scope="col" className="px-5 py-3.5">
                  Papel
                </th>
                <th scope="col" className="px-5 py-3.5">
                  Departamento
                </th>
                <th scope="col" className="px-5 py-3.5">
                  Segurança 2FA
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
              {usuariosFiltrados.map((usr) => (
                <tr key={usr.id}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar nome={usr.nome} tamanho="sm" />
                      <div>
                        <p className="font-semibold text-ink">{usr.nome}</p>
                        <p className="text-xs text-muted">{usr.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-medium text-ink">{usr.papel}</td>
                  <td className="px-5 py-4 text-muted">{usr.departamento}</td>
                  <td className="px-5 py-4">
                    {usr.mfaAtivo ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent">
                        <ShieldCheck size={14} aria-hidden />
                        Ativo
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-warn">Pendente</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-muted">{usr.ultimoAcesso}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        usr.status === 'Ativo'
                          ? 'bg-accent/15 text-accent'
                          : 'bg-warn/15 text-warn'
                      }`}
                    >
                      {usr.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Registro de Auditoria */}
      <section aria-labelledby="auditoria-titulo" className="space-y-4">
        <h2 id="auditoria-titulo" className="text-xl font-semibold text-ink">
          Eventos recentes de auditoria
        </h2>

        <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
          {EVENTOS_AUDITORIA.map((evt) => (
            <li
              key={evt.id}
              className="flex flex-col justify-between gap-2 p-5 sm:flex-row sm:items-center"
            >
              <div>
                <p className="text-sm font-semibold text-ink">{evt.titulo}</p>
                <p className="mt-0.5 text-xs text-muted">{evt.descricao}</p>
              </div>
              <span className="shrink-0 font-mono text-xs text-subtle">{evt.dataHora}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Modal acessível para convidar gestor */}
      <Modal
        aberto={modalConvidarAberto}
        onFechar={() => setModalConvidarAberto(false)}
        titulo="Convidar novo gestor"
        descricao="Defina o nível de permissão administrativa para o colaborador."
      >
        <form onSubmit={handleConvidar} className="space-y-4">
          <div>
            <label htmlFor="convite-nome" className="mb-1.5 block text-sm font-medium text-ink">
              Nome completo
            </label>
            <input
              id="convite-nome"
              type="text"
              required
              value={novoUsuario.nome}
              onChange={(e) => setNovoUsuario({ ...novoUsuario, nome: e.target.value })}
              className="w-full rounded-xl border border-line bg-surface2 px-3.5 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="convite-email" className="mb-1.5 block text-sm font-medium text-ink">
              E-mail corporativo
            </label>
            <input
              id="convite-email"
              type="email"
              required
              value={novoUsuario.email}
              onChange={(e) => setNovoUsuario({ ...novoUsuario, email: e.target.value })}
              className="w-full rounded-xl border border-line bg-surface2 px-3.5 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="convite-papel" className="mb-1.5 block text-sm font-medium text-ink">
                Papel de acesso
              </label>
              <select
                id="convite-papel"
                value={novoUsuario.papel}
                onChange={(e) => setNovoUsuario({ ...novoUsuario, papel: e.target.value })}
                className="w-full rounded-xl border border-line bg-surface2 px-3 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
              >
                <option value="Líder de Equipe">Líder de Equipe</option>
                <option value="Gestor de RH">Gestor de RH</option>
                <option value="Gestor Financeiro">Gestor Financeiro</option>
                <option value="Super Admin">Super Admin</option>
              </select>
            </div>

            <div>
              <label htmlFor="convite-depto" className="mb-1.5 block text-sm font-medium text-ink">
                Departamento
              </label>
              <input
                id="convite-depto"
                type="text"
                required
                value={novoUsuario.departamento}
                onChange={(e) => setNovoUsuario({ ...novoUsuario, departamento: e.target.value })}
                className="w-full rounded-xl border border-line bg-surface2 px-3.5 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-line pt-4">
            <button
              type="button"
              onClick={() => setModalConvidarAberto(false)}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-muted hover:bg-surface2 hover:text-ink"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-onprimary transition-colors hover:bg-primary-hover"
            >
              Enviar convite
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
