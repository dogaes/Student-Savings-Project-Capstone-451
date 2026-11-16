
package com.ninjapenguins.finance.ai;

import com.ninjapenguins.finance.user.User;
import com.ninjapenguins.finance.user.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.ZoneOffset;

@Service
public class AiUsageService {

    private final JdbcTemplate jdbcTemplate;
    private final UserRepository userRepository;
    private final int dailyLimit;

    public AiUsageService(
            JdbcTemplate jdbcTemplate,
            UserRepository userRepository,
            @Value("${app.ai.daily-limit:20}") int dailyLimit
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.userRepository = userRepository;
        this.dailyLimit = dailyLimit;
    }

    public void checkAndIncrement(String username) {

        User user = userRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "User not found"
                ));

        Long userId = user.getId();
        LocalDate today = LocalDate.now(ZoneOffset.UTC);

        String sql = """
                INSERT INTO ai_usage (user_id, usage_date, request_count)
                SELECT ?, ?, 1
                WHERE ? > 0
                ON CONFLICT (user_id, usage_date)
                DO UPDATE SET request_count = ai_usage.request_count + 1
                WHERE ai_usage.request_count < ?
                RETURNING request_count
                """;

        var results = jdbcTemplate.query(
                sql,
                (rs, rowNum) -> rs.getInt("request_count"),
                userId,
                today,
                dailyLimit,
                dailyLimit
        );

        if (results.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.TOO_MANY_REQUESTS,
                    "Daily AI limit reached. You can make up to "
                            + dailyLimit
                            + " AI requests per day. Please try again tomorrow."
            );
        }
    }
}
