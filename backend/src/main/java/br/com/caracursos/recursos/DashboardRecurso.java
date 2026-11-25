package br.com.caracursos.recursos;

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

    /** Arredonda distribuindo as sobras pelos maiores restos, para o gráfico fechar em 100%. */
    static int[] percentuaisQueSomam100(int[] contagens, int total) {
        return DashboardService.percentuaisQueSomam100(contagens, total);
    }
}
