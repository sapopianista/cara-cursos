package br.com.caracursos.recursos;

import java.sql.Connection;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import br.com.caracursos.dao.ColaboradorDAO;
import br.com.caracursos.dao.EmpresaDAO;
import br.com.caracursos.dao.UsuarioDAO;
import br.com.caracursos.http.ApiException;
import br.com.caracursos.http.Arquivo;
import br.com.caracursos.http.Requisicao;
import br.com.caracursos.http.Roteador;
import br.com.caracursos.model.Colaborador;
import br.com.caracursos.model.Usuario;
import br.com.caracursos.seguranca.Permissao;
import br.com.caracursos.seguranca.Senhas;
import br.com.caracursos.service.ColaboradorService;
import br.com.caracursos.util.Csv;
import br.com.caracursos.util.Email;
import br.com.caracursos.util.Relogio;

/** Painel da empresa: {@code /admin/colaboradores}. */
public class ColaboradorRecurso {

    private static final List<Integer> NIVEIS = List.of(1, 2, 3, 4);
    private static final Map<String, String> STATUS_CSV = Map.of(
            "ativo", "Ativo", "pendente", "Aguardando 1º acesso", "inativo", "Inativo");
    private static final DateTimeFormatter DATA_HORA_CSV =
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm").withZone(Relogio.FUSO_EMPRESA);

    private final ColaboradorService servico = new ColaboradorService();

    public void registrar(Roteador r) {
        Permissao p = Permissao.ADMIN_COLABORADORES;
        r.get("/admin/colaboradores", p, this::listar);
        r.get("/admin/colaboradores/resumo", p, req -> servico.resumo(req.conexao()));
        r.get("/admin/colaboradores/opcoes", p, this::opcoes);
        r.get("/admin/colaboradores/exportar", p, this::exportar);
        r.post("/admin/colaboradores", p, this::criar);
        r.put("/admin/colaboradores/{id}", p, this::atualizar);
        r.patch("/admin/colaboradores/{id}/status", p, this::alterarStatus);
        r.get("/admin/colaboradores/{id}/progresso", p,
                req -> servico.progresso(req.conexao(), req.idCaminho("id")));
        r.put("/admin/colaboradores/{id}/senha", p, this::redefinirSenha);
    }

    private static ColaboradorDAO.Filtro filtro(Requisicao req) {
        return new ColaboradorDAO.Filtro(req.parametro("busca"), req.parametro("status"), req.parametro("departamento"));
    }

    private Object listar(Requisicao req) throws SQLException {
        return new ColaboradorDAO(req.conexao()).listar(filtro(req), req.parametroInt("pagina", 1),
                req.parametroInt("porPagina", 10));
    }

    private Object opcoes(Requisicao req) throws SQLException {
        ColaboradorDAO dao = new ColaboradorDAO(req.conexao());
        return Map.of("cargos", dao.cargos(), "departamentos", dao.departamentos(), "niveis", NIVEIS);
    }

    private static ColaboradorService.Dados validar(Requisicao req, Integer idAtual, int nivelPadrao)
            throws SQLException {
        Connection c = req.conexao();
        ColaboradorDAO dao = new ColaboradorDAO(c);
        String nome = req.texto("nome");
        String email = Email.normalizar(req.texto("email"));
        String cargo = req.texto("cargo");
        String departamento = req.texto("departamento");
        Integer nivel = req.inteiro("nivel");

        Map<String, String> campos = new LinkedHashMap<>();
        if (nome == null) campos.put("nome", "Informe o nome completo.");
        else if (nome.length() > 120) campos.put("nome", "Use no máximo 120 caracteres.");
        if (!Email.valido(email)) {
            campos.put("email", "Informe um e-mail válido.");
        } else {
            List<String> dominios = new EmpresaDAO(c).dominiosAutorizados();
            if (!Email.dominioAutorizado(email, dominios)) {
                campos.put("email", "Use um domínio autorizado: " + String.join(", ", dominios) + ".");
            } else if (new UsuarioDAO(c).emailEmUso(email, idAtual)) {
                campos.put("email", "Já existe um colaborador com este e-mail.");
            }
        }
        if (cargo == null || !dao.cargos().contains(cargo)) campos.put("cargo", "Escolha um cargo.");
        if (departamento == null || !dao.departamentos().contains(departamento)) {
            campos.put("departamento", "Escolha um departamento.");
        }
        if (nivel != null && !NIVEIS.contains(nivel)) campos.put("nivel", "Escolha um nível de 1 a 4.");
        if (!campos.isEmpty()) throw ApiException.validacao(campos);
        return new ColaboradorService.Dados(nome, email, cargo, departamento, nivel == null ? nivelPadrao : nivel);
    }

    private Object criar(Requisicao req) throws SQLException {
        String senha = req.textoOriginal("senhaInicial");
        String problema = Senhas.problema(senha);
        ColaboradorService.Dados d;
        try {
            d = validar(req, null, 1);
        } catch (ApiException e) {
            if (problema == null || e.getCampos() == null) throw e;
            Map<String, String> campos = new LinkedHashMap<>(e.getCampos());
            campos.put("senhaInicial", problema);
            throw ApiException.validacao(campos);
        }
        if (problema != null) throw ApiException.validacao(Map.of("senhaInicial", problema));
        return servico.criar(req.conexao(), d, senha);
    }

    private Usuario existente(Requisicao req) throws SQLException {
        Usuario u = new UsuarioDAO(req.conexao()).buscarPorId(req.idCaminho("id"));
        if (u == null) throw ApiException.naoEncontrado("Colaborador não encontrado.");
        return u;
    }

    private Object atualizar(Requisicao req) throws SQLException {
        Usuario u = existente(req);
        ColaboradorService.Dados d = validar(req, u.getId(), u.getNivel());
        return servico.atualizar(req.conexao(), u, d);
    }

    private Object alterarStatus(Requisicao req) throws SQLException {
        Usuario u = existente(req);
        String valor = req.texto("status");
        if (!"ativo".equals(valor) && !"inativo".equals(valor)) {
            throw ApiException.validacao(Map.of("status", "Use \"ativo\" ou \"inativo\"."));
        }
        return servico.alterarStatus(req.conexao(), u, req.idUsuario(), Usuario.Status.deValorBanco(valor));
    }

    private Object redefinirSenha(Requisicao req) throws SQLException {
        servico.redefinirSenha(req.conexao(), req.usuario(), existente(req), req.textoOriginal("senha"));
        return null;
    }

    private Object exportar(Requisicao req) throws SQLException {
        ZoneId fuso = new EmpresaDAO(req.conexao()).fusoHorario();
        DateTimeFormatter dataHora = DATA_HORA_CSV.withZone(fuso);
        List<Colaborador> lista = new ColaboradorDAO(req.conexao()).listarTodos(filtro(req));
        Csv csv = new Csv("Matrícula", "Nome", "E-mail", "Cargo", "Departamento", "Nível", "Progresso (%)",
                "Último acesso", "Status");
        for (Colaborador c : lista) {
            csv.linha(c.matricula(), c.nome(), c.email(), c.cargo(), c.departamento(), c.nivel(), c.progresso(),
                    c.ultimoAcesso() == null ? "" : dataHora.format(c.ultimoAcesso()),
                    STATUS_CSV.getOrDefault(c.status(), c.status()));
        }
        String nome = "colaboradores-" + LocalDate.now(fuso) + ".csv";
        return new Arquivo(nome, "text/csv; charset=UTF-8", csv.bytes());
    }
}
