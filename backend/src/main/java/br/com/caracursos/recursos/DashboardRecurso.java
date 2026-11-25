package br.com.caracursos.recursos;

import java.sql.Connection;
import java.sql.SQLException;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import br.com.caracursos.dao.ColaboradorDAO;
import br.com.caracursos.dao.CursoDAO;
import br.com.caracursos.dao.SessaoDAO;
import br.com.caracursos.http.Requisicao;
import br.com.caracursos.http.Roteador;
import br.com.caracursos.seguranca.Permissao;
import br.com.caracursos.service.DashboardService;

/** Painel da empresa: {@code GET /admin/dashboard?periodo=7dias|30dias|trimestre}. */
public class DashboardRecurso {

    private final DashboardService servico = new DashboardService();

    public void registrar(Roteador r) {
        r.get("/admin/dashboard", Permissao.ADMIN_VISAO,
                req -> servico.painel(req.conexao(), req.parametro("periodo")));
    }


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
        for (ColaboradorDAO.Colaborador col : colaboradores.acessosRecentes(5)) {
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
        json.put("sessoesPorTurno", sessoesPorTurno(c, inicio, fim));
        return json;
    }

    private static Map<String, Object> sessoesPorTurno(Connection c, Instant inicio, Instant agora) throws SQLException {
        int deslocamento = Relogio.fuso().getRules().getOffset(agora).getTotalSeconds() / 3600;
        Map<Integer, Integer> porHora = new SessaoDAO(c).contarPorHora(inicio, deslocamento);
        int[] contagens = new int[TURNOS.size()];
        porHora.forEach((hora, total) -> {
            for (int i = 0; i < TURNOS.size(); i++) {
                if (hora >= TURNOS.get(i).de() && hora < TURNOS.get(i).ate()) contagens[i] += total;
            }
        });
        int total = Arrays.stream(contagens).reduce(0, Integer::sum);
        int[] percentuais = percentuaisQueSomam100(contagens, total);

        List<Map<String, Object>> segmentos = new ArrayList<>();
        for (int i = 0; i < TURNOS.size(); i++) {
            Turno t = TURNOS.get(i);
            segmentos.add(Map.of("turno", t.nome(), "intervalo", t.intervalo(), "percentual", percentuais[i]));
        }
        return Map.of("total", total, "segmentos", segmentos);
    }

    /** Arredonda distribuindo as sobras pelos maiores restos, para o gráfico fechar em 100%. */
    static int[] percentuaisQueSomam100(int[] contagens, int total) {
        return DashboardService.percentuaisQueSomam100(contagens, total);
    }
}
