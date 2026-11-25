package br.com.caracursos.recursos;

import java.sql.SQLException;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;

import br.com.caracursos.dao.RelatorioDAO;
import br.com.caracursos.util.Csv;
import br.com.caracursos.util.Relogio;
import br.com.caracursos.util.TabelaPdf;
import br.com.caracursos.util.TabelaPdf.Coluna;

/**
 * Estratégias de geração dos relatórios do painel ({@code /admin/relatorios}),
 * encapsulando metadados e formato de saída (CSV ou PDF) em cada constante do enum.
 */
public enum RelatorioStrategy {

    ENGAJAMENTO("engajamento", "Engajamento e frequência",
            "Acessos, dias com acesso e aulas concluídas por colaborador no período.", "csv") {
        @Override
        public byte[] gerar(RelatorioDAO dao, Instant desde, String departamento, String subtitulo) throws SQLException {
            Csv csv = new Csv("Matrícula", "Nome", "Departamento", "Acessos no período", "Dias com acesso",
                    "Aulas concluídas no período", "Último acesso");
            for (RelatorioDAO.Engajamento e : dao.engajamento(desde, departamento)) {
                csv.linha(e.matricula(), e.nome(), e.departamento(), e.acessos(), e.diasComAcesso(),
                        e.aulasConcluidas(), dataHora(e.ultimoAcesso()));
            }
            return csv.bytes();
        }
    },

    CONCLUSAO("conclusao", "Conclusão de cursos e trilhas",
            "Percentual de conclusão e cursos concluídos no período, por departamento.", "pdf") {
        @Override
        public byte[] gerar(RelatorioDAO dao, Instant desde, String departamento, String subtitulo) throws SQLException {
            List<List<String>> linhas = new ArrayList<>();
            for (RelatorioDAO.ConclusaoDepartamento c : dao.conclusao(desde, departamento)) {
                linhas.add(List.of(c.departamento(), String.valueOf(c.colaboradores()), String.valueOf(c.matriculas()),
                        String.valueOf(c.concluidas()), percentual(c.concluidas(), c.matriculas()),
                        String.valueOf(c.concluidasNoPeriodo()), c.progressoMedio() + "%"));
            }
            return TabelaPdf.gerar(titulo(), subtitulo, List.of(
                    new Coluna("Departamento", 3, false),
                    new Coluna("Colaboradores", 1.4, true),
                    new Coluna("Matrículas", 1.3, true),
                    new Coluna("Concluídas", 1.3, true),
                    new Coluna("Taxa de conclusão", 1.7, true),
                    new Coluna("Concluídas no período", 2, true),
                    new Coluna("Progresso médio", 1.6, true)), linhas);
        }
    },

    HORAS("horas", "Horas de treinamento",
            "Horas de aula concluídas e certificados emitidos no período, por departamento.", "pdf") {
        @Override
        public byte[] gerar(RelatorioDAO dao, Instant desde, String departamento, String subtitulo) throws SQLException {
            List<List<String>> linhas = new ArrayList<>();
            for (RelatorioDAO.HorasDepartamento h : dao.horas(desde, departamento)) {
                double horas = h.segundos() / 3600.0;
                linhas.add(List.of(h.departamento(), String.valueOf(h.colaboradores()), decimal(horas),
                        decimal(h.colaboradores() == 0 ? 0 : horas / h.colaboradores()),
                        String.valueOf(h.certificados())));
            }
            return TabelaPdf.gerar(titulo(), subtitulo, List.of(
                    new Coluna("Departamento", 3, false),
                    new Coluna("Colaboradores", 1.5, true),
                    new Coluna("Horas de aula", 1.5, true),
                    new Coluna("Horas por colaborador", 2, true),
                    new Coluna("Certificados emitidos", 2, true)), linhas);
        }
    },

    SATISFACAO("satisfacao", "Avaliações e satisfação",
            "Nota média de cada curso, com matriculados e concluintes no período.", "csv") {
        @Override
        public byte[] gerar(RelatorioDAO dao, Instant desde, String departamento, String subtitulo) throws SQLException {
            Csv csv = new Csv("Curso", "Categoria", "Instrutor", "Nota média", "Avaliações", "Matriculados",
                    "Concluintes no período");
            for (RelatorioDAO.AvaliacaoCurso a : dao.avaliacoes(desde, departamento)) {
                csv.linha(a.curso(), a.categoria(), a.instrutor(), decimal(a.nota()), a.avaliacoes(),
                        a.matriculados(), a.concluintesNoPeriodo());
            }
            return csv.bytes();
        }
    },

    INDIVIDUAL("individual", "Desempenho individual",
            "Cursos concluídos, certificados e aulas no período de cada colaborador.", "pdf") {
        @Override
        public byte[] gerar(RelatorioDAO dao, Instant desde, String departamento, String subtitulo) throws SQLException {
            List<List<String>> linhas = new ArrayList<>();
            for (RelatorioDAO.Desempenho d : dao.desempenho(desde, departamento)) {
                linhas.add(List.of(d.nome(), d.departamento(), String.valueOf(d.concluidos()),
                        String.valueOf(d.emAndamento()), d.progressoMedio() + "%", String.valueOf(d.certificados()),
                        String.valueOf(d.aulasNoPeriodo()), dataHora(d.ultimoAcesso())));
            }
            return TabelaPdf.gerar(titulo(), subtitulo, List.of(
                    new Coluna("Colaborador", 3, false),
                    new Coluna("Departamento", 2.2, false),
                    new Coluna("Concluídos", 1.2, true),
                    new Coluna("Em andamento", 1.4, true),
                    new Coluna("Progresso", 1.2, true),
                    new Coluna("Certificados", 1.3, true),
                    new Coluna("Aulas no período", 1.6, true),
                    new Coluna("Último acesso", 1.9, false)), linhas);
        }
    },

    CONFORMIDADE("conformidade", "Conformidade e LGPD",
            "Situação de cada colaborador nos treinamentos obrigatórios (categoria Conformidade).", "csv") {
        @Override
        public byte[] gerar(RelatorioDAO dao, Instant desde, String departamento, String subtitulo) throws SQLException {
            DateTimeFormatter dataFmt = DATA.withZone(Relogio.fuso());
            Csv csv = new Csv("Matrícula", "Nome", "Departamento", "Treinamento obrigatório", "Situação",
                    "Progresso (%)", "Concluído em");
            for (RelatorioDAO.Conformidade c : dao.conformidade(departamento)) {
                String situacao = c.progresso() == null ? "Não iniciado"
                        : c.progresso() >= 100 ? "Concluído" : "Em andamento";
                csv.linha(c.matricula(), c.nome(), c.departamento(), c.curso(), situacao,
                        c.progresso() == null ? 0 : c.progresso(),
                        c.concluidoEm() == null ? "" : dataFmt.format(c.concluidoEm()));
            }
            return csv.bytes();
        }
    };

    private static final Locale PT_BR = Locale.of("pt", "BR");
    private static final DateTimeFormatter DATA_HORA = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final DateTimeFormatter DATA = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final String id;
    private final String titulo;
    private final String descricao;
    private final String formato;

    RelatorioStrategy(String id, String titulo, String descricao, String formato) {
        this.id = id;
        this.titulo = titulo;
        this.descricao = descricao;
        this.formato = formato;
    }

    public abstract byte[] gerar(RelatorioDAO dao, Instant desde, String departamento, String subtitulo)
            throws SQLException;

    public String id() {
        return id;
    }

    public String titulo() {
        return titulo;
    }

    public String descricao() {
        return descricao;
    }

    public String formato() {
        return formato;
    }

    public RelatorioRecurso.Modelo toModelo() {
        return new RelatorioRecurso.Modelo(id, titulo, descricao, formato);
    }

    public static RelatorioStrategy porId(String id) {
        if (id == null) return null;
        return Arrays.stream(values()).filter(s -> s.id.equals(id)).findFirst().orElse(null);
    }

    public static List<RelatorioRecurso.Modelo> modelos() {
        return Arrays.stream(values()).map(RelatorioStrategy::toModelo).toList();
    }

    static String dataHora(Instant instante) {
        return instante == null ? "" : DATA_HORA.withZone(Relogio.fuso()).format(instante);
    }

    private static String percentual(int parte, int total) {
        return total == 0 ? "—" : Math.round(parte * 100.0 / total) + "%";
    }

    private static String decimal(double valor) {
        return String.format(PT_BR, "%.1f", valor);
    }
}
