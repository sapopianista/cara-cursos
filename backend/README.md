# Cara Cursos — API (Java 25 + JDBC + Servlets)

API REST consumida pelo frontend React (pasta raiz). O contrato está em [`../docs/API.md`](../docs/API.md)
e o andamento do projeto em [`PLANO.md`](PLANO.md).

## Pré-requisitos

- **JDK 25** (`java -version` deve mostrar 25). O Maven não precisa ser instalado: use `mvnw`.
- **MySQL 8.0.19+**.

## 1. Criar a base de dados

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p -e "source C:/caminho/para/cara-cursos/backend/sql/cara_cursos.sql"
```

O script apaga e recria tudo (pode rodar de novo quando quiser voltar aos dados iniciais).
Contas de teste (senha `demo1234`):

| E-mail | Papel |
|---|---|
| `tiago.vieira@oscorp.com` | admin (área do aluno + painel completo) |
| `beatriz.albuquerque@oscorp.com` | rh |
| `juliana.mendonca@oscorp.com` | lider |
| `ana.silveira@oscorp.com` | colaborador (só área do aluno) |

## 2. Configurar a conexão

A `ConexaoFactory` lê `DB_URL`, `DB_USUARIO` e `DB_SENHA` (propriedade `-D` ou variável de ambiente).
Padrão: `jdbc:mysql://localhost:3306/cara_cursos`, usuário `root`, sem senha.

```powershell
$env:DB_USUARIO = "root"
$env:DB_SENHA = "sua-senha"
.\mvnw.cmd -q compile exec:java "-Dexec.mainClass=br.com.caracursos.dao.TesteConexao"   # opcional: confere a conexão
```

## 3. Subir a API

```powershell
.\mvnw.cmd jetty:run
```

A API fica em `http://localhost:8080/api` (teste: `http://localhost:8080/api/saude`).

## 4. Ligar o frontend

Na pasta raiz, crie um `.env` com `VITE_USAR_MOCK=false` e rode `npm run dev`. O Vite encaminha `/api`
para a porta 8080. Os módulos listados em `MODULOS_SO_NO_MOCK` (`src/services/api.js`) continuam simulados
até o backend implementá-los.

## Testes

```powershell
.\mvnw.cmd test                                                      # só os testes unitários
.\mvnw.cmd test "-DDB_TESTE_URL=jdbc:mysql://127.0.0.1:3306/" "-DDB_TESTE_SENHA=sua-senha"   # + integração
```

Os testes de integração exercitam a API inteira (rotas, login, permissões, JSON e SQL) numa base
**separada**, `cara_cursos_teste`, recriada a cada classe de teste. A base `cara_cursos` nunca é tocada.

## Produção (Tomcat 10.1+)

`.\mvnw.cmd package` gera `target/api.war`. Copie para `webapps/` do Tomcat: a API fica em `/api`, o mesmo
caminho que o frontend usa. Defina `DB_URL`, `DB_USUARIO` e `DB_SENHA` no ambiente do Tomcat e use um
usuário MySQL próprio da aplicação (o script tem o `CREATE USER` comentado).

## Estrutura

```
src/main/java/br/com/caracursos/
  http/        Api (processa a requisição), ApiServlet, Roteador, Requisicao, Json, Pagina, ApiException
  recursos/    rotas por módulo: Auth, Catalogo, Trilha, Sala, Aluno, Notificacao, Colaborador, Dashboard
  dao/         acesso ao banco com JDBC puro (PreparedStatement) + ConexaoFactory
  model/       Usuario, Curso, Matricula, CursoResumo
  seguranca/   Senhas (PBKDF2), Tokens (sessão), Permissao (papéis)
  util/        Csv (exportação para Excel), CertificadoPdf (PDF sem bibliotecas), Relogio
sql/cara_cursos.sql   esquema + dados de teste
```
