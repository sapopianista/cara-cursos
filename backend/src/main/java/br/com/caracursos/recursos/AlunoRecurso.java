package br.com.caracursos.recursos;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.function.Predicate;

import br.com.caracursos.dao.CertificadoDAO;
import br.com.caracursos.dao.CursoDAO;
import br.com.caracursos.dao.MatriculaDAO;
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
}
