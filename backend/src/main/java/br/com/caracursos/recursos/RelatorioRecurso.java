package br.com.caracursos.recursos;

import java.sql.SQLException;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
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
import br.com.caracursos.seguranca.Permissao;
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
    static final List<Modelo> MODELOS = RelatorioStrategy.modelos();

    private static final Map<String, Integer> DIAS_PERIODO =
            Map.of("7dias", 7, "30dias", 30, "trimestre", 90, "ano", 365);
    private static final Map<String, String> ROTULO_PERIODO = Map.of("7dias", "Últimos 7 dias", "30dias",
            "Últimos 30 dias", "trimestre", "Últimos 3 meses", "ano", "Últimos 12 meses");

    public void registrar(Roteador r) {
        Permissao p = Permissao.ADMIN_RELATORIOS;
        r.get("/admin/relatorios", p, this::listar);
        r.post("/admin/relatorios", p, this::gerar);
        r.get("/admin/relatorios/{id}/arquivo", p, this::baixar);
    }

    private static Modelo modelo(String id) {
        RelatorioStrategy estrategia = RelatorioStrategy.porId(id);
        return estrategia == null ? null : estrategia.toModelo();
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
        RelatorioStrategy estrategia = RelatorioStrategy.porId(req.texto("modeloId"));
        String periodo = req.texto("periodo");
        String departamento = req.texto("departamento");

        Map<String, String> campos = new LinkedHashMap<>();
        if (estrategia == null) campos.put("modeloId", "Escolha um modelo de relatório.");
        if (periodo == null || !DIAS_PERIODO.containsKey(periodo)) campos.put("periodo", "Escolha um período.");
        if (departamento != null && !new ColaboradorDAO(req.conexao()).departamentos().contains(departamento)) {
            campos.put("departamento", "Escolha um departamento da lista.");
        }
        if (!campos.isEmpty()) throw ApiException.validacao(campos);

        Instant agora = Relogio.agora();
        Instant desde = agora.minus(Duration.ofDays(DIAS_PERIODO.get(periodo)));
        String subtitulo = ROTULO_PERIODO.get(periodo) + " · "
                + (departamento == null ? "Todos os departamentos" : departamento)
                + " · Gerado em " + RelatorioStrategy.dataHora(agora) + " por " + req.usuario().getNome();
        RelatorioDAO dao = new RelatorioDAO(req.conexao());
        byte[] conteudo = estrategia.gerar(dao, desde, departamento, subtitulo);
        String nome = estrategia.id() + "-" + LocalDate.ofInstant(agora, Relogio.fuso()) + "." + estrategia.formato();
        int id = dao.salvar(estrategia.id(), periodo, departamento, req.idUsuario(), req.usuario().getNome(), agora,
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
