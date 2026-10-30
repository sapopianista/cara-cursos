package br.com.caracursos.model;

import java.time.Instant;
import java.util.Objects;

/** Matrícula de um usuário em um curso (tabela {@code matriculas}). */
public class Matricula {

    private Integer id;
    private int idUsuario;
    private int idCurso;
    /** 0–100: porcentagem de aulas concluídas. */
    private int progresso;
    private Instant dataMatricula;
    private Instant dataConclusao;

    public Matricula() {
    }

    public Matricula(Integer id, int idUsuario, int idCurso, int progresso, Instant dataMatricula,
                     Instant dataConclusao) {
        this.id = id;
        this.idUsuario = idUsuario;
        this.idCurso = idCurso;
        this.progresso = progresso;
        this.dataMatricula = dataMatricula;
        this.dataConclusao = dataConclusao;
    }

    public boolean isConcluida() {
        return progresso >= 100;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public int getIdUsuario() {
        return idUsuario;
    }

    public void setIdUsuario(int idUsuario) {
        this.idUsuario = idUsuario;
    }

    public int getIdCurso() {
        return idCurso;
    }

    public void setIdCurso(int idCurso) {
        this.idCurso = idCurso;
    }

    public int getProgresso() {
        return progresso;
    }

    public void setProgresso(int progresso) {
        this.progresso = progresso;
    }

    public Instant getDataMatricula() {
        return dataMatricula;
    }

    public void setDataMatricula(Instant dataMatricula) {
        this.dataMatricula = dataMatricula;
    }

    public Instant getDataConclusao() {
        return dataConclusao;
    }

    public void setDataConclusao(Instant dataConclusao) {
        this.dataConclusao = dataConclusao;
    }

    @Override
    public boolean equals(Object outro) {
        if (this == outro) return true;
        if (!(outro instanceof Matricula)) return false;
        Matricula m = (Matricula) outro;
        return id != null && id.equals(m.id);
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(id);
    }

    @Override
    public String toString() {
        return "Matricula{id=" + id + ", idUsuario=" + idUsuario + ", idCurso=" + idCurso
                + ", progresso=" + progresso + "}";
    }
}
