import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SearchX, X } from 'lucide-react';
import useApi from '../../../hooks/useApi';
import { useDebounce, useTituloPagina } from '../../../hooks/utilitarios';
import { listarAreas, listarCategorias, listarCursos } from '../../../services/api';
import { NIVEL_CURSO } from '../../../lib/rotulos';
import { plural } from '../../../lib/formatadores';
import { GradeCursos } from '../../../components/cursos/CursoCard';
import SegmentedControl from '../../../components/ui/SegmentedControl';
import Pagination from '../../../components/ui/Pagination';
import Button from '../../../components/ui/Button';
import { CampoSelecao, CampoTexto } from '../../../components/ui/Campo';
import { ErroCarregamento, SkeletonPagina, Vazio } from '../../../components/ui/Estados';

const POR_PAGINA = 9;
const OPCOES_NIVEL = [
  { valor: '', rotulo: 'Todos os níveis' },
  ...['iniciante', 'intermediario', 'avancado'].map((v) => ({ valor: v, rotulo: NIVEL_CURSO[v] })),
];

/**
 * Catálogo completo. Busca, categoria, nível, área e página ficam na URL
 * (?q=&categoria=&nivel=&area=&pagina=) — dá para compartilhar o link e
 * usar o "voltar" do navegador.
 */
export default function TodosCursos() {
  useTituloPagina('Explorar cursos');
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const categoria = params.get('categoria') ?? '';
  const nivel = params.get('nivel') ?? '';
  const area = params.get('area') ?? '';
  const pagina = Number(params.get('pagina')) || 1;

  const [termo, setTermo] = useState(q);
  const termoDebounced = useDebounce(termo, 350);
  // Se a URL mudar por fora (busca global, voltar do navegador), atualiza o campo.
  const [qAnterior, setQAnterior] = useState(q);
  if (q !== qAnterior) {
    setQAnterior(q);
    if (q !== termo.trim()) setTermo(q);
  }

  const atualizar = (mudancas) => {
    const proximo = new URLSearchParams(params);
    Object.entries(mudancas).forEach(([k, v]) => (v ? proximo.set(k, v) : proximo.delete(k)));
    if (!('pagina' in mudancas)) proximo.delete('pagina');
    setParams(proximo, { replace: !('pagina' in mudancas) });
  };

  // Aplica a busca digitada depois de uma pausa.
  useEffect(() => {
    if (termoDebounced.trim() !== q) atualizar({ q: termoDebounced.trim() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [termoDebounced]);

  const { dados: categorias } = useApi(listarCategorias);
  const { dados: areas } = useApi(listarAreas);
  const { dados, carregando, atualizando, erro, recarregar } = useApi(
    () => listarCursos({ q, categoria, nivel, area, pagina, porPagina: POR_PAGINA }),
    [q, categoria, nivel, area, pagina],
  );

  const areaAtual = areas?.find((a) => a.id === area);
  const temFiltro = Boolean(q || categoria || nivel || area);
  const limpar = () => {
    setTermo('');
    setParams({}, { replace: true });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
        <CampoTexto
          rotulo="Buscar no catálogo"
          rotuloOculto
          icone={Search}
          type="search"
          placeholder="Buscar por tema, curso ou instrutor"
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          className="flex-1"
        />
        <CampoSelecao
          rotulo="Nível"
          rotuloOculto
          opcoes={OPCOES_NIVEL}
          value={nivel}
          onChange={(e) => atualizar({ nivel: e.target.value })}
          className="lg:w-56"
        />
      </div>

      {categorias && (
        <SegmentedControl
          variante="chips"
          rotulo="Filtrar por categoria"
          opcoes={[
            { valor: '', rotulo: 'Todas' },
            ...categorias.map((c) => ({ valor: c.id, rotulo: c.nome })),
          ]}
          valor={categoria}
          onChange={(v) => atualizar({ categoria: v })}
        />
      )}

      <div className="flex flex-wrap items-center gap-3 border-b border-line pb-4">
        <p className="text-sm text-muted" aria-live="polite">
          {dados ? plural(dados.total, 'curso encontrado', 'cursos encontrados') : ' '}
        </p>
        {areaAtual && (
          <button
            type="button"
            onClick={() => atualizar({ area: '' })}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-sm font-medium text-primary hover:bg-primary/25"
          >
            Área: {areaAtual.nome}
            <X size={14} aria-hidden />
            <span className="sr-only">(remover filtro)</span>
          </button>
        )}
        {temFiltro && (
          <Button variante="link" tamanho="sm" onClick={limpar} className="ml-auto">
            Limpar filtros
          </Button>
        )}
      </div>

      {carregando ? (
        <SkeletonPagina cabecalho={false} largura="max-w-none" />
      ) : erro ? (
        <ErroCarregamento
          erro={erro}
          mensagem="Não foi possível carregar o catálogo."
          onTentarNovamente={recarregar}
        />
      ) : dados.itens.length === 0 ? (
        <Vazio
          icone={SearchX}
          titulo={q ? `Nenhum curso para “${q}”` : 'Nenhum curso com esses filtros'}
          descricao="Tente outras palavras ou remova algum filtro."
          acao={
            <Button variante="secondary" onClick={limpar}>
              Limpar filtros
            </Button>
          }
        />
      ) : (
        <div
          className={atualizando ? 'opacity-60 transition-opacity' : 'transition-opacity'}
          aria-busy={atualizando || undefined}
        >
          <GradeCursos cursos={dados.itens} nivelTitulo={2} />
          <Pagination
            className="mt-8"
            pagina={dados.pagina}
            totalPaginas={dados.totalPaginas}
            total={dados.total}
            porPagina={dados.porPagina}
            onChange={(p) => {
              atualizar({ pagina: p > 1 ? String(p) : '' });
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </div>
      )}
    </div>
  );
}
