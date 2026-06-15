package com.nortear.gateway;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClient;

import java.io.IOException;
import java.util.Collections;
import java.util.Set;

@RestController
public class GatewayConfig {

    private static final Set<String> SKIP_HEADERS = Set.of(
            "host", "connection", "content-length", "transfer-encoding", "keep-alive");

    private final RestClient authClient;
    private final RestClient chatClient;

    GatewayConfig(
            @Value("${AUTH_SERVICE_URL:http://localhost:8081}") String authUrl,
            @Value("${CHAT_SERVICE_URL:http://localhost:8082}") String chatUrl) {
        this.authClient = buildClient(authUrl);
        this.chatClient = buildClient(chatUrl);
    }

    @RequestMapping("/api/auth/**")
    public ResponseEntity<byte[]> auth(HttpServletRequest req) throws IOException {
        return forward(authClient, req);
    }

    @RequestMapping("/api/users/**")
    public ResponseEntity<byte[]> users(HttpServletRequest req) throws IOException {
        return forward(authClient, req);
    }

    @RequestMapping("/api/v1/chats/**")
    public ResponseEntity<byte[]> chats(HttpServletRequest req) throws IOException {
        return forward(chatClient, req);
    }

    @RequestMapping("/api/vagas/**")
    public ResponseEntity<byte[]> vagas(HttpServletRequest req) throws IOException {
        return forward(chatClient, req);
    }

    @RequestMapping("/api/v1/telegram/**")
    public ResponseEntity<byte[]> telegram(HttpServletRequest req) throws IOException {
        return forward(chatClient, req);
    }

    private ResponseEntity<byte[]> forward(RestClient client, HttpServletRequest req) throws IOException {
        String uri = req.getRequestURI()
                + (req.getQueryString() != null ? "?" + req.getQueryString() : "");

        HttpHeaders headers = new HttpHeaders();
        Collections.list(req.getHeaderNames()).stream()
                .filter(h -> !SKIP_HEADERS.contains(h.toLowerCase()))
                .forEach(h -> headers.add(h, req.getHeader(h)));

        byte[] body = req.getInputStream().readAllBytes();
        HttpMethod method = HttpMethod.valueOf(req.getMethod());

        RestClient.RequestBodySpec spec = client
                .method(method)
                .uri(uri)
                .headers(h -> h.addAll(headers));

        if (body.length > 0) {
            spec.body(body);
        }

        ResponseEntity<byte[]> downstream = spec.retrieve().toEntity(byte[].class);

        // Reconstrói a resposta sem os headers hop-by-hop (Transfer-Encoding,
        // Connection, etc.) — o Tomcat do gateway adiciona os seus próprios,
        // e duplicá-los gera resposta malformada que o nginx rejeita com 502.
        HttpHeaders cleanHeaders = new HttpHeaders();
        downstream.getHeaders().forEach((name, values) -> {
            if (!SKIP_HEADERS.contains(name.toLowerCase())) {
                cleanHeaders.put(name, values);
            }
        });

        return new ResponseEntity<>(downstream.getBody(), cleanHeaders, downstream.getStatusCode());
    }

    private static RestClient buildClient(String baseUrl) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000);
        factory.setReadTimeout(120000);
        return RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(factory)
                .defaultStatusHandler(status -> true, (req2, res) -> {})
                .build();
    }
}
