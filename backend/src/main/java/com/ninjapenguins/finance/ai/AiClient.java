package com.ninjapenguins.finance.ai;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class AiClient {

    private final RestClient http;
    private final String model;
    private final String apiKey;

    public AiClient(
            @Value("${app.ai.base-url}") String baseUrl,
            @Value("${app.ai.model}") String model,
            @Value("${app.ai.api-key}") String apiKey,
            @Value("${app.ai.timeout-ms}") int timeoutMs) {

        SimpleClientHttpRequestFactory factory =
                new SimpleClientHttpRequestFactory();

        factory.setConnectTimeout(timeoutMs);
        factory.setReadTimeout(timeoutMs);

        this.http = RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(factory)
                .build();

        this.model = model;
        this.apiKey = apiKey;
    }

    public String ask(
            String system,
            List<Map<String, String>> messages) {

        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException(
                    "AI_API_KEY is not set");
        }

        List<Map<String, Object>> contents = new ArrayList<>();

        for (Map<String, String> m : messages) {

            String role = "assistant".equals(m.get("role"))
                    ? "model"
                    : "user";

            if (contents.isEmpty() && role.equals("model")) {
                continue;
            }

            contents.add(Map.of(
                    "role", role,
                    "parts", List.of(
                            Map.of("text", m.get("content"))
                    )
            ));
        }

        Map<String, Object> body = Map.of(
                "systemInstruction",
                Map.of("parts", List.of(
                        Map.of("text", system)
                )),
                "contents", contents,
                "generationConfig",
                Map.of("maxOutputTokens", 1024)
        );

        Map<?, ?> reply = http.post()
                .uri("/v1beta/models/{model}:generateContent", model)
                .header("x-goog-api-key", apiKey)
                .body(body)
                .retrieve()
                .body(Map.class);

        if (reply == null) {
            throw new IllegalStateException(
                    "No response from Gemini");
        }

        List<?> candidates = (List<?>) reply.get("candidates");

        if (candidates == null || candidates.isEmpty()) {
            throw new IllegalStateException(
                    "Gemini returned no candidates");
        }

        Map<?, ?> content = (Map<?, ?>)
                ((Map<?, ?>) candidates.get(0)).get("content");

        if (content == null) {
            throw new IllegalStateException(
                    "Gemini returned no content");
        }

        StringBuilder text = new StringBuilder();

        for (Object p : (List<?>) content.get("parts")) {

            Map<?, ?> part = (Map<?, ?>) p;

            if (Boolean.TRUE.equals(part.get("thought"))) {
                continue;
            }

            if (part.get("text") != null) {
                text.append(part.get("text"));
            }
        }

        String answer = text.toString().trim();

        if (answer.isEmpty()) {
            throw new IllegalStateException(
                    "Empty answer from Gemini");
        }

        return answer;
    }
}
