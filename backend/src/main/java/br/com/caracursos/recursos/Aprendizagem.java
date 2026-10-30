package br.com.caracursos.recursos;

import java.sql.Connection;
import java.sql.SQLException;
import java.time.Instant;
import java.util.Map;

import br.com.caracursos.dao.AulaDAO;
import br.com.caracursos.dao.CertificadoDAO;
import br.com.caracursos.dao.CursoDAO;
import br.com.caracursos.dao.MatriculaDAO;
import br.com.caracursos.dao.NotificacaoDAO;
import br.com.caracursos.dao.TrilhaDAO;
import br.com.caracursos.model.CursoResumo;

/**
 * Regras de progresso do aluno. Chamar sempre dentro de uma transação:
 * concluir uma aula recalcula o curso, e concluir o curso pode emitir certificados.
 */
final class Aprendizagem {

    private Aprendizagem() {
    }

    /** Conclui a aula e devolve o novo progresso do curso (0–100). */
    static int concluirAula(Connection c, int idUsuario, int idCurso, AulaDAO.Aula aula, Instant agora)
            throws SQLException {
        MatriculaDAO matriculas = new MatriculaDAO(c);
        AulaDAO aulas = new AulaDAO(c);
        matriculas.garantir(idUsuario, idCurso, agora);
        aulas.concluir(idUsuario, aula.id(), aula.duracaoSegundos(), agora);
        int progresso = aulas.progressoDoCurso(idUsuario, idCurso);
        matriculas.atualizarProgresso(idUsuario, idCurso, progresso, agora);
        if (progresso >= 100) emitirCertificados(c, idUsuario, idCurso, agora);
        return progresso;
    }

    /** Certificado do curso e, se o curso fechou um nível inteiro, também o do nível. */
    private static void emitirCertificados(Connection c, int idUsuario, int idCurso, Instant agora)
            throws SQLException {
        CertificadoDAO certificados = new CertificadoDAO(c);
        NotificacaoDAO notificacoes = new NotificacaoDAO(c);
        CursoResumo curso = new CursoDAO(c).resumo(idCurso);
        if (certificados.emitirSeNovo(idUsuario, "curso", idCurso, curso.titulo(), "Curso", agora)) {
            notificacoes.criar(idUsuario, "Certificado disponível",
                    "Você concluiu " + curso.titulo() + ". O certificado já está em Meu progresso.", "/progresso", agora);
        }

        Map<Integer, Integer> progresso = new MatriculaDAO(c).progressoPorCurso(idUsuario);
        for (TrilhaDAO.Nivel nivel : new TrilhaDAO(c).niveis()) {
            if (!nivel.cursoIds().contains(idCurso)) continue;
            boolean completo = nivel.cursoIds().stream().allMatch(id -> progresso.getOrDefault(id, 0) >= 100);
            if (completo && certificados.emitirSeNovo(idUsuario, "nivel", nivel.id(), nivel.titulo(),
                    "Nível " + nivel.ordem(), agora)) {
                notificacoes.criar(idUsuario, "Nível concluído",
                        "Você completou o nível " + nivel.titulo() + ".", "/progresso", agora);
            }
        }
    }
}
