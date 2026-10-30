package br.com.caracursos.recursos;

import java.sql.Connection;
import java.sql.SQLException;
import java.sql.SQLIntegrityConstraintViolationException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

import br.com.caracursos.dao.ColaboradorDAO;
import br.com.caracursos.dao.ColaboradorDAO.Colaborador;
import br.com.caracursos.dao.MatriculaDAO;
import br.com.caracursos.dao.SessaoDAO;
import br.com.caracursos.dao.UsuarioDAO;
import br.com.caracursos.http.ApiException;
import br.com.caracursos.http.Arquivo;
import br.com.caracursos.http.Requisicao;
import br.com.caracursos.http.Roteador;
import br.com.caracursos.model.Curso;
import br.com.caracursos.model.Usuario;
import br.com.caracursos.seguranca.Permissao;
import br.com.caracursos.util.Csv;
import br.com.caracursos.util.Relogio;

/** Painel da empresa: {@code /admin/colaboradores}. */
public class ColaboradorRecurso {

    private static final Pattern EMAIL = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    private static final List<Integer> NIVEIS = List.of(1, 2, 3, 4);
    private static final Map<String, String> STATUS_CSV = Map.of(
            "ativo", "Ativo", "pendente", "Convite pendente", "inativo", "Inativo");
    private static final DateTimeFormatter DATA_HORA_CSV =
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm").withZone(Relogio.FUSO_EMPRESA);

    public void registrar(Roteador r) {
        Permissao p = Permissao.ADMIN_COLABORADORES;
        r.get("/admin/colaboradores", p, this::listar);
        r.get("/admin/colaboradores/resumo", p, this::resumo);
        r.get("/admin/colaboradores/opcoes", p, this::opcoes);
        r.get("/admin/colaboradores/exportar", p, this::exportar);
        r.post("/admin/colaboradores", p, this::criar);
        r.put("/admin/colaboradores/{id}", p, this::atualizar);
        r.patch("/admin/colaboradores/{id}/status", p, this::alterarStatus);
        r.get("/admin/colaboradores/{id}/progresso", p, this::progresso);
    }

    private static ColaboradorDAO.Filtro filtro(Requisicao req) {
        return new ColaboradorDAO.Filtro(req.parametro("busca"), req.parametro("status"), req.parametro("departamento"));
    }

    private Object listar(Requisicao req) throws SQLException {
        return new ColaboradorDAO(req.conexao()).listar(filtro(req), req.parametroInt("pagina", 1),
                req.parametroInt("porPagina", 10));
    }

    private Object resumo(Requisicao req) throws SQLException {
        ColaboradorDAO.Resumo r = new ColaboradorDAO(req.conexao()).resumo();
        UsuarioDAO usuarios = new UsuarioDAO(req.conexao());
        Map<String, Object> json = new LinkedHashMap<>();
        json.put("total", r.total());
        json.put("ativos", r.ativos());
        json.put("pendentes", r.pendentes());
        json.put("inativos", r.inativos());
        json.put("conclusaoMedia", r.conclusaoMedia());
        json.put("licencas", Map.of("emUso", usuarios.contarLicencasEmUso(),
                "contratadas", usuarios.licencasContratadas()));
        return json;
    }

    private Object opcoes(Requisicao req) throws SQLException {
        ColaboradorDAO dao = new ColaboradorDAO(req.conexao());
        return Map.of("cargos", dao.cargos(), "departamentos", dao.departamentos(), "niveis", NIVEIS);
    }

    /** Dados do formulário, já validados. */
    private record Dados(String nome, String email, String cargo, String departamento, int nivel) {
    }

    private static Dados validar(Requisicao req, Integer idAtual, int nivelPadrao) throws SQLException {
        Connection c = req.conexao();
        ColaboradorDAO dao = new ColaboradorDAO(c);
        String nome = req.texto("nome");
        String email = req.texto("email") == null ? null : req.texto("email").toLowerCase(Locale.ROOT);
        String cargo = req.texto("cargo");
        String departamento = req.texto("departamento");
        Integer nivel = req.inteiro("nivel");

        Map<String, String> campos = new LinkedHashMap<>();
        if (nome == null) campos.put("nome", "Informe o nome completo.");
        else if (nome.length() > 120) campos.put("nome", "Use no máximo 120 caracteres.");
        if (email == null || email.length() > 160 || !EMAIL.matcher(email).matches()) {
            campos.put("email", "Informe um e-mail válido.");
        } else if (new UsuarioDAO(c).emailEmUso(email, idAtual)) {
            campos.put("email", "Já existe um colaborador com este e-mail.");
        }
        if (cargo == null || !dao.cargos().contains(cargo)) campos.put("cargo", "Escolha um cargo.");
        if (departamento == null || !dao.departamentos().contains(departamento)) {
            campos.put("departamento", "Escolha um departamento.");
        }
        if (nivel != null && !NIVEIS.contains(nivel)) campos.put("nivel", "Escolha um nível de 1 a 4.");
        if (!campos.isEmpty()) throw ApiException.validacao(campos);
        return new Dados(nome, email, cargo, departamento, nivel == null ? nivelPadrao : nivel);
    }

    private static ApiException semLicencas(String mensagem) {
        return ApiException.conflito("SEM_LICENCAS", mensagem);
    }

    /** Cria com status "pendente" (o convite por e-mail ainda não é enviado; ver PLANO.md). */
    private Object criar(Requisicao req) throws SQLException {
        Dados d = validar(req, null, 1);
        try {
            int id = req.transacao(c -> {
                UsuarioDAO usuarios = new UsuarioDAO(c);
                if (usuarios.contarLicencasEmUso() >= usuarios.licencasContratadas()) {
                    throw semLicencas("Todas as licenças estão em uso. Contrate mais licenças em Plano e faturamento.");
                }
                Usuario u = new Usuario(d.nome(), d.email(), null, Usuario.TipoPerfil.COLABORADOR);
                u.setCargo(d.cargo());
                u.setDepartamento(d.departamento());
                u.setNivel(d.nivel());
                u.setStatus(Usuario.Status.PENDENTE);
                return usuarios.inserir(u).getId();
            });
            return new ColaboradorDAO(req.conexao()).buscar(id);
        } catch (SQLIntegrityConstraintViolationException e) {
            // Outro cadastro com o mesmo e-mail entrou entre a validação e o INSERT.
            throw ApiException.validacao(Map.of("email", "Já existe um colaborador com este e-mail."));
        }
    }

    private Usuario existente(Requisicao req) throws SQLException {
        Usuario u = new UsuarioDAO(req.conexao()).buscarPorId(req.idCaminho("id"));
        if (u == null) throw ApiException.naoEncontrado("Colaborador não encontrado.");
        return u;
    }

    private Object atualizar(Requisicao req) throws SQLException {
        Usuario u = existente(req);
        Dados d = validar(req, u.getId(), u.getNivel());
        u.setNome(d.nome());
        u.setEmail(d.email());
        u.setCargo(d.cargo());
        u.setDepartamento(d.departamento());
        u.setNivel(d.nivel());
        try {
            new UsuarioDAO(req.conexao()).atualizarCadastro(u);
        } catch (SQLIntegrityConstraintViolationException e) {
            throw ApiException.validacao(Map.of("email", "Já existe um colaborador com este e-mail."));
        }
        return new ColaboradorDAO(req.conexao()).buscar(u.getId());
    }

    private Object alterarStatus(Requisicao req) throws SQLException {
        Usuario u = existente(req);
        String valor = req.texto("status");
        if (!"ativo".equals(valor) && !"inativo".equals(valor)) {
            throw ApiException.validacao(Map.of("status", "Use \"ativo\" ou \"inativo\"."));
        }
        Usuario.Status novo = Usuario.Status.deValorBanco(valor);
        if (novo == Usuario.Status.INATIVO && u.getId() == req.idUsuario()) {
            throw ApiException.conflito("PROPRIO_ACESSO", "Você não pode desativar o próprio acesso.");
        }
        req.transacao(c -> {
            UsuarioDAO usuarios = new UsuarioDAO(c);
            boolean reativando = u.getStatus() == Usuario.Status.INATIVO && novo != Usuario.Status.INATIVO;
            if (reativando && usuarios.contarLicencasEmUso() >= usuarios.licencasContratadas()) {
                throw semLicencas("Não há licenças livres para reativar este colaborador.");
            }
            usuarios.atualizarStatus(u.getId(), novo);
            if (novo == Usuario.Status.INATIVO) new SessaoDAO(c).revogarTodas(u.getId());
            return null;
        });
        return new ColaboradorDAO(req.conexao()).buscar(u.getId());
    }

    private Object progresso(Requisicao req) throws SQLException {
        Colaborador colaborador = new ColaboradorDAO(req.conexao()).buscar(req.idCaminho("id"));
        if (colaborador == null) throw ApiException.naoEncontrado("Colaborador não encontrado.");
        List<Map<String, Object>> cursos = new MatriculaDAO(req.conexao()).cursosDoUsuario(colaborador.id()).stream()
                .map(m -> Map.<String, Object>of("curso", m.curso(), "progresso", m.progresso(),
                        "status", Curso.statusDoProgresso(m.progresso())))
                .toList();
        return Map.of("colaborador", colaborador, "cursos", cursos);
    }

    private Object exportar(Requisicao req) throws SQLException {
        List<Colaborador> lista = new ColaboradorDAO(req.conexao()).listarTodos(filtro(req));
        Csv csv = new Csv("Matrícula", "Nome", "E-mail", "Cargo", "Departamento", "Nível", "Progresso (%)",
                "Último acesso", "Status");
        for (Colaborador c : lista) {
            csv.linha(c.matricula(), c.nome(), c.email(), c.cargo(), c.departamento(), c.nivel(), c.progresso(),
                    c.ultimoAcesso() == null ? "" : DATA_HORA_CSV.format(c.ultimoAcesso()),
                    STATUS_CSV.getOrDefault(c.status(), c.status()));
        }
        String nome = "colaboradores-" + LocalDate.now(Relogio.FUSO_EMPRESA) + ".csv";
        return new Arquivo(nome, "text/csv; charset=UTF-8", csv.bytes());
    }
}
