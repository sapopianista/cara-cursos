package br.com.caracursos.service;

import java.sql.Connection;
import java.sql.SQLException;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import br.com.caracursos.dao.ColaboradorDAO;
import br.com.caracursos.dao.CursoDAO;
import br.com.caracursos.dao.EmpresaDAO;
import br.com.caracursos.dao.SessaoDAO;
import br.com.caracursos.model.Colaborador;
import br.com.caracursos.util.Relogio;

/** Regras de negócio e indicadores do painel corporativo. */
public class DashboardService {

    private static final Map<String, Integer> DIAS_PERIODO = Map.of("7dias", 7, "30dias", 30, "trimestre", 90);
    private static final int META_ENGAJAMENTO = 70;

    /** Turnos na ordem em que o gráfico os exibe. {@code de} inclusivo, {@code ate} exclusivo. */
    private record Turno(String nome, String intervalo, int de, int ate) {
    }

    private static final List<Turno> TURNOS = List.of(
            new Turno("Tarde", "12h–18h", 12, 18),
            new Turno("Manhã", "6h–12h", 6, 12),
            new Turno("Noite", "18h–0h", 18, 24),
            new Turno("Madrugada", "0h–6h", 0, 6));

    public Map<String, Object> painel(Connection c, String pedido) throws SQLException {
        String periodo = pedido != null && DIAS_PERIODO.containsKey(pedido) ? pedido : "7dias";
        ZoneId fuso = new EmpresaDAO(c).fusoHorario();
        Instant fim = Relogio.agora();
        Instant inicio = fim.minus(Duration.ofDays(DIAS_PERIODO.get(periodo)));
        Instant inicioDoDia = LocalDate.now(fuso).atStartOfDay(fuso).toInstant();

        ColaboradorDAO colaboradores = new ColaboradorDAO(c);
        int ativos = colaboradores.contarAtivos();
        int acessaram = colaboradores.contarAtivosQueAcessaramDesde(inicio);

        Map<String, Object> indicadores = new LinkedHashMap<>();
        indicadores.put("engajamento", ativos == 0 ? 0 : Math.round(acessaram * 100.0 / ativos));
        indicadores.put("metaEngajamento", META_ENGAJAMENTO);
        indicadores.put("conclusaoMedia", colaboradores.conclusaoMediaDosAtivos());
        // Sem avaliações por aluno ainda: usa a nota média dos cursos em uso.
        indicadores.put("satisfacao", new CursoDAO(c).notaMediaDosCursosEmUso());

        List<Map<String, Object>> recentes = new ArrayList<>();
        for (Colaborador col : colaboradores.acessosRecentes(5)) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", col.id());
            item.put("nome", col.nome());
            item.put("email", col.email());
            item.put("cargo", col.cargo());
            item.put("ultimoAcesso", col.ultimoAcesso());
            recentes.add(item);
        }
        Map<String, Object> atividade = new LinkedHashMap<>();
        atividade.put("ativosHoje", colaboradores.contarAtivosQueAcessaramDesde(inicioDoDia));
        atividade.put("totalColaboradores", ativos);
        atividade.put("colaboradores", recentes);

        Map<String, Object> json = new LinkedHashMap<>();
        json.put("periodo", Map.of("id", periodo, "inicio", inicio, "fim", fim));
        json.put("indicadores", indicadores);
        json.put("atividadeRecente", atividade);
        json.put("sessoesPorTurno", sessoesPorTurno(c, inicio, fim, fuso));
        return json;
    }

    private static Map<String, Object> sessoesPorTurno(Connection c, Instant inicio, Instant agora, ZoneId fuso)
            throws SQLException {
        int deslocamento = fuso.getRules().getOffset(agora).getTotalSeconds() / 3600;
        Map<Integer, Integer> porHora = new SessaoDAO(c).contarPorHora(inicio, deslocamento);
        int[] contagens = new int[TURNOS.size()];
        porHora.forEach((hora, total) -> {
            for (int i = 0; i < TURNOS.size(); i++) {
                if (hora >= TURNOS.get(i).de() && hora < TURNOS.get(i).ate()) contagens[i] += total;
            }
        });
        int total = 0;
        for (int n : contagens) total += n;
        int[] percentuais = percentuaisQueSomam100(contagens, total);

        List<Map<String, Object>> segmentos = new ArrayList<>();
        for (int i = 0; i < TURNOS.size(); i++) {
            Turno t = TURNOS.get(i);
            segmentos.add(Map.of("turno", t.nome(), "intervalo", t.intervalo(), "percentual", percentuais[i]));
        }
        return Map.of("total", total, "segmentos", segmentos);
    }

    /** Arredonda distribuindo as sobras pelos maiores restos, para o gráfico fechar em 100%. */
    public static int[] percentuaisQueSomam100(int[] contagens, int total) {
        int[] resultado = new int[contagens.length];
        if (total == 0) return resultado;
        double[] restos = new double[contagens.length];
        int soma = 0;
        for (int i = 0; i < contagens.length; i++) {
            double exato = contagens[i] * 100.0 / total;
            resultado[i] = (int) Math.floor(exato);
            restos[i] = exato - resultado[i];
            soma += resultado[i];
        }
        while (soma < 100) {
            int maior = 0;
            for (int i = 1; i < restos.length; i++) if (restos[i] > restos[maior]) maior = i;
            resultado[maior]++;
            restos[maior] = -1;
            soma++;
        }
        return resultado;
    }
}
