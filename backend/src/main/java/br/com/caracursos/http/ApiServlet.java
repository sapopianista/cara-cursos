package br.com.caracursos.http;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Único servlet da aplicação (mapeado em {@code /*}, ver web.xml): converte o
 * HTTP em {@link Api.Pedido} e escreve a {@link Api.Resposta}.
 */
public class ApiServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;

    private transient Api api;

    @Override
    public void init() {
        api = new Api();
    }

    @Override
    protected void service(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        req.setCharacterEncoding(StandardCharsets.UTF_8.name());

        Map<String, String> parametros = new HashMap<>();
        req.getParameterMap().forEach((nome, valores) -> {
            if (valores.length > 0) parametros.put(nome, valores[0]);
        });
        String caminho = req.getPathInfo() == null ? "/" : req.getPathInfo();
        String corpo = new String(req.getInputStream().readAllBytes(), StandardCharsets.UTF_8);

        Api.Resposta resposta = api.processar(new Api.Pedido(
                req.getMethod(), caminho, parametros, corpo, req.getHeader("Authorization")));

        resp.setStatus(resposta.status());
        resp.setHeader("Cache-Control", "no-store");
        resposta.cabecalhos().forEach(resp::setHeader);
        if (resposta.corpo() != null) {
            resp.setContentType(resposta.tipoConteudo());
            resp.setContentLength(resposta.corpo().length);
            try (OutputStream saida = resp.getOutputStream()) {
                saida.write(resposta.corpo());
            }
        }
    }
}
