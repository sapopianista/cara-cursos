package br.com.caracursos.recursos;

import java.sql.SQLException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import br.com.caracursos.dao.SuporteDAO;
import br.com.caracursos.http.ApiException;
import br.com.caracursos.http.Requisicao;
import br.com.caracursos.http.Roteador;
import br.com.caracursos.seguranca.Permissao;

/**
 * Central de suporte: {@code /suporte} e {@code /suporte/chamados}.
 * O escopo "aluno" é de qualquer usuário; "gestor" (Ajuda do painel) exige um papel de gestão.
 */
public class SuporteRecurso {

    private static final Map<String, List<String>> ASSUNTOS = Map.of(
            "aluno", List.of("Dúvida sobre o conteúdo", "Problema técnico com vídeo", "Certificado", "Outro assunto"),
            "gestor", List.of("Trilhas e cursos", "Faturamento e licenças", "Integrações e API", "Segurança e LGPD"));

    private static final Map<String, Map<String, String>> CONTATO = Map.of(
            "aluno", Map.of(
                    "canal", "Equipe pedagógica e técnica",
                    "tempoResposta", "Resposta em até 2 horas úteis, no seu e-mail corporativo."),
            "gestor", Map.of(
                    "canal", "Gerente de sucesso dedicado",
                    "nome", "Camila Fontes",
                    "email", "camila.fontes@caracursos.com.br",
                    "tempoResposta", "Segunda a sexta, das 9h às 18h. Resposta em até 1 hora útil."));

    private static final int MAX_TITULO = 150;
    private static final int MIN_DESCRICAO = 10;
    private static final int MAX_DESCRICAO = 5000;

    public void registrar(Roteador r) {
        r.get("/suporte", Permissao.AUTENTICADO, this::central);
        r.post("/suporte/chamados", Permissao.AUTENTICADO, this::abrirChamado);
    }

    /** Valida o escopo e se o usuário pode usá-lo. */
    private static String escopo(Requisicao req, String valor) {
        if (!"aluno".equals(valor) && !"gestor".equals(valor)) {
            throw ApiException.requisicaoInvalida("Escopo inválido: use \"aluno\" ou \"gestor\".");
        }
        if ("gestor".equals(valor) && !Permissao.ADMIN_AJUDA.permite(req.usuario().getTipoPerfil())) {
            throw ApiException.proibido("Você não tem permissão para esta ação.");
        }
        return valor;
    }

    private static List<SuporteDAO.Chamado> chamados(SuporteDAO dao, Requisicao req, String escopo)
            throws SQLException {
        return "aluno".equals(escopo) ? dao.chamadosDoAluno(req.idUsuario()) : dao.chamadosDaEmpresa();
    }

    private Object central(Requisicao req) throws SQLException {
        String escopo = escopo(req, req.parametro("escopo"));
        SuporteDAO dao = new SuporteDAO(req.conexao());
        Map<String, Object> json = new LinkedHashMap<>();
        json.put("faq", dao.faq(escopo));
        json.put("contato", CONTATO.get(escopo));
        json.put("assuntos", ASSUNTOS.get(escopo));
        json.put("cursos", "aluno".equals(escopo) ? dao.cursos() : List.of());
        json.put("chamados", chamados(dao, req, escopo));
        return json;
    }

    private Object abrirChamado(Requisicao req) throws SQLException {
        String escopo = escopo(req, req.texto("escopo"));
        SuporteDAO dao = new SuporteDAO(req.conexao());
        String assunto = req.texto("assunto");
        String titulo = req.texto("titulo");
        String descricao = req.texto("descricao");
        // O formulário manda "" quando nenhum curso foi escolhido.
        Integer cursoId = "aluno".equals(escopo) && req.texto("cursoId") != null ? req.inteiro("cursoId") : null;

        Map<String, String> campos = new LinkedHashMap<>();
        if (assunto == null || !ASSUNTOS.get(escopo).contains(assunto)) campos.put("assunto", "Escolha um assunto.");
        if (titulo == null) campos.put("titulo", "Resuma o problema em poucas palavras.");
        else if (titulo.length() > MAX_TITULO) campos.put("titulo", "Use no máximo " + MAX_TITULO + " caracteres.");
        if (descricao == null || descricao.length() < MIN_DESCRICAO) {
            campos.put("descricao", "Descreva com pelo menos " + MIN_DESCRICAO + " caracteres.");
        } else if (descricao.length() > MAX_DESCRICAO) {
            campos.put("descricao", "Use no máximo " + MAX_DESCRICAO + " caracteres.");
        }
        if (req.texto("cursoId") != null && "aluno".equals(escopo) && (cursoId == null || !dao.cursoExiste(cursoId))) {
            campos.put("cursoId", "Escolha um curso da lista.");
        }
        if (!campos.isEmpty()) throw ApiException.validacao(campos);

        int id = dao.criar(req.idUsuario(), escopo, assunto, titulo, cursoId, descricao);
        return dao.buscar(id);
    }
}
