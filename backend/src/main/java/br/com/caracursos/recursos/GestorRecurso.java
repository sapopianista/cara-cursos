package br.com.caracursos.recursos;

import java.sql.SQLException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import br.com.caracursos.dao.AuditoriaDAO;
import br.com.caracursos.dao.GestorDAO;
import br.com.caracursos.dao.GestorDAO.Gestor;
import br.com.caracursos.dao.UsuarioDAO;
import br.com.caracursos.http.ApiException;
import br.com.caracursos.http.Requisicao;
import br.com.caracursos.http.Roteador;
import br.com.caracursos.model.Usuario;
import br.com.caracursos.model.Usuario.TipoPerfil;
import br.com.caracursos.seguranca.Permissao;
import br.com.caracursos.util.Relogio;

/**
 * Painel da empresa: {@code /admin/gestores} e {@code /admin/auditoria}.
 *
 * <p>O convite ainda não envia e-mail (depende de SMTP; ver PLANO.md): o papel vale na
 * hora, e o gestor aparece como "pendente" até entrar no sistema.
 */
public class GestorRecurso {

    public record Papel(String id, String nome, String descricao) {
    }

    /** Papéis administrativos, na ordem em que aparecem na tela. */
    static final List<Papel> PAPEIS = List.of(
            new Papel("admin", "Administrador", "Acesso total, incluindo faturamento e permissões."),
            new Papel("rh", "Gestor de RH", "Gerencia colaboradores, relatórios e configurações de aprendizagem."),
            new Papel("lider", "Líder de equipe", "Acompanha o progresso das pessoas da sua equipe."),
            new Papel("financeiro", "Financeiro", "Acessa faturas, notas fiscais e licenças."));

    private static final int LIMITE_AUDITORIA = 10;

    public void registrar(Roteador r) {
        Permissao p = Permissao.ADMIN_GESTORES;
        r.get("/admin/gestores", p, this::listar);
        r.post("/admin/gestores", p, this::convidar);
        r.patch("/admin/gestores/{id}", p, this::alterarPapel);
        r.delete("/admin/gestores/{id}", p, this::revogar);
        r.post("/admin/gestores/{id}/convite", p, this::reenviarConvite);
        r.get("/admin/auditoria", p, req -> new AuditoriaDAO(req.conexao()).ultimos(LIMITE_AUDITORIA));
    }

    private static String nomePapel(TipoPerfil papel) {
        return PAPEIS.stream().filter(p -> p.id().equals(papel.getValorBanco())).findFirst()
                .map(Papel::nome).orElse(papel.getValorBanco());
    }

    /** Papel administrativo vindo do corpo; {@code null} se ausente ou inválido. */
    private static TipoPerfil papel(Requisicao req) {
        String valor = req.texto("papel");
        if (valor == null || PAPEIS.stream().noneMatch(p -> p.id().equals(valor))) return null;
        return TipoPerfil.deValorBanco(valor);
    }

    private static ApiException semAdmin() {
        return ApiException.conflito("ULTIMO_ADMIN", "A empresa precisa de pelo menos um Administrador ativo.");
    }

    private Object listar(Requisicao req) throws SQLException {
        GestorDAO dao = new GestorDAO(req.conexao());
        Map<String, Object> json = new LinkedHashMap<>();
        json.put("gestores", dao.listar());
        json.put("papeis", PAPEIS);
        json.put("candidatos", dao.candidatos());
        return json;
    }

    private Gestor existente(Requisicao req) throws SQLException {
        Gestor g = new GestorDAO(req.conexao()).buscar(req.idCaminho("id"));
        if (g == null) throw ApiException.naoEncontrado("Gestor não encontrado.");
        return g;
    }

    private Object convidar(Requisicao req) throws SQLException {
        Integer colaboradorId = req.inteiro("colaboradorId");
        TipoPerfil papel = papel(req);
        Usuario colaborador = colaboradorId == null ? null : new UsuarioDAO(req.conexao()).buscarPorId(colaboradorId);

        Map<String, String> campos = new LinkedHashMap<>();
        if (colaborador == null || colaborador.getStatus() == Usuario.Status.INATIVO) {
            campos.put("colaboradorId", "Escolha um colaborador.");
        } else if (new GestorDAO(req.conexao()).buscar(colaborador.getId()) != null) {
            campos.put("colaboradorId", "Este colaborador já é gestor.");
        }
        if (papel == null) campos.put("papel", "Escolha um papel.");
        if (!campos.isEmpty()) throw ApiException.validacao(campos);

        req.transacao(c -> {
            new GestorDAO(c).inserir(colaborador.getId(), papel, Relogio.agora());
            new AuditoriaDAO(c).registrar(req.usuario(), "Convite enviado",
                    "convidou " + colaborador.getNome() + " como " + nomePapel(papel) + ".");
            return null;
        });
        return new GestorDAO(req.conexao()).buscar(colaborador.getId());
    }

    private Object alterarPapel(Requisicao req) throws SQLException {
        Gestor g = existente(req);
        TipoPerfil papel = papel(req);
        if (papel == null) throw ApiException.validacao(Map.of("papel", "Escolha um papel."));
        if (papel.getValorBanco().equals(g.papel())) return g;

        req.transacao(c -> {
            GestorDAO dao = new GestorDAO(c);
            boolean deixaDeSerAdmin = "admin".equals(g.papel()) && "ativo".equals(g.status());
            if (deixaDeSerAdmin && dao.contarAdminsAtivosTravando() <= 1) throw semAdmin();
            dao.definirPapel(g.id(), papel);
            new AuditoriaDAO(c).registrar(req.usuario(), "Permissão alterada",
                    "definiu " + g.nome() + " como " + nomePapel(papel) + ".");
            return null;
        });
        return new GestorDAO(req.conexao()).buscar(g.id());
    }

    private Object revogar(Requisicao req) throws SQLException {
        Gestor g = existente(req);
        if (g.id() == req.idUsuario()) {
            throw ApiException.conflito("PROPRIO_ACESSO", "Você não pode revogar o próprio acesso.");
        }
        req.transacao(c -> {
            GestorDAO dao = new GestorDAO(c);
            boolean eraAdmin = "admin".equals(g.papel()) && "ativo".equals(g.status());
            if (eraAdmin && dao.contarAdminsAtivosTravando() <= 1) throw semAdmin();
            dao.remover(g.id());
            new AuditoriaDAO(c).registrar(req.usuario(), "Acesso revogado",
                    "revogou o acesso administrativo de " + g.nome() + ".");
            return null;
        });
        return null;
    }

    private Object reenviarConvite(Requisicao req) throws SQLException {
        Gestor g = existente(req);
        if (!"pendente".equals(g.status())) {
            throw ApiException.conflito("CONVITE_ACEITO", "Este gestor já aceitou o convite.");
        }
        req.transacao(c -> {
            new GestorDAO(c).reenviarConvite(g.id(), Relogio.agora());
            new AuditoriaDAO(c).registrar(req.usuario(), "Convite reenviado",
                    "reenviou o convite de " + g.nome() + ".");
            return null;
        });
        return new GestorDAO(req.conexao()).buscar(g.id());
    }
}
