package com.ninjapenguins.finance.ai;

import java.util.List;
import java.util.Map;

public class AiDtos {

    public record ChatRequest(
            String question,
            List<Map<String, String>> history
    ) {}

    public record ChatResponse(
            String answer
    ) {}

    public record SummaryRequest(
            String month,
            Map<String, Object> totals
    ) {}

    public record SummaryResponse(
            String summary
    ) {}
}
