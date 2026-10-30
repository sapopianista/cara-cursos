# Contrato da API REST (backend Java)

Referência para implementar o backend. O front já consome exatamente estes formatos — a implementação simulada
em `src/services/mock/handlers.js` é a fonte de verdade executável (os dados de exemplo estão em `mock/db.js`).

Base: `VITE_API_URL` (padrão `/api`). Todas as rotas, exceto `POST /auth/login`, exigem
`Authorization: Bearer <token>`.

## Convenções

| Assunto      | Regra                                                                                          |
| ------------ | ---------------------------------------------------------------------------------------------- |
| Datas        | ISO 8601 com fuso (`2026-10-30T14:15:00Z`). O front formata.                                    |
| Durações     | `duracaoMinutos` (cursos/trilhas), `duracaoSegundos` / `posicaoSegundos` (aulas).               |
| Dinheiro     | Inteiro em centavos: `valorCentavos: 222000` = R$ 2.220,00.                                    |
| Enums        | Minúsculas com `_`: `nao_iniciado`, `em_andamento`, `concluido`.                                |
| Paginação    | Query `pagina` (1…), `porPagina`. Resposta `Pagina<T>`: `{ itens: T[], total, pagina, porPagina, totalPaginas }`. |
| Sem conteúdo | `204 No Content` é aceito em ações sem retorno.                                                  |
| Arquivos     | Responder o binário com `Content-Disposition: attachment; filename="..."`, **ou** enviar `url` (assinada) no JSON. |

### Erros

Qualquer status ≥ 400 com corpo:

```json
{ "mensagem": "Revise os campos destacados.", "codigo": "VALIDACAO", "campos": { "email": "Já existe um colaborador com este e-mail." } }
```

- `mensagem` é exibida ao usuário (toast/alerta). Sem ela, o front usa uma mensagem padrão por status.
- `campos` (opcional) aparece embaixo de cada campo do formulário, pela chave.
- `401` → o front encerra a sessão e volta para o login. `403` → "sem permissão". `409` → conflito de regra de
  negócio (ex.: `SEM_LICENCAS`). `422` → validação.

### Papéis

`usuario.papel`: `colaborador` (só área do aluno), `admin`, `rh`, `lider`, `financeiro`.
Permissões por tela (front e back devem concordar) — ver `PERMISSOES` em `src/context/AuthContext.jsx`:

| Tela                  | Papéis                     |
| --------------------- | -------------------------- |
| Visão geral, Colaboradores, Relatórios | admin, rh, lider |
| Gestores e permissões | admin                      |
| Plano e faturamento   | admin, financeiro          |
| Configurações         | admin, rh                  |
| Ajuda                 | todos os papéis de gestão  |

O backend **deve** aplicar as mesmas regras (o front só esconde o que não é permitido).

---

## Autenticação

### `POST /auth/login`
```json
// requisição
{ "identificador": "tiago.vieira@oscorp.com", "senha": "••••", "lembrar": true }
// 200
{ "token": "eyJ…", "usuario": Usuario }
```
`401` credenciais inválidas · `403` acesso desativado.

### `GET /auth/me` → `Usuario`
Usado ao recarregar a página para validar o token salvo.

### `POST /auth/logout` → `204`

```ts
Usuario = { id, nome, email, cargo, departamento, papel, empresa: { id, nome } }
```

## Aluno

### `GET /alunos/me/inicio`
```ts
{
  usuario: { nome },                        // primeiro nome
  metaSemanal: { minutosEstudados, minutosMeta },
  continuar: null | {
    curso: { id, titulo, categoria }, aula: { id, ordem, titulo },
    percentualAssistido, minutosRestantes, tema, imagemUrl
  },
  cursosEmAndamento: Curso[],
  atividades: (Atividade & { curso: { id, titulo } })[]   // só pendentes, por prazo
}
```

### `GET /alunos/me/progresso`
```ts
{
  resumo: { percentualGeral, cursosConcluidos, cursosTotais, nivelAtual: Nivel | null },
  niveis: Nivel[],
  certificados: { id, titulo, origem, emitidoEm, codigo, url | null }[]
}
Nivel = {
  id, ordem, titulo, perfil, competencias: string[],
  estado: 'concluido' | 'em_andamento' | 'bloqueado',
  progresso, cursosConcluidos, cursosTotais, minutosRestantes,
  proximoCurso: { id, titulo } | null, cursos: { id, titulo }[]
}
```

### `GET /certificados/{id}/arquivo` → PDF (quando `url` não vier no JSON)

### `GET /alunos/me/perfil`
`Usuario` + `{ matricula, membroDesde, estatisticas: { cursosConcluidos, minutosEstudados, certificados }, preferencias }`

### `PUT /alunos/me/preferencias`
```json
{ "metaSemanalMinutos": 480, "notificacoesEmail": true, "resumoSemanal": true }
```
Responde as preferências salvas. (O tema claro/escuro é salvo só no navegador.)

### `GET /alunos/me/recomendacoes`
```ts
{
  perfil: { cargo, departamento },
  porCargo: { curso: Curso, motivo: string }[],
  continuidade: { baseadoEm: string, cursos: { curso: Curso, motivo: string }[] }
}
```
`motivo` é exibido no card ("Indicado para quem atua em Operações").

## Catálogo

### `GET /cursos?q=&categoria=&area=&nivel=&pagina=&porPagina=` → `Pagina<Curso>`
`q` busca em título, descrição e instrutor (sem diferenciar acentos/maiúsculas). `nivel` inclui cursos `todos`.

```ts
Curso = {
  id, titulo, descricao,
  categoria: { id, nome }, area: { id, nome },
  nivel: 'iniciante' | 'intermediario' | 'avancado' | 'todos',
  duracaoMinutos, totalAulas, nota, totalAvaliacoes,
  instrutor: { nome, cargo },
  tema: 'azul'|'ambar'|'ciano'|'roxo'|'teal'|'verde'|'rosa'|'grafite'|'laranja',  // capa quando não há imagem
  imagemUrl: string | null,
  progresso: number,                          // 0–100 do usuário logado
  status: 'nao_iniciado' | 'em_andamento' | 'concluido'
}
```

### `GET /cursos/categorias` → `{ id, nome }[]`
### `GET /areas` → `{ id, nome, icone, competencias: string[], totalCursos, duracaoMinutos }[]`
`icone`: `code | users | heart | trending | building | megaphone | pen | boxes`.

### `GET /cursos/destaques` → `{ principal: Curso, semana: Curso[], lancamentos: Curso[] }`

## Trilhas

### `GET /trilhas`
`{ id, titulo, descricao, nivel, tema, competencias, totalCursos, duracaoMinutos, progresso, status }[]`

### `GET /trilhas/{id}` → trilha acima + `cursos: Curso[]` (na ordem sugerida). `404` se não existir.

## Sala de aula

### `GET /cursos/{id}/sala`
```ts
{
  curso: Curso & { trilha: { id, titulo } | null },
  aulas: Aula[],
  aulaAtualId: number,                         // onde o aluno parou
  materiais: { id, nome, tamanhoBytes, url | null }[],
  atividades: Atividade[]
}
Aula = {
  id, ordem, titulo, tipo: 'video' | 'avaliacao',
  duracaoSegundos, posicaoSegundos,
  status: 'concluida' | 'em_andamento' | 'pendente',
  videoUrl, posterUrl?, legendaUrl?            // legenda em WebVTT (pt-BR), opcional
}
Atividade = { id, cursoId, titulo, descricao, prazo, status: 'pendente' | 'entregue', entregueEm? }
```

### `PUT /cursos/{id}/aulas/{aulaId}/progresso` `{ "posicaoSegundos": 342 }` → `204`
Chamado a cada ~15 s de vídeo, ao pausar e ao sair da aula.

### `POST /cursos/{id}/aulas/{aulaId}/conclusao` → `{ aula: Aula, progressoCurso: number }`

### `POST /atividades/{id}/entregas` `{ "resposta": "texto" }` → `Atividade` (com `status: 'entregue'`)

## Notificações

- `GET /notificacoes` → `{ id, titulo, descricao, link | null, lida, criadaEm }[]` (mais recentes primeiro)
- `POST /notificacoes/{id}/leitura` → `204`
- `POST /notificacoes/leitura` → `204` (marca todas)

## Suporte (aluno e gestor)

### `GET /suporte?escopo=aluno|gestor`
```ts
{
  faq: { id, pergunta, resposta }[],
  contato: { canal, tempoResposta, nome?, email? },   // gestor: gerente de sucesso
  assuntos: string[],
  cursos: { id, titulo }[],                            // só para escopo aluno
  chamados: { id, assunto, titulo, curso: {id,titulo} | null,
              status: 'em_analise' | 'respondido' | 'resolvido', atualizadoEm }[]
}
```

### `POST /suporte/chamados`
`{ escopo, assunto, titulo, cursoId?, descricao }` → chamado criado. `422` com `campos` para validação.

## Painel da empresa

### `GET /admin/dashboard?periodo=7dias|30dias|trimestre`
```ts
{
  periodo: { id, inicio, fim },
  indicadores: { engajamento, metaEngajamento, conclusaoMedia, satisfacao },   // % , %, %, nota 0–5
  atividadeRecente: { ativosHoje, totalColaboradores,
                      colaboradores: { id, nome, email, cargo, ultimoAcesso }[] },
  sessoesPorTurno: { total, segmentos: { turno, intervalo, percentual }[] }
}
```

### Colaboradores
| Método | Rota | Corpo / Query | Resposta |
| --- | --- | --- | --- |
| GET | `/admin/colaboradores` | `busca, status (todos\|ativo\|pendente\|inativo), departamento, pagina, porPagina` | `Pagina<Colaborador>` |
| GET | `/admin/colaboradores/resumo` | — | `{ total, ativos, pendentes, inativos, conclusaoMedia, licencas: { emUso, contratadas } }` |
| GET | `/admin/colaboradores/opcoes` | — | `{ cargos: string[], departamentos: string[], niveis: number[] }` |
| POST | `/admin/colaboradores` | `{ nome, email, cargo, departamento, nivel }` | `Colaborador` (status `pendente`; envia convite por e-mail) |
| PUT | `/admin/colaboradores/{id}` | mesmo corpo | `Colaborador` |
| PATCH | `/admin/colaboradores/{id}/status` | `{ status: 'ativo' \| 'inativo' }` | `Colaborador` |
| GET | `/admin/colaboradores/{id}/progresso` | — | `{ colaborador, cursos: { curso: {id,titulo}, progresso, status }[] }` |
| GET | `/admin/colaboradores/exportar` | mesmos filtros da listagem | `text/csv` (UTF-8 com BOM, separador `;`) |

```ts
Colaborador = { id, matricula, nome, email, cargo, departamento, nivel, progresso,
                cursosConcluidos, status, ultimoAcesso | null, criadoEm }
```
Regras: e-mail único (`422`, `campos.email`); sem licença livre → `409 SEM_LICENCAS`; não pode desativar a si mesmo.

### Gestores e permissões
| Método | Rota | Corpo | Resposta |
| --- | --- | --- | --- |
| GET | `/admin/gestores` | — | `{ gestores: Gestor[], papeis: { id, nome, descricao }[], candidatos: { id, nome, email, departamento }[] }` |
| POST | `/admin/gestores` | `{ colaboradorId, papel }` | `Gestor` (status `pendente`) |
| PATCH | `/admin/gestores/{id}` | `{ papel }` | `Gestor` |
| DELETE | `/admin/gestores/{id}` | — | `204` |
| POST | `/admin/gestores/{id}/convite` | — | `Gestor` (reenvia o e-mail) |
| GET | `/admin/auditoria` | — | `{ id, acao, descricao, autor, criadoEm }[]` (últimos 10) |

```ts
Gestor = { id, colaboradorId, nome, email, departamento, papel, mfaAtivo, status: 'ativo'|'pendente', convidadoEm, ultimoAcesso | null }
```
Regras: sempre ao menos um `admin` ativo (`409`); ninguém revoga o próprio acesso; toda alteração gera auditoria.

### Relatórios
- `GET /admin/relatorios` → `{ modelos: { id, titulo, descricao, formato: 'pdf'|'xlsx'|'csv' }[], departamentos: string[], historico: Relatorio[] }`
- `POST /admin/relatorios` `{ modeloId, periodo: '7dias'|'30dias'|'trimestre'|'ano', departamento?: string }` → `Relatorio` com `status: 'processando'`
- `GET /admin/relatorios/{id}/arquivo` → arquivo (quando `url` não vier no JSON)

```ts
Relatorio = { id, modeloId, modelo, periodo, departamento | null, status: 'processando'|'pronto'|'erro', solicitadoPor, criadoEm, url | null }
```
A geração é assíncrona: o front consulta `GET /admin/relatorios` a cada 2,5 s enquanto houver item `processando`.

### Plano e faturamento
- `GET /admin/faturamento`
```ts
{
  contrato: { numero, plano, status, inicio, renovacao, licencasContratadas, valorLicencaMensalCentavos, metodoPagamento, emailNotaFiscal },
  licencas: { contratadas, emUso },
  proximaFatura: { vencimento, valorCentavos },
  dadosFiscais: { razaoSocial, cnpj, endereco },
  faturas: { id, competencia, licencas, emitidaEm, valorCentavos, status: 'paga'|'aberta'|'vencida', notaFiscal: { numero, url | null } }[]
}
```
- `POST /admin/faturamento/licencas` `{ quantidade }` (1–500) → `{ licencasContratadas }`

### Configurações
- `GET /admin/configuracoes`
- `PUT /admin/configuracoes`
```json
{
  "organizacao": { "nomeFantasia": "Oscorp", "razaoSocial": "Oscorp Brasil Ltda.", "cnpj": "11.222.333/0001-81",
                   "emailNotificacao": "educacao@oscorp.com", "fusoHorario": "America/Sao_Paulo",
                   "dominiosAutorizados": "oscorp.com, lab.oscorp.com" },
  "politicas": { "exigirPresencaMinima": true, "certificacaoAutomatica": true,
                 "permitirDownloadMateriais": true, "exigir2FA": true }
}
```
Validar CNPJ (dígitos verificadores) e e-mail; responder `422` com `campos.cnpj` / `campos.emailNotificacao`.
