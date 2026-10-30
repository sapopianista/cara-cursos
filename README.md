# Cara Cursos — Front-end

Plataforma de educação corporativa: área do aluno (cursos, trilhas, sala de aula, progresso) e painel da empresa
(colaboradores, relatórios, gestores, faturamento, configurações).

React 19 · React Router 7 · Tailwind CSS 3 · Lucide · Vite. Testes com Vitest + Testing Library + axe.

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # gera dist/
npm test             # testes (unitários, componentes, fluxos e acessibilidade)
npm run lint         # ESLint
npm run format       # Prettier
```

## Rodando sem backend (modo demonstração)

Com `VITE_USAR_MOCK=true` (padrão), todas as chamadas vão para `src/services/mock/`, um "banco" em memória com o
**mesmo formato** que a API real deve devolver. Criar, editar e excluir funciona durante a sessão (recarregar a
página restaura os dados).

No login aparecem as contas de demonstração (qualquer senha com 6+ caracteres):

| E-mail                    | Perfil                                       |
| ------------------------- | -------------------------------------------- |
| `tiago.vieira@oscorp.com` | Administrador — área do aluno + painel da empresa |
| `ana.silveira@oscorp.com` | Colaboradora — somente área do aluno         |

Os vídeos das aulas usam um arquivo de demonstração de domínio público. Downloads (certificados, notas fiscais,
relatórios, materiais) aparecem como "Arquivo indisponível" porque o mock não gera arquivos — com a API real,
basta ela enviar a `url` do arquivo.

## Conectando o backend Java

O backend fica em **[backend/](backend/README.md)** e requer **JDK 25**, a versão LTS mais recente, e MySQL 8.
O Maven vem junto (`backend/mvnw.cmd`). O WAR continua compatível com Tomcat 10.1.

1. Crie a base com `backend/sql/cara_cursos.sql` e suba a API: `cd backend && .\mvnw.cmd jetty:run`
   (detalhes em [backend/README.md](backend/README.md)).
2. `cp .env.example .env` e defina `VITE_USAR_MOCK=false`.
3. Em desenvolvimento, `/api` é redirecionado para `http://localhost:8080` (ver `vite.config.js`). Em produção,
   defina `VITE_API_URL` com a URL pública da API.

Os módulos que o backend ainda não implementa (suporte, gestores, relatórios, faturamento e configurações)
estão em `MODULOS_SO_NO_MOCK` (`src/services/api.js`) e continuam simulados mesmo com o mock desligado.
O contrato completo dos endpoints está em **[docs/API.md](docs/API.md)**.

Convenções esperadas do backend (detalhes em `docs/API.md`):

- Autenticação por **Bearer token** (`Authorization: Bearer …`). Resposta `401` encerra a sessão no front.
- Datas em **ISO 8601**, durações em minutos/segundos, dinheiro em **centavos** (inteiro), enums em minúsculas.
- Listas paginadas: `{ itens, total, pagina, porPagina, totalPaginas }`.
- Erros: `{ "mensagem": "...", "codigo": "...", "campos": { "email": "..." } }` — `campos` aparece embaixo de cada
  campo do formulário.

## Estrutura

```
src/
├── main.jsx                 # roteador + provedores (tema, toasts, sessão)
├── App.jsx                  # tabela de rotas (lazy por tela, proteção, redirecionamentos)
├── index.css                # tokens de cor (dark/light) e utilitários (skeleton, card interativo, tabela responsiva)
├── config/
│   ├── ambiente.js          # variáveis de ambiente (único lugar que lê import.meta.env)
│   └── navigation.js        # menus do aluno e do painel (com permissões)
├── context/                 # AuthContext (sessão/permissões), TemaContext, ToastContext
├── hooks/                   # useApi (carregar), useMutacao (enviar), utilitários (debounce, título, popover…)
├── services/
│   ├── api.js               # ÚNICO ponto que fala com o backend (cada função = 1 endpoint)
│   ├── http.js              # fetch com token, timeout, erros tipados (ErroApi) e download de arquivos
│   └── mock/                # db.js (dados) + handlers.js (implementação simulada dos endpoints)
├── lib/                     # formatadores (moeda, datas…), validação, rótulos/vocabulário, CSV
├── components/
│   ├── ui/                  # design system: Button, Campo*, Switch, Badge, Card, Modal, ConfirmDialog,
│   │                        #   DataTable, Pagination, MenuAcoes, Accordion, StatCard, Pagina/Secao, Estados…
│   ├── layout/              # AppLayout, Sidebar, TopNavigation, Notificacoes, UserMenu, Rotas (guardas)
│   ├── cursos/              # CursoCard (card único de curso)
│   ├── atividades/          # AtividadeCard (entrega de atividade)
│   ├── sala/                # PlayerAula
│   └── suporte/             # CentralSuporte (aluno e gestor)
├── pages/
│   ├── aluno/               # Inicio, explorar/*, Trilhas, Trilha, SalaDeAula, MeuProgresso, Perfil, Suporte
│   ├── admin/               # VisaoGeral, Colaboradores, Relatorios, Gestores, Faturamento, Configuracoes, Ajuda
│   ├── Login.jsx
│   └── NaoEncontrada.jsx
└── test/                    # setup, utilitários e testes de fluxo
```

### Criando uma tela nova

1. Endpoint em `services/api.js` (+ implementação em `services/mock/handlers.js`).
2. Página em `pages/…` usando `<Pagina>`, `useApi` e os componentes de `components/ui`.
3. `<Route>` em `App.jsx` (com `RotaPermissao` se for do painel) e item em `config/navigation.js`.

## Padrões de interface

- **Carregamento:** `useApi` diferencia `carregando` (primeira vez → skeleton) de `atualizando` (troca de filtro →
  conteúdo esmaecido, sem piscar a tela).
- **Feedback:** sucesso e erro de ações vão para **toasts** (`useToast`); erros de validação ficam no campo.
- **Ações destrutivas** (desativar, revogar, descartar) sempre passam por `ConfirmDialog`.
- **Vocabulário:** textos de status e chamadas de ação ficam em `lib/rotulos.js` (Começar → Continuar → Revisar).
- **Tema:** cores são CSS variables em `index.css`, mapeadas no `tailwind.config.js` (`bg-surface`, `text-muted`,
  `bg-primary`…). Para ajustar a paleta, edite só as variáveis.
- **Acessibilidade:** foco visível, navegação por teclado (menus, modais com foco preso, abas), rótulos ligados aos
  campos, `prefers-reduced-motion` respeitado. Os testes rodam o axe nas telas principais.
