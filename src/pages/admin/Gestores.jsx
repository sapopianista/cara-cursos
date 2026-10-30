import { useState } from 'react';
import { MailPlus, ShieldCheck, UserCog, UserMinus, UserPlus } from 'lucide-react';
import useApi from '../../hooks/useApi';
import useMutacao from '../../hooks/useMutacao';
import {
  alterarPapelGestor,
  convidarGestor,
  listarAuditoria,
  listarGestores,
  reenviarConvite,
  revogarGestor,
} from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { dataHora, plural, relativo } from '../../lib/formatadores';
import { MFA, STATUS_GESTOR } from '../../lib/rotulos';
import Pagina, { Secao } from '../../components/ui/Pagina';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import DataTable from '../../components/ui/DataTable';
import MenuAcoes from '../../components/ui/MenuAcoes';
import Modal, { ConfirmDialog } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/Badge';
import { CampoSelecao } from '../../components/ui/Campo';
import { StatCard, StatGrid } from '../../components/ui/StatCard';
import { ErroCarregamento, SkeletonPagina } from '../../components/ui/Estados';

/** Lista os papéis com a explicação de cada um (o usuário entende o que está concedendo). */
function OpcoesPapel({ papeis, valor, onChange, erro }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-ink">
        Papel{' '}
        <span className="text-danger" aria-hidden>
          *
        </span>
      </legend>
      <div className="space-y-2">
        {papeis.map((p) => (
          <label
            key={p.id}
            className="flex cursor-pointer gap-3 rounded-xl border border-line p-3 transition-colors hover:border-track has-[:checked]:border-primary has-[:checked]:bg-primary/10"
          >
            <input
              type="radio"
              name="papel"
              value={p.id}
              checked={valor === p.id}
              onChange={() => onChange(p.id)}
              className="mt-1 accent-[rgb(var(--c-primary))]"
            />
            <span>
              <span className="block text-sm font-semibold text-ink">{p.nome}</span>
              <span className="block text-sm text-muted">{p.descricao}</span>
            </span>
          </label>
        ))}
      </div>
      {erro && <p className="mt-1.5 text-xs font-medium text-danger">{erro}</p>}
    </fieldset>
  );
}

export default function Gestores() {
  const toast = useToast();
  const { usuario } = useAuth();
  const { dados, carregando, erro, recarregar } = useApi(listarGestores);
  const auditoria = useApi(listarAuditoria);

  const [convite, setConvite] = useState(null); // { colaboradorId, papel }
  const [edicao, setEdicao] = useState(null); // { gestor, papel }
  const [revogar, setRevogar] = useState(null);

  const notificarErro = { onErro: (e) => toast.erro(e.message) };
  const acaoConvidar = useMutacao(convidarGestor);
  const acaoPapel = useMutacao(alterarPapelGestor, notificarErro);
  const acaoRevogar = useMutacao(revogarGestor, notificarErro);
  const acaoReenviar = useMutacao(reenviarConvite, notificarErro);

  const atualizarTudo = () => {
    recarregar();
    auditoria.recarregar();
  };

  if (carregando) return <SkeletonPagina variante="tabela" />;
  if (erro) return <ErroCarregamento erro={erro} onTentarNovamente={recarregar} className="mt-10" />;

  const { gestores, papeis, candidatos } = dados;
  const nomePapel = (id) => papeis.find((p) => p.id === id)?.nome ?? id;
  const ativos = gestores.filter((g) => g.status === 'ativo');
  const semMfa = ativos.filter((g) => !g.mfaAtivo).length;

  const enviarConvite = async (e) => {
    e.preventDefault();
    const novo = await acaoConvidar.executar({
      colaboradorId: Number(convite.colaboradorId),
      papel: convite.papel,
    });
    if (!novo) return;
    setConvite(null);
    toast.sucesso(`Convite enviado para ${novo.email}.`);
    atualizarTudo();
  };

  const salvarPapel = async () => {
    const ok = await acaoPapel.executar(edicao.gestor.id, edicao.papel);
    if (!ok) return;
    setEdicao(null);
    toast.sucesso(`${ok.nome} agora é ${nomePapel(ok.papel)}.`);
    atualizarTudo();
  };

  const confirmarRevogacao = async () => {
    const alvo = revogar;
    const ok = await acaoRevogar.executar(alvo.id);
    setRevogar(null);
    if (ok === undefined) return;
    toast.sucesso(`Acesso administrativo de ${alvo.nome} revogado.`);
    atualizarTudo();
  };

  const reenviar = async (g) => {
    if (await acaoReenviar.executar(g.id)) {
      toast.sucesso(`Convite reenviado para ${g.email}.`);
      auditoria.recarregar();
    }
  };

  const colunas = [
    {
      id: 'nome',
      titulo: 'Pessoa',
      render: (g) => (
        <div className="flex items-center gap-3 text-left">
          <Avatar nome={g.nome} />
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink">
              {g.nome}
              {g.colaboradorId === usuario?.id && (
                <span className="ml-1.5 text-xs font-normal text-muted">(você)</span>
              )}
            </p>
            <p className="truncate text-xs text-muted">{g.email}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'papel',
      titulo: 'Papel',
      render: (g) => <span className="font-medium text-ink">{nomePapel(g.papel)}</span>,
    },
    { id: 'mfa', titulo: 'Segurança', render: (g) => <StatusBadge mapa={MFA} valor={String(g.mfaAtivo)} /> },
    {
      id: 'acesso',
      titulo: 'Último acesso',
      render: (g) => (
        <span className="text-muted">
          {g.status === 'pendente'
            ? `Convidado ${relativo(g.convidadoEm)}`
            : g.ultimoAcesso
              ? relativo(g.ultimoAcesso)
              : '—'}
        </span>
      ),
    },
    { id: 'status', titulo: 'Status', render: (g) => <StatusBadge mapa={STATUS_GESTOR} valor={g.status} /> },
    {
      id: 'acoes',
      titulo: 'Ações',
      tituloOculto: true,
      alinhar: 'direita',
      render: (g) =>
        g.colaboradorId === usuario?.id ? null : (
          <MenuAcoes
            rotulo={`Ações para ${g.nome}`}
            acoes={[
              {
                rotulo: 'Alterar papel',
                icone: UserCog,
                onClick: () => setEdicao({ gestor: g, papel: g.papel }),
              },
              {
                rotulo: 'Reenviar convite',
                icone: MailPlus,
                oculto: g.status !== 'pendente',
                onClick: () => reenviar(g),
              },
              { rotulo: 'Revogar acesso', icone: UserMinus, perigoso: true, onClick: () => setRevogar(g) },
            ]}
          />
        ),
    },
  ];

  return (
    <Pagina
      titulo="Gestores e permissões"
      descricao="Quem pode administrar a plataforma e o que cada pessoa pode fazer."
      largura="larga"
      acoes={
        <Button
          iconeEsquerda={UserPlus}
          onClick={() => setConvite({ colaboradorId: '', papel: 'lider' })}
          disabled={!candidatos.length}
        >
          Convidar gestor
        </Button>
      }
    >
      <StatGrid>
        <StatCard
          rotulo="Administradores"
          valor={ativos.filter((g) => g.papel === 'admin').length}
          detalhe="Acesso total, incluindo faturamento"
        />
        <StatCard
          rotulo="Gestores ativos"
          valor={ativos.length}
          detalhe={
            gestores.length === ativos.length
              ? 'Nenhum convite pendente'
              : plural(gestores.length - ativos.length, 'convite pendente', 'convites pendentes')
          }
        />
        <StatCard
          rotulo="Sem 2FA"
          valor={semMfa}
          detalhe={semMfa ? 'Peça que ativem a verificação em duas etapas' : 'Todos protegidos com 2FA'}
          tomDetalhe={semMfa ? 'alerta' : 'sucesso'}
        />
      </StatGrid>

      <DataTable colunas={colunas} linhas={gestores} legenda="Gestores e administradores" />

      <Secao titulo="Atividade recente" descricao="Registro de alterações de acesso (auditoria).">
        {auditoria.dados && (
          <ul className="divide-y divide-line rounded-2xl border border-line bg-surface shadow-card">
            {auditoria.dados.map((evt) => (
              <li
                key={evt.id}
                className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <div className="flex items-start gap-3">
                  <ShieldCheck size={16} className="mt-0.5 shrink-0 text-subtle" aria-hidden />
                  <div>
                    <p className="text-sm font-semibold text-ink">{evt.acao}</p>
                    <p className="text-sm text-muted">{evt.descricao}</p>
                  </div>
                </div>
                <time dateTime={evt.criadoEm} className="shrink-0 pl-7 text-sm text-subtle sm:pl-0">
                  {dataHora(evt.criadoEm)}
                </time>
              </li>
            ))}
          </ul>
        )}
      </Secao>

      <Modal
        aberto={Boolean(convite)}
        onFechar={() => !acaoConvidar.executando && setConvite(null)}
        titulo="Convidar gestor"
        descricao="A pessoa precisa já ser colaboradora. Ela recebe um e-mail para aceitar o novo acesso."
        rodape={
          <>
            <Button variante="ghost" onClick={() => setConvite(null)}>
              Cancelar
            </Button>
            <Button type="submit" form="form-convite" carregando={acaoConvidar.executando}>
              Enviar convite
            </Button>
          </>
        }
      >
        {convite && (
          <form id="form-convite" onSubmit={enviarConvite} noValidate className="space-y-5">
            {acaoConvidar.erro && !Object.keys(acaoConvidar.errosCampos).length && (
              <p role="alert" className="text-sm text-danger">
                {acaoConvidar.erro.message}
              </p>
            )}
            <CampoSelecao
              rotulo="Colaborador"
              obrigatorio
              data-autofocus
              placeholder="Escolha uma pessoa"
              opcoes={candidatos.map((c) => ({
                valor: String(c.id),
                rotulo: `${c.nome} — ${c.departamento}`,
              }))}
              value={convite.colaboradorId}
              onChange={(e) => setConvite((c) => ({ ...c, colaboradorId: e.target.value }))}
              erro={acaoConvidar.errosCampos.colaboradorId}
            />
            <OpcoesPapel
              papeis={papeis}
              valor={convite.papel}
              onChange={(papel) => setConvite((c) => ({ ...c, papel }))}
              erro={acaoConvidar.errosCampos.papel}
            />
          </form>
        )}
      </Modal>

      <Modal
        aberto={Boolean(edicao)}
        onFechar={() => !acaoPapel.executando && setEdicao(null)}
        titulo={edicao ? `Papel de ${edicao.gestor.nome}` : ''}
        rodape={
          <>
            <Button variante="ghost" onClick={() => setEdicao(null)}>
              Cancelar
            </Button>
            <Button
              onClick={salvarPapel}
              carregando={acaoPapel.executando}
              disabled={edicao?.papel === edicao?.gestor.papel}
            >
              Salvar papel
            </Button>
          </>
        }
      >
        {edicao && (
          <OpcoesPapel
            papeis={papeis}
            valor={edicao.papel}
            onChange={(papel) => setEdicao((x) => ({ ...x, papel }))}
          />
        )}
      </Modal>

      <ConfirmDialog
        aberto={Boolean(revogar)}
        onFechar={() => setRevogar(null)}
        onConfirmar={confirmarRevogacao}
        carregando={acaoRevogar.executando}
        perigoso
        titulo={`Revogar o acesso de ${revogar?.nome}?`}
        textoConfirmar="Revogar acesso"
        descricao="A pessoa perde o acesso ao painel da empresa na hora, mas continua como colaboradora e mantém seus cursos."
      />
    </Pagina>
  );
}
