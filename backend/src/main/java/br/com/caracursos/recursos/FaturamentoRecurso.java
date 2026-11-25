package br.com.caracursos.recursos;

import java.sql.SQLException;
import java.text.NumberFormat;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import br.com.caracursos.dao.AuditoriaDAO;
import br.com.caracursos.dao.EmpresaDAO;
import br.com.caracursos.dao.FaturamentoDAO;
import br.com.caracursos.dao.FaturamentoDAO.Contrato;
import br.com.caracursos.dao.FaturamentoDAO.DadosFiscais;
import br.com.caracursos.dao.FaturamentoDAO.Fatura;
import br.com.caracursos.dao.UsuarioDAO;
import br.com.caracursos.http.ApiException;
import br.com.caracursos.http.Arquivo;
import br.com.caracursos.http.Requisicao;
import br.com.caracursos.http.Roteador;
import br.com.caracursos.seguranca.Permissao;
import br.com.caracursos.util.Relogio;
import br.com.caracursos.util.TabelaPdf;
import br.com.caracursos.util.TabelaPdf.Coluna;

/**
 * Painel da empresa: {@code /admin/faturamento}.
 *
 * <p>Não há integração com sistema de cobrança: contrato e faturas vêm do banco, e o arquivo
 * de cada fatura é um demonstrativo em PDF (sem valor fiscal).
 */
public class FaturamentoRecurso {

    private static final int MIN_LICENCAS = 1;
    private static final int MAX_LICENCAS = 500;
    /** Teto do total de licenças (a coluna é SMALLINT). */
    private static final int MAX_TOTAL = 10_000;
    /** As faturas vencem todo dia 15. */
    private static final int DIA_VENCIMENTO = 15;

    private static final Locale PT_BR = Locale.of("pt", "BR");
    private static final DateTimeFormatter DATA =
            DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter MES =
            DateTimeFormatter.ofPattern("MMMM 'de' yyyy", PT_BR);

    public void registrar(Roteador r) {
        Permissao p = Permissao.ADMIN_FATURAMENTO;
        r.get("/admin/faturamento", p, this::resumo);
        r.post("/admin/faturamento/licencas", p, this::contratarLicencas);
        r.get("/admin/faturamento/faturas/{id}/nota", p, this::demonstrativo);
    }

    private static String urlNota(Fatura f) {
        return "/admin/faturamento/faturas/" + f.id() + "/nota";
    }

    private Object resumo(Requisicao req) throws SQLException {
        FaturamentoDAO dao = new FaturamentoDAO(req.conexao());
        Contrato contrato = dao.contrato();
        if (contrato == null) throw ApiException.naoEncontrado("A empresa ainda não tem contrato cadastrado.");
        int emUso = new UsuarioDAO(req.conexao()).contarLicencasEmUso();
        ZoneId fuso = new EmpresaDAO(req.conexao()).fusoHorario();

        List<Map<String, Object>> faturas = dao.faturas().stream().map(f -> {
            Map<String, Object> json = new LinkedHashMap<>();
            json.put("id", f.id());
            json.put("competencia", f.competencia());
            json.put("licencas", f.licencas());
            json.put("emitidaEm", f.emitidaEm());
            json.put("vencimento", f.vencimento());
            json.put("valorCentavos", f.valorCentavos());
            json.put("status", f.status());
            json.put("notaFiscal", Map.of("numero", f.notaFiscal(), "url", urlNota(f)));
            return json;
        }).toList();

        Map<String, Object> json = new LinkedHashMap<>();
        json.put("contrato", contrato);
        json.put("licencas", Map.of("contratadas", contrato.licencasContratadas(), "emUso", emUso));
        json.put("proximaFatura", Map.of("vencimento", proximoVencimento(fuso),
                "valorCentavos", contrato.licencasContratadas() * contrato.valorLicencaMensalCentavos()));
        json.put("dadosFiscais", dao.dadosFiscais());
        json.put("faturas", faturas);
        return json;
    }

    /** Próximo dia 15 depois de hoje (no fuso da empresa), à meia-noite. */
    private static Instant proximoVencimento(ZoneId fuso) {
        LocalDate hoje = LocalDate.now(fuso);
        LocalDate vencimento = hoje.withDayOfMonth(DIA_VENCIMENTO);
        if (!vencimento.isAfter(hoje)) vencimento = vencimento.plusMonths(1);
        return vencimento.atStartOfDay(fuso).toInstant();
    }

    private Object contratarLicencas(Requisicao req) throws SQLException {
        Integer quantidade = req.inteiro("quantidade");
        if (quantidade == null || quantidade < MIN_LICENCAS || quantidade > MAX_LICENCAS) {
            throw ApiException.validacao("Informe uma quantidade entre " + MIN_LICENCAS + " e " + MAX_LICENCAS + ".",
                    Map.of("quantidade", "Entre " + MIN_LICENCAS + " e " + MAX_LICENCAS + "."));
        }
        int total = req.transacao(c -> {
            int novo = new FaturamentoDAO(c).contratarLicencas(quantidade);
            if (novo > MAX_TOTAL) {
                throw ApiException.validacao(Map.of("quantidade", "O limite é de " + MAX_TOTAL + " licenças."));
            }
            String licencas = quantidade == 1 ? " licença" : " licenças";
            new AuditoriaDAO(c).registrar(req.usuario(), "Licenças contratadas",
                    "contratou " + quantidade + licencas + " (total: " + novo + ").");
            return novo;
        });
        return Map.of("licencasContratadas", total);
    }

    /** Demonstrativo da fatura em PDF. Não é nota fiscal: não há emissor fiscal integrado. */
    private Object demonstrativo(Requisicao req) throws SQLException {
        FaturamentoDAO dao = new FaturamentoDAO(req.conexao());
        Fatura f = dao.fatura(idFatura(req));
        if (f == null) throw ApiException.naoEncontrado("Fatura não encontrada.");
        DadosFiscais fiscais = dao.dadosFiscais();
        Contrato contrato = dao.contrato();
        ZoneId fuso = new EmpresaDAO(req.conexao()).fusoHorario();
        DateTimeFormatter data = DATA.withZone(fuso);
        DateTimeFormatter mes = MES.withZone(fuso);
        NumberFormat moeda = NumberFormat.getCurrencyInstance(PT_BR);

        String subtitulo = fiscais.razaoSocial() + " · CNPJ " + fiscais.cnpj() + " · Contrato " + contrato.numero()
                + " · Documento sem valor fiscal";
        String status = switch (f.status()) {
            case "paga" -> "Paga";
            case "vencida" -> "Vencida";
            default -> "Em aberto";
        };
        DateTimeFormatter dataFmt = DATA.withZone(Relogio.fuso());
        DateTimeFormatter mesFmt = MES.withZone(Relogio.fuso());
        List<List<String>> linhas = List.of(
                List.of("Licenças " + contrato.plano(), mesFmt.format(f.competencia()), String.valueOf(f.licencas()),
                        moeda.format(f.valorCentavos() / 100.0 / Math.max(1, f.licencas())),
                        moeda.format(f.valorCentavos() / 100.0)),
                List.of("Emitida em " + dataFmt.format(f.emitidaEm()) + " · Vencimento " + dataFmt.format(f.vencimento())
                        + " · " + status, "", "", "", ""),
                List.of("Referência da nota fiscal: " + f.notaFiscal() + " · " + contrato.metodoPagamento(),
                        "", "", "", ""));
        byte[] pdf = TabelaPdf.gerar("Demonstrativo da fatura " + f.id(), subtitulo, List.of(
                new Coluna("Descrição", 4, false), new Coluna("Competência", 2, false),
                new Coluna("Licenças", 1.2, true), new Coluna("Valor unitário", 1.6, true),
                new Coluna("Total", 1.6, true)), linhas);
        return new Arquivo(f.notaFiscal() + ".pdf", "application/pdf", pdf);
    }

    /** Ids de fatura são textos como "INV-2026-10"; formato diferente = 404. */
    private static String idFatura(Requisicao req) {
        String id = req.variavel("id");
        if (id == null || !id.matches("INV-\\d{4}-\\d{2}")) throw ApiException.naoEncontrado("Fatura não encontrada.");
        return id;
    }
}
