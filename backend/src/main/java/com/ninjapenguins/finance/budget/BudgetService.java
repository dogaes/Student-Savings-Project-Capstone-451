package com.ninjapenguins.finance.budget;

import com.ninjapenguins.finance.common.FieldException;
import com.ninjapenguins.finance.transaction.TransactionRepository;
import com.ninjapenguins.finance.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class BudgetService {

    /** A budget category plus what was spent this month and last month in it. */
    public record BudgetView(BudgetCategory category, BigDecimal spent, BigDecimal lastMonth) {
    }

    private final BudgetCategoryRepository budgets;
    private final TransactionRepository transactions;
    private final UserRepository users;

    public BudgetService(BudgetCategoryRepository budgets, TransactionRepository transactions,
                         UserRepository users) {
        this.budgets = budgets;
        this.transactions = transactions;
        this.users = users;
    }

    @Transactional(readOnly = true)
    public List<BudgetView> list(String username, String month) {
        Long userId = userId(username);
        YearMonth ym = parseMonth(month);
        Map<String, BigDecimal> spent = spending(userId, ym);
        Map<String, BigDecimal> last = spending(userId, ym.minusMonths(1));
        return budgets.findByUserIdAndMonthOrderByNameAsc(userId, ym.atDay(1)).stream()
                .map(b -> toView(b, spent, last))
                .toList();
    }

    @Transactional
    public BudgetView create(String username, String month, String name, BigDecimal amount) {
        Long userId = userId(username);
        YearMonth ym = parseMonth(month);
        String cleanName = name.trim();
        requireUniqueName(userId, ym, cleanName, null);

        BudgetCategory b = new BudgetCategory();
        b.setUserId(userId);
        b.setMonth(ym.atDay(1));
        b.setName(cleanName);
        b.setBudgetAmount(amount);
        return viewOf(budgets.save(b), userId, ym);
    }

    @Transactional
    public BudgetView update(String username, Long id, String month, String name, BigDecimal amount) {
        Long userId = userId(username);
        BudgetCategory b = find(id, userId);
        YearMonth ym = parseMonth(month);
        String cleanName = name.trim();
        requireUniqueName(userId, ym, cleanName, id);

        b.setMonth(ym.atDay(1));
        b.setName(cleanName);
        b.setBudgetAmount(amount);
        return viewOf(budgets.save(b), userId, ym);
    }

    @Transactional
    public void delete(String username, Long id) {
        Long userId = userId(username);
        budgets.delete(find(id, userId));
    }

    private BudgetView viewOf(BudgetCategory b, Long userId, YearMonth ym) {
        return toView(b, spending(userId, ym), spending(userId, ym.minusMonths(1)));
    }

    private BudgetView toView(BudgetCategory b, Map<String, BigDecimal> spent, Map<String, BigDecimal> last) {
        String key = b.getName().toLowerCase(Locale.ROOT);
        return new BudgetView(b,
                spent.getOrDefault(key, BigDecimal.ZERO),
                last.getOrDefault(key, BigDecimal.ZERO));
    }

    /** Spending per category (lowercase name) for a month, as positive numbers. */
    private Map<String, BigDecimal> spending(Long userId, YearMonth ym) {
        Map<String, BigDecimal> map = new HashMap<>();
        for (Object[] row : transactions.spendingByCategory(userId, ym.atDay(1), ym.atEndOfMonth())) {
            map.put((String) row[0], ((BigDecimal) row[1]).negate());
        }
        return map;
    }

    private BudgetCategory find(Long id, Long userId) {
        return budgets.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new FieldException(HttpStatus.NOT_FOUND, "form", "Budget category not found"));
    }

    private void requireUniqueName(Long userId, YearMonth ym, String name, Long ownId) {
        budgets.findByUserIdAndMonthAndNameIgnoreCase(userId, ym.atDay(1), name).ifPresent(existing -> {
            if (!existing.getId().equals(ownId)) {
                throw new FieldException(HttpStatus.CONFLICT, "name",
                        "You already have a budget for that category this month");
            }
        });
    }

    private YearMonth parseMonth(String month) {
        try {
            return YearMonth.parse(month);
        } catch (DateTimeParseException e) {
            throw new FieldException(HttpStatus.BAD_REQUEST, "month", "Month must look like 2026-10");
        }
    }

    private Long userId(String username) {
        return users.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new FieldException(HttpStatus.UNAUTHORIZED, "form", "Signed-in user not found"))
                .getId();
    }
}