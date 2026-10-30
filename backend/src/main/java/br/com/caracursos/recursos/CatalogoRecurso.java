package br.com.caracursos.recursos;

import java.sql.SQLException;
import java.util.LinkedHashMap;
import java.util.Map;

import br.com.caracursos.dao.CursoDAO;
import br.com.caracursos.http.ApiException;
import br.com.caracursos.http.Requisicao;
import br.com.caracursos.http.Roteador;
import br.com.caracursos.model.Curso;
import br.com.caracursos.seguranca.Permissao;

/** Catálogo: {@code /cursos}, {@code /cursos/categorias}, {@code /cursos/destaques}, {@code /areas}. */
public class CatalogoRecurso {

    public void registrar(Roteador r) {
        r.get("/cursos", Permissao.AUTENTICADO, this::listar);
        r.get("/cursos/categorias", Permissao.AUTENTICADO, req -> new CursoDAO(req.conexao()).categorias());
        r.get("/cursos/destaques", Permissao.AUTENTICADO, this::destaques);
        r.get("/cursos/{id}", Permissao.AUTENTICADO, this::buscar);
        r.get("/areas", Permissao.AUTENTICADO, req -> new CursoDAO(req.conexao()).areas());
    }

    private Object listar(Requisicao req) throws SQLException {
        CursoDAO.Filtro filtro = new CursoDAO.Filtro(req.parametro("q"), req.parametro("categoria"),
                req.parametro("area"), req.parametro("nivel"));
        return new CursoDAO(req.conexao()).listar(filtro, req.idUsuario(), req.parametroInt("pagina", 1),
                req.parametroInt("porPagina", 12));
    }

    private Object buscar(Requisicao req) throws SQLException {
        Curso curso = new CursoDAO(req.conexao()).buscar(req.idCaminho("id"), req.idUsuario());
        if (curso == null) throw ApiException.naoEncontrado("Este curso não existe ou foi removido do catálogo.");
        return curso;
    }

    private Object destaques(Requisicao req) throws SQLException {
        CursoDAO cursos = new CursoDAO(req.conexao());
        int usuario = req.idUsuario();
        Map<String, Object> json = new LinkedHashMap<>();
        json.put("principal", cursos.destaqueDoMes(usuario));
        json.put("semana", cursos.emDestaque(usuario));
        json.put("lancamentos", cursos.lancamentos(usuario));
        return json;
    }
}
