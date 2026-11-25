package br.com.caracursos.recursos;

import java.nio.charset.StandardCharsets;
import java.sql.SQLException;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import com.google.gson.JsonObject;

import br.com.caracursos.dao.AtividadeDAO;
import br.com.caracursos.dao.AulaDAO;
import br.com.caracursos.dao.CursoDAO;
import br.com.caracursos.dao.EmpresaDAO;
import br.com.caracursos.dao.MatriculaDAO;
import br.com.caracursos.dao.TrilhaDAO;
import br.com.caracursos.http.ApiException;
import br.com.caracursos.http.Arquivo;
import br.com.caracursos.http.Json;
import br.com.caracursos.http.Requisicao;
import br.com.caracursos.http.Roteador;
import br.com.caracursos.model.Aula;
import br.com.caracursos.model.Curso;
import br.com.caracursos.seguranca.Permissao;
import br.com.caracursos.service.AprendizagemService;
import br.com.caracursos.util.Relogio;
import br.com.caracursos.util.TabelaPdf;
import br.com.caracursos.util.TabelaPdf.Coluna;

/** Sala de aula: conteúdo do curso, progresso por aula e entrega de atividades. */
public class SalaRecurso {

    private static final int RESPOSTA_MAXIMA = 10_000;

    public void registrar(Roteador r) {
        r.get("/cursos/{id}/sala", Permissao.AUTENTICADO, this::sala);
        r.put("/cursos/{id}/aulas/{aulaId}/progresso", Permissao.AUTENTICADO, this::salvarProgresso);
        r.post("/cursos/{id}/aulas/{aulaId}/conclusao", Permissao.AUTENTICADO, this::concluir);
        r.post("/atividades/{id}/entregas", Permissao.AUTENTICADO, this::entregar);
        r.get("/materiais/{id}/arquivo", Permissao.AUTENTICADO, this::baixarMaterial);
    }

    private Object sala(Requisicao req) throws SQLException {
        int idCurso = req.idCaminho("id");
        int usuario = req.idUsuario();
        CursoDAO cursos = new CursoDAO(req.conexao());
        Curso curso = cursos.buscar(idCurso, usuario);
        if (curso == null) throw ApiException.naoEncontrado("Este curso não existe ou foi removido do catálogo.");

        List<Aula> aulas = new AulaDAO(req.conexao()).listar(idCurso, usuario);
        // Onde o aluno parou: a aula em andamento; senão a primeira pendente; senão a primeira.
        Aula atual = aulas.stream().filter(a -> a.status().equals("em_andamento")).findFirst()
                .or(() -> aulas.stream().filter(a -> a.status().equals("pendente")).findFirst())
                .orElse(aulas.isEmpty() ? null : aulas.getFirst());

        EmpresaDAO.Politicas politicas = new EmpresaDAO(req.conexao()).politicas();
        List<CursoDAO.Material> materiais = cursos.materiais(idCurso);
        if (!politicas.permitirDownloadMateriais()) {
            materiais = materiais.stream()
                    .map(m -> new CursoDAO.Material(m.id(), m.nome(), m.tamanhoBytes(), null))
                    .toList();
        }

        JsonObject cursoJson = Json.objeto(curso);
        cursoJson.add("trilha", Json.arvore(new TrilhaDAO(req.conexao()).trilhaDoCurso(idCurso)));

        boolean permitirDownload = new EmpresaDAO(req.conexao()).politicas().permitirDownloadMateriais();
        List<CursoDAO.Material> materiais = cursos.materiais(idCurso).stream()
                .map(m -> permitirDownload ? m : new CursoDAO.Material(m.id(), m.nome(), m.tamanhoBytes(), null))
                .toList();

        Map<String, Object> json = new LinkedHashMap<>();
        json.put("curso", cursoJson);
        json.put("aulas", aulas);
        json.put("aulaAtualId", atual == null ? null : atual.id());
        json.put("materiais", materiais);

        json.put("atividades", new AtividadeDAO(req.conexao()).doCurso(idCurso, usuario));
        return json;
    }

    private Aula aulaDoCaminho(Requisicao req) throws SQLException {
        Aula aula = new AulaDAO(req.conexao()).buscar(req.idCaminho("id"), req.idCaminho("aulaId"),
                req.idUsuario());
        if (aula == null) throw ApiException.naoEncontrado("Aula não encontrada.");
        return aula;
    }

    private Object salvarProgresso(Requisicao req) throws SQLException {
        Aula aula = aulaDoCaminho(req);
        Double posicao = req.numero("posicaoSegundos");
        if (posicao == null || posicao < 0 || posicao.isNaN()) {
            throw ApiException.validacao("Posição do vídeo inválida.",
                    Map.of("posicaoSegundos", "Informe a posição em segundos."));
        }
        int segundos = (int) Math.min(Math.round(posicao), aula.duracaoSegundos());
        int idCurso = req.idCaminho("id");
        Instant agora = Relogio.agora();
        req.transacao(c -> {
            new MatriculaDAO(c).garantir(req.idUsuario(), idCurso, agora);
            new AulaDAO(c).salvarPosicao(req.idUsuario(), aula.id(), segundos, agora);
            return null;
        });
        return null;
    }

    private Object concluir(Requisicao req) throws SQLException {
        Aula aula = aulaDoCaminho(req);
        int idCurso = req.idCaminho("id");
        Instant agora = Relogio.agora();
        int progresso = req.transacao(c -> AprendizagemService.concluirAula(c, req.idUsuario(), idCurso, aula, agora));

        Map<String, Object> json = new LinkedHashMap<>();
        json.put("aula", new AulaDAO(req.conexao()).buscar(idCurso, aula.id(), req.idUsuario()));
        json.put("progressoCurso", progresso);
        return json;
    }

    private Object entregar(Requisicao req) throws SQLException {
        AtividadeDAO atividades = new AtividadeDAO(req.conexao());
        int id = req.idCaminho("id");
        if (atividades.buscar(id, req.idUsuario()) == null) throw ApiException.naoEncontrado("Atividade não encontrada.");
        String resposta = req.texto("resposta");
        if (resposta == null) {
            throw ApiException.validacao("Escreva sua resposta antes de entregar.",
                    Map.of("resposta", "Escreva sua resposta."));
        }
        if (resposta.length() > RESPOSTA_MAXIMA) {
            throw ApiException.validacao(Map.of("resposta", "Use no máximo 10.000 caracteres."));
        }
        atividades.entregar(id, req.idUsuario(), resposta, Relogio.agora());
        return atividades.buscar(id, req.idUsuario());
    }

    private Object baixarMaterial(Requisicao req) throws SQLException {
        if (!new EmpresaDAO(req.conexao()).politicas().permitirDownloadMateriais()) {
            throw ApiException.proibido("O download de materiais de apoio está desativado pela organização.");
        }
        CursoDAO.Material m = new CursoDAO(req.conexao()).material(req.idCaminho("id"));
        if (m == null) throw ApiException.naoEncontrado("Material não encontrado.");

        boolean pdf = m.nome().toLowerCase(Locale.ROOT).endsWith(".pdf");
        String tipo = pdf ? "application/pdf" : "application/octet-stream";
        byte[] conteudo = pdf
                ? TabelaPdf.gerar("Material de apoio", m.nome(),
                        List.of(new Coluna("Arquivo", 3, false), new Coluna("Referência", 1.5, true)),
                        List.of(List.of(m.nome(), "Material #" + m.id())))
                : ("Material de apoio demonstrativo — " + m.nome() + "\nCara Cursos\n")
                        .getBytes(StandardCharsets.UTF_8);
        return new Arquivo(m.nome(), tipo, conteudo);
    }
}
