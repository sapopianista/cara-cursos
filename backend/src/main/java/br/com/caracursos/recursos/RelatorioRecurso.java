package br.com.caracursos.recursos;

import java.sql.SQLException;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import br.com.caracursos.dao.ColaboradorDAO;
import br.com.caracursos.dao.RelatorioDAO;
import br.com.caracursos.dao.RelatorioDAO.Gerado;
import br.com.caracursos.http.ApiException;
import br.com.caracursos.http.Arquivo;
import br.com.caracursos.http.Requisicao;
import br.com.caracursos.http.Roteador;
import br.com.caracursos.seguranca.Permissao;
import br.com.caracursos.util.Csv;
import br.com.caracursos.util.Relogio;
import br.com.caracursos.util.TabelaPdf;
import br.com.caracursos.util.TabelaPdf.Coluna;

/**
 * Painel da empresa: {@code /admin/relatorios}.
 *
 * <p>O relatório é gerado na hora com os dados do banco e guardado no histórico; o
 * navegador baixa o arquivo (vai para a pasta Downloads).
 */
public class RelatorioRecurso {

    public record Modelo(String id, String titulo, String descricao, String formato) {
    }

    /** Os mesmos de {@code modelosRelatorio} no mock do frontend. */
    static final List<Modelo> MODELOS = List.of(
            new Modelo("engajamento", "Engajamento e frequência",
                    "Acessos, dias com acesso e aulas concluídas por colaborador no período.", "csv"),
            new Modelo("conclusao", "Conclusão de cursos e trilhas",
                    "Percentual de conclusão e cursos concluídos no período, por departamento.", "pdf"),
            new Modelo("horas", "Horas de treinamento",
                    "Horas de aula concluídas e certificados emitidos no período, por departamento.", "pdf"),
            new Modelo("satisfacao", "Avaliações e satisfação",
                    "Nota média de cada curso, com matriculados e concluintes no período.", "csv"),
            new Modelo("individual", "Desempenho individual",
                    "Cursos concluídos, certificados e aulas no período de cada colaborador.", "pdf"),
            new Modelo("conformidade", "Conformidade e LGPD",
                    "Situação de cada colaborador nos treinamentos obrigatórios (categoria Conformidade).", "csv"));

    private static final Map<String, Integer> DIAS_PERIODO =
            Map.of("7dias", 7, "30dias", 30, "trimestre", 90, "ano", 365);
    private static final Map<String, String> ROTULO_PERIODO = Map.of("7dias", "Últimos 7 dias", "30dias",
            "Últimos 30 dias", "trimestre", "Últimos 3 meses", "ano", "Últimos 12 meses");

    private static final Locale PT_BR = Locale.of("pt", "BR");
    private static final DateTimeFormatter DATA_HORA =
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm").withZone(Relogio.FUSO_EMPRESA);
    private static final DateTimeFormatter DATA =
            DateTimeFormatter.ofPattern("dd/MM/yyyy").withZone(Relogio.FUSO_EMPRESA);

    public void registrar(Roteador r) {
        Permissao p = Permissao.ADMIN_RELATORIOS;
        r.get("/admin/relatorios", p, this::listar);
        r.post("/admin/relatorios", p, this::gerar);
        r.get("/admin/relatorios/{id}/arquivo", p, this::baixar);
    }

    private static Modelo modelo(String id) {
        return MODELOS.stream().filter(m -> m.id().equals(id)).findFirst().orElse(null);
    }

    /** Formato {@code Relatorio} do contrato. O arquivo é baixado pela própria API ({@code url}). */
    private static Map<String, Object> json(Gerado g) {
        Map<String, Object> json = new LinkedHashMap<>();
        json.put("id", g.id());
        json.put("modeloId", g.modelo());
        json.put("modelo", modelo(g.modelo()));
        json.put("periodo", g.periodo());
        json.put("departamento", g.departamento());
        json.put("status", "pronto");
        json.put("solicitadoPor", g.solicitadoPor());
        json.put("criadoEm", g.criadoEm());
        json.put("url", "/admin/relatorios/" + g.id() + "/arquivo");
        return json;
    }

    private Object listar(Requisicao req) throws SQLException {
        Map<String, Object> json = new LinkedHashMap<>();
        json.put("modelos", MODELOS);
        json.put("departamentos", new ColaboradorDAO(req.conexao()).departamentos());
        json.put("historico", new RelatorioDAO(req.conexao()).historico().stream().map(RelatorioRecurso::json).toList());
        return json;
    }

    private Object gerar(Requisicao req) throws SQLException {
        Modelo modelo = modelo(req.texto("modeloId"));
        String periodo = req.texto("periodo");
        String departamento = req.texto("departamento");

        Map<String, String> campos = new LinkedHashMap<>();
        if (modelo == null) campos.put("modeloId", "Escolha um modelo de relatório.");
        if (periodo == null || !DIAS_PERIODO.containsKey(periodo)) campos.put("periodo", "Escolha um período.");
        if (departamento != null && !new ColaboradorDAO(req.conexao()).departamentos().contains(departamento)) {
            campos.put("departamento", "Escolha um departamento da lista.");
        }
        if (!campos.isEmpty()) throw ApiException.validacao(campos);

        Instant agora = Relogio.agora();
        Instant desde = agora.minus(Duration.ofDays(DIAS_PERIODO.get(periodo)));
        String subtitulo = ROTULO_PERIODO.get(periodo) + " · "
                + (departamento == null ? "Todos os departamentos" : departamento)
                + " · Gerado em " + DATA_HORA.format(agora) + " por " + req.usuario().getNome();
        RelatorioDAO dao = new RelatorioDAO(req.conexao());
        byte[] conteudo = switch (modelo.id()) {
            case "engajamento" -> engajamento(dao, desde, departamento);
            case "conclusao" -> conclusao(dao, desde, departamento, modelo.titulo(), subtitulo);
            case "horas" -> horas(dao, desde, departamento, modelo.titulo(), subtitulo);
            case "satisfacao" -> satisfacao(dao, desde, departamento);
            case "individual" -> individual(dao, desde, departamento, modelo.titulo(), subtitulo);
            case "conformidade" -> conformidade(dao, departamento);
            default -> throw new IllegalStateException("Modelo sem gerador: " + modelo.id());
        };
        String nome = modelo.id() + "-" + LocalDate.ofInstant(agora, Relogio.FUSO_EMPRESA) + "." + modelo.formato();
        int id = dao.salvar(modelo.id(), periodo, departamento, req.idUsuario(), req.usuario().getNome(), agora,
                new RelatorioDAO.Arquivo(nome, conteudo));
        return json(dao.buscar(id));
    }

    private Object baixar(Requisicao req) throws SQLException {
        RelatorioDAO.Arquivo arquivo = new RelatorioDAO(req.conexao()).arquivo(req.idCaminho("id"));
        if (arquivo == null) throw ApiException.naoEncontrado("Relatório não encontrado.");
        String tipo = arquivo.nome().endsWith(".pdf") ? "application/pdf" : "text/csv; charset=UTF-8";
        return new Arquivo(arquivo.nome(), tipo, arquivo.conteudo());
    }

    // ---- geradores ---------------------------------------------------------

    private static String dataHora(Instant instante) {
        return instante == null ? "" : DATA_HORA.format(instante);
    }

    private static String percentual(int parte, int total) {
        return total == 0 ? "—" : Math.round(parte * 100.0 / total) + "%";
    }

    private static String decimal(double valor) {
        return String.format(PT_BR, "%.1f", valor);
    }

    private static byte[] engajamento(RelatorioDAO dao, Instant desde, String departamento) throws SQLException {
        Csv csv = new Csv("Matrícula", "Nome", "Departamento", "Acessos no período", "Dias com acesso",
                "Aulas concluídas no período", "Último acesso");
        for (RelatorioDAO.Engajamento e : dao.engajamento(desde, departamento)) {
            csv.linha(e.matricula(), e.nome(), e.departamento(), e.acessos(), e.diasComAcesso(), e.aulasConcluidas(),
                    dataHora(e.ultimoAcesso()));
        }
        return csv.bytes();
    }

    private static byte[] conclusao(RelatorioDAO dao, Instant desde, String departamento, String titulo,
                                    String subtitulo) throws SQLException {
        List<List<String>> linhas = new ArrayList<>();
        for (RelatorioDAO.ConclusaoDepartamento c : dao.conclusao(desde, departamento)) {
            linhas.add(List.of(c.departamento(), String.valueOf(c.colaboradores()), String.valueOf(c.matriculas()),
                    String.valueOf(c.concluidas()), percentual(c.concluidas(), c.matriculas()),
                    String.valueOf(c.concluidasNoPeriodo()), c.progressoMedio() + "%"));
        }
        return TabelaPdf.gerar(titulo, subtitulo, List.of(new Coluna("Departamento", 3, false),
                new Coluna("Colaboradores", 1.4, true), new Coluna("Matrículas", 1.3, true),
                new Coluna("Concluídas", 1.3, true), new Coluna("Taxa de conclusão", 1.7, true),
                new Coluna("Concluídas no período", 2, true), new Coluna("Progresso médio", 1.6, true)), linhas);
    }

    private static byte[] horas(RelatorioDAO dao, Instant desde, String departamento, String titulo,
                                String subtitulo) throws SQLException {
        List<List<String>> linhas = new ArrayList<>();
        for (RelatorioDAO.HorasDepartamento h : dao.horas(desde, departamento)) {
            double horas = h.segundos() / 3600.0;
            linhas.add(List.of(h.departamento(), String.valueOf(h.colaboradores()), decimal(horas),
                    decimal(h.colaboradores() == 0 ? 0 : horas / h.colaboradores()),
                    String.valueOf(h.certificados())));
        }
        return TabelaPdf.gerar(titulo, subtitulo, List.of(new Coluna("Departamento", 3, false),
                new Coluna("Colaboradores", 1.5, true), new Coluna("Horas de aula", 1.5, true),
                new Coluna("Horas por colaborador", 2, true), new Coluna("Certificados emitidos", 2, true)), linhas);
    }

    private static byte[] satisfacao(RelatorioDAO dao, Instant desde, String departamento) throws SQLException {
        Csv csv = new Csv("Curso", "Categoria", "Instrutor", "Nota média", "Avaliações", "Matriculados",
                "Concluintes no período");
        for (RelatorioDAO.AvaliacaoCurso a : dao.avaliacoes(desde, departamento)) {
            csv.linha(a.curso(), a.categoria(), a.instrutor(), decimal(a.nota()), a.avaliacoes(), a.matriculados(),
                    a.concluintesNoPeriodo());
        }
        return csv.bytes();
    }

    private static byte[] individual(RelatorioDAO dao, Instant desde, String departamento, String titulo,
                                     String subtitulo) throws SQLException {
        List<List<String>> linhas = new ArrayList<>();
        for (RelatorioDAO.Desempenho d : dao.desempenho(desde, departamento)) {
            linhas.add(List.of(d.nome(), d.departamento(), String.valueOf(d.concluidos()),
                    String.valueOf(d.emAndamento()), d.progressoMedio() + "%", String.valueOf(d.certificados()),
                    String.valueOf(d.aulasNoPeriodo()), dataHora(d.ultimoAcesso())));
        }
        return TabelaPdf.gerar(titulo, subtitulo, List.of(new Coluna("Colaborador", 3, false),
                new Coluna("Departamento", 2.2, false), new Coluna("Concluídos", 1.2, true),
                new Coluna("Em andamento", 1.4, true), new Coluna("Progresso", 1.2, true),
                new Coluna("Certificados", 1.3, true), new Coluna("Aulas no período", 1.6, true),
                new Coluna("Último acesso", 1.9, false)), linhas);
    }

    private static byte[] conformidade(RelatorioDAO dao, String departamento) throws SQLException {
        Csv csv = new Csv("Matrícula", "Nome", "Departamento", "Treinamento obrigatório", "Situação", "Progresso (%)",
                "Concluído em");
        for (RelatorioDAO.Conformidade c : dao.conformidade(departamento)) {
            String situacao = c.progresso() == null ? "Não iniciado"
                    : c.progresso() >= 100 ? "Concluído" : "Em andamento";
            csv.linha(c.matricula(), c.nome(), c.departamento(), c.curso(), situacao,
                    c.progresso() == null ? 0 : c.progresso(), c.concluidoEm() == null ? "" : DATA.format(c.concluidoEm()));
        }
        return csv.bytes();
    }
}
