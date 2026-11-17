package br.com.caracursos.recursos;

import java.sql.SQLException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import br.com.caracursos.dao.ColaboradorDAO;
import br.com.caracursos.dao.RelatorioDAO;
import br.com.caracursos.dao.RelatorioDAO.Gerado;
import br.com.caracursos.http.ApiException;
import br.com.caracursos.http.Arquivo;
import br.com.caracursos.http.Requisicao;
import br.com.caracursos.http.Roteador;
import br.com.caracursos.relatorios.ContextoRelatorio;
import br.com.caracursos.relatorios.GeradorRelatorio;
import br.com.caracursos.relatorios.Geradores;
import br.com.caracursos.seguranca.Permissao;
import br.com.caracursos.util.Periodo;
import br.com.caracursos.util.Relogio;

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

    private static final DateTimeFormatter DATA_HORA =
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm").withZone(Relogio.FUSO_EMPRESA);

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
        String idPeriodo = req.texto("periodo");
        Periodo periodo = Periodo.deId(idPeriodo);
        String departamento = req.texto("departamento");

        Map<String, String> campos = new LinkedHashMap<>();
        if (modelo == null) campos.put("modeloId", "Escolha um modelo de relatório.");
        if (periodo == null) campos.put("periodo", "Escolha um período.");
        if (departamento != null && !new ColaboradorDAO(req.conexao()).departamentos().contains(departamento)) {
            campos.put("departamento", "Escolha um departamento da lista.");
        }
        if (!campos.isEmpty()) throw ApiException.validacao(campos);

        Instant agora = Relogio.agora();
        Instant desde = periodo.desde(agora);
        String subtitulo = periodo.rotulo() + " · "
                + (departamento == null ? "Todos os departamentos" : departamento)
                + " · Gerado em " + DATA_HORA.format(agora) + " por " + req.usuario().getNome();
        RelatorioDAO dao = new RelatorioDAO(req.conexao());
        GeradorRelatorio gerador = Geradores.de(modelo.id());
        if (gerador == null) throw new IllegalStateException("Modelo sem gerador: " + modelo.id());
        byte[] conteudo = gerador.gerar(new ContextoRelatorio(dao, desde, departamento, modelo.titulo(), subtitulo));
        String nome = modelo.id() + "-" + LocalDate.ofInstant(agora, Relogio.FUSO_EMPRESA) + "." + modelo.formato();
        int id = dao.salvar(modelo.id(), periodo.id(), departamento, req.idUsuario(), req.usuario().getNome(), agora,
                new RelatorioDAO.Arquivo(nome, conteudo));
        return json(dao.buscar(id));
    }

    private Object baixar(Requisicao req) throws SQLException {
        RelatorioDAO.Arquivo arquivo = new RelatorioDAO(req.conexao()).arquivo(req.idCaminho("id"));
        if (arquivo == null) throw ApiException.naoEncontrado("Relatório não encontrado.");
        String tipo = arquivo.nome().endsWith(".pdf") ? "application/pdf" : "text/csv; charset=UTF-8";
        return new Arquivo(arquivo.nome(), tipo, arquivo.conteudo());
    }
}
