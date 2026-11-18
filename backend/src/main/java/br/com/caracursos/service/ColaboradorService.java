package br.com.caracursos.service;

import java.sql.Connection;
import java.sql.SQLException;
import java.sql.SQLIntegrityConstraintViolationException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import br.com.caracursos.dao.AuditoriaDAO;
import br.com.caracursos.dao.ColaboradorDAO;
import br.com.caracursos.dao.EmpresaDAO;
import br.com.caracursos.dao.MatriculaDAO;
import br.com.caracursos.dao.SessaoDAO;
import br.com.caracursos.dao.UsuarioDAO;
import br.com.caracursos.http.ApiException;
import br.com.caracursos.model.Colaborador;
import br.com.caracursos.model.Curso;
import br.com.caracursos.model.Usuario;
import br.com.caracursos.seguranca.Senhas;

/** Regras de negócio da gestão de colaboradores. */
public class ColaboradorService {

    /** Dados do formulário de cadastro/edição, já validados. */
    public record Dados(String nome, String email, String cargo, String departamento, int nivel) {
    }

    public Map<String, Object> resumo(Connection c) throws SQLException {
        ColaboradorDAO.Resumo r = new ColaboradorDAO(c).resumo();
        UsuarioDAO usuarios = new UsuarioDAO(c);
        EmpresaDAO empresas = new EmpresaDAO(c);
        Map<String, Object> json = new LinkedHashMap<>();
        json.put("total", r.total());
        json.put("ativos", r.ativos());
        json.put("pendentes", r.pendentes());
        json.put("inativos", r.inativos());
        json.put("conclusaoMedia", r.conclusaoMedia());
        json.put("licencas", Map.of("emUso", usuarios.contarLicencasEmUso(),
                "contratadas", empresas.licencasContratadas()));
        return json;
    }

    private static ApiException semLicencas(String mensagem) {
        return ApiException.conflito("SEM_LICENCAS", mensagem);
    }

    /**
     * Cria colaborador com senha provisória definida pelo RH. Fica "pendente" até
     * o primeiro acesso, e a pessoa precisa trocar a senha antes de usar o sistema.
     */
    public Colaborador criar(Connection c, Dados d, String senha) throws SQLException {
        String hash = Senhas.gerar(senha);
        try {
            int id = Transacao.executar(c, conn -> {
                UsuarioDAO usuarios = new UsuarioDAO(conn);
                int contratadas = new EmpresaDAO(conn).licencasContratadasTravando();
                if (usuarios.contarLicencasEmUso() >= contratadas) {
                    throw semLicencas("Todas as licenças estão em uso. Contrate mais licenças em Plano e faturamento.");
                }
                Usuario u = new Usuario(d.nome(), d.email(), hash, Usuario.TipoPerfil.COLABORADOR);
                u.setTrocarSenha(true);
                u.setCargo(d.cargo());
                u.setDepartamento(d.departamento());
                u.setNivel(d.nivel());
                u.setStatus(Usuario.Status.PENDENTE);
                return usuarios.inserir(u).getId();
            });
            return new ColaboradorDAO(c).buscar(id);
        } catch (SQLIntegrityConstraintViolationException e) {
            // Outro cadastro com o mesmo e-mail entrou entre a validação e o INSERT.
            throw ApiException.validacao(Map.of("email", "Já existe um colaborador com este e-mail."));
        }
    }

    public Colaborador atualizar(Connection c, Usuario u, Dados d) throws SQLException {
        u.setNome(d.nome());
        u.setEmail(d.email());
        u.setCargo(d.cargo());
        u.setDepartamento(d.departamento());
        u.setNivel(d.nivel());
        try {
            new UsuarioDAO(c).atualizarCadastro(u);
        } catch (SQLIntegrityConstraintViolationException e) {
            throw ApiException.validacao(Map.of("email", "Já existe um colaborador com este e-mail."));
        }
        return new ColaboradorDAO(c).buscar(u.getId());
    }

    public Colaborador alterarStatus(Connection c, Usuario u, int idAutor, Usuario.Status novo) throws SQLException {
        if (novo == Usuario.Status.INATIVO && u.getId() == idAutor) {
            throw ApiException.conflito("PROPRIO_ACESSO", "Você não pode desativar o próprio acesso.");
        }
        Transacao.executar(c, conn -> {
            UsuarioDAO usuarios = new UsuarioDAO(conn);
            boolean reativando = u.getStatus() == Usuario.Status.INATIVO && novo != Usuario.Status.INATIVO;
            if (reativando) {
                int contratadas = new EmpresaDAO(conn).licencasContratadasTravando();
                if (usuarios.contarLicencasEmUso() >= contratadas) {
                    throw semLicencas("Não há licenças livres para reativar este colaborador.");
                }
            }
            usuarios.atualizarStatus(u.getId(), novo);
            if (novo == Usuario.Status.INATIVO) new SessaoDAO(conn).revogarTodas(u.getId());
            return null;
        });
        return new ColaboradorDAO(c).buscar(u.getId());
    }

    /**
     * Define uma senha provisória. Só admin e RH; a senha de um gestor só o admin redefine,
     * para ninguém assumir uma conta com mais acesso que a sua.
     */
    public void redefinirSenha(Connection c, Usuario quem, Usuario u, String senha) throws SQLException {
        Usuario.TipoPerfil papel = quem.getTipoPerfil();
        if (papel != Usuario.TipoPerfil.ADMIN && papel != Usuario.TipoPerfil.RH) {
            throw ApiException.proibido("Só administradores e o RH podem redefinir senhas.");
        }
        if (u.getId().equals(quem.getId())) {
            throw ApiException.conflito("PROPRIA_SENHA", "Para trocar a sua senha, use Meu perfil.");
        }
        if (u.getTipoPerfil() != Usuario.TipoPerfil.COLABORADOR && papel != Usuario.TipoPerfil.ADMIN) {
            throw ApiException.proibido("Só um administrador pode redefinir a senha de um gestor.");
        }
        String problema = Senhas.problema(senha);
        if (problema != null) throw ApiException.validacao(Map.of("senha", problema));

        String hash = Senhas.gerar(senha);
        Transacao.executar(c, conn -> {
            new UsuarioDAO(conn).definirSenha(u.getId(), hash, true);
            new SessaoDAO(conn).revogarTodas(u.getId());
            new AuditoriaDAO(conn).registrar(quem, "Senha redefinida", "redefiniu a senha de " + u.getNome() + ".");
            return null;
        });
    }

    public Map<String, Object> progresso(Connection c, int idColaborador) throws SQLException {
        Colaborador colaborador = new ColaboradorDAO(c).buscar(idColaborador);
        if (colaborador == null) throw ApiException.naoEncontrado("Colaborador não encontrado.");
        List<Map<String, Object>> cursos = new MatriculaDAO(c).cursosDoUsuario(colaborador.id()).stream()
                .map(m -> Map.<String, Object>of("curso", m.curso(), "progresso", m.progresso(),
                        "status", Curso.statusDoProgresso(m.progresso())))
                .toList();
        return Map.of("colaborador", colaborador, "cursos", cursos);
    }
}
