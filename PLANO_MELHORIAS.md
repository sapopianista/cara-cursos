# Relatório de Diagnóstico Arquitetural e Plano de Melhorias — Cara Cursos

> **Escopo da Revisão:** Frontend (React 19 + Tailwind CSS + Vite) & Backend (Java 21 + Jakarta Servlet 6 + JDBC + MySQL 8 + Gson)  
> **Papel:** Arquiteto de Software Sênior  
> **Status:** Diagnóstico concluído (nenhum arquivo de código-fonte foi alterado nesta etapa)

---

## Visão Geral do Diagnóstico

O projeto **Cara Cursos** apresenta uma base funcional coesa, boa cobertura de testes de integração (`JUnit 5` no backend e `Vitest` no frontend) e um roteador HTTP enxuto que desacopla o processamento da API de `jakarta.servlet` (`Api` vs. `ApiServlet`). Não há vazamento de SQL dentro do `ApiServlet` nem nas classes de `recursos`.

Contudo, sob a ótica de arquitetura corporativa, escalabilidade e manutenção, foram identificados **problemas estruturais importantes** distribuídos nos 4 pilares analisados:
1. **Acoplamento entre camadas e ausência de camada de Serviço (`service`)**, com regras de negócio divididas entre classes HTTP (`recursos`) e classes de persistência (`dao`), além de dependência invertida (`dao` importando classes de `http`).
2. **Gargalos severos de performance e segurança em JDBC**, destacando-se a ausência de pool de conexões (`DriverManager` por requisição), execução de hashing pesado (`PBKDF2` com 600.000 iterações) **dentro de transações abertas**, risco de *Statement leak* em exceções de runtime e queries N+1.
3. **Ausência total de suporte a CORS e Preflight (`OPTIONS` retorna 405)** no `ApiServlet`/`Roteador` e divergências pontuais de contrato JSON entre o backend Java, o mock do React e a especificação `docs/API.md`.
4. **Funcionalidades salvas mas não aplicadas** (políticas de aprendizagem, fuso horário da empresa, domínios de e-mail autorizados, materiais de apoio e aulas de avaliação) e duplicação de responsabilidades entre DAOs.

---

## Pilar 1 — Orientação a Objetos e Camadas Java

### `[BACK-01]` Ausência de Camada de Serviço (`service`) e Regras de Negócio nos Recursos HTTP — ✅ Concluído
- **Prioridade:** Alta
- **Diagnóstico:** Não existe um pacote `br.com.caracursos.service`. Apenas `Aprendizagem.java` isola uma regra de domínio, mas está declarada como *package-private* dentro do pacote `recursos` e recebe `java.sql.Connection` diretamente. Todas as demais regras de negócio e orquestrações transacionais (`req.transacao(c -> ...)`) estão espalhadas nas classes de roteamento HTTP (`*Recurso`):
  - Cálculo de desbloqueio sequencial de níveis de carreira e estimativa de minutos restantes em `AlunoRecurso.progresso()`.
  - Algoritmo de recomendação de cursos por departamento e continuidade em `AlunoRecurso.recomendacoes()`.
  - Controle de limite de licenças contratadas vs. em uso em `ColaboradorRecurso.criar()` e `alterarStatus()`.
  - Proteção contra remoção/rebaixamento do último administrador ativo (`contarAdminsAtivosTravando() <= 1`) em `GestorRecurso`.
  - Cálculo de turnos e algoritmo de arredondamento por maiores restos (`percentuaisQueSomam100`) em `DashboardRecurso`.
  - Cálculo do próximo vencimento (dia 15) e limite máximo de licenças (`MAX_TOTAL = 10_000`) em `FaturamentoRecurso`.
- **Recomendação:** Extrair a lógica de negócio e o controle transacional das classes `*Recurso` para classes de serviço dedicadas em `br.com.caracursos.service`, deixando `*Recurso` responsáveis exclusivamente por ler dados da `Requisicao` e devolver objetos de resposta.
- **Arquivos afetados:**
  - `backend/src/main/java/br/com/caracursos/recursos/Aprendizagem.java`
  - `backend/src/main/java/br/com/caracursos/recursos/AlunoRecurso.java`
  - `backend/src/main/java/br/com/caracursos/recursos/ColaboradorRecurso.java`
  - `backend/src/main/java/br/com/caracursos/recursos/GestorRecurso.java`
  - `backend/src/main/java/br/com/caracursos/recursos/DashboardRecurso.java`
  - `backend/src/main/java/br/com/caracursos/recursos/FaturamentoRecurso.java`
  - `backend/src/main/java/br/com/caracursos/recursos/SalaRecurso.java`

### `[BACK-02]` Inversão de Dependência: Camada `dao` Importando Classes da Camada `http` — ✅ Concluído
- **Prioridade:** Alta
- **Diagnóstico:** A camada de persistência (`br.com.caracursos.dao`) importa e depende diretamente de classes da camada de transporte HTTP (`br.com.caracursos.http.Pagina` e `br.com.caracursos.http.Json`).
  - `CursoDAO` e `ColaboradorDAO` importam `br.com.caracursos.http.Pagina` para calcular `LIMIT`/`OFFSET` e retornar resultados paginados.
  - `CursoDAO.areas()` e `TrilhaDAO.niveis()`/`consultar()` importam `br.com.caracursos.http.Json` para desserializar colunas JSON do MySQL (`Json.listaDeTexto(...)`).
- **Recomendação:** Mover `Pagina` para `br.com.caracursos.model` (ou `util`) e mover o utilitário de leitura de listas JSON para `util`, eliminando qualquer import de `br.com.caracursos.http.*` dentro de `br.com.caracursos.dao`.
- **Arquivos afetados:**
  - `backend/src/main/java/br/com/caracursos/dao/CursoDAO.java`
  - `backend/src/main/java/br/com/caracursos/dao/ColaboradorDAO.java`
  - `backend/src/main/java/br/com/caracursos/dao/TrilhaDAO.java`
  - `backend/src/main/java/br/com/caracursos/http/Pagina.java`
  - `backend/src/main/java/br/com/caracursos/http/Json.java`

### `[BACK-03]` Vazamento de Regras de Negócio e Rotas HTTP para dentro dos DAOs — ✅ Concluído
- **Prioridade:** Alta
- **Diagnóstico:** Diversos DAOs contêm regras de negócio ou detalhes da camada de apresentação/HTTP:
  1. `CertificadoDAO.mapear()` (linha 106) constrói uma rota da API REST hardcoded (`"/certificados/" + id + "/arquivo"`) e `CertificadoDAO.novoCodigo()` gera o código verificador (`CC-XXXX-YYY`) e trata retentativas de colisão dentro do DAO.
  2. `UsuarioDAO.inserir()` (linhas 61–66) formata a regra de negócio da matrícula (`String.format("COL-%04d", u.getId())`) e executa um `UPDATE` adicional após o `INSERT` sem garantir escopo transacional próprio.
  3. `GestorDAO` define a regra de negócio de quando um convite é considerado aceito (`ACEITO = "(u.ultimo_acesso IS NOT NULL AND u.ultimo_acesso >= g.convidado_em)"`) e executa múltiplas mutações (`INSERT`/`DELETE` em `gestores` + `UPDATE` em `usuarios`) nos métodos `inserir()` e `remover()`.
  4. `FaturamentoDAO` embute a regra de transição de status de fatura para `"vencida"` na query SQL (`IF(status = 'aberta' AND DATE(vencimento) < UTC_DATE(), 'vencida', status)`).
- **Recomendação:** Restringir os DAOs a operações de persistência e consultas parametrizadas, movendo a geração de códigos de matrícula/certificados, montagem de URLs de download e regras de negócio para a camada de domínio/serviço.
- **Arquivos afetados:**
  - `backend/src/main/java/br/com/caracursos/dao/CertificadoDAO.java`
  - `backend/src/main/java/br/com/caracursos/dao/UsuarioDAO.java`
  - `backend/src/main/java/br/com/caracursos/dao/GestorDAO.java`
  - `backend/src/main/java/br/com/caracursos/dao/FaturamentoDAO.java`

### `[BACK-04]` Modelos de Domínio e DTOs Acoplados Internamente às Classes DAO — ✅ Concluído
- **Prioridade:** Média
- **Diagnóstico:** O pacote `br.com.caracursos.model` possui apenas 4 classes (`Usuario`, `Curso`, `Matricula`, `CursoResumo`). Todas as demais entidades e DTOs do sistema (`Aula`, `Continuacao`, `Atividade`, `Trilha`, `Nivel`, `Certificado`, `Notificacao`, `Colaborador`, `Gestor`, `Registro` de auditoria, `Configuracoes`, `Organizacao`, `Politicas`, `Contrato`, `Fatura`, `Chamado`, `Pergunta`, `Gerado`) estão declaradas como `public record` aninhados dentro dos respectivos DAOs, obrigando as camadas superiores e utilitários (como `CertificadoPdf`) a importar classes do pacote `dao` apenas para referenciar tipos de dados.
- **Recomendação:** Extrair as entidades e records de domínio/DTOs dos DAOs para o pacote `br.com.caracursos.model` (ou `br.com.caracursos.dto`).
- **Arquivos afetados:**
  - `backend/src/main/java/br/com/caracursos/model/`
  - `backend/src/main/java/br/com/caracursos/dao/AtividadeDAO.java`
  - `backend/src/main/java/br/com/caracursos/dao/AuditoriaDAO.java`
  - `backend/src/main/java/br/com/caracursos/dao/AulaDAO.java`
  - `backend/src/main/java/br/com/caracursos/dao/CertificadoDAO.java`
  - `backend/src/main/java/br/com/caracursos/dao/ColaboradorDAO.java`
  - `backend/src/main/java/br/com/caracursos/dao/EmpresaDAO.java`
  - `backend/src/main/java/br/com/caracursos/dao/FaturamentoDAO.java`
  - `backend/src/main/java/br/com/caracursos/dao/GestorDAO.java`
  - `backend/src/main/java/br/com/caracursos/dao/NotificacaoDAO.java`
  - `backend/src/main/java/br/com/caracursos/dao/RelatorioDAO.java`
  - `backend/src/main/java/br/com/caracursos/dao/SuporteDAO.java`
  - `backend/src/main/java/br/com/caracursos/dao/TrilhaDAO.java`
  - `backend/src/main/java/br/com/caracursos/util/CertificadoPdf.java`

### `[BACK-05]` Acoplamento de Gerenciamento de Conexão JDBC e Transação na Classe `Requisicao` (Camada HTTP) — ✅ Concluído
- **Prioridade:** Média
- **Diagnóstico:** A classe `br.com.caracursos.http.Requisicao` acumula responsabilidades de parsing HTTP (path variables, query params, body JSON), contexto de autenticação (`usuario`, `token`) e gerenciamento de ciclo de vida de `java.sql.Connection` e transações (`conexao()`, `transacao()`, `close()`). Além disso, em `Requisicao.transacao()`, caso `c.rollback()` ou `c.setAutoCommit(true)` lancem `SQLException` no bloco `catch`/`finally`, a exceção original que causou o aborto da transação será mascarada (perdida) se não for tratada com `addSuppressed`.
- **Recomendação:** Isolar o gerenciamento de unidade de trabalho/transação em um componente de infraestrutura/persistência e proteger o `rollback()`/`setAutoCommit(true)` com `try/catch` usando `e.addSuppressed(...)`.
- **Arquivos afetados:**
  - `backend/src/main/java/br/com/caracursos/http/Requisicao.java`
  - `backend/src/main/java/br/com/caracursos/http/Api.java`

### `[BACK-06]` Uso de `ApiException` e Vazamento de `SQLException` / `SQLIntegrityConstraintViolationException` para a Camada HTTP — ✅ Concluído
- **Prioridade:** Média
- **Diagnóstico:**
  1. `ApiException` reside em `br.com.caracursos.http` e carrega códigos de status HTTP (`400`, `401`, `403`, `404`, `409`, `422`, `429`), misturando exceções de protocolo HTTP (ex.: 405 rota não suporta método, 400 JSON malformado) com exceções de regras de negócio.
  2. Todos os métodos dos DAOs declaram `throws SQLException`, vazando exceções de infraestrutura JDBC para as classes `*Recurso`. Em `ColaboradorRecurso.criar()` (linha 148) e `atualizar()` (linha 170), a classe de recurso HTTP captura diretamente `java.sql.SQLIntegrityConstraintViolationException` para transformá-la em erro de validação `422`.
- **Recomendação:** Encapsular erros de integridade/persistência nos DAOs ou na camada de serviço e separar exceções de domínio do transporte HTTP.
- **Arquivos afetados:**
  - `backend/src/main/java/br/com/caracursos/http/ApiException.java`
  - `backend/src/main/java/br/com/caracursos/recursos/ColaboradorRecurso.java`
  - `backend/src/main/java/br/com/caracursos/dao/UsuarioDAO.java`

### `[BACK-07]` Encapsulamento, Igualdade de Entidades (`Curso`) e Risco de Serialização de Senha em `Usuario` — ✅ Concluído
- **Prioridade:** Baixa
- **Diagnóstico:**
  1. Em `Curso.java`: o campo `id` é primitivo (`int id`, iniciando em `0`) e `equals(Object)` compara `c.id == id` sem checar se o curso já foi persistido (`id != 0`), ao contrário de `Usuario.java` e `Matricula.java` que usam `Integer id` e verificam `id != null`. Além disso, `Curso` inicializa `progresso = 0` mas `status = null` até que `setProgresso(...)` seja invocado.
  2. Em `Usuario.java`: o campo `senha` (hash PBKDF2) não é marcado como `transient` nem possui proteção no `Gson`. Se qualquer rota retornar acidentalmente a instância de `Usuario` (em vez de chamar `AuthRecurso.usuarioJson`), o hash da senha será exposto no JSON da resposta.
- **Recomendação:** Padronizar `id` e `status = "nao_iniciado"` em `Curso.java`, e marcar `senha` como `transient` (ou usar anotação/exclusão no `Json.java`) em `Usuario.java`.
- **Arquivos afetados:**
  - `backend/src/main/java/br/com/caracursos/model/Curso.java`
  - `backend/src/main/java/br/com/caracursos/model/Usuario.java`
  - `backend/src/main/java/br/com/caracursos/http/Json.java`

---

## Pilar 2 — Segurança e Performance JDBC

### `[JDBC-01]` Ausência de Pool de Conexões (`DriverManager` por Requisição) — ✅ Concluído
- **Prioridade:** Alta
- **Diagnóstico:** `ConexaoFactory.getConexao()` chama `DriverManager.getConnection(URL, USUARIO, SENHA)` a cada requisição HTTP. Abrir e fechar uma conexão física TCP + autenticação MySQL por requisição adiciona alta latência e, sob picos de tráfego, esgota rapidamente o limite de conexões (`max_connections`) do MySQL.
- **Recomendação:** Substituir `DriverManager.getConnection` por um pool de conexões leve (como **HikariCP** ou DataSource JNDI do Tomcat configurado via `META-INF/context.xml`), mantendo a mesma interface pública `ConexaoFactory.getConexao()` para que o `close()` nos blocos `try-with-resources` apenas devolva a conexão ao pool.
- **Arquivos afetados:**
  - `backend/pom.xml`
  - `backend/src/main/java/br/com/caracursos/dao/ConexaoFactory.java`
  - `backend/PLANO.md`

### `[JDBC-02]` Execução de Hashing Pesado (`PBKDF2` 600.000 iterações) Dentro de Transações JDBC Abertas — ✅ Concluído
- **Prioridade:** Alta
- **Diagnóstico:** `Senhas.gerar(senha)` executa 600.000 iterações de `PBKDF2WithHmacSHA256` (operação intensiva de CPU que leva centenas de milissegundos). Em `ColaboradorRecurso.criar()` (linhas 134–146) e `ColaboradorRecurso.redefinirSenha()` (linhas 220–225), `Senhas.gerar(senha)` é executado **dentro** do bloco `req.transacao(c -> ...)`, mantendo a conexão com `autoCommit = false` e eventuais locks de linha/tabela ativos no MySQL durante todo o processamento criptográfico na JVM. Além disso, em `AuthRecurso.entrar()`, `req.conexao()` é aberta antes de `Senhas.verificar(...)`.
- **Recomendação:** Calcular `String hash = Senhas.gerar(senha)` **antes** de abrir `req.transacao(...)` em `ColaboradorRecurso`, e fechar/liberar conexões antes de tarefas pesadas em memória (como geração de PDFs/CSVs).
- **Arquivos afetados:**
  - `backend/src/main/java/br/com/caracursos/recursos/ColaboradorRecurso.java`
  - `backend/src/main/java/br/com/caracursos/recursos/AuthRecurso.java`

### `[JDBC-03]` Risco de Vazamento de `PreparedStatement` em `RelatorioDAO.preparar()` — ✅ Concluído
- **Prioridade:** Média
- **Diagnóstico:** Em `RelatorioDAO.java` (linhas 250–259), o método `private PreparedStatement preparar(String sql, List<Object> valores)` instancia `PreparedStatement ps = conexao.prepareStatement(sql)` e chama `Jdbc.preencher(ps, valores.toArray())` tratando apenas `catch (SQLException e) { ps.close(); throw e; }`. Se ocorrer qualquer `RuntimeException` ou `Error` durante o preenchimento dos parâmetros antes do retorno ao `try-with-resources` do chamador, o `PreparedStatement` não será fechado.
- **Recomendação:** Capturar `Throwable` (ou `Exception`) no bloco de limpeza de `preparar()` fechando `ps` com `addSuppressed`, ou abrir o `PreparedStatement` diretamente no `try-with-resources` e chamar `Jdbc.preencher(ps, ...)` na primeira linha do bloco `try`, como já é feito nos demais DAOs.
- **Arquivos afetados:**
  - `backend/src/main/java/br/com/caracursos/dao/RelatorioDAO.java`

### `[JDBC-04]` Condição de Corrida (Race Condition) na Contratação e Verificação de Licenças — ✅ Concluído
- **Prioridade:** Alta
- **Diagnóstico:**
  1. Em `ColaboradorRecurso.criar()` (linhas 136–138) e `alterarStatus()` (linhas 189–191), a verificação `usuarios.contarLicencasEmUso() >= usuarios.licencasContratadas()` usa `SELECT` simples sem `FOR UPDATE` (diferente de `GestorDAO.contarAdminsAtivosTravando()`, que usa `FOR UPDATE`). Duas requisições simultâneas de criação/reativação de colaborador com apenas 1 licença livre lerão o mesmo total e ultrapassarão o limite contratado.
  2. Em `FaturamentoDAO.contratarLicencas()` (linhas 70–81), faz um `UPDATE empresa SET licencas_contratadas = licencas_contratadas + ?` seguido de um `SELECT` separado, sem `FOR UPDATE`.
- **Recomendação:** Travar a linha da empresa (`SELECT licencas_contratadas FROM empresa WHERE id = 1 FOR UPDATE`) dentro da transação antes de validar e consumir licenças em `UsuarioDAO` / `ColaboradorRecurso`.
- **Arquivos afetados:**
  - `backend/src/main/java/br/com/caracursos/dao/UsuarioDAO.java`
  - `backend/src/main/java/br/com/caracursos/dao/FaturamentoDAO.java`
  - `backend/src/main/java/br/com/caracursos/recursos/ColaboradorRecurso.java`

### `[JDBC-05]` Queries N+1, Consultas Redundantes e Subqueries Correlacionadas — ✅ Concluído
- **Prioridade:** Média
- **Diagnóstico:**
  1. **N+1 em `TrilhaDAO.niveis()` (linhas 69–82):** Executa 1 query em `niveis` e depois 1 query por nível em `nivel_cursos` dentro de um `for`. Pode ser resolvido com uma única query com `LEFT JOIN nivel_cursos`.
  2. **N+1 em `AlunoRecurso.recomendacoes()` (linhas 245–256):** Itera pelos cursos concluídos executando `cursos.relacionados(...)` e `cursos.resumo(...)` a cada iteração.
  3. **Consultas duplicadas e carga integral na mesma requisição:**
     - `AlunoRecurso.progresso()` chama `resumosPorId()` e `duracoesPorId()`, executando dois `SELECT` completos na tabela `cursos`.
     - `AlunoRecurso.inicio()` carrega todos os cursos do catálogo (`resumosPorId()`) apenas para preencher o nome do curso nas atividades pendentes (que já poderiam vir via `JOIN` em `AtividadeDAO.pendentes()`).
     - `AuthRecurso.sessaoAtual()` (`GET /auth/me`) executa um `UPDATE usuarios SET ultimo_acesso = ?` em toda leitura de sessão e um `SELECT` extra na tabela `empresa`.
  4. **Subqueries correlacionadas em `RelatorioDAO` e `CursoDAO`:** `RelatorioDAO.engajamento()`, `horas()` e `desempenho()` executam múltiplas subqueries correlacionadas por linha de usuário em `sessoes`, `progresso_aulas` e `certificados`; `CursoDAO.SELECT` executa `(SELECT COUNT(*) FROM aulas ...)` por linha.
- **Recomendação:** Unificar as buscas N+1 com `JOIN`, substituir subqueries correlacionadas por agregações (`LEFT JOIN ... GROUP BY`) e incluir os dados do curso diretamente no `JOIN` de `AtividadeDAO.pendentes()`.
- **Arquivos afetados:**
  - `backend/src/main/java/br/com/caracursos/dao/TrilhaDAO.java`
  - `backend/src/main/java/br/com/caracursos/dao/AtividadeDAO.java`
  - `backend/src/main/java/br/com/caracursos/dao/CursoDAO.java`
  - `backend/src/main/java/br/com/caracursos/dao/RelatorioDAO.java`
  - `backend/src/main/java/br/com/caracursos/recursos/AlunoRecurso.java`
  - `backend/src/main/java/br/com/caracursos/recursos/AuthRecurso.java`

### `[JDBC-06]` Segurança de Configuração JDBC, Cláusula `ESCAPE` no `LIKE` e Índices Faltantes no Schema — ✅ Concluído
- **Prioridade:** Baixa
- **Diagnóstico:**
  1. Em `ConexaoFactory.java`, a `URL_PADRAO` define `useSSL=false&allowPublicKeyRetrieval=true` e usuário `"root"` com senha vazia `""`, além de fixar `URL`, `USUARIO` e `SENHA` em constantes `static final` no carregamento da classe.
  2. Em `Jdbc.contem(String termo)`, os caracteres `\`, `%` e `_` são escapados com barra invertida, mas as queries `LIKE ?` em `CursoDAO` e `ColaboradorDAO` não declaram explicitamente `ESCAPE '\\'`, dependendo do comportamento padrão do MySQL (`NO_BACKSLASH_ESCAPES` desativado).
  3. Em `backend/sql/cara_cursos.sql`, faltam índices nas colunas de filtro frequente: `usuarios(status, departamento)` e `usuarios(status, ultimo_acesso)`.
- **Recomendação:** Adicionar `ESCAPE '\\'` explícito nas cláusulas `LIKE`, criar os índices compostos em `cara_cursos.sql` e restringir parâmetros inseguros de SSL apenas ao ambiente local.
- **Arquivos afetados:**
  - `backend/src/main/java/br/com/caracursos/dao/ConexaoFactory.java`
  - `backend/src/main/java/br/com/caracursos/dao/Jdbc.java`
  - `backend/src/main/java/br/com/caracursos/dao/CursoDAO.java`
  - `backend/src/main/java/br/com/caracursos/dao/ColaboradorDAO.java`
  - `backend/sql/cara_cursos.sql`

---

## Pilar 3 — Contrato API <-> Frontend (JSON) e CORS

### `[API-01]` Ausência Total de Suporte a CORS e Bloqueio de Preflight (`OPTIONS` retorna HTTP 405) — ✅ Concluído
- **Prioridade:** Alta
- **Diagnóstico:**
  1. `ApiServlet` e `Api` não emitem cabeçalhos CORS (`Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, `Access-Control-Allow-Headers`, `Access-Control-Max-Age`).
  2. Como `ApiServlet` sobrescreve `service(HttpServletRequest, HttpServletResponse)` e delega qualquer método HTTP diretamente para `api.processar(...)` -> `roteador.encontrar(metodo, caminho)`, requisições preflight **`OPTIONS`** enviadas pelo navegador (obrigatórias quando há header `Authorization: Bearer ...` ou `Content-Type: application/json`) batem no `Roteador` e recebem **`405 METODO_NAO_PERMITIDO`**.
  3. O cabeçalho `Content-Disposition` (usado por `src/services/http.js` na função `nomeDoArquivo()` ao baixar PDFs e CSVs) não é exposto via `Access-Control-Expose-Headers: Content-Disposition`, impedindo o frontend de ler o nome do arquivo em requisições cross-origin.
- **Recomendação:** Tratar requisições `OPTIONS` e adicionar cabeçalhos CORS configuráveis (ex.: variável de ambiente `CORS_ORIGIN`) no `ApiServlet` (ou em um `Filter` Jakarta), incluindo `Access-Control-Expose-Headers: Content-Disposition`.
- **Arquivos afetados:**
  - `backend/src/main/java/br/com/caracursos/http/ApiServlet.java`
  - `backend/src/main/java/br/com/caracursos/http/Api.java`
  - `backend/src/main/java/br/com/caracursos/http/Roteador.java`
  - `backend/src/main/webapp/WEB-INF/web.xml`

### `[API-02]` Divergência no Contrato de Relatórios (`status` e `url`) e Download Quebrado no Modo Mock — ✅ Concluído
- **Prioridade:** Alta
- **Diagnóstico:**
  1. Em `POST /admin/relatorios`: o mock (`src/services/mock/handlers.js` linhas 775–789) e a documentação (`docs/API.md` linha 284) retornam `status: "processando"` e `url: null`, mudando para `"pronto"` após 3 segundos via `setTimeout`, mas mantendo `url: null` (assim como nos registros iniciais de `db.relatoriosGerados`). Já o backend Java (`RelatorioRecurso.gerar()`) gera o arquivo de forma síncrona e retorna imediatamente `status: "pronto"` com `url: "/admin/relatorios/{id}/arquivo"`.
  2. Em `src/pages/admin/Relatorios.jsx` (linha 90), o botão de download exige `disponivel={Boolean(r.url)}`. Como no modo mock `r.url` é sempre `null`, **nenhum relatório pode ser baixado no modo mock** (aparece como "Arquivo indisponível"), mesmo embora `src/services/api.js` (linha 248) tenha o fallback `relatorio.url ?? /admin/relatorios/${relatorio.id}/arquivo`!
- **Recomendação:** Alinhar `docs/API.md` e `src/services/mock/handlers.js` / `db.js` com o comportamento real do backend (ou implementar um handler de download simulado no mock), garantindo consistência entre `r.url` e o botão de download em `Relatorios.jsx`.
- **Arquivos afetados:**
  - `src/pages/admin/Relatorios.jsx`
  - `src/services/mock/db.js`
  - `src/services/mock/handlers.js`
  - `src/services/api.js`
  - `docs/API.md`

### `[API-03]` Divergência na Estrutura de `Curso` (`curso.area` e Campos Internos) entre Java e Mock React — ✅ Concluído
- **Prioridade:** Média
- **Diagnóstico:**
  1. No **Java** (`Curso.java` linha 22 e `CursoDAO.mapear` linha 244), o atributo `area` de um `Curso` usa o record `Curso.Categoria(String id, String nome)` e serializa apenas `{ "id": "...", "nome": "..." }`. No **Mock React** (`src/services/mock/handlers.js` linha 130), `enriquecerCurso` atribui o objeto inteiro de `db.areas`, serializando `{ "id", "nome", "icone", "competencias" }`.
  2. Além disso, `enriquecerCurso` no mock faz `{ ...c, ... }` sobre `db.cursos`, vazando no JSON das rotas de cursos os campos internos `categoriaId`, `areaId`, `destaque` e `lancamento`, que não existem em `Curso.java` nem em `docs/API.md`.
- **Recomendação:** Em `src/services/mock/handlers.js` (`enriquecerCurso`), mapear `area` para `{ id: area.id, nome: area.nome }` e omitir `categoriaId`, `areaId`, `destaque` e `lancamento` para espelhar exatamente o modelo `Curso.java`.
- **Arquivos afetados:**
  - `src/services/mock/handlers.js`
  - `backend/src/main/java/br/com/caracursos/model/Curso.java`

### `[API-04]` Divergência nos Objetos `Chamado` (`/suporte`), `Aula` e `Atividade` (`/cursos/{id}/sala`) — ✅ Concluído
- **Prioridade:** Média
- **Diagnóstico:**
  1. **`Chamado` (`GET /suporte` e `POST /suporte/chamados`):**
     - No **Java** (`SuporteDAO.Chamado`), `chamado.curso` é `CursoRef(int id, String titulo)` (sem `categoria`), e o objeto não contém `escopo` nem `cursoId`.
     - No **Mock** (`handlers.js` linhas 429–432 e 452–455), o retorno espalha `{ ...c }`, enviando `escopo` e `cursoId` extras, e monta `curso` com `resumoCurso(...)`, que inclui `categoria`.
  2. **`Aula` (`GET /cursos/{id}/sala` e `POST .../conclusao`):**
     - No **Java** (`AulaDAO.Aula`), toda aula possui `posterUrl` e `legendaUrl` (serializados como `null` pelo Gson) e, ao concluir a aula (`AulaDAO.concluir`), `posicaoSegundos` passa a ser igual a `duracaoSegundos`.
     - No **Mock** (`db.js` linhas 382–391 e `handlers.js` linha 232), `posterUrl` e `legendaUrl` não existem nos objetos e `concluirAula` não atualiza `posicaoSegundos`.
  3. **`Atividade` (`GET /cursos/{id}/sala`):**
     - No **Java** (`AtividadeDAO.Atividade`), `entregueEm` está sempre presente no JSON (`null` enquanto pendente). No **Mock** (`db.js`), `entregueEm` está ausente nas atividades pendentes.
- **Recomendação:** Padronizar os formatos em `src/services/mock/db.js` e `src/services/mock/handlers.js` para que coincidam campo a campo com os records do backend Java.
- **Arquivos afetados:**
  - `src/services/mock/db.js`
  - `src/services/mock/handlers.js`
  - `backend/src/main/java/br/com/caracursos/dao/SuporteDAO.java`

### `[API-05]` Vazamento de `senha` e `trocarSenha` no Mock de Colaboradores e Campo `vencimento` Descartado em `FaturamentoRecurso` — ✅ Concluído
- **Prioridade:** Baixa
- **Diagnóstico:**
  1. Em `src/services/mock/handlers.js` (`criarColaborador`, linha 586), o objeto inserido em `db.colaboradores` contém `senha` e `trocarSenha`. Embora `criarColaborador` omita esses campos na sua resposta imediata, chamadas subsequentes a `atualizarColaborador` (linha 601), `alterarStatusColaborador` (linha 632) e `getProgressoColaborador` (linha 643) retornam o objeto bruto de `db.colaboradores`, vazando `senha` em texto puro no JSON do mock.
  2. Em `PUT /alunos/me/preferencias` (`handlers.js` linha 363), o mock não mescla os valores padrão (`metaSemanalMinutos: 480, notificacoesEmail: true, resumoSemanal: true`) antes de salvar, podendo retornar um objeto incompleto na primeira chamada.
  3. Em `FaturamentoDAO.java` (linha 25), o record `Fatura` lê e carrega `Instant vencimento` do banco, mas `FaturamentoRecurso.resumo()` (linhas 66–76) reconstrói um `Map` manual para cada fatura e descarta o campo `vencimento`.
- **Recomendação:** Sanitizar o retorno de `Colaborador` e `Preferencias` em `src/services/mock/handlers.js` e incluir (ou remover do record, se não utilizado) `vencimento` em `FaturamentoRecurso.java`.
- **Arquivos afetados:**
  - `src/services/mock/handlers.js`
  - `backend/src/main/java/br/com/caracursos/recursos/FaturamentoRecurso.java`
  - `backend/src/main/java/br/com/caracursos/dao/FaturamentoDAO.java`

---

## Pilar 4 — Clean Code e Pendências

### `[CLEAN-01]` Políticas de Aprendizagem Salvas no Banco mas Não Aplicadas nas Regras do Sistema — ✅ Concluído
- **Prioridade:** Alta
- **Diagnóstico:** A tela de Configurações (`/admin/configuracoes`) e o endpoint `PUT /admin/configuracoes` gravam na tabela `empresa` três políticas booleanas:
  - `exigir_presenca_minima` (*"Exigir 80% das aulas antes da avaliação"*)
  - `certificacao_automatica` (*"Emitir certificados automaticamente"*)
  - `permitir_download_materiais` (*"Permitir baixar materiais de apoio"*)
  Porém, nenhuma dessas colunas é lida ou aplicada nos fluxos do aluno:
  - `Aprendizagem.concluirAula()` emite certificados sempre que `progresso >= 100`, ignorando `certificacao_automatica`.
  - `SalaRecurso` permite concluir aulas do tipo `'avaliacao'` mesmo com 0% das aulas anteriores assistidas, ignorando `exigir_presenca_minima`.
  - `SalaRecurso.sala()` e `SalaDeAula.jsx` retornam/exibem os materiais independentemente de `permitir_download_materiais`.
- **Recomendação:** Aplicar as três políticas configuradas na tabela `empresa` dentro de `Aprendizagem.java`, `SalaRecurso.java` e `SalaDeAula.jsx`.
- **Arquivos afetados:**
  - `backend/src/main/java/br/com/caracursos/recursos/Aprendizagem.java`
  - `backend/src/main/java/br/com/caracursos/recursos/SalaRecurso.java`
  - `backend/src/main/java/br/com/caracursos/dao/EmpresaDAO.java`
  - `src/pages/aluno/SalaDeAula.jsx`

### `[CLEAN-02]` Fuso Horário (`fuso_horario`) e Domínios Autorizados (`dominios_autorizados`) da Empresa Ignorados pelo Backend — ✅ Concluído
- **Prioridade:** Média
- **Diagnóstico:**
  1. A empresa configura seu `fuso_horario` em `/admin/configuracoes` (gravado em `empresa.fuso_horario`), mas a classe `Relogio.java` define `public static final ZoneId FUSO_EMPRESA = ZoneId.of("America/Sao_Paulo")` de forma fixa/estática. Todos os relatórios PDF/CSV, certificados e cálculos de turnos do dashboard ignoram o fuso salvo no banco.
  2. A empresa configura `dominios_autorizados` (ex.: `oscorp.com, lab.oscorp.com`), mas `ColaboradorRecurso.validar()` aceita cadastrar e editar colaboradores com qualquer domínio de e-mail.
- **Recomendação:** Consultar `empresa.fuso_horario` e `empresa.dominios_autorizados` nas validações de cadastro de colaborador e na formatação de datas/turnos da empresa.
- **Arquivos afetados:**
  - `backend/src/main/java/br/com/caracursos/util/Relogio.java`
  - `backend/src/main/java/br/com/caracursos/recursos/ColaboradorRecurso.java`
  - `backend/src/main/java/br/com/caracursos/recursos/DashboardRecurso.java`
  - `backend/src/main/java/br/com/caracursos/recursos/RelatorioRecurso.java`

### `[CLEAN-03]` Filtro por Departamento Ausente na Interface de Colaboradores (`Colaboradores.jsx`) — ✅ Concluído
- **Prioridade:** Média
- **Diagnóstico:** O backend (`ColaboradorDAO.listar` e `listarTodos`), o cliente HTTP (`src/services/api.js` linha 159) e o mock (`filtrarColaboradores`) suportam filtragem por `departamento`, e a página `Colaboradores.jsx` já carrega `opcoes.departamentos` via `getOpcoesColaboradores()`. Entretanto, a barra de filtros de `src/pages/admin/Colaboradores.jsx` (linhas 517–546) renderiza apenas o campo de busca textual e o `SegmentedControl` de status, deixando a funcionalidade de filtro por departamento inacessível ao usuário na tabela e na exportação CSV.
- **Recomendação:** Adicionar o seletor (`CampoSelecao`) de departamento na barra de filtros de `Colaboradores.jsx` e repassar o estado `departamento` para `listarColaboradores` e `exportarColaboradores`.
- **Arquivos afetados:**
  - `src/pages/admin/Colaboradores.jsx`

### `[CLEAN-04]` Duplicação de Acesso à Tabela `empresa` e de Records de Referência de Curso no Backend — ✅ Concluído
- **Prioridade:** Média
- **Diagnóstico:**
  1. **Três DAOs diferentes acessam a tabela `empresa` (`WHERE id = 1`):**
     - `UsuarioDAO` define `record Empresa(int id, String nome)`, `empresa()` e `licencasContratadas()`.
     - `EmpresaDAO` define `configuracoes()` e `salvar()`.
     - `FaturamentoDAO` define `dadosFiscais()` e `contratarLicencas()`.
  2. **Três estruturas distintas para representar referência curta a um curso:**
     - `br.com.caracursos.model.CursoResumo(int id, String titulo, String categoria)`
     - `TrilhaDAO.Referencia(int id, String titulo)`
     - `SuporteDAO.CursoRef(int id, String titulo)`
  3. **Regex de e-mail duplicada:** `Pattern EMAIL` declarada tanto em `ColaboradorRecurso` quanto em `ConfiguracaoRecurso`.
- **Recomendação:** Centralizar todas as consultas e mutações da tabela `empresa` em `EmpresaDAO`, unificar os records de referência de curso em `model` e extrair validadores comuns para `util`.
- **Arquivos afetados:**
  - `backend/src/main/java/br/com/caracursos/dao/EmpresaDAO.java`
  - `backend/src/main/java/br/com/caracursos/dao/UsuarioDAO.java`
  - `backend/src/main/java/br/com/caracursos/dao/FaturamentoDAO.java`
  - `backend/src/main/java/br/com/caracursos/dao/TrilhaDAO.java`
  - `backend/src/main/java/br/com/caracursos/dao/SuporteDAO.java`
  - `backend/src/main/java/br/com/caracursos/recursos/ColaboradorRecurso.java`
  - `backend/src/main/java/br/com/caracursos/recursos/ConfiguracaoRecurso.java`

### `[CLEAN-05]` Materiais de Apoio Sem Endpoint de Arquivo e Aulas de `avaliacao` Renderizadas como Vídeo — ✅ Concluído
- **Prioridade:** Baixa
- **Diagnóstico:**
  1. Todos os registros da tabela `materiais` possuem `url = NULL` e não há rota no backend para baixar ou gerar o material de apoio; na UI (`SalaDeAula.jsx`), todos aparecem desabilitados como *"Arquivo indisponível"*.
  2. Aulas com `tipo = 'avaliacao'` são exibidas em `SalaDeAula.jsx` usando o mesmo `<PlayerAula>` de vídeo em vez de um componente de avaliação/questionário.
- **Recomendação:** Criar endpoint para servir materiais demonstrativos (ou arquivos estáticos) e implementar visualização específica quando `aula.tipo === 'avaliacao'`.
- **Arquivos afetados:**
  - `backend/sql/cara_cursos.sql`
  - `backend/src/main/java/br/com/caracursos/recursos/SalaRecurso.java`
  - `src/pages/aluno/SalaDeAula.jsx`
  - `src/services/mock/db.js`

### `[CLEAN-06]` Código Morto, Proteção contra CSV Injection no Frontend e Documentação Desatualizada — ✅ Concluído
- **Prioridade:** Baixa
- **Diagnóstico:**
  1. `docs/API.md` (linhas 9–11) afirma que os módulos `suporte`, `gestores`, `relatorios`, `faturamento` e `configuracoes` *"ainda estão no mock"*, mas todos já estão implementados no backend Java e `MODULOS_SO_NO_MOCK` em `src/services/api.js` está vazio.
  2. Em `src/pages/admin/Relatorios.jsx` (linha 19), o formato `xlsx` em `ICONE_FORMATO` é código morto (substituído por `csv`).
  3. Em `src/lib/download.js` (`celulaCsv`, linha 15), a função geradora de CSV do frontend não escapa células iniciadas por `=`, `+`, `-` ou `@` (CSV Injection), proteção que já existe em `backend/src/main/java/br/com/caracursos/util/Csv.java` (linha 36).
- **Recomendação:** Atualizar `docs/API.md`, remover entradas mortas em `Relatorios.jsx` e alinhar `celulaCsv` em `src/lib/download.js` com a sanitização de fórmulas do `Csv.java`.
- **Arquivos afetados:**
  - `docs/API.md`
  - `src/pages/admin/Relatorios.jsx`
  - `src/lib/download.js`
  - `src/services/api.js`

---

## Resumo Consolidado e Matriz de Priorização

| ID | Pilar | Título Resumido | Prioridade | Status |
| :--- | :--- | :--- | :---: | :---: |
| **`[BACK-01]`** | 1. OO e Camadas Java | Criar camada `service` e remover regras de negócio de `*Recurso` | **Alta** | ✅ Concluído |
| **`[BACK-02]`** | 1. OO e Camadas Java | Remover dependência invertida (`dao` importando `http.Pagina` e `http.Json`) | **Alta** | ✅ Concluído |
| **`[BACK-03]`** | 1. OO e Camadas Java | Remover regras de negócio e URLs HTTP de dentro dos DAOs | **Alta** | ✅ Concluído |
| **`[JDBC-01]`** | 2. Segurança/Perf JDBC | Implementar Pool de Conexões (HikariCP / DataSource) em `ConexaoFactory` | **Alta** | ✅ Concluído |
| **`[JDBC-02]`** | 2. Segurança/Perf JDBC | Retirar `Senhas.gerar()` (PBKDF2 600k) de dentro de transações JDBC | **Alta** | ✅ Concluído |
| **`[JDBC-04]`** | 2. Segurança/Perf JDBC | Evitar race condition na verificação de licenças com `FOR UPDATE` | **Alta** | ✅ Concluído |
| **`[API-01]`** | 3. Contrato API/Front | Implementar CORS e suporte a preflight `OPTIONS` no `ApiServlet`/`Roteador` | **Alta** | ✅ Concluído |
| **`[API-02]`** | 3. Contrato API/Front | Alinhar contrato de Relatórios (`status`/`url`) e corrigir download no mock | **Alta** | ✅ Concluído |
| **`[CLEAN-01]`** | 4. Clean Code/Pendências | Aplicar de fato as políticas de aprendizagem salvas em `empresa` | **Alta** | ✅ Concluído |
| **`[BACK-04]`** | 1. OO e Camadas Java | Mover `record`s de entidades/DTOs de dentro dos DAOs para `model` | **Média** | ✅ Concluído |
| **`[BACK-05]`** | 1. OO e Camadas Java | Desacoplar gestão de `Connection`/transação de `http.Requisicao` | **Média** | ✅ Concluído |
| **`[BACK-06]`** | 1. OO e Camadas Java | Encapsular `SQLException`/constraints nos DAOs e separar exceções HTTP | **Média** | ✅ Concluído |
| **`[JDBC-03]`** | 2. Segurança/Perf JDBC | Corrigir risco de leak de `PreparedStatement` em `RelatorioDAO.preparar()` | **Média** | ✅ Concluído |
| **`[JDBC-05]`** | 2. Segurança/Perf JDBC | Eliminar queries N+1 (`TrilhaDAO`, `AlunoRecurso`) e subqueries correlacionadas | **Média** | ✅ Concluído |
| **`[API-03]`** | 3. Contrato API/Front | Alinhar serialização de `Curso` (`area` e campos internos) entre Java e Mock | **Média** | ✅ Concluído |
| **`[API-04]`** | 3. Contrato API/Front | Alinhar campos de `Chamado`, `Aula` e `Atividade` entre Java e Mock | **Média** | ✅ Concluído |
| **`[CLEAN-02]`** | 4. Clean Code/Pendências | Usar `fuso_horario` e validar `dominios_autorizados` configurados no banco | **Média** | ✅ Concluído |
| **`[CLEAN-03]`** | 4. Clean Code/Pendências | Adicionar seletor de filtro por departamento em `Colaboradores.jsx` | **Média** | ✅ Concluído |
| **`[CLEAN-04]`** | 4. Clean Code/Pendências | Consolidar queries da tabela `empresa` em `EmpresaDAO` e unificar `CursoResumo` | **Média** | ✅ Concluído |
| **`[BACK-07]`** | 1. OO e Camadas Java | Proteger `Usuario.senha` contra serialização acidental e ajustar `Curso.equals` | **Baixa** | ✅ Concluído |
| **`[JDBC-06]`** | 2. Segurança/Perf JDBC | Explicitar `ESCAPE '\\'` em `LIKE`, criar índices e isolar configs de dev | **Baixa** | ✅ Concluído |
| **`[API-05]`** | 3. Contrato API/Front | Omitir `senha`/`trocarSenha` no mock de colaboradores e revisar `Fatura.vencimento` | **Baixa** | ✅ Concluído |
| **`[CLEAN-05]`** | 4. Clean Code/Pendências | Servir arquivos de materiais de apoio e diferenciar aulas de avaliação | **Baixa** | ✅ Concluído |
| **`[CLEAN-06]`** | 4. Clean Code/Pendências | Atualizar `docs/API.md`, remover código morto e proteger CSV no frontend | **Baixa** | ✅ Concluído |
