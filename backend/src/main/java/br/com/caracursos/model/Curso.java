package br.com.caracursos.model;

import java.util.Objects;

/**
 * Curso do catálogo (tabela {@code cursos}) já com o progresso do usuário logado.
 * Os nomes dos campos são os do contrato da API ({@code Curso} em docs/API.md),
 * por isso o objeto é enviado ao frontend como está.
 */
public class Curso {

    public record Categoria(String id, String nome) {
    }

    public record Instrutor(String nome, String cargo) {
    }

    private int id;
    private String titulo;
    private String descricao;
    private Categoria categoria;
    private Categoria area;
    private String nivel;
    /** Carga horária, em minutos (coluna {@code carga_horaria_minutos}). */
    private int duracaoMinutos;
    private int totalAulas;
    private double nota;
    private int totalAvaliacoes;
    private Instrutor instrutor;
    private String tema;
    private String imagemUrl;
    /** 0–100, do usuário logado. */
    private int progresso;
    private String status;

    /** {@code nao_iniciado} | {@code em_andamento} | {@code concluido}. */
    public static String statusDoProgresso(int progresso) {
        if (progresso <= 0) return "nao_iniciado";
        return progresso >= 100 ? "concluido" : "em_andamento";
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getTitulo() {
        return titulo;
    }

    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public Categoria getCategoria() {
        return categoria;
    }

    public void setCategoria(Categoria categoria) {
        this.categoria = categoria;
    }

    public Categoria getArea() {
        return area;
    }

    public void setArea(Categoria area) {
        this.area = area;
    }

    public String getNivel() {
        return nivel;
    }

    public void setNivel(String nivel) {
        this.nivel = nivel;
    }

    public int getDuracaoMinutos() {
        return duracaoMinutos;
    }

    public void setDuracaoMinutos(int duracaoMinutos) {
        this.duracaoMinutos = duracaoMinutos;
    }

    public int getTotalAulas() {
        return totalAulas;
    }

    public void setTotalAulas(int totalAulas) {
        this.totalAulas = totalAulas;
    }

    public double getNota() {
        return nota;
    }

    public void setNota(double nota) {
        this.nota = nota;
    }

    public int getTotalAvaliacoes() {
        return totalAvaliacoes;
    }

    public void setTotalAvaliacoes(int totalAvaliacoes) {
        this.totalAvaliacoes = totalAvaliacoes;
    }

    public Instrutor getInstrutor() {
        return instrutor;
    }

    public void setInstrutor(Instrutor instrutor) {
        this.instrutor = instrutor;
    }

    public String getTema() {
        return tema;
    }

    public void setTema(String tema) {
        this.tema = tema;
    }

    public String getImagemUrl() {
        return imagemUrl;
    }

    public void setImagemUrl(String imagemUrl) {
        this.imagemUrl = imagemUrl;
    }

    public int getProgresso() {
        return progresso;
    }

    /** Também atualiza o {@code status}. */
    public void setProgresso(int progresso) {
        this.progresso = progresso;
        this.status = statusDoProgresso(progresso);
    }

    public String getStatus() {
        return status;
    }

    @Override
    public boolean equals(Object outro) {
        return outro instanceof Curso c && c.id == id;
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(id);
    }

    @Override
    public String toString() {
        return "Curso{id=" + id + ", titulo='" + titulo + "'}";
    }
}
