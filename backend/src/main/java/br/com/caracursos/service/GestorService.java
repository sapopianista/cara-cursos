package br.com.caracursos.service;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import br.com.caracursos.dao.AuditoriaDAO;
import br.com.caracursos.dao.GestorDAO;
import br.com.caracursos.dao.UsuarioDAO;
import br.com.caracursos.http.ApiException;
import br.com.caracursos.model.Gestor;
import br.com.caracursos.model.Usuario;
import br.com.caracursos.model.Usuario.TipoPerfil;
import br.com.caracursos.util.Relogio;

/** Regras de negócio para gestão de permissões administrativas. */
public class GestorService {

    public record Papel(String id, String nome, String descricao) {
    }

    /** Papéis administrativos, na ordem em que aparecem na tela. */
    public static final List<Papel> PAPEIS = List.of(
            new Papel("admin", "Administrador", "Acesso total, incluindo faturamento e permissões."),
            new Papel("rh", "Gestor de RH", "Gerencia colaboradores, relatórios e configurações de aprendizagem."),
            new Papel("lider", "Líder de equipe", "Acompanha o progresso das pessoas da sua equipe."),
            new Papel("financeiro", "Financeiro", "Acessa faturas, notas fiscais e licenças."));

    private static String nomePapel(TipoPerfil papel) {
        return PAPEIS.stream().filter(p -> p.id().equals(papel.getValorBanco())).findFirst()
                .map(Papel::nome).orElse(papel.getValorBanco());
    }

    private static ApiException semAdmin() {
        return ApiException.conflito("ULTIMO_ADMIN", "A empresa precisa de pelo menos um Administrador ativo.");
    }

    public Map<String, Object> listar(Connection c) throws SQLException {
        GestorDAO dao = new GestorDAO(c);
        Map<String, Object> json = new LinkedHashMap<>();
        json.put("gestores", dao.listar());
        json.put("papeis", PAPEIS);
        json.put("candidatos", dao.candidatos());
        return json;
    }

    private static Gestor existente(Connection c, int id) throws SQLException {
        Gestor g = new GestorDAO(c).buscar(id);
        if (g == null) throw ApiException.naoEncontrado("Gestor não encontrado.");
        return g;
    }

    public Gestor convidar(Connection c, Usuario autor, Integer colaboradorId, TipoPerfil papel) throws SQLException {
        Usuario colaborador = colaboradorId == null ? null : new UsuarioDAO(c).buscarPorId(colaboradorId);

        Map<String, String> campos = new LinkedHashMap<>();
        if (colaborador == null || colaborador.getStatus() == Usuario.Status.INATIVO) {
            campos.put("colaboradorId", "Escolha um colaborador.");
        } else if (new GestorDAO(c).buscar(colaborador.getId()) != null) {
            campos.put("colaboradorId", "Este colaborador já é gestor.");
        }
        if (papel == null) campos.put("papel", "Escolha um papel.");
        if (!campos.isEmpty()) throw ApiException.validacao(campos);

        Transacao.executar(c, conn -> {
            new GestorDAO(conn).inserir(colaborador.getId(), papel, Relogio.agora());
            new AuditoriaDAO(conn).registrar(autor, "Convite enviado",
                    "convidou " + colaborador.getNome() + " como " + nomePapel(papel) + ".");
            return null;
        });
        return new GestorDAO(c).buscar(colaborador.getId());
    }

    public Gestor alterarPapel(Connection c, Usuario autor, int idGestor, TipoPerfil papel) throws SQLException {
        Gestor g = existente(c, idGestor);
        if (papel == null) throw ApiException.validacao(Map.of("papel", "Escolha um papel."));
        if (papel.getValorBanco().equals(g.papel())) return g;

        Transacao.executar(c, conn -> {
            GestorDAO dao = new GestorDAO(conn);
            boolean deixaDeSerAdmin = "admin".equals(g.papel()) && "ativo".equals(g.status());
            if (deixaDeSerAdmin && dao.contarAdminsAtivosTravando() <= 1) throw semAdmin();
            dao.definirPapel(g.id(), papel);
            new AuditoriaDAO(conn).registrar(autor, "Permissão alterada",
                    "definiu " + g.nome() + " como " + nomePapel(papel) + ".");
            return null;
        });
        return new GestorDAO(c).buscar(g.id());
    }

    public void revogar(Connection c, Usuario autor, int idGestor) throws SQLException {
        Gestor g = existente(c, idGestor);
        if (g.id() == autor.getId()) {
            throw ApiException.conflito("PROPRIO_ACESSO", "Você não pode revogar o próprio acesso.");
        }
        Transacao.executar(c, conn -> {
            GestorDAO dao = new GestorDAO(conn);
            boolean eraAdmin = "admin".equals(g.papel()) && "ativo".equals(g.status());
            if (eraAdmin && dao.contarAdminsAtivosTravando() <= 1) throw semAdmin();
            dao.remover(g.id());
            new AuditoriaDAO(conn).registrar(autor, "Acesso revogado",
                    "revogou o acesso administrativo de " + g.nome() + ".");
            return null;
        });
    }

    public Gestor reenviarConvite(Connection c, Usuario autor, int idGestor) throws SQLException {
        Gestor g = existente(c, idGestor);
        if (!"pendente".equals(g.status())) {
            throw ApiException.conflito("CONVITE_ACEITO", "Este gestor já aceitou o convite.");
        }
        Transacao.executar(c, conn -> {
            new GestorDAO(conn).reenviarConvite(g.id(), Relogio.agora());
            new AuditoriaDAO(conn).registrar(autor, "Convite reenviado",
                    "reenviou o convite de " + g.nome() + ".");
            return null;
        });
        return new GestorDAO(c).buscar(g.id());
    }
}
