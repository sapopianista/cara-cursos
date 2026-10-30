# Plano do backend — Cara Cursos (Java + JDBC + Servlets)

O frontend fala com a API por um único arquivo (`src/services/api.js`).
O contrato que o backend cumpre está em [`docs/API.md`](../docs/API.md).
Cada etapa termina com algo verificável; só avance quando o critério de "pronto" passar.

## Decisões de base

| Tema | Escolha | Motivo |
|---|---|---|
| Java / servidor | JDK 25 + **Tomcat 10.1** (produção) · Jetty 12 via Maven (desenvolvimento) | Java 25 é a LTS mais recente; Servlets 6 (`jakarta.servlet`) roda nos dois. |
| Build | **Maven** (`pom.xml`, `mvnw`) | Gera o `api.war` e baixa as dependências. |
| JSON | **Gson** | Única dependência além do driver. `null` é escrito; datas em ISO 8601 UTC. |
| Rotas | Um servlet (`ApiServlet`) + `Roteador` próprio | Evita dezenas de servlets e centraliza autenticação, permissão e erros. |
| Autenticação | Token opaco `Bearer`; banco guarda só o SHA-256 (tabela `sessoes`) | É o que o frontend já envia. Logout e desativação revogam o token. |
| Senhas | PBKDF2-SHA256, 600 mil iterações (`javax.crypto`) | Sem bibliotecas; tempo de resposta igual para e-mail inexistente. |
| Datas | `DATETIME` em UTC (`connectionTimeZone=UTC`) | O frontend formata no fuso do navegador. |
| CORS | Não precisa | O Vite encaminha `/api` para `localhost:8080`; em produção, mesmo domínio. |

## Etapa 0 — Ambiente ✅

- [x] Script `sql/cara_cursos.sql` (esquema + dados de teste gerados a partir do mock do frontend).
- [x] Driver `mysql-connector-j 9.1.0`, Gson e JUnit no `pom.xml`.
- [x] Script validado num MySQL 8.0.46 real.
- [ ] **Pendente (você):** executar o script no seu MySQL e configurar `DB_USUARIO`/`DB_SENHA`.
- [ ] **Pendente (você):** instalar o JDK 25 (o atalho `C:\Program Files\Java\latest\jdk-25` aponta para uma pasta que não existe).

## Etapa 1 — Camada de dados ✅

- Modelos `Usuario`, `Curso`, `Matricula` (classes com getters/setters) + records para respostas menores.
- DAOs: `UsuarioDAO`, `SessaoDAO`, `CursoDAO`, `AulaDAO`, `MatriculaDAO`, `AtividadeDAO`, `TrilhaDAO`,
  `CertificadoDAO`, `NotificacaoDAO`, `ColaboradorDAO`.
- Sempre `PreparedStatement`, try-with-resources e colunas explícitas; `LIKE` com `%`/`_` escapados.
- E-mail duplicado (`SQLIntegrityConstraintViolationException`) vira `422` com `campos.email`.

## Etapa 2 — Infraestrutura HTTP ✅

- `Api` processa a requisição inteira sem depender de Servlets (os testes chamam direto); `ApiServlet` só adapta.
- `ApiException` → `{ mensagem, codigo, campos }`; erro inesperado → 500 genérico, stack trace só no log.
- `Pagina` → `{ itens, total, pagina, porPagina, totalPaginas }`, com a página corrigida para a faixa válida.
- `GET /api/saude` → `{"status":"ok"}`; rota inexistente → 404 JSON; método errado → 405 JSON.

## Etapa 3 — Autenticação ✅

- `POST /auth/login`, `GET /auth/me`, `POST /auth/logout`.
- "Manter conectado" = sessão de 30 dias; sem ele, 12 horas.
- Permissões por `tipo_perfil` (`Permissao`), iguais ao `PERMISSOES` do frontend; 403 quando faltar.
- Conta inativa → 403; convite pendente (sem senha) → 401.

## Etapa 4 — Endpoints ✅

Escopo decidido para esta fase (tudo que o aluno usa e o núcleo do painel):

| Módulo | Endpoints | Estado |
|---|---|---|
| Autenticação | `/auth/*` | ✅ backend |
| Catálogo | `/cursos`, `/cursos/{id}`, `/cursos/categorias`, `/cursos/destaques`, `/areas` | ✅ backend |
| Trilhas | `/trilhas`, `/trilhas/{id}` | ✅ backend |
| Sala de aula | `/cursos/{id}/sala`, progresso e conclusão de aula, `/atividades/{id}/entregas` | ✅ backend |
| Aluno | `/alunos/me/inicio`, `progresso`, `perfil`, `preferencias`, `recomendacoes` | ✅ backend |
| Certificados | emitidos ao concluir curso/nível; `/certificados/{id}/arquivo` gera o PDF | ✅ backend |
| Notificações | `/notificacoes` (+ leitura) | ✅ backend |
| Colaboradores | `/admin/colaboradores/*` (CRUD, status, licenças, progresso, CSV) | ✅ backend |
| Visão geral | `/admin/dashboard` | ✅ backend |
| Suporte, Gestores, Relatórios, Faturamento, Configurações | — | ⏳ mock (Etapa 7) |

**Pronto:** os 32 testes passam (`mvnw test -DDB_TESTE_URL=jdbc:mysql://127.0.0.1:3306/`) e o frontend
funciona com `VITE_USAR_MOCK=false`.

## Etapa 5 — Escopo do frontend com o banco ✅

- `src/services/api.js` tem `MODULOS_SO_NO_MOCK`: esses módulos continuam simulados mesmo com o mock desligado.
  Quando o backend entregar um, basta tirá-lo da lista.
- Ajustes no frontend: login só por e-mail (não há CPF no banco); "Próximos passos" some quando a API manda
  `continuidade: null`.

## Etapa 6 — Qualidade e entrega (parcial)

- [x] Testes JUnit 5: unitários (senhas, tokens, JSON, paginação, CSV, PDF, roteador) e de integração
  (API inteira contra MySQL, numa base separada `cara_cursos_teste`, recriada a cada classe).
- [x] Logs com `java.util.logging`; senhas e tokens nunca são registrados.
- [x] `README.md` do backend.
- [ ] Pool de conexões (JNDI do Tomcat / `context.xml`) em vez de `DriverManager` por requisição.
- [ ] Limite de tentativas de login (por e-mail/IP) contra força bruta.

## Etapa 7 — Próxima fase: módulos que ficaram no mock

Ficaram de fora porque dependem de serviços externos ou de regras que ainda não existem no banco:

1. **Convite de colaboradores** — e-mail com link para definir a senha (hoje o cadastro fica `pendente`
   e não consegue entrar). Precisa de SMTP.
2. **Gestores e permissões** — já é só `usuarios.tipo_perfil` + uma tabela `auditoria`; é o mais barato.
3. **Suporte** — tabelas `chamados` e `faq`.
4. **Relatórios** — geração assíncrona de arquivos (fila + armazenamento).
5. **Configurações** — tabela `empresa` já existe; faltam colunas de políticas e validação de CNPJ no Java.
6. **Faturamento** — depende do sistema de cobrança/notas fiscais.

## Pendências e riscos

- **Senha do MySQL:** o servidor local recusa `root` sem senha; é preciso informá-la (via `DB_SENHA`).
- **Satisfação no painel:** sem avaliações dos alunos, usa a nota média dos cursos em uso.
- **Materiais de apoio:** os dados de teste não têm arquivo (`url` nula); o frontend mostra "Arquivo indisponível".
