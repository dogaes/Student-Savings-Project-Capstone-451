package com.ninjapenguins.finance.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.Date;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

/**
 * Creates one shared test account filled with FABRICATED sample data (BR-001), so the team
 * and the professor can see a full dashboard right away.
 *
 *   username: admin      password: admin1234
 *
 * Every time the server starts, the demo account's data is wiped and rebuilt for the last
 * 6 months (based on today's date), so it always looks current and any test edits are undone.
 * Other users are never touched; new accounts start empty.
 * Turn it off with the environment variable DEMO_USER_ENABLED=false.
 */
@Component
public class DemoDataSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoDataSeeder.class);

    static final String USERNAME = "admin";
    static final String EMAIL = "admin@studentsavings.test";
    static final String PASSWORD = "admin1234";

    private final JdbcTemplate jdbc;
    private final PasswordEncoder passwordEncoder;
    private final boolean enabled;

    public DemoDataSeeder(JdbcTemplate jdbc, PasswordEncoder passwordEncoder,
                          @Value("${DEMO_USER_ENABLED:true}") boolean enabled) {
        this.jdbc = jdbc;
        this.passwordEncoder = passwordEncoder;
        this.enabled = enabled;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!enabled) {
            return;
        }
        // Remove the old demo account from before it was renamed to "admin"
        jdbc.update("DELETE FROM users WHERE LOWER(username) = 'demo' AND email = 'demo@studentsavings.test'");

        Long userId = findOrCreateDemoUser();
        if (userId == null) {
            return;
        }

        // Start fresh each time (accounts also removes their transactions)
        for (String table : List.of("transactions", "accounts", "budget_categories", "loans", "goals")) {
            jdbc.update("DELETE FROM " + table + " WHERE user_id = ?", userId);
        }

        LocalDate today = LocalDate.now();
        YearMonth thisMonth = YearMonth.from(today);

        long checking = account(userId, "Campus Checking", "Checking", "900.00");
        account(userId, "Rainy Day Savings", "Savings", "600.00");
        long card = account(userId, "Student Card", "Credit card", "-150.00");

        // 6 months of transactions: this month (up to today) and the 5 before it
        double[] shift = {0, 12.40, -18.20, 31.75, -6.50, 9.90};
        for (int i = 0; i < 6; i++) {
            YearMonth m = thisMonth.minusMonths(i);
            double s = shift[i];
            Object[][] items = {
                {1, "Apartment rent", "Housing", checking, -700.00},
                {3, "Campus Market", "Groceries", checking, -(61.20 + s)},
                {5, "Fed Unsub Loan A payment", "Loan Payments", checking, -62.00},
                {6, "Bus pass", "Transportation", checking, -46.50},
                {8, "Part-time job paycheck", "Income", checking, 700.00},
                {10, "Pizza night", "Dining Out", card, -(38.50 + Math.max(0, s))},
                {12, "Trader Joe's", "Groceries", checking, -(72.35 - s / 2)},
                {14, "Movie tickets", "Entertainment", card, -24.00},
                {17, "Coffee with friends", "Dining Out", checking, -18.75},
                {19, "Campus Market", "Groceries", checking, -(55.80 + s)},
                {22, "Part-time job paycheck", "Income", checking, 700.00},
                {24, "Rideshare home", "Transportation", checking, -21.40},
                {26, "Campus Market", "Groceries", checking, -48.10},
            };
            for (Object[] it : items) {
                LocalDate date = m.atDay((Integer) it[0]);
                if (date.isAfter(today)) {
                    continue; // no future transactions
                }
                transaction(userId, (Long) it[3], date, (String) it[1], (String) it[2], (Double) it[4]);
            }
            if (i == 1) {
                transaction(userId, checking, m.atDay(15), "Textbooks", "Tuition and Books", -312.00);
            }
        }

        // Budgets for this month and last month (last month had a bigger textbook budget)
        Object[][] budget = {
            {"Housing", 700}, {"Groceries", 250}, {"Dining Out", 60}, {"Transportation", 80},
            {"Tuition and Books", 150}, {"Loan Payments", 62}, {"Entertainment", 40},
        };
        for (int i = 0; i < 2; i++) {
            YearMonth m = thisMonth.minusMonths(i);
            for (Object[] b : budget) {
                int amount = (i == 1 && b[0].equals("Tuition and Books")) ? 300 : (Integer) b[1];
                jdbc.update("INSERT INTO budget_categories (user_id, month, name, budget_amount) VALUES (?, ?, ?, ?)",
                        userId, Date.valueOf(m.atDay(1)), b[0], new BigDecimal(amount));
            }
        }

        loan(userId, "Fed Unsub Loan A", "5500.00", "5.50", "62.00", "4867.93", thisMonth.plusMonths(1).atDay(5));
        loan(userId, "Fed Sub Loan B", "4500.00", "4.99", "0.00", "4500.00", thisMonth.plusMonths(8).atDay(1));

        goal(userId, "Spring break trip", "150.00", "600.00", thisMonth.plusMonths(5).atDay(1));
        goal(userId, "Emergency fund", "350.00", "1000.00", thisMonth.plusMonths(7).atEndOfMonth());

        log.info("Demo account ready (username '{}')", USERNAME);
    }

    /** Returns the demo user's id, or null if a real person already took the username. */
    private Long findOrCreateDemoUser() {
        List<String> emails = jdbc.queryForList("SELECT email FROM users WHERE LOWER(username) = ?", String.class, USERNAME);
        if (!emails.isEmpty() && !emails.get(0).equalsIgnoreCase(EMAIL)) {
            // Never wipe a real person's account
            log.warn("Skipping demo data: username '{}' already belongs to a real account", USERNAME);
            return null;
        }
        List<Long> ids = jdbc.queryForList("SELECT id FROM users WHERE LOWER(username) = ?", Long.class, USERNAME);
        if (!ids.isEmpty()) {
            // Reset the password too, in case someone changed it while testing
            jdbc.update("UPDATE users SET password_hash = ? WHERE id = ?", passwordEncoder.encode(PASSWORD), ids.get(0));
            return ids.get(0);
        }
        return jdbc.queryForObject(
                "INSERT INTO users (first_name, last_name, username, email, password_hash) "
                        + "VALUES (?, ?, ?, ?, ?) RETURNING id",
                Long.class, "Demo", "Student", USERNAME, EMAIL, passwordEncoder.encode(PASSWORD));
    }

    private long account(long userId, String name, String type, String openingBalance) {
        return jdbc.queryForObject(
                "INSERT INTO accounts (user_id, name, type, opening_balance) VALUES (?, ?, ?, ?) RETURNING id",
                Long.class, userId, name, type, new BigDecimal(openingBalance));
    }

    private void transaction(long userId, long accountId, LocalDate date, String description,
                             String category, double amount) {
        jdbc.update("INSERT INTO transactions (user_id, account_id, txn_date, description, category, amount) "
                        + "VALUES (?, ?, ?, ?, ?, ?)",
                userId, accountId, Date.valueOf(date), description, category,
                BigDecimal.valueOf(amount).setScale(2, java.math.RoundingMode.HALF_UP));
    }

    private void loan(long userId, String name, String principal, String rate, String payment,
                      String remaining, LocalDate nextDue) {
        jdbc.update("INSERT INTO loans (user_id, name, lender, principal, interest_rate, monthly_payment, "
                        + "remaining_balance, next_due_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                userId, name, "Fictional Loan Servicer", new BigDecimal(principal), new BigDecimal(rate),
                new BigDecimal(payment), new BigDecimal(remaining), Date.valueOf(nextDue));
    }

    private void goal(long userId, String name, String saved, String target, LocalDate targetDate) {
        jdbc.update("INSERT INTO goals (user_id, name, saved_amount, target_amount, target_date) VALUES (?, ?, ?, ?, ?)",
                userId, name, new BigDecimal(saved), new BigDecimal(target), Date.valueOf(targetDate));
    }
}
