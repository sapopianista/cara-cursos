import { useState } from 'react';
import { Link } from 'react-router-dom';
import useApi from '../../hooks/useApi';
import useMutacao from '../../hooks/useMutacao';
import { atualizarPreferencias, getPerfil } from '../../services/api';
import { useTema } from '../../context/TemaContext';
import { useToast } from '../../context/ToastContext';
import { duracao, mesAno } from '../../lib/formatadores';
import Pagina, { Secao } from '../../components/ui/Pagina';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Switch from '../../components/ui/Switch';
import { CampoSelecao } from '../../components/ui/Campo';
import { StatCard, StatGrid } from '../../components/ui/StatCard';
import { ErroCarregamento, SkeletonPagina } from '../../components/ui/Estados';

const METAS = [120, 240, 360, 480, 600].map((m) => ({
  valor: String(m),
  rotulo: `${m / 60} horas por semana`,
}));

function Info({ rotulo, valor }) {
  return (
    <div>
      <dt className="text-sm text-muted">{rotulo}</dt>
      <dd className="mt-0.5 text-sm font-medium text-ink">{valor}</dd>
    </div>
  );
}

export default function Perfil() {
  const { dados, carregando, erro, recarregar } = useApi(getPerfil);
  const { escuro, setTema } = useTema();
  const toast = useToast();
  const salvar = useMutacao(atualizarPreferencias, { onErro: (e) => toast.erro(e.message) });
  // Edição local; `null` = sem alterações (mostra o que veio da API).
  const [edicao, setEdicao] = useState(null);
  const prefs = edicao ?? dados?.preferencias;
  const setPrefs = (atualizar) => setEdicao(atualizar(prefs));

  if (carregando) return <SkeletonPagina variante="formulario" largura="max-w-3xl" />;
  if (erro) return <ErroCarregamento erro={erro} onTentarNovamente={recarregar} className="mt-10" />;

  const alterado = edicao !== null && JSON.stringify(edicao) !== JSON.stringify(dados.preferencias);
  const aoSalvar = async (e) => {
    e.preventDefault();
    const salvas = await salvar.executar(prefs);
    if (!salvas) return;
    toast.sucesso('Preferências salvas.');
    setEdicao(null);
    recarregar();
  };

  return (
    <Pagina titulo="Meu perfil" largura="estreita">
      <Card espacamento="lg">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <Avatar nome={dados.nome} tamanho="xl" />
          <div className="min-w-0">
            <p className="text-xl font-semibold text-ink">{dados.nome}</p>
            <p className="text-sm text-muted">{dados.email}</p>
          </div>
        </div>
        <dl className="mt-6 grid gap-4 border-t border-line pt-6 sm:grid-cols-2">
          <Info rotulo="Cargo" valor={dados.cargo} />
          <Info rotulo="Departamento" valor={dados.departamento} />
          <Info rotulo="Matrícula" valor={dados.matricula} />
          <Info rotulo="Na plataforma desde" valor={dados.membroDesde ? mesAno(dados.membroDesde) : '—'} />
        </dl>
        <p className="mt-6 text-sm text-muted">
          Esses dados vêm do RH da {dados.empresa?.nome}. Algo errado?{' '}
          <Link to="/suporte" className="font-medium text-primary hover:underline">
            Abra um chamado
          </Link>
          .
        </p>
      </Card>

      <StatGrid>
        <StatCard rotulo="Cursos concluídos" valor={dados.estatisticas.cursosConcluidos} />
        <StatCard rotulo="Tempo estudado" valor={duracao(dados.estatisticas.minutosEstudados)} />
        <StatCard
          rotulo="Certificados"
          valor={dados.estatisticas.certificados}
          detalhe={
            <Link to="/progresso" className="text-primary hover:underline">
              Ver certificados
            </Link>
          }
        />
      </StatGrid>

      <Secao titulo="Preferências">
        <Card as="form" espacamento="lg" onSubmit={aoSalvar} className="space-y-6">
          <CampoSelecao
            rotulo="Meta semanal de estudo"
            obrigatorio
            opcoes={METAS}
            value={String(prefs.metaSemanalMinutos)}
            onChange={(e) => setPrefs((p) => ({ ...p, metaSemanalMinutos: Number(e.target.value) }))}
            dica="Usada no acompanhamento da sua página inicial."
          />
          <div className="space-y-5 border-t border-line pt-6">
            <Switch
              rotulo="Lembretes por e-mail"
              descricao="Avisos de prazos de atividades e novos cursos obrigatórios."
              ativo={prefs.notificacoesEmail}
              onChange={(v) => setPrefs((p) => ({ ...p, notificacoesEmail: v }))}
            />
            <Switch
              rotulo="Resumo semanal"
              descricao="Toda segunda-feira, um e-mail com seu progresso da semana anterior."
              ativo={prefs.resumoSemanal}
              onChange={(v) => setPrefs((p) => ({ ...p, resumoSemanal: v }))}
            />
            <Switch
              rotulo="Modo escuro"
              descricao="Vale para este navegador e é aplicado na hora."
              ativo={escuro}
              onChange={(v) => setTema(v ? 'dark' : 'light')}
            />
          </div>
          <div className="flex justify-end gap-2 border-t border-line pt-6">
            {alterado && (
              <Button variante="ghost" onClick={() => setEdicao(null)}>
                Descartar
              </Button>
            )}
            <Button type="submit" disabled={!alterado} carregando={salvar.executando}>
              Salvar preferências
            </Button>
          </div>
        </Card>
      </Secao>
    </Pagina>
  );
}
