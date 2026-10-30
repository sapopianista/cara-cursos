package br.com.caracursos.recursos;

import java.sql.SQLException;

import com.google.gson.JsonObject;

import br.com.caracursos.dao.CursoDAO;
import br.com.caracursos.dao.TrilhaDAO;
import br.com.caracursos.http.ApiException;
import br.com.caracursos.http.Json;
import br.com.caracursos.http.Requisicao;
import br.com.caracursos.http.Roteador;
import br.com.caracursos.seguranca.Permissao;

/** {@code /trilhas}: lista e detalhe (com os cursos na ordem sugerida). */
public class TrilhaRecurso {

    public void registrar(Roteador r) {
        r.get("/trilhas", Permissao.AUTENTICADO, req -> new TrilhaDAO(req.conexao()).listar(req.idUsuario()));
        r.get("/trilhas/{id}", Permissao.AUTENTICADO, this::buscar);
    }

    private Object buscar(Requisicao req) throws SQLException {
        TrilhaDAO trilhas = new TrilhaDAO(req.conexao());
        int id = req.idCaminho("id");
        TrilhaDAO.Trilha trilha = trilhas.buscar(id, req.idUsuario());
        if (trilha == null) throw ApiException.naoEncontrado("Esta trilha não existe.");
        JsonObject json = Json.objeto(trilha);
        json.add("cursos", Json.arvore(new CursoDAO(req.conexao()).listarPorIds(trilhas.cursosDaTrilha(id),
                req.idUsuario())));
        return json;
    }
}
