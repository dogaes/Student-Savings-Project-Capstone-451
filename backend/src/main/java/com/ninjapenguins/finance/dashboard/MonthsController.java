package com.ninjapenguins.finance.dashboard;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * GET /api/months -> the months that have any data for the signed-in user
 * (a transaction or a budget category), newest first, like ["2026-11", "2026-10"].
 * The month dropdowns use this so they don't offer empty months.
 */
@RestController
@RequestMapping("/api/months")
public class MonthsController {

    private final JdbcTemplate jdbc;

    public MonthsController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @GetMapping
    public List<String> list(Authentication auth) {
        return jdbc.queryForList(
                "SELECT m FROM ("
                        + " SELECT to_char(t.txn_date, 'YYYY-MM') AS m FROM transactions t"
                        + "   JOIN users u ON u.id = t.user_id WHERE LOWER(u.username) = LOWER(?)"
                        + " UNION"
                        + " SELECT to_char(b.month, 'YYYY-MM') AS m FROM budget_categories b"
                        + "   JOIN users u ON u.id = b.user_id WHERE LOWER(u.username) = LOWER(?)"
                        + ") months ORDER BY m DESC",
                String.class, auth.getName(), auth.getName());
    }
}
