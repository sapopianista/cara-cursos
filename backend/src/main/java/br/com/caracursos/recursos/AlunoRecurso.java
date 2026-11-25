package br.com.caracursos.recursos;

import java.sql.SQLException;
import java.util.Map;
import java.util.function.Predicate;

import br.com.caracursos.dao.UsuarioDAO;
import br.com.caracursos.http.ApiException;
import br.com.caracursos.http.Arquivo;
import br.com.caracursos.http.Requisicao;
import br.com.caracursos.http.Roteador;
import br.com.caracursos.model.Usuario;
import br.com.caracursos.seguranca.Permissao;
import br.com.caracursos.service.AlunoService;

/** Área do aluno: {@code /alunos/me/*} e o PDF dos certificados. */
public class AlunoRecurso {

    private static final int META_MINIMA = 30;
    private static final int META_MAXIMA = 3000;
    private static final Predicate<Integer> PROGRESSO_CONCLUIDO = p -> p >= 100;

    private final AlunoService servico = new AlunoService();

    public void registrar(Roteador r) {
        r.get("/alunos/me/inicio", Permissao.AUTENTICADO, req -> servico.inicio(req.conexao(), req.usuario()));
        r.get("/alunos/me/progresso", Permissao.AUTENTICADO, req -> servico.progresso(req.conexao(), req.idUsuario()));
        r.get("/alunos/me/perfil", Permissao.AUTENTICADO, this::perfil);
        r.put("/alunos/me/preferencias", Permissao.AUTENTICADO, this::atualizarPreferencias);
        r.get("/alunos/me/recomendacoes", Permissao.AUTENTICADO,
                req -> servico.recomendacoes(req.conexao(), req.usuario()));
        r.get("/certificados/{id}/arquivo", Permissao.AUTENTICADO, this::baixarCertificado);
    }

    // ---- início -------------------------------------------------------------

    private Object inicio(Requisicao req) throws SQLException {
        Connection c = req.conexao();
        Usuario u = req.usuario();
        CursoDAO cursos = new CursoDAO(c);

        Map<String, Object> json = new LinkedHashMap<>();
        json.put("usuario", Map.of("nome", u.getPrimeiroNome()));
        json.put("metaSemanal", Map.of(
                "minutosEstudados", new AulaDAO(c).minutosEstudadosDesde(u.getId(),
                        Relogio.agora().minus(Duration.ofDays(7))),
                "minutosMeta", u.getMetaSemanalMinutos()));
        json.put("continuar", continuar(new AulaDAO(c).continuar(u.getId())));
        json.put("cursosEmAndamento", cursos.emAndamento(u.getId(), 4));

        Map<Integer, CursoResumo> resumos = cursos.resumosPorId();
        List<JsonObject> atividades = new ArrayList<>();
        for (AtividadeDAO.Atividade a : new AtividadeDAO(c).pendentes(u.getId())) {
            JsonObject item = Json.objeto(a);
            item.add("curso", Json.arvore(resumos.get(a.cursoId())));
            atividades.add(item);
        }
        json.put("atividades", atividades);
        return json;
    }

    private static Map<String, Object> continuar(AulaDAO.Continuacao cont) {
        if (cont == null) return null;
        AulaDAO.Aula aula = cont.aula();
        int duracao = Math.max(1, aula.duracaoSegundos());
        Map<String, Object> json = new LinkedHashMap<>();
        json.put("curso", cont.curso());
        json.put("aula", Map.of("id", aula.id(), "ordem", aula.ordem(), "titulo", aula.titulo()));
        json.put("percentualAssistido", Math.round(aula.posicaoSegundos() * 100.0 / duracao));
        json.put("minutosRestantes", (int) Math.ceil(Math.max(0, duracao - aula.posicaoSegundos()) / 60.0));
        json.put("tema", cont.tema());
        json.put("imagemUrl", cont.imagemUrl());
        return json;
    }

    // ---- progresso (níveis + certificados) ----------------------------------

    private Object progresso(Requisicao req) throws SQLException {
        Connection c = req.conexao();
        int usuario = req.idUsuario();
        Map<Integer, Integer> progresso = new MatriculaDAO(c).progressoPorCurso(usuario);
        Map<Integer, CursoResumo> resumos = new CursoDAO(c).resumosPorId();
        Map<Integer, Integer> duracoes = new CursoDAO(c).duracoesPorId();

        // O primeiro nível não concluído fica "em andamento"; os seguintes, "bloqueado".
        List<Map<String, Object>> niveis = new ArrayList<>();
        boolean achouAtual = false;
        int totalCursos = 0;
        int totalConcluidos = 0;
        for (TrilhaDAO.Nivel n : new TrilhaDAO(c).niveis()) {
            List<Integer> ids = n.cursoIds();
            Predicate<Integer> cursoConcluido = id -> PROGRESSO_CONCLUIDO.test(progresso.getOrDefault(id, 0));
            int concluidos = (int) ids.stream().filter(cursoConcluido).count();
            int media = ids.isEmpty() ? 0
                    : (int) Math.round(ids.stream().mapToInt(id -> progresso.getOrDefault(id, 0)).average().orElse(0));
            String estado = "bloqueado";
            if (concluidos == ids.size()) {
                estado = "concluido";
            } else if (!achouAtual) {
                estado = "em_andamento";
                achouAtual = true;
            }
            double restantes = ids.stream()
                    .map(id -> duracoes.getOrDefault(id, 0) * (100 - progresso.getOrDefault(id, 0)) / 100.0)
                    .reduce(0.0, Double::sum);
            CursoResumo proximo = ids.stream().filter(cursoConcluido.negate()).findFirst()
                    .map(resumos::get).orElse(null);

            Map<String, Object> nivel = new LinkedHashMap<>();
            nivel.put("id", n.id());
            nivel.put("ordem", n.ordem());
            nivel.put("titulo", n.titulo());
            nivel.put("perfil", n.perfil());
            nivel.put("competencias", n.competencias());
            nivel.put("estado", estado);
            nivel.put("progresso", media);
            nivel.put("cursosConcluidos", concluidos);
            nivel.put("cursosTotais", ids.size());
            nivel.put("minutosRestantes", Math.round(restantes));
            nivel.put("proximoCurso", estado.equals("em_andamento") && proximo != null
                    ? Map.of("id", proximo.id(), "titulo", proximo.titulo())
                    : null);
            nivel.put("cursos", ids.stream().map(resumos::get).toList());
            niveis.add(nivel);
            totalCursos += ids.size();
            totalConcluidos += concluidos;
        }

        Map<String, Object> resumo = new LinkedHashMap<>();
        resumo.put("percentualGeral", totalCursos == 0 ? 0 : Math.round(totalConcluidos * 100.0 / totalCursos));
        resumo.put("cursosConcluidos", totalConcluidos);
        resumo.put("cursosTotais", totalCursos);
        resumo.put("nivelAtual", niveis.stream().filter(n -> "em_andamento".equals(n.get("estado"))).findFirst()
                .orElse(null));

        Map<String, Object> json = new LinkedHashMap<>();
        json.put("resumo", resumo);
        json.put("niveis", niveis);
        json.put("certificados", new CertificadoDAO(c).doUsuario(usuario));
        return json;
    }

    private Object baixarCertificado(Requisicao req) throws SQLException {
        AlunoService.CertificadoPdfArquivo cert = servico.baixarCertificado(
                req.conexao(), req.idCaminho("id"), req.idUsuario());
        return new Arquivo("certificado-" + cert.codigo() + ".pdf", "application/pdf", cert.pdf());
    }

    private Object perfil(Requisicao req) throws SQLException {
        Connection c = req.conexao();
        Usuario u = req.usuario();
        Map<Integer, Integer> progresso = new MatriculaDAO(c).progressoPorCurso(u.getId());
        Map<Integer, Integer> duracoes = new CursoDAO(c).duracoesPorId();
        long concluidos = progresso.values().stream().filter(PROGRESSO_CONCLUIDO).count();
        double minutos = progresso.entrySet().stream()
                .map(e -> duracoes.getOrDefault(e.getKey(), 0) * e.getValue() / 100.0)
                .reduce(0.0, Double::sum);

        Map<String, Object> json = AuthRecurso.usuarioJson(u, c);
        json.put("matricula", u.getMatricula());
        json.put("membroDesde", u.getCriadoEm());
        json.put("estatisticas", Map.of(
                "cursosConcluidos", concluidos,
                "minutosEstudados", Math.round(minutos),
                "certificados", new CertificadoDAO(c).contar(u.getId())));
        json.put("preferencias", preferencias(u));
        return json;
    }

    private Object atualizarPreferencias(Requisicao req) throws SQLException {
        Usuario u = req.usuario();
        if (req.corpo().has("metaSemanalMinutos")) {
            Integer meta = req.inteiro("metaSemanalMinutos");
            if (meta == null || meta < META_MINIMA || meta > META_MAXIMA) {
                throw ApiException.validacao(Map.of("metaSemanalMinutos",
                        "Escolha uma meta entre " + META_MINIMA + " e " + META_MAXIMA + " minutos."));
            }
            u.setMetaSemanalMinutos(meta);
        }
        Boolean email = req.booleano("notificacoesEmail");
        if (email != null) u.setNotificacoesEmail(email);
        Boolean resumo = req.booleano("resumoSemanal");
        if (resumo != null) u.setResumoSemanal(resumo);
        new UsuarioDAO(req.conexao()).atualizarPreferencias(u);
        return preferencias(u);
    }

    private static Map<String, Object> preferencias(Usuario u) {
        Map<String, Object> json = new LinkedHashMap<>();
        json.put("metaSemanalMinutos", u.getMetaSemanalMinutos());
        json.put("notificacoesEmail", u.isNotificacoesEmail());
        json.put("resumoSemanal", u.isResumoSemanal());
        return json;
    }

    // ---- recomendações -----------------------------------------------------

    private static final int RECOMENDACOES = 3;

    /**
     * "Para o seu cargo": o que colegas do mesmo departamento mais fazem (e o aluno ainda não começou),
     * completado pelos cursos mais bem avaliados. "Próximos passos": cursos da mesma área ou categoria
     * do curso concluído mais recente que ainda tenha relacionados por fazer ({@code continuidade} é
     * {@code null} se não houver nenhum).
     */
    private Object recomendacoes(Requisicao req) throws SQLException {
        Connection c = req.conexao();
        Usuario u = req.usuario();
        CursoDAO cursos = new CursoDAO(c);
        MatriculaDAO matriculas = new MatriculaDAO(c);

        List<Map<String, Object>> porCargo = new ArrayList<>();
        List<Integer> usados = new ArrayList<>();
        for (Curso curso : cursos.listarPorIds(
                matriculas.popularesNoDepartamento(u.getId(), u.getDepartamento(), RECOMENDACOES), u.getId())) {
            porCargo.add(Map.of("curso", curso, "motivo", "Popular entre colegas de " + u.getDepartamento()));
            usados.add(curso.getId());
        }
        Predicate<Curso> naoSelecionado = curso -> !usados.contains(curso.getId());
        cursos.naoIniciados(u.getId()).stream()
                .filter(naoSelecionado)
                .sorted(Curso.POR_NOTA_DECRESCENTE)
                .limit(Math.max(0, RECOMENDACOES - porCargo.size()))
                .forEach(curso -> {
                    porCargo.add(Map.of("curso", curso, "motivo", "Entre os mais bem avaliados do catálogo"));
                    usados.add(curso.getId());
                });

        Map<String, Object> continuidade = null;
        for (int concluido : matriculas.cursosConcluidos(u.getId())) {
            List<Curso> relacionados = cursos.relacionados(concluido, u.getId(), RECOMENDACOES);
            if (relacionados.isEmpty()) continue;
            List<Map<String, Object>> proximos = new ArrayList<>();
            for (Curso curso : relacionados) {
                proximos.add(Map.of("curso", curso, "motivo", "Complementa um curso que você concluiu"));
            }
            continuidade = new LinkedHashMap<>();
            continuidade.put("baseadoEm", cursos.resumo(concluido).titulo());
            continuidade.put("cursos", proximos);
            break;
        }

        Map<String, Object> perfil = new LinkedHashMap<>();
        perfil.put("cargo", u.getCargo());
        perfil.put("departamento", u.getDepartamento());

        Map<String, Object> json = new LinkedHashMap<>();
        json.put("perfil", perfil);
        json.put("porCargo", porCargo);
        json.put("continuidade", continuidade);
        return json;
    }
}
