import { useState } from 'react';
import { useBlocker } from 'react-router-dom';
import useApi from '../../hooks/useApi';
import useMutacao from '../../hooks/useMutacao';
import { getConfiguracoes, salvarConfiguracoes } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { FUSOS_HORARIOS } from '../../lib/rotulos';
import { cnpj, email, mascararCnpj, obrigatorio, validar } from '../../lib/validacao';
import Pagina from '../../components/ui/Pagina';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Switch from '../../components/ui/Switch';
import { ConfirmDialog } from '../../components/ui/Modal';
import { CampoSelecao, CampoTexto } from '../../components/ui/Campo';
import { ErroCarregamento, SkeletonPagina } from '../../components/ui/Estados';

const REGRAS = {
  nomeFantasia: [obrigatorio('Informe o nome fantasia.')],
  razaoSocial: [obrigatorio('Informe a razão social.')],
  cnpj: [obrigatorio('Informe o CNPJ.'), cnpj()],
  emailNotificacao: [obrigatorio('Informe um e-mail.'), email()],
};

const POLITICAS = [
  {
    grupo: 'Aprendizagem',
    itens: [
      {
        chave: 'exigirPresencaMinima',
        titulo: 'Exigir 80% das aulas antes da avaliação',
        descricao: 'A avaliação final só abre depois que a pessoa assiste a 80% do módulo.',
      },
      {
        chave: 'certificacaoAutomatica',
        titulo: 'Emitir certificados automaticamente',
        descricao: 'O PDF é gerado assim que a pessoa atinge a nota mínima.',
      },
      {
        chave: 'permitirDownloadMateriais',
        titulo: 'Permitir baixar materiais de apoio',
        descricao: 'Libera apostilas e planilhas para download nas salas de aula.',
      },
    ],
  },
  {
    grupo: 'Segurança',
    itens: [
      {
        chave: 'exigir2FA',
        titulo: 'Exigir verificação em duas etapas (2FA) para gestores',
        descricao: 'Pede um código extra a cada acesso ao painel da empresa.',
      },
    ],
  },
];

/** Formulário com controle de alterações: "Salvar" só aparece ativo quando algo mudou. */
function Formulario({ inicial, onSalvo }) {
  const toast = useToast();
  const [config, setConfig] = useState(inicial);
  const [errosLocais, setErrosLocais] = useState({});
  const [descartar, setDescartar] = useState(false);
  const salvar = useMutacao(salvarConfiguracoes, { onErro: (e) => !e.campos && toast.erro(e.message) });

  const alterado = JSON.stringify(config) !== JSON.stringify(inicial);
  const erros = { ...salvar.errosCampos, ...errosLocais };

  // Avisa antes de sair da tela com alterações não salvas.
  const bloqueio = useBlocker(
    ({ currentLocation, nextLocation }) => alterado && currentLocation.pathname !== nextLocation.pathname,
  );

  const org = (campo) => (e) => {
    const valor = campo === 'cnpj' ? mascararCnpj(e.target.value) : e.target.value;
    setConfig((c) => ({ ...c, organizacao: { ...c.organizacao, [campo]: valor } }));
    setErrosLocais((x) => ({ ...x, [campo]: undefined }));
  };
  const politica = (chave) => (valor) =>
    setConfig((c) => ({ ...c, politicas: { ...c.politicas, [chave]: valor } }));

  const enviar = async (e) => {
    e.preventDefault();
    const encontrados = validar(config.organizacao, REGRAS);
    setErrosLocais(encontrados);
    if (Object.keys(encontrados).length) {
      toast.erro('Revise os campos destacados.');
      return;
    }
    const salvo = await salvar.executar(config);
    if (!salvo) return;
    toast.sucesso('Configurações salvas.');
    onSalvo(salvo);
  };

  return (
    <form onSubmit={enviar} noValidate className="space-y-8 pb-24">
      <Card as="section" espacamento="lg" aria-labelledby="cfg-org" className="space-y-5">
        <div>
          <h2 id="cfg-org" className="text-lg font-semibold text-ink">
            Organização
          </h2>
          <p className="mt-1 text-sm text-muted">Aparece em certificados, relatórios e notas fiscais.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <CampoTexto
            rotulo="Nome fantasia"
            obrigatorio
            value={config.organizacao.nomeFantasia}
            onChange={org('nomeFantasia')}
            erro={erros.nomeFantasia}
          />
          <CampoTexto
            rotulo="Razão social"
            obrigatorio
            value={config.organizacao.razaoSocial}
            onChange={org('razaoSocial')}
            erro={erros.razaoSocial}
          />
          <CampoTexto
            rotulo="CNPJ"
            obrigatorio
            inputMode="numeric"
            placeholder="00.000.000/0000-00"
            value={config.organizacao.cnpj}
            onChange={org('cnpj')}
            erro={erros.cnpj}
          />
          <CampoTexto
            rotulo="E-mail para avisos do RH"
            obrigatorio
            type="email"
            value={config.organizacao.emailNotificacao}
            onChange={org('emailNotificacao')}
            erro={erros.emailNotificacao}
          />
          <CampoSelecao
            rotulo="Fuso horário"
            obrigatorio
            opcoes={FUSOS_HORARIOS}
            value={config.organizacao.fusoHorario}
            onChange={org('fusoHorario')}
            dica="Usado em prazos e relatórios."
          />
          <CampoTexto
            rotulo="Domínios de e-mail autorizados"
            value={config.organizacao.dominiosAutorizados}
            onChange={org('dominiosAutorizados')}
            dica="Separados por vírgula. Só esses e-mails podem entrar via SSO."
            placeholder="empresa.com, filial.empresa.com"
          />
        </div>
      </Card>

      {POLITICAS.map((grupo) => (
        <Card as="section" key={grupo.grupo} espacamento="lg" aria-label={grupo.grupo}>
          <h2 className="text-lg font-semibold text-ink">{grupo.grupo}</h2>
          <div className="mt-2 divide-y divide-line">
            {grupo.itens.map((item) => (
              <Switch
                key={item.chave}
                rotulo={item.titulo}
                descricao={item.descricao}
                ativo={config.politicas[item.chave]}
                onChange={politica(item.chave)}
                className="py-4"
              />
            ))}
          </div>
        </Card>
      ))}

      {/* Barra de ações fixa: sempre à vista em formulários longos. */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-bg/90 backdrop-blur-md lg:left-60">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <p className="text-sm text-muted" aria-live="polite">
            {alterado ? 'Você tem alterações não salvas.' : 'Tudo salvo.'}
          </p>
          <div className="flex gap-2">
            {alterado && (
              <Button variante="ghost" onClick={() => setDescartar(true)} disabled={salvar.executando}>
                Descartar
              </Button>
            )}
            <Button type="submit" disabled={!alterado} carregando={salvar.executando}>
              Salvar alterações
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        aberto={descartar}
        onFechar={() => setDescartar(false)}
        onConfirmar={() => {
          setConfig(inicial);
          setErrosLocais({});
          salvar.limpar();
          setDescartar(false);
        }}
        perigoso
        titulo="Descartar alterações?"
        descricao="Os campos voltam para os valores salvos por último."
        textoConfirmar="Descartar"
      />

      <ConfirmDialog
        aberto={bloqueio.state === 'blocked'}
        onFechar={() => bloqueio.reset?.()}
        onConfirmar={() => bloqueio.proceed?.()}
        perigoso
        titulo="Sair sem salvar?"
        descricao="Suas alterações nas configurações serão perdidas."
        textoConfirmar="Sair sem salvar"
        textoCancelar="Continuar editando"
      />
    </form>
  );
}

export default function Configuracoes() {
  const { dados, carregando, erro, recarregar, setDados } = useApi(getConfiguracoes);

  return (
    <Pagina
      titulo="Configurações"
      descricao="Dados da organização e regras de aprendizagem e segurança."
      largura="estreita"
    >
      {carregando ? (
        <SkeletonPagina variante="formulario" cabecalho={false} largura="max-w-3xl" />
      ) : erro ? (
        <ErroCarregamento erro={erro} onTentarNovamente={recarregar} />
      ) : (
        // `key` reinicia o formulário com os valores salvos após cada gravação.
        <Formulario key={JSON.stringify(dados)} inicial={dados} onSalvo={setDados} />
      )}
    </Pagina>
  );
}
