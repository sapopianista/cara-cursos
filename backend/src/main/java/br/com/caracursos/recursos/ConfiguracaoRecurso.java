package br.com.caracursos.recursos;

import java.sql.SQLException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

import br.com.caracursos.dao.AuditoriaDAO;
import br.com.caracursos.dao.EmpresaDAO;
import br.com.caracursos.dao.EmpresaDAO.Configuracoes;
import br.com.caracursos.dao.EmpresaDAO.Organizacao;
import br.com.caracursos.dao.EmpresaDAO.Politicas;
import br.com.caracursos.http.ApiException;
import br.com.caracursos.http.Requisicao;
import br.com.caracursos.http.Roteador;
import br.com.caracursos.seguranca.Permissao;
import br.com.caracursos.util.Cnpj;

/**
 * Painel da empresa: {@code /admin/configuracoes}.
 *
 * <p>As políticas são guardadas e devolvidas; aplicá-las (2FA, presença mínima etc.) é uma próxima etapa.
 */
public class ConfiguracaoRecurso {

    private static final Pattern EMAIL = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    private static final Pattern DOMINIO =
            Pattern.compile("^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\\.)+[a-z]{2,63}$");
    /** Os mesmos de {@code FUSOS_HORARIOS} (src/lib/rotulos.js). */
    private static final Set<String> FUSOS = Set.of("America/Sao_Paulo", "America/Manaus", "America/Rio_Branco",
            "America/Noronha", "Europe/Lisbon");

    public void registrar(Roteador r) {
        Permissao p = Permissao.ADMIN_CONFIGURACOES;
        r.get("/admin/configuracoes", p, req -> new EmpresaDAO(req.conexao()).configuracoes());
        r.put("/admin/configuracoes", p, this::salvar);
    }

    private static JsonObject objeto(JsonObject pai, String campo) {
        JsonElement e = pai.get(campo);
        return e != null && e.isJsonObject() ? e.getAsJsonObject() : new JsonObject();
    }

    private static String texto(JsonObject o, String campo) {
        JsonElement e = o.get(campo);
        if (e == null || !e.isJsonPrimitive()) return null;
        String valor = e.getAsString().trim();
        return valor.isEmpty() ? null : valor;
    }

    /** Ausente mantém o valor atual. */
    private static boolean booleano(JsonObject o, String campo, boolean atual) {
        JsonElement e = o.get(campo);
        return e != null && e.isJsonPrimitive() && e.getAsJsonPrimitive().isBoolean() ? e.getAsBoolean() : atual;
    }

    /** "Oscorp.com,  lab.oscorp.com" → "oscorp.com, lab.oscorp.com"; {@code null} se algum for inválido. */
    private static String dominios(String valor) {
        if (valor == null) return "";
        List<String> lista = new ArrayList<>();
        for (String parte : valor.split(",")) {
            String d = parte.trim().toLowerCase(Locale.ROOT);
            if (d.isEmpty()) continue;
            if (!DOMINIO.matcher(d).matches()) return null;
            if (!lista.contains(d)) lista.add(d);
        }
        String resultado = String.join(", ", lista);
        return resultado.length() > 300 ? null : resultado;
    }

    private Object salvar(Requisicao req) throws SQLException {
        EmpresaDAO dao = new EmpresaDAO(req.conexao());
        Configuracoes atual = dao.configuracoes();
        JsonObject org = objeto(req.corpo(), "organizacao");
        JsonObject pol = objeto(req.corpo(), "politicas");

        String nomeFantasia = texto(org, "nomeFantasia");
        String razaoSocial = texto(org, "razaoSocial");
        String cnpj = texto(org, "cnpj");
        String email = texto(org, "emailNotificacao");
        String fuso = texto(org, "fusoHorario");
        String dominios = dominios(texto(org, "dominiosAutorizados"));

        Map<String, String> campos = new LinkedHashMap<>();
        if (nomeFantasia == null) campos.put("nomeFantasia", "Informe o nome fantasia.");
        else if (nomeFantasia.length() > 120) campos.put("nomeFantasia", "Use no máximo 120 caracteres.");
        if (razaoSocial == null) campos.put("razaoSocial", "Informe a razão social.");
        else if (razaoSocial.length() > 160) campos.put("razaoSocial", "Use no máximo 160 caracteres.");
        if (!Cnpj.valido(cnpj)) campos.put("cnpj", "CNPJ inválido. Confira os 14 dígitos.");
        if (email == null || email.length() > 160 || !EMAIL.matcher(email).matches()) {
            campos.put("emailNotificacao", "Informe um e-mail válido.");
        }
        if (fuso == null || !FUSOS.contains(fuso)) campos.put("fusoHorario", "Escolha um fuso horário.");
        if (dominios == null) {
            campos.put("dominiosAutorizados", "Use domínios separados por vírgula, como empresa.com.br.");
        }
        if (!campos.isEmpty()) throw ApiException.validacao(campos);

        Politicas p = atual.politicas();
        Configuracoes novas = new Configuracoes(
                new Organizacao(nomeFantasia, razaoSocial, Cnpj.formatar(cnpj), email.toLowerCase(Locale.ROOT), fuso,
                        dominios),
                new Politicas(booleano(pol, "exigirPresencaMinima", p.exigirPresencaMinima()),
                        booleano(pol, "certificacaoAutomatica", p.certificacaoAutomatica()),
                        booleano(pol, "permitirDownloadMateriais", p.permitirDownloadMateriais()),
                        booleano(pol, "exigir2FA", p.exigir2FA())));
        if (novas.equals(atual)) return atual;

        req.transacao(c -> {
            new EmpresaDAO(c).salvar(novas);
            new AuditoriaDAO(c).registrar(req.usuario(), "Configurações alteradas",
                    "alterou as configurações da organização.");
            return null;
        });
        return novas;
    }
}
