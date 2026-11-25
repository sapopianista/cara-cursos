package br.com.caracursos.recursos;

import java.sql.SQLException;

import br.com.caracursos.dao.AuditoriaDAO;
import br.com.caracursos.http.Requisicao;
import br.com.caracursos.http.Roteador;
import br.com.caracursos.model.Usuario.TipoPerfil;
import br.com.caracursos.seguranca.Permissao;
import br.com.caracursos.service.GestorService;

/**
 * Painel da empresa: {@code /admin/gestores} e {@code /admin/auditoria}.
 *
 * <p>Não há envio de e-mail: o papel vale na hora, e o gestor aparece como "pendente"
 * até entrar no painel (quem convida avisa a pessoa).
 */
public class GestorRecurso {

    private static final int LIMITE_AUDITORIA = 10;

    private final GestorService servico = new GestorService();

    public void registrar(Roteador r) {
        Permissao p = Permissao.ADMIN_GESTORES;
        r.get("/admin/gestores", p, req -> servico.listar(req.conexao()));
        r.post("/admin/gestores", p, this::convidar);
        r.patch("/admin/gestores/{id}", p, this::alterarPapel);
        r.delete("/admin/gestores/{id}", p, this::revogar);
        r.post("/admin/gestores/{id}/convite", p, this::reenviarConvite);
        r.get("/admin/auditoria", p, req -> new AuditoriaDAO(req.conexao()).ultimos(LIMITE_AUDITORIA));
    }

    /** Papel administrativo vindo do corpo; {@code null} se ausente ou inválido. */
    private static TipoPerfil papel(Requisicao req) {
        String valor = req.texto("papel");
        if (valor == null || GestorService.PAPEIS.stream().noneMatch(p -> p.id().equals(valor))) return null;
        return TipoPerfil.deValorBanco(valor);
    }

    private Object convidar(Requisicao req) throws SQLException {
        return servico.convidar(req.conexao(), req.usuario(), req.inteiro("colaboradorId"), papel(req));
    }

    private Object alterarPapel(Requisicao req) throws SQLException {
        return servico.alterarPapel(req.conexao(), req.usuario(), req.idCaminho("id"), papel(req));
    }

    private Object revogar(Requisicao req) throws SQLException {
        servico.revogar(req.conexao(), req.usuario(), req.idCaminho("id"));
        return null;
    }

    private Object reenviarConvite(Requisicao req) throws SQLException {
        return servico.reenviarConvite(req.conexao(), req.usuario(), req.idCaminho("id"));
    }
}
