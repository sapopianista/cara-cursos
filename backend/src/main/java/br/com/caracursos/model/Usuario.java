package br.com.caracursos.model;

import java.time.Instant;
import java.util.Objects;

/**
 * Usuário da plataforma (tabela {@code usuarios}): colaborador da empresa e,
 * conforme o {@link TipoPerfil}, também gestor.
 *
 * <p>O campo {@code senha} guarda o hash da senha, nunca o texto puro, e não
 * deve ser enviado ao frontend.
 */
public class Usuario {

    /** Papéis aceitos pela coluna {@code tipo_perfil}; os mesmos do frontend. */
    public enum TipoPerfil {
        ADMIN, RH, LIDER, FINANCEIRO, COLABORADOR;

        /** Valor gravado na base de dados e enviado na API (ex.: "admin"). */
        public String getValorBanco() {
            return name().toLowerCase();
        }

        /** Converte o valor lido da base de dados (ex.: "rh") no enum. */
        public static TipoPerfil deValorBanco(String valor) {
            if (valor == null) {
                throw new IllegalArgumentException("tipo_perfil não pode ser nulo");
            }
            return valueOf(valor.trim().toUpperCase());
        }
    }

    /** Situação do acesso: {@code pendente} = convite ainda não aceito. */
    public enum Status {
        ATIVO, PENDENTE, INATIVO;

        public String getValorBanco() {
            return name().toLowerCase();
        }

        public static Status deValorBanco(String valor) {
            if (valor == null) {
                throw new IllegalArgumentException("status não pode ser nulo");
            }
            return valueOf(valor.trim().toUpperCase());
        }
    }

    private Integer id;
    private String matricula;
    private String nome;
    private String email;
    private String senha;
    private TipoPerfil tipoPerfil;
    private String cargo;
    private String departamento;
    private int nivel = 1;
    private Status status = Status.PENDENTE;
    private int metaSemanalMinutos = 480;
    private boolean notificacoesEmail = true;
    private boolean resumoSemanal = true;
    private Instant ultimoAcesso;
    private Instant criadoEm;

    public Usuario() {
        this.tipoPerfil = TipoPerfil.COLABORADOR;
    }

    /** Para novos usuários, antes de inserir (o id é gerado pela base de dados). */
    public Usuario(String nome, String email, String senha, TipoPerfil tipoPerfil) {
        this(null, nome, email, senha, tipoPerfil);
    }

    /** Para usuários lidos da base de dados. */
    public Usuario(Integer id, String nome, String email, String senha, TipoPerfil tipoPerfil) {
        this.id = id;
        this.nome = nome;
        this.email = email;
        this.senha = senha;
        this.tipoPerfil = tipoPerfil;
    }

    /** Primeiro nome, usado na saudação da tela inicial. */
    public String getPrimeiroNome() {
        return nome == null ? null : nome.trim().split("\\s+")[0];
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getMatricula() {
        return matricula;
    }

    public void setMatricula(String matricula) {
        this.matricula = matricula;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getSenha() {
        return senha;
    }

    public void setSenha(String senha) {
        this.senha = senha;
    }

    public TipoPerfil getTipoPerfil() {
        return tipoPerfil;
    }

    public void setTipoPerfil(TipoPerfil tipoPerfil) {
        this.tipoPerfil = tipoPerfil;
    }

    public String getCargo() {
        return cargo;
    }

    public void setCargo(String cargo) {
        this.cargo = cargo;
    }

    public String getDepartamento() {
        return departamento;
    }

    public void setDepartamento(String departamento) {
        this.departamento = departamento;
    }

    public int getNivel() {
        return nivel;
    }

    public void setNivel(int nivel) {
        this.nivel = nivel;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public int getMetaSemanalMinutos() {
        return metaSemanalMinutos;
    }

    public void setMetaSemanalMinutos(int metaSemanalMinutos) {
        this.metaSemanalMinutos = metaSemanalMinutos;
    }

    public boolean isNotificacoesEmail() {
        return notificacoesEmail;
    }

    public void setNotificacoesEmail(boolean notificacoesEmail) {
        this.notificacoesEmail = notificacoesEmail;
    }

    public boolean isResumoSemanal() {
        return resumoSemanal;
    }

    public void setResumoSemanal(boolean resumoSemanal) {
        this.resumoSemanal = resumoSemanal;
    }

    public Instant getUltimoAcesso() {
        return ultimoAcesso;
    }

    public void setUltimoAcesso(Instant ultimoAcesso) {
        this.ultimoAcesso = ultimoAcesso;
    }

    public Instant getCriadoEm() {
        return criadoEm;
    }

    public void setCriadoEm(Instant criadoEm) {
        this.criadoEm = criadoEm;
    }

    @Override
    public boolean equals(Object outro) {
        if (this == outro) return true;
        if (!(outro instanceof Usuario)) return false;
        Usuario usuario = (Usuario) outro;
        return id != null && id.equals(usuario.id);
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(id);
    }

    /** Não inclui a senha, para ela nunca aparecer em logs. */
    @Override
    public String toString() {
        return "Usuario{id=" + id + ", nome='" + nome + "', email='" + email
                + "', tipoPerfil=" + tipoPerfil + ", status=" + status + "}";
    }
}
