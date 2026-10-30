package br.com.caracursos.recursos;

import br.com.caracursos.dao.NotificacaoDAO;
import br.com.caracursos.http.Roteador;
import br.com.caracursos.seguranca.Permissao;

/** {@code /notificacoes}: lista e marcação como lida. */
public class NotificacaoRecurso {

    public void registrar(Roteador r) {
        r.get("/notificacoes", Permissao.AUTENTICADO, req -> new NotificacaoDAO(req.conexao()).listar(req.idUsuario()));
        r.post("/notificacoes/{id}/leitura", Permissao.AUTENTICADO, req -> {
            new NotificacaoDAO(req.conexao()).marcarLida(req.idCaminho("id"), req.idUsuario());
            return null;
        });
        r.post("/notificacoes/leitura", Permissao.AUTENTICADO, req -> {
            new NotificacaoDAO(req.conexao()).marcarTodasLidas(req.idUsuario());
            return null;
        });
    }
}
