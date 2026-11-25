package br.com.caracursos.model;

import java.util.Objects;

/**
 * Classe base para entidades persistidas identificadas por {@code id} inteiro.
 * Centraliza a identidade ({@link #equals(Object)} e {@link #hashCode()}) e exige
 * uma representação resumida via {@link #resumo()}.
 */
public abstract class Entidade {

    protected Integer id;

    protected Entidade() {
    }

    protected Entidade(Integer id) {
        this.id = id;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    /** Descrição curta da entidade para logs e inspeção. */
    public abstract String resumo();

    @Override
    public boolean equals(Object outro) {
        if (this == outro) return true;
        if (outro == null || getClass() != outro.getClass()) return false;
        Entidade entidade = (Entidade) outro;
        return id != null && id.equals(entidade.id);
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(id);
    }
}
