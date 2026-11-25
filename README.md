# Cara Cursos

Plataforma de educação corporativa composta por **área do aluno** (catálogo de cursos, trilhas de carreira, sala de aula, atividades, progresso e certificados) e **painel da empresa** (visão geral, colaboradores, gestores, relatórios, faturamento, suporte e configurações).

## Tecnologias

- **Frontend:** React 19, React Router 7, Tailwind CSS 3, Lucide, Vite · Testes com Vitest, Testing Library e axe-core.
- **Backend:** Java 21+, Jakarta Servlet 6, JDBC, Gson, MySQL 8 · Testes com JUnit 5 e servidor de desenvolvimento Jetty 12 (deploy via WAR em Tomcat 10.1+).

---

## Como executar

Você pode rodar o projeto **apenas no modo demonstração** (sem banco de dados) ou **integrado ao backend Java + MySQL**.

### Opção 1: Modo demonstração (apenas frontend)

Por padrão (`VITE_USAR_MOCK=true`), o frontend utiliza um banco em memória (`src/services/mock/`) com os mesmos formatos da API real. Alterações funcionam durante a sessão e são restauradas ao recarregar a página.

```bash
npm install
npm run dev
```

Acesse `http://localhost:5173`. Na tela de login, utilize qualquer uma das contas de demonstração (qualquer senha com 6+ caracteres):

| E-mail                    | Perfil                                            |
| ------------------------- | ------------------------------------------------- |
| `tiago.vieira@oscorp.com` | Administrador — área do aluno + painel da empresa |
| `ana.silveira@oscorp.com` | Colaboradora — somente área do aluno              |

### Opção 2: Aplicação completa (frontend + backend Java + MySQL)

**Pré-requisitos:** Node.js, JDK 21+ e MySQL 8.0.19+.

1. **Crie a base de dados** executando o script `backend/sql/cara_cursos.sql` no MySQL.
2. **Suba a API Java** (na pasta `backend/`):

   ```powershell
   cd backend
   .\mvnw.cmd jetty:run
   ```

   > Em Linux/macOS, use `./mvnw jetty:run`. Para configurar usuário/senha do MySQL (`DB_URL`, `DB_USUARIO`, `DB_SENHA`) ou gerar o WAR para Tomcat, consulte [backend/README.md](backend/README.md).

3. **Desative o mock no frontend** (na pasta raiz):

   ```bash
   cp .env.example .env
   ```

   Edite o `.env` e altere para `VITE_USAR_MOCK=false`.

4. **Inicie o frontend:**

   ```bash
   npm install
   npm run dev
   ```

   Em desenvolvimento, o Vite redireciona automaticamente `/api` para `http://localhost:8080` (`vite.config.js`). Em produção, defina `VITE_API_URL` com a URL pública da API.

**Contas de teste no banco** (senha padrão: `demo1234`):

| E-mail                           | Papel                                     |
| -------------------------------- | ----------------------------------------- |
| `tiago.vieira@oscorp.com`        | `admin` (área do aluno + painel completo) |
| `beatriz.albuquerque@oscorp.com` | `rh`                                      |
| `juliana.mendonca@oscorp.com`    | `lider`                                   |
| `ana.silveira@oscorp.com`        | `colaborador` (somente área do aluno)     |

---

## Scripts e testes

### Frontend (raiz do projeto)

```bash
npm run dev           # servidor de desenvolvimento (http://localhost:5173)
npm run build         # build de produção em dist/
npm test              # testes automatizados (unitários, componentes, fluxos e acessibilidade)
npm run lint          # verificação com ESLint
npm run format:check  # verificação de formatação com Prettier
```

### Backend (pasta `backend/`)

```powershell
.\mvnw.cmd test                                                                              # testes unitários
.\mvnw.cmd test "-DDB_TESTE_URL=jdbc:mysql://127.0.0.1:3306/" "-DDB_TESTE_SENHA=sua-senha"   # unitários + integração (usa base cara_cursos_teste)
.\mvnw.cmd package                                                                           # gera target/api.war para produção
```

---

## Estrutura do projeto

```text
cara-cursos/
├── src/
│   ├── components/    # design system (ui/), layout/, cursos/, atividades/, sala/, suporte/
│   ├── config/        # leitura de variáveis de ambiente e menus de navegação
│   ├── context/       # sessão/permissões (AuthContext), tema e toasts
│   ├── hooks/         # useApi, useMutacao e utilitários
│   ├── lib/           # formatadores, validação, rótulos e download
│   ├── pages/         # telas do aluno (aluno/), painel (admin/), Login e TrocarSenha
│   ├── services/      # api.js (ponto único de comunicação), http.js e mock/
│   └── test/          # configuração e testes de fluxo
├── backend/
│   ├── sql/           # cara_cursos.sql (esquema e massa inicial)
│   └── src/main/java/br/com/caracursos/
│       ├── cliente/       # cliente console de demonstração
│       ├── concorrencia/  # controle de licenças e simulador de onboarding
│       ├── dao/           # acesso ao banco via JDBC
│       ├── demo/          # demonstrações de concorrência e sockets TCP
│       ├── http/          # Api, ApiServlet, Roteador, Requisicao, Json, ApiException
│       ├── integracao/    # cliente de consulta de CNPJ
│       ├── model/         # entidades e DTOs
│       ├── recursos/      # endpoints REST por módulo
│       ├── relatorios/    # geração de relatórios (CSV e PDF)
│       ├── seguranca/     # PBKDF2, tokens Bearer, permissões e limite de login
│       ├── service/       # regras de negócio e controle transacional
│       └── util/          # utilitários (PDF, CSV, CNPJ, e-mail, relógio)
├── docs/
│   └── API.md         # contrato completo dos endpoints REST
└── .env.example       # modelo de variáveis de ambiente do frontend
```

## Documentação complementar

- **Contrato da API REST:** [docs/API.md](docs/API.md)
- **Guia do Backend e Deploy:** [backend/README.md](backend/README.md)
