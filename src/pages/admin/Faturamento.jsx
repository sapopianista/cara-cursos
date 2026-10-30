import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import useApi from '../../hooks/useApi';
import useMutacao from '../../hooks/useMutacao';
import { baixarNotaFiscal, contratarLicencas, getFaturamento } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { data, dataLonga, diasAte, mesAno, moeda } from '../../lib/formatadores';
import { STATUS_FATURA } from '../../lib/rotulos';
import Pagina, { Secao } from '../../components/ui/Pagina';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import ProgressBar from '../../components/ui/ProgressBar';
import BotaoDownload from '../../components/ui/BotaoDownload';
import Badge, { StatusBadge } from '../../components/ui/Badge';
import { CampoTexto } from '../../components/ui/Campo';
import { ErroCarregamento, SkeletonPagina } from '../../components/ui/Estados';

function Linha({ rotulo, children }) {
  return (
    <div className="flex flex-col gap-0.5 py-2 sm:flex-row sm:justify-between sm:gap-4">
      <dt className="text-sm text-muted">{rotulo}</dt>
      <dd className="text-sm font-medium text-ink sm:text-right">{children}</dd>
    </div>
  );
}

export default function Faturamento() {
  const toast = useToast();
  const { dados, carregando, erro, recarregar } = useApi(getFaturamento);
  const [modal, setModal] = useState(false);
  const [quantidade, setQuantidade] = useState('5');
  const contratar = useMutacao(contratarLicencas);

  if (carregando) return <SkeletonPagina variante="tabela" />;
  if (erro) return <ErroCarregamento erro={erro} onTentarNovamente={recarregar} className="mt-10" />;

  const { contrato, licencas, proximaFatura, dadosFiscais, faturas } = dados;
  const uso = Math.round((licencas.emUso / licencas.contratadas) * 100);
  const livres = licencas.contratadas - licencas.emUso;
  const qtd = Math.max(0, Math.floor(Number(quantidade) || 0));
  const acrescimoMensal = qtd * contrato.valorLicencaMensalCentavos;
  const novoMensal = (licencas.contratadas + qtd) * contrato.valorLicencaMensalCentavos;
  const diasRenovacao = diasAte(contrato.renovacao);

  const confirmar = async (e) => {
    e.preventDefault();
    const r = await contratar.executar(qtd);
    if (!r) return;
    setModal(false);
    toast.sucesso(`${qtd} licenças adicionadas. Agora são ${r.licencasContratadas} no total.`);
    recarregar();
  };

  const colunas = [
    {
      id: 'competencia',
      titulo: 'Competência',
      render: (f) => <span className="font-medium text-ink">{mesAno(f.competencia)}</span>,
    },
    {
      id: 'licencas',
      titulo: 'Licenças',
      render: (f) => <span className="tabular-nums text-muted">{f.licencas}</span>,
    },
    {
      id: 'emitidaEm',
      titulo: 'Emissão',
      render: (f) => <span className="text-muted">{data(f.emitidaEm)}</span>,
    },
    {
      id: 'valor',
      titulo: 'Valor',
      render: (f) => <span className="font-semibold tabular-nums text-ink">{moeda(f.valorCentavos)}</span>,
    },
    { id: 'status', titulo: 'Status', render: (f) => <StatusBadge mapa={STATUS_FATURA} valor={f.status} /> },
    {
      id: 'nf',
      titulo: 'Nota fiscal',
      alinhar: 'direita',
      render: (f) => (
        <BotaoDownload
          disponivel={Boolean(f.notaFiscal.url)}
          onBaixar={() => baixarNotaFiscal(f)}
          rotulo={f.notaFiscal.numero}
          variante="ghost"
          aria-label={`Baixar nota fiscal ${f.notaFiscal.numero}`}
        />
      ),
    },
  ];

  return (
    <Pagina
      titulo="Plano e faturamento"
      descricao="Licenças, próxima cobrança e notas fiscais."
      acoes={
        <Button iconeEsquerda={Plus} onClick={() => (setQuantidade('5'), contratar.limpar(), setModal(true))}>
          Contratar licenças
        </Button>
      }
    >
      <div className="grid gap-6 md:grid-cols-2">
        <Card as="section" espacamento="lg" aria-labelledby="licencas-titulo">
          <div className="flex items-center justify-between gap-2">
            <h2 id="licencas-titulo" className="text-lg font-semibold text-ink">
              Licenças
            </h2>
            <Badge tom="info">{contrato.plano}</Badge>
          </div>
          <p className="mt-4 text-3xl font-bold tabular-nums text-ink">
            {licencas.emUso}{' '}
            <span className="text-lg font-normal text-muted">de {licencas.contratadas} em uso</span>
          </p>
          <ProgressBar
            valor={uso}
            altura="h-2.5"
            cor={uso >= 90 ? 'warn' : 'primary'}
            className="mt-4"
            rotulo="Ocupação das licenças"
          />
          <p className="mt-3 text-sm text-muted">
            {livres > 0 ? (
              <>
                <strong className="text-ink">{livres} livres</strong> para novos colaboradores.
              </>
            ) : (
              <strong className="text-warn">Todas as licenças estão em uso.</strong>
            )}{' '}
            <Link to="/admin/colaboradores" className="text-primary hover:underline">
              Ver colaboradores
            </Link>
          </p>
        </Card>

        <Card as="section" espacamento="lg" aria-labelledby="proxima-titulo">
          <h2 id="proxima-titulo" className="text-lg font-semibold text-ink">
            Próxima cobrança
          </h2>
          <p className="mt-4 text-3xl font-bold tabular-nums text-ink">
            {moeda(proximaFatura.valorCentavos)}
          </p>
          <p className="mt-1 text-sm text-muted">
            Vence em {data(proximaFatura.vencimento)} · {contrato.metodoPagamento}
          </p>
          <dl className="mt-4 divide-y divide-line border-t border-line">
            <Linha rotulo="Valor por licença">{moeda(contrato.valorLicencaMensalCentavos)}/mês</Linha>
            <Linha rotulo="Renovação do contrato">
              {dataLonga(contrato.renovacao)}
              {diasRenovacao <= 60 && (
                <span className="block text-xs font-normal text-warn">em {diasRenovacao} dias</span>
              )}
            </Linha>
          </dl>
        </Card>
      </div>

      <Secao titulo="Faturas">
        <DataTable
          colunas={colunas}
          linhas={faturas}
          legenda="Histórico de faturas"
          vazio="Nenhuma fatura emitida ainda."
        />
      </Secao>

      <Secao
        titulo="Dados de cobrança"
        descricao="Usados nas notas fiscais. Para alterar, edite em Configurações."
      >
        <Card espacamento="lg">
          <dl className="divide-y divide-line">
            <Linha rotulo="Razão social">{dadosFiscais.razaoSocial}</Linha>
            <Linha rotulo="CNPJ">
              <span className="font-mono">{dadosFiscais.cnpj}</span>
            </Linha>
            <Linha rotulo="Endereço">{dadosFiscais.endereco}</Linha>
            <Linha rotulo="E-mail para notas fiscais">{contrato.emailNotaFiscal}</Linha>
            <Linha rotulo="Contrato">{contrato.numero}</Linha>
          </dl>
        </Card>
      </Secao>

      <Modal
        aberto={modal}
        onFechar={() => !contratar.executando && setModal(false)}
        titulo="Contratar licenças"
        descricao="As licenças ficam disponíveis na hora e entram na próxima fatura."
        rodape={
          <>
            <Button variante="ghost" onClick={() => setModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="form-licencas" carregando={contratar.executando} disabled={qtd < 1}>
              Contratar {qtd > 0 ? qtd : ''} licenças
            </Button>
          </>
        }
      >
        <form id="form-licencas" onSubmit={confirmar} noValidate className="space-y-5">
          <CampoTexto
            rotulo="Quantidade"
            obrigatorio
            data-autofocus
            type="number"
            inputMode="numeric"
            min={1}
            max={500}
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            erro={
              contratar.errosCampos.quantidade ??
              (contratar.erro && !contratar.errosCampos.quantidade ? contratar.erro.message : undefined)
            }
            dica="Entre 1 e 500 licenças por vez."
          />
          <dl className="divide-y divide-line rounded-xl bg-surface2 px-4">
            <Linha rotulo={`Acréscimo (${qtd} × ${moeda(contrato.valorLicencaMensalCentavos)})`}>
              + {moeda(acrescimoMensal)}/mês
            </Linha>
            <Linha rotulo="Nova mensalidade">
              <span className="text-base font-bold">{moeda(novoMensal)}/mês</span>
            </Linha>
          </dl>
          <p className="text-sm text-muted">
            O contrato é anual e renova em {dataLonga(contrato.renovacao)}. As novas licenças seguem a mesma
            data.
          </p>
        </form>
      </Modal>
    </Pagina>
  );
}
