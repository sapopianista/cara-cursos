import { useState } from 'react';
import { Check, CheckCircle2 } from 'lucide-react';

/**
 * Dados simulados para integração futura com a API REST Java/JDBC:
 * - GET /api/admin/configuracoes
 * - PUT /api/admin/configuracoes
 */
const CONFIG_INICIAL = {
  nomeEmpresa: 'Oscorp Enterprise',
  razaoSocial: 'Oscorp Industries Brasil Ltda',
  cnpj: '12.345.678/0001-90',
  emailNotificacao: 'educacao.corporativa@oscorp.com',
  fusoHorario: 'Brasília (GMT-3)',
  exigirPresenca80: true,
  certificacaoAutomatica: true,
  downloadOffline: true,
  exigir2FA: true,
  expiracaoSessao: '30 dias',
  dominiosAutorizados: '@oscorp.com, @lab.oscorp.com',
};

export default function ConfiguracoesCorporativas() {
  const [config, setConfig] = useState(CONFIG_INICIAL);
  const [salvo, setSalvo] = useState(false);

  const atualizarCampo = (chave, valor) => {
    setSalvo(false);
    setConfig((atual) => ({ ...atual, [chave]: valor }));
  };

  const handleSubmit = (evento) => {
    evento.preventDefault();
    setSalvo(true);
  };

  const opcoesPoliticas = [
    {
      chave: 'exigirPresenca80',
      titulo: 'Exigir conclusão mínima de 80% das aulas',
      descricao:
        'O colaborador só poderá realizar a avaliação final após assistir a pelo menos 80% do módulo.',
    },
    {
      chave: 'certificacaoAutomatica',
      titulo: 'Emissão automática de certificados',
      descricao:
        'Gera o certificado em PDF assim que o aluno atingir a nota mínima na avaliação.',
    },
    {
      chave: 'downloadOffline',
      titulo: 'Permitir download de materiais de apoio',
      descricao:
        'Libera o download de apostilas, planilhas e apresentações em PDF nas salas de aula.',
    },
    {
      chave: 'exigir2FA',
      titulo: 'Exigir autenticação em duas etapas (2FA) para gestores',
      descricao:
        'Solicita código de verificação adicional no acesso ao painel administrativo.',
    },
  ];

  return (
    <div className="animate-entrada mx-auto max-w-4xl space-y-10 py-4">
      <header className="border-b border-line pb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent">
          Administração • Oscorp Enterprise
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          Configurações Corporativas
        </h1>
        <p className="mt-2 max-w-2xl text-base text-muted">
          Gerencie os dados cadastrais da organização, políticas de estudo e segurança de acesso.
        </p>
      </header>

      {salvo && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-ink"
        >
          <CheckCircle2 size={18} className="shrink-0 text-accent" aria-hidden />
          <span>Configurações salvas com sucesso.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-10">
        {/* Seção 1: Dados da Organização */}
        <section
          aria-labelledby="dados-org-titulo"
          className="space-y-5 rounded-2xl border border-line bg-surface p-6"
        >
          <div>
            <h2 id="dados-org-titulo" className="text-lg font-semibold text-ink">
              Dados da organização
            </h2>
            <p className="mt-1 text-sm text-muted">
              Informações exibidas nos relatórios e certificados emitidos para os colaboradores.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="cfg-nome" className="mb-1.5 block text-sm font-medium text-ink">
                Nome fantasia
              </label>
              <input
                id="cfg-nome"
                type="text"
                required
                value={config.nomeEmpresa}
                onChange={(e) => atualizarCampo('nomeEmpresa', e.target.value)}
                className="w-full rounded-xl border border-line bg-surface2 px-3.5 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="cfg-razao" className="mb-1.5 block text-sm font-medium text-ink">
                Razão social
              </label>
              <input
                id="cfg-razao"
                type="text"
                required
                value={config.razaoSocial}
                onChange={(e) => atualizarCampo('razaoSocial', e.target.value)}
                className="w-full rounded-xl border border-line bg-surface2 px-3.5 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="cfg-cnpj" className="mb-1.5 block text-sm font-medium text-ink">
                CNPJ
              </label>
              <input
                id="cfg-cnpj"
                type="text"
                required
                value={config.cnpj}
                onChange={(e) => atualizarCampo('cnpj', e.target.value)}
                className="w-full rounded-xl border border-line bg-surface2 px-3.5 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="cfg-email" className="mb-1.5 block text-sm font-medium text-ink">
                E-mail para notificações de RH
              </label>
              <input
                id="cfg-email"
                type="email"
                required
                value={config.emailNotificacao}
                onChange={(e) => atualizarCampo('emailNotificacao', e.target.value)}
                className="w-full rounded-xl border border-line bg-surface2 px-3.5 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="cfg-fuso" className="mb-1.5 block text-sm font-medium text-ink">
                Fuso horário padrão
              </label>
              <select
                id="cfg-fuso"
                value={config.fusoHorario}
                onChange={(e) => atualizarCampo('fusoHorario', e.target.value)}
                className="w-full rounded-xl border border-line bg-surface2 px-3.5 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
              >
                <option value="Brasília (GMT-3)">Brasília (GMT-3)</option>
                <option value="Manaus (GMT-4)">Manaus (GMT-4)</option>
                <option value="Lisboa (GMT+0)">Lisboa (GMT+0)</option>
              </select>
            </div>

            <div>
              <label htmlFor="cfg-dominios" className="mb-1.5 block text-sm font-medium text-ink">
                Domínios corporativos autorizados (SSO)
              </label>
              <input
                id="cfg-dominios"
                type="text"
                value={config.dominiosAutorizados}
                onChange={(e) => atualizarCampo('dominiosAutorizados', e.target.value)}
                className="w-full rounded-xl border border-line bg-surface2 px-3.5 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        </section>

        {/* Seção 2: Políticas de Aprendizado e Segurança */}
        <section
          aria-labelledby="politicas-titulo"
          className="space-y-4 rounded-2xl border border-line bg-surface p-6"
        >
          <div>
            <h2 id="politicas-titulo" className="text-lg font-semibold text-ink">
              Políticas de aprendizado e segurança
            </h2>
            <p className="mt-1 text-sm text-muted">
              Defina as regras de aprovação, emissão de certificados e autenticação.
            </p>
          </div>

          <ul className="divide-y divide-line">
            {opcoesPoliticas.map((item) => {
              const ativo = config[item.chave];
              return (
                <li
                  key={item.chave}
                  className="flex items-center justify-between gap-6 py-4 first:pt-2 last:pb-0"
                >
                  <div>
                    <p className="text-sm font-semibold text-ink">{item.titulo}</p>
                    <p className="mt-0.5 text-xs text-muted">{item.descricao}</p>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={ativo}
                    aria-label={item.titulo}
                    onClick={() => atualizarCampo(item.chave, !ativo)}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                      ativo ? 'bg-primary' : 'bg-surface2 border border-line'
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        ativo ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              setConfig(CONFIG_INICIAL);
              setSalvo(false);
            }}
            className="rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-surface2 hover:text-ink"
          >
            Restaurar padrão
          </button>

          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-onprimary transition-colors hover:bg-primary-hover"
          >
            <Check size={16} aria-hidden />
            Salvar alterações
          </button>
        </div>
      </form>
    </div>
  );
}
