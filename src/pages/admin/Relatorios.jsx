import { useEffect, useState } from 'react';
import { FileBarChart, FileSpreadsheet, FileText } from 'lucide-react';
import useApi from '../../hooks/useApi';
import useMutacao from '../../hooks/useMutacao';
import { baixarRelatorio, gerarRelatorio, getRelatorios } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { dataHora } from '../../lib/formatadores';
import { PERIODOS_RELATORIO, rotuloPeriodo, STATUS_RELATORIO } from '../../lib/rotulos';
import Pagina, { Secao } from '../../components/ui/Pagina';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import BotaoDownload from '../../components/ui/BotaoDownload';
import { StatusBadge } from '../../components/ui/Badge';
import { CampoSelecao } from '../../components/ui/Campo';
import { ErroCarregamento, SkeletonPagina } from '../../components/ui/Estados';

const ICONE_FORMATO = { xlsx: FileSpreadsheet, csv: FileSpreadsheet, pdf: FileText };
const INTERVALO_CONSULTA_MS = 2500;

export default function Relatorios() {
  const toast = useToast();
  const { dados, carregando, erro, recarregar } = useApi(getRelatorios);
  const [pedido, setPedido] = useState(null); // { modelo, periodo, departamento }
  const gerar = useMutacao(gerarRelatorio, { onErro: (e) => toast.erro(e.message) });

  // Enquanto houver relatório sendo gerado no servidor, consulta de novo periodicamente.
  const processando = dados?.historico.some((r) => r.status === 'processando');
  useEffect(() => {
    if (!processando) return undefined;
    const id = setInterval(recarregar, INTERVALO_CONSULTA_MS);
    return () => clearInterval(id);
  }, [processando, recarregar]);

  if (carregando) return <SkeletonPagina />;
  if (erro) return <ErroCarregamento erro={erro} onTentarNovamente={recarregar} className="mt-10" />;

  const confirmar = async (e) => {
    e.preventDefault();
    const novo = await gerar.executar({
      modeloId: pedido.modelo.id,
      periodo: pedido.periodo,
      departamento: pedido.departamento || null,
    });
    if (!novo) return;
    setPedido(null);
    toast.info('Estamos gerando o relatório. Ele aparece pronto no histórico em instantes.');
    recarregar();
  };

  const colunas = [
    {
      id: 'modelo',
      titulo: 'Relatório',
      render: (r) => (
        <span className="text-left">
          <span className="block font-medium text-ink">{r.modelo?.titulo}</span>
          <span className="block text-xs text-muted">
            {rotuloPeriodo(r.periodo)} · {r.departamento ?? 'Todos os departamentos'} ·{' '}
            {r.modelo?.formato.toUpperCase()}
          </span>
        </span>
      ),
    },
    {
      id: 'solicitadoPor',
      titulo: 'Solicitado por',
      render: (r) => <span className="text-muted">{r.solicitadoPor}</span>,
    },
    {
      id: 'criadoEm',
      titulo: 'Data',
      render: (r) => <span className="text-muted">{dataHora(r.criadoEm)}</span>,
    },
    {
      id: 'status',
      titulo: 'Status',
      render: (r) => <StatusBadge mapa={STATUS_RELATORIO} valor={r.status} />,
    },
    {
      id: 'acao',
      titulo: 'Arquivo',
      tituloOculto: true,
      alinhar: 'direita',
      render: (r) =>
        r.status === 'pronto' ? (
          <BotaoDownload
            disponivel={Boolean(r.url)}
            onBaixar={() => baixarRelatorio(r)}
            aria-label={`Baixar ${r.modelo?.titulo}`}
          />
        ) : null,
    },
  ];

  return (
    <Pagina
      titulo="Relatórios"
      descricao="Escolha um modelo, defina o período e baixe o arquivo quando estiver pronto."
      largura="larga"
    >
      <Secao titulo="Modelos" tituloOculto>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dados.modelos.map((m) => {
            const Icone = ICONE_FORMATO[m.formato] ?? FileBarChart;
            return (
              <Card as="li" key={m.id} className="flex flex-col">
                <div className="flex items-center justify-between gap-2">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
                    <Icone size={20} aria-hidden />
                  </span>
                  <span className="rounded-md bg-surface2 px-2 py-0.5 font-mono text-xs font-semibold text-muted">
                    {m.formato.toUpperCase()}
                  </span>
                </div>
                <h3 className="mt-4 text-base font-semibold text-ink">{m.titulo}</h3>
                <p className="mt-1 text-sm text-muted">{m.descricao}</p>
                <div className="mt-auto pt-5">
                  <Button
                    variante="secondary"
                    onClick={() => setPedido({ modelo: m, periodo: '30dias', departamento: '' })}
                  >
                    Gerar relatório
                  </Button>
                </div>
              </Card>
            );
          })}
        </ul>
      </Secao>

      <Secao titulo="Histórico">
        <DataTable
          colunas={colunas}
          linhas={dados.historico}
          legenda="Relatórios gerados"
          vazio="Nenhum relatório gerado ainda."
        />
      </Secao>

      <Modal
        aberto={Boolean(pedido)}
        onFechar={() => !gerar.executando && setPedido(null)}
        titulo={pedido ? pedido.modelo.titulo : ''}
        descricao={pedido?.modelo.descricao}
        rodape={
          <>
            <Button variante="ghost" onClick={() => setPedido(null)}>
              Cancelar
            </Button>
            <Button type="submit" form="form-relatorio" carregando={gerar.executando}>
              Gerar {pedido?.modelo.formato.toUpperCase()}
            </Button>
          </>
        }
      >
        {pedido && (
          <form id="form-relatorio" onSubmit={confirmar} className="space-y-4">
            <CampoSelecao
              rotulo="Período"
              obrigatorio
              data-autofocus
              opcoes={PERIODOS_RELATORIO}
              value={pedido.periodo}
              onChange={(e) => setPedido((p) => ({ ...p, periodo: e.target.value }))}
            />
            <CampoSelecao
              rotulo="Departamento"
              placeholder="Todos os departamentos"
              opcoes={dados.departamentos.map((d) => ({ valor: d, rotulo: d }))}
              value={pedido.departamento}
              onChange={(e) => setPedido((p) => ({ ...p, departamento: e.target.value }))}
            />
          </form>
        )}
      </Modal>
    </Pagina>
  );
}
