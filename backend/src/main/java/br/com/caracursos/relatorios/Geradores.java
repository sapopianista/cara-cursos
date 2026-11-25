package br.com.caracursos.relatorios;

import java.sql.SQLException;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import br.com.caracursos.dao.RelatorioDAO;
import br.com.caracursos.util.Csv;
import br.com.caracursos.util.Relogio;
import br.com.caracursos.util.TabelaPdf.Coluna;

/**
 * Os seis modelos de relatório, cada um uma subclasse de {@link RelatorioCsv} ou
 * {@link RelatorioPdf} (herança + sobrescrita), e o mapa que escolhe o gerador pelo id do modelo.
 */
public final class Geradores {

    private static final Locale PT_BR = Locale.of("pt", "BR");
    private static final DateTimeFormatter DATA_HORA =
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm").withZone(Relogio.FUSO_EMPRESA);
    private static final DateTimeFormatter DATA =
            DateTimeFormatter.ofPattern("dd/MM/yyyy").withZone(Relogio.FUSO_EMPRESA);

    /** Seleção da estratégia: id do modelo -> gerador. */
    private static final Map<String, GeradorRelatorio> POR_MODELO = Map.of(
            "engajamento", new Engajamento(),
            "conclusao", new Conclusao(),
            "horas", new Horas(),
            "satisfacao", new Satisfacao(),
            "individual", new Individual(),
            "conformidade", new Conformidade());

    private Geradores() {
    }

    /** Gerador do modelo, ou {@code null} se o id não existir. */
    public static GeradorRelatorio de(String idModelo) {
        return POR_MODELO.get(idModelo);
    }

    // ---- formatação --------------------------------------------------------

    private static String dataHora(Instant instante) {
        return instante == null ? "" : DATA_HORA.format(instante);
    }

    private static String percentual(int parte, int total) {
        return total == 0 ? "—" : Math.round(parte * 100.0 / total) + "%";
    }

    private static String decimal(double valor) {
        return String.format(PT_BR, "%.1f", valor);
    }

    // ---- modelos CSV -------------------------------------------------------

    private static final class Engajamento extends RelatorioCsv {
        @Override
        protected String[] cabecalho() {
            return new String[] { "Matrícula", "Nome", "Departamento", "Acessos no período", "Dias com acesso",
                    "Aulas concluídas no período", "Último acesso" };
        }

        @Override
        protected void preencher(ContextoRelatorio ctx, Csv csv) throws SQLException {
            for (RelatorioDAO.Engajamento e : ctx.dao().engajamento(ctx.desde(), ctx.departamento())) {
                csv.linha(e.matricula(), e.nome(), e.departamento(), e.acessos(), e.diasComAcesso(),
                        e.aulasConcluidas(), dataHora(e.ultimoAcesso()));
            }
        }
    }

    private static final class Satisfacao extends RelatorioCsv {
        @Override
        protected String[] cabecalho() {
            return new String[] { "Curso", "Categoria", "Instrutor", "Nota média", "Avaliações", "Matriculados",
                    "Concluintes no período" };
        }

        @Override
        protected void preencher(ContextoRelatorio ctx, Csv csv) throws SQLException {
            for (RelatorioDAO.AvaliacaoCurso a : ctx.dao().avaliacoes(ctx.desde(), ctx.departamento())) {
                csv.linha(a.curso(), a.categoria(), a.instrutor(), decimal(a.nota()), a.avaliacoes(),
                        a.matriculados(), a.concluintesNoPeriodo());
            }
        }
    }

    private static final class Conformidade extends RelatorioCsv {
        @Override
        protected String[] cabecalho() {
            return new String[] { "Matrícula", "Nome", "Departamento", "Treinamento obrigatório", "Situação",
                    "Progresso (%)", "Concluído em" };
        }

        @Override
        protected void preencher(ContextoRelatorio ctx, Csv csv) throws SQLException {
            for (RelatorioDAO.Conformidade c : ctx.dao().conformidade(ctx.departamento())) {
                String situacao = c.progresso() == null ? "Não iniciado"
                        : c.progresso() >= 100 ? "Concluído" : "Em andamento";
                csv.linha(c.matricula(), c.nome(), c.departamento(), c.curso(), situacao,
                        c.progresso() == null ? 0 : c.progresso(),
                        c.concluidoEm() == null ? "" : DATA.format(c.concluidoEm()));
            }
        }
    }

    // ---- modelos PDF -------------------------------------------------------

    private static final class Conclusao extends RelatorioPdf {
        @Override
        protected List<Coluna> colunas() {
            return List.of(new Coluna("Departamento", 3, false), new Coluna("Colaboradores", 1.4, true),
                    new Coluna("Matrículas", 1.3, true), new Coluna("Concluídas", 1.3, true),
                    new Coluna("Taxa de conclusão", 1.7, true), new Coluna("Concluídas no período", 2, true),
                    new Coluna("Progresso médio", 1.6, true));
        }

        @Override
        protected List<List<String>> linhas(ContextoRelatorio ctx) throws SQLException {
            List<List<String>> linhas = new ArrayList<>();
            for (RelatorioDAO.ConclusaoDepartamento c : ctx.dao().conclusao(ctx.desde(), ctx.departamento())) {
                linhas.add(List.of(c.departamento(), String.valueOf(c.colaboradores()),
                        String.valueOf(c.matriculas()), String.valueOf(c.concluidas()),
                        percentual(c.concluidas(), c.matriculas()), String.valueOf(c.concluidasNoPeriodo()),
                        c.progressoMedio() + "%"));
            }
            return linhas;
        }
    }

    private static final class Horas extends RelatorioPdf {
        @Override
        protected List<Coluna> colunas() {
            return List.of(new Coluna("Departamento", 3, false), new Coluna("Colaboradores", 1.5, true),
                    new Coluna("Horas de aula", 1.5, true), new Coluna("Horas por colaborador", 2, true),
                    new Coluna("Certificados emitidos", 2, true));
        }

        @Override
        protected List<List<String>> linhas(ContextoRelatorio ctx) throws SQLException {
            List<List<String>> linhas = new ArrayList<>();
            for (RelatorioDAO.HorasDepartamento h : ctx.dao().horas(ctx.desde(), ctx.departamento())) {
                double horas = h.segundos() / 3600.0;
                linhas.add(List.of(h.departamento(), String.valueOf(h.colaboradores()), decimal(horas),
                        decimal(h.colaboradores() == 0 ? 0 : horas / h.colaboradores()),
                        String.valueOf(h.certificados())));
            }
            return linhas;
        }
    }

    private static final class Individual extends RelatorioPdf {
        @Override
        protected List<Coluna> colunas() {
            return List.of(new Coluna("Colaborador", 3, false), new Coluna("Departamento", 2.2, false),
                    new Coluna("Concluídos", 1.2, true), new Coluna("Em andamento", 1.4, true),
                    new Coluna("Progresso", 1.2, true), new Coluna("Certificados", 1.3, true),
                    new Coluna("Aulas no período", 1.6, true), new Coluna("Último acesso", 1.9, false));
        }

        @Override
        protected List<List<String>> linhas(ContextoRelatorio ctx) throws SQLException {
            List<List<String>> linhas = new ArrayList<>();
            for (RelatorioDAO.Desempenho d : ctx.dao().desempenho(ctx.desde(), ctx.departamento())) {
                linhas.add(List.of(d.nome(), d.departamento(), String.valueOf(d.concluidos()),
                        String.valueOf(d.emAndamento()), d.progressoMedio() + "%", String.valueOf(d.certificados()),
                        String.valueOf(d.aulasNoPeriodo()), dataHora(d.ultimoAcesso())));
            }
            return linhas;
        }
    }
}
