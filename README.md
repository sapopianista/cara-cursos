# Cara Cursos — Front-end

React + Tailwind CSS (v3) + Lucide React + React Router. Dark Mode por padrão (com alternância para tema claro).

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
```

## Estrutura de pastas

```
src/
├── main.jsx                  # entry point (BrowserRouter)
├── App.jsx                   # tabela de rotas
├── index.css                 # tokens de cor (dark/light) + base Tailwind
├── config/
│   └── navigation.js         # itens dos menus laterais (aluno e RH)
├── components/
│   ├── layout/               # AppLayout, Sidebar, TopNavigation, UserMenu, ThemeToggle, Logo
│   ├── ui/                   # genéricos: Card, ProgressBar, DonutChart, Badge, Thumbnail, SectionHeader
│   └── dashboard/            # específicos do Dashboard do Aluno
├── pages/                    # uma por rota (DashboardAluno, EmConstrucao...)
├── hooks/                    # useApi (loading/erro), useTheme
├── services/api.js           # ÚNICO ponto que fala com o backend (mock <-> fetch)
├── data/                     # mock data (mesmo JSON que o Java deve devolver)
└── lib/                      # cn(), mapa de ícones/cores
```

Telas futuras seguem o mesmo padrão: `pages/X.jsx` + `components/x/` + `data/x.js` + função em `services/api.js` + `<Route>` em `App.jsx`.

## Integrando com o backend Java/JDBC

1. `cp .env.example .env` e defina `VITE_USAR_MOCK=false` (e `VITE_API_URL`).
2. Implemente `GET /api/alunos/me/dashboard` devolvendo o JSON de `src/data/dashboardAluno.js`.
3. Endpoints já previstos em `services/api.js`:
   - `POST /api/atividades/{id}/entregas`
   - `POST /api/cursos/{id}/favoritos`

Nenhum componente precisa ser alterado: eles só recebem props.

## Tema

As cores são CSS variables (`src/index.css`) mapeadas em `tailwind.config.js`
(`bg-surface`, `text-muted`, `bg-primary`, `text-accent`...). Para ajustar a paleta, edite apenas as variáveis.
