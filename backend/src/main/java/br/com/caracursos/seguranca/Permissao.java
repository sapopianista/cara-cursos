package br.com.caracursos.seguranca;

import java.util.EnumSet;
import java.util.Set;

import br.com.caracursos.model.Usuario.TipoPerfil;

/**
 * Quem pode acessar cada grupo de rotas. Espelha {@code PERMISSOES} do frontend
 * (src/context/AuthContext.jsx); os dois lados precisam concordar.
 */
public enum Permissao {

    /** Qualquer usuário autenticado (área do aluno). */
    AUTENTICADO(EnumSet.allOf(TipoPerfil.class)),
    ADMIN_VISAO(EnumSet.of(TipoPerfil.ADMIN, TipoPerfil.RH, TipoPerfil.LIDER)),
    ADMIN_COLABORADORES(EnumSet.of(TipoPerfil.ADMIN, TipoPerfil.RH, TipoPerfil.LIDER));

    private final Set<TipoPerfil> perfis;

    Permissao(Set<TipoPerfil> perfis) {
        this.perfis = perfis;
    }

    public boolean permite(TipoPerfil perfil) {
        return perfis.contains(perfil);
    }
}
