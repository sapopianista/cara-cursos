import { useState } from 'react';
import { CheckCircle2, CreditCard, Download, Plus } from 'lucide-react';
import Modal from '../../components/ui/Modal';

/**
 * Dados simulados para integração futura com a API REST Java/JDBC:
 * - GET  /api/admin/pagamento/overview
 * - POST /api/admin/pagamento/licencas
 * - GET  /api/admin/pagamento/faturas
 */
const CONTRATO = {
  numero: 'OSC-2024-008',
  planoNome: 'Enterprise Pro Anual',
  status: 'Ativo',
  renovacao: '15 de dezembro de 2025',
  valorPorLicenca: 74,
};

const DADOS_FISCAIS = {
  razaoSocial: 'Oscorp Brasil Tecnologia Ltda.',
  cnpj: '45.109.832/0001-90',
  endereco: 'Av. Paulista, 1842, Bela Vista — São Paulo, SP',
  emailNfe: 'nfe-corporativo@oscorp.com',
  metodoPrincipal: 'Boleto Bancário Faturado (D+30)',
};

const FATURAS = [
  {
    id: 'INV-2025-0681',
    competencia: 'Junho 2025 (200 licenças)',
    emissao: '15/06/2025',
    valor: 'R$ 14.800,00',
    status: 'Pago',
    notaFiscal: 'NFE-90420-SP',
  },
  {
    id: 'INV-2025-0581',
    competencia: 'Maio 2025 (200 licenças)',
    emissao: '15/05/2025',
    valor: 'R$ 14.800,00',
    status: 'Pago',
    notaFiscal: 'NFE-88319-SP',
  },
  {
    id: 'INV-2025-0481',
    competencia: 'Abril 2025 (200 licenças)',
    emissao: '15/04/2025',
    valor: 'R$ 14.800,00',
    status: 'Pago',
    notaFiscal: 'NFE-77210-SP',
  },
];

export default function PlanosPagamento() {
  const [assentosTotais, setAssentosTotais] = useState(200);
  const assentosAlocados = 142;
  const percentualUso = Math.round((assentosAlocados / assentosTotais) * 100);

  const [modalLicencasAberto, setModalLicencasAberto] = useState(false);
  const [qtdAdicional, setQtdAdicional] = useState(25);
  const [feedback, setFeedback] = useState('');

  const handleContratarLicencas = (evento) => {
    evento.preventDefault();
    const qtd = Number(qtdAdicional) || 0;
    if (qtd <= 0) return;

    setAssentosTotais((atual) => atual + qtd);
    setModalLicencasAberto(false);
    setFeedback(`Foram adicionadas +${qtd} licenças ao contrato da Oscorp.`);
  };

  return (
    <div className="animate-entrada mx-auto max-w-5xl space-y-10 py-4">
      <header className="flex flex-col justify-between gap-4 border-b border-line pb-8 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            Faturamento e Assinatura • Contrato #{CONTRATO.numero}
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Planos e Pagamento
          </h1>
          <p className="mt-2 max-w-2xl text-base text-muted">
            Acompanhe a alocação de licenças, próxima fatura e notas fiscais emitidas.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalLicencasAberto(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-onprimary transition-colors hover:bg-primary-hover"
        >
          <Plus size={16} aria-hidden />
          Contratar licenças
        </button>
      </header>

      {feedback && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-ink"
        >
          <CheckCircle2 size={18} className="shrink-0 text-accent" aria-hidden />
          <span>{feedback}</span>
        </div>
      )}

      {/* Resumo do Plano e Uso de Licenças */}
      <div className="grid gap-6 md:grid-cols-2">
        <section
          aria-labelledby="resumo-licencas-titulo"
          className="flex flex-col justify-between rounded-2xl border border-line bg-surface p-6"
        >
          <div>
            <div className="flex items-center justify-between gap-2">
              <h2 id="resumo-licencas-titulo" className="text-lg font-semibold text-ink">
                Licenças corporativas
              </h2>
              <span className="rounded-full bg-accent/15 px-3 py-0.5 text-xs font-semibold text-accent">
                {CONTRATO.planoNome}
              </span>
            </div>

            <p className="mt-4 text-3xl font-bold text-ink">
              {assentosAlocados}{' '}
              <span className="text-lg font-normal text-muted">de {assentosTotais} em uso</span>
            </p>

            <div className="mt-4">
              <div className="mb-1.5 flex justify-between text-xs">
                <span className="text-muted">Taxa de ocupação</span>
                <span className="font-semibold text-ink">{percentualUso}%</span>
              </div>
              <div
                role="progressbar"
                aria-label="Ocupação de licenças corporativas"
                aria-valuenow={percentualUso}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-2.5 w-full overflow-hidden rounded-full bg-surface2"
              >
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${percentualUso}%` }}
                />
              </div>
            </div>
          </div>

          <p className="mt-6 border-t border-line pt-4 text-xs text-muted">
            Restam <strong>{assentosTotais - assentosAlocados} licenças</strong> disponíveis para
            novos colaboradores.
          </p>
        </section>

        <section
          aria-labelledby="proxima-fatura-titulo"
          className="flex flex-col justify-between rounded-2xl border border-line bg-surface p-6"
        >
          <div>
            <div className="flex items-center justify-between gap-2">
              <h2 id="proxima-fatura-titulo" className="text-lg font-semibold text-ink">
                Próximo faturamento
              </h2>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted">
                <CreditCard size={15} aria-hidden />
                Vencimento: 15/07/2025
              </span>
            </div>

            <p className="mt-4 text-3xl font-bold text-ink">R$ 14.800,00</p>
            <p className="mt-1 text-sm text-muted">{DADOS_FISCAIS.metodoPrincipal}</p>

            <dl className="mt-5 space-y-1.5 border-t border-line pt-4 text-xs">
              <div className="flex justify-between gap-2">
                <dt className="text-muted">Razão Social:</dt>
                <dd className="font-medium text-ink">{DADOS_FISCAIS.razaoSocial}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted">CNPJ:</dt>
                <dd className="font-mono text-ink">{DADOS_FISCAIS.cnpj}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted">Envio de NF-e:</dt>
                <dd className="text-ink">{DADOS_FISCAIS.emailNfe}</dd>
              </div>
            </dl>
          </div>
        </section>
      </div>

      {/* Histórico de faturas */}
      <section aria-labelledby="historico-faturas-titulo" className="space-y-4">
        <h2 id="historico-faturas-titulo" className="text-xl font-semibold text-ink">
          Histórico de faturas e notas fiscais
        </h2>

        <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-surface2/60 text-xs font-semibold uppercase tracking-wider text-subtle">
              <tr>
                <th scope="col" className="px-5 py-3.5">
                  Fatura
                </th>
                <th scope="col" className="px-5 py-3.5">
                  Competência
                </th>
                <th scope="col" className="px-5 py-3.5">
                  Emissão
                </th>
                <th scope="col" className="px-5 py-3.5">
                  Valor
                </th>
                <th scope="col" className="px-5 py-3.5">
                  Status
                </th>
                <th scope="col" className="px-5 py-3.5 text-right">
                  Nota Fiscal
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {FATURAS.map((fat) => (
                <tr key={fat.id}>
                  <td className="px-5 py-4 font-mono text-xs font-semibold text-muted">
                    {fat.id}
                  </td>
                  <td className="px-5 py-4 font-medium text-ink">{fat.competencia}</td>
                  <td className="px-5 py-4 text-muted">{fat.emissao}</td>
                  <td className="px-5 py-4 font-semibold text-ink">{fat.valor}</td>
                  <td className="px-5 py-4">
                    <span className="inline-block rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-semibold text-accent">
                      {fat.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={() =>
                        setFeedback(`Download iniciado: Nota Fiscal ${fat.notaFiscal}.pdf`)
                      }
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                    >
                      <Download size={15} aria-hidden />
                      {fat.notaFiscal}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal acessível para contratar mais licenças */}
      <Modal
        aberto={modalLicencasAberto}
        onFechar={() => setModalLicencasAberto(false)}
        titulo="Contratar licenças adicionais"
        descricao="As novas licenças são liberadas imediatamente para alocação na sua equipe."
      >
        <form onSubmit={handleContratarLicencas} className="space-y-4">
          <div>
            <label
              htmlFor="input-qtd-licencas"
              className="mb-1.5 block text-sm font-medium text-ink"
            >
              Quantidade de novas licenças
            </label>
            <input
              id="input-qtd-licencas"
              type="number"
              min={5}
              step={5}
              required
              value={qtdAdicional}
              onChange={(e) => setQtdAdicional(e.target.value)}
              className="w-full rounded-xl border border-line bg-surface2 px-3.5 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
            />
            <p className="mt-2 text-xs text-muted">
              Valor mensal adicional estimado:{' '}
              <strong className="text-ink">
                R$ {(Number(qtdAdicional) * CONTRATO.valorPorLicenca).toLocaleString('pt-BR')},00
              </strong>
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-line pt-4">
            <button
              type="button"
              onClick={() => setModalLicencasAberto(false)}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-muted hover:bg-surface2 hover:text-ink"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-onprimary transition-colors hover:bg-primary-hover"
            >
              Confirmar contratação
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
