package br.com.caracursos.service;

import java.sql.Connection;
import java.sql.SQLException;
import java.time.Instant;
import java.util.Map;

import br.com.caracursos.dao.AulaDAO;
import br.com.caracursos.dao.CertificadoDAO;
import br.com.caracursos.dao.CursoDAO;
import br.com.caracursos.dao.EmpresaDAO;
import br.com.caracursos.dao.MatriculaDAO;
import br.com.caracursos.dao.NotificacaoDAO;
import br.com.caracursos.dao.TrilhaDAO;
import br.com.caracursos.http.ApiException;
import br.com.caracursos.model.Aula;
import br.com.caracursos.model.CursoResumo;

/**
 * Regras de progresso do aluno. Chamar sempre dentro de uma transação:
 * concluir uma aula recalcula o curso, e concluir o curso pode emitir certificados.
 */
public final class AprendizagemService {

    private static final int PRESENCA_MINIMA_AVALIACAO = 80;

    private AprendizagemService() {
    }

    /** Conclui a aula e devolve o novo progresso do curso (0–100). */
    public static int concluirAula(Connection c, int idUsuario, int idCurso, Aula aula, Instant agora)
            throws SQLException {
        EmpresaDAO.Politicas politicas = new EmpresaDAO(c).politicas();
        AulaDAO aulas = new AulaDAO(c);
        if ("avaliacao".equals(aula.tipo()) && politicas.exigirPresencaMinima()
                && aulas.presencaNasAulas(idUsuario, idCurso) < PRESENCA_MINIMA_AVALIACAO) {
            throw ApiException.conflito("PRESENCA_MINIMA",
                    "Conclua pelo menos 80% das aulas antes de realizar a avaliação.");
        }
        MatriculaDAO matriculas = new MatriculaDAO(c);
        matriculas.garantir(idUsuario, idCurso, agora);
        aulas.concluir(idUsuario, aula.id(), aula.duracaoSegundos(), agora);
        int progresso = aulas.progressoDoCurso(idUsuario, idCurso);
        matriculas.atualizarProgresso(idUsuario, idCurso, progresso, agora);
        if (progresso >= 100 && politicas.certificacaoAutomatica()) {
            emitirCertificados(c, idUsuario, idCurso, agora);
        }
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
