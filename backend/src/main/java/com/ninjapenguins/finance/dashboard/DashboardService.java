package com.ninjapenguins.finance.dashboard;

import com.ninjapenguins.finance.account.AccountService;
import com.ninjapenguins.finance.account.AccountService.AccountView;
import com.ninjapenguins.finance.budget.BudgetService;
import com.ninjapenguins.finance.budget.BudgetService.BudgetView;
import com.ninjapenguins.finance.common.FieldException;
import com.ninjapenguins.finance.goal.Goal;
import com.ninjapenguins.finance.goal.GoalService;
import com.ninjapenguins.finance.loan.LoanService;
import com.ninjapenguins.finance.loan.LoanService.LoanSummary;
import com.ninjapenguins.finance.transaction.Transaction;
import com.ninjapenguins.finance.transaction.TransactionRepository;
import com.ninjapenguins.finance.transaction.TransactionService;
import com.ninjapenguins.finance.transaction.TransactionService.TransactionView;
import com.ninjapenguins.finance.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Get everything the dashboard shows by calling services */
@Service
public class DashboardService {

    public record MonthTotal(YearMonth month, BigDecimal income, BigDecimal spending) {
    }

    public record Dashboard(List<YearMonth> months, boolean empty, BigDecimal income,
                            List<BudgetView> categories, List<TransactionView> transactions,
                            List<AccountView> accounts, LoanSummary loans, List<Goal> goals,
                            List<MonthTotal> history) {
    }

    private static final int RECENT_TRANSACTIONS = 5;

    private final AccountService accountService;
    private final TransactionService transactionService;
    private final BudgetService budgetService;
    private final LoanService loanService;
    private final GoalService goalService;
    private final TransactionRepository transactionRepo;
    private final UserRepository users;

    public DashboardService(AccountService accountService, TransactionService transactionService,
                            BudgetService budgetService, LoanService loanService, GoalService goalService,
                            TransactionRepository transactionRepo, UserRepository users) {
        this.accountService = accountService;
        this.transactionService = transactionService;
        this.budgetService = budgetService;
        this.loanService = loanService;
        this.goalService = goalService;
        this.transactionRepo = transactionRepo;
        this.users = users;
    }

    @Transactional(readOnly = true)
    public Dashboard build(String username, String month) {
        YearMonth ym = parseMonth(month);
        Long userId = users.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new FieldException(HttpStatus.UNAUTHORIZED, "form", "Signed-in user not found"))
                .getId();

        List<BudgetView> categories = budgetService.list(username, month(ym));
        List<TransactionView> all = transactionService.list(username, month(ym));
        List<TransactionView> recent = all.stream().limit(RECENT_TRANSACTIONS).toList();
        List<MonthTotal> history = history(userId, ym);
        BigDecimal income = history.get(history.size() - 1).income();

        return new Dashboard(months(ym), categories.isEmpty() && all.isEmpty(), income, categories, recent,
                accountService.list(username), loanService.list(username), goalService.list(username), history);
    }

    /** Income (positive amounts) and spending (negative amounts, shown positive) for 6 months */
    private List<MonthTotal> history(Long userId, YearMonth ym) {
        YearMonth first = ym.minusMonths(5);
        Map<YearMonth, BigDecimal[]> totals = new LinkedHashMap<>();
        for (int i = 0; i < 6; i++) {
            totals.put(first.plusMonths(i), new BigDecimal[]{BigDecimal.ZERO, BigDecimal.ZERO});
        }
        for (Transaction t : transactionRepo.findByUserIdAndTxnDateBetweenOrderByTxnDateDescIdDesc(
                userId, first.atDay(1), ym.atEndOfMonth())) {
            BigDecimal[] sums = totals.get(YearMonth.from(t.getTxnDate()));
            if (t.getAmount().signum() > 0) {
                sums[0] = sums[0].add(t.getAmount());
            } else {
                sums[1] = sums[1].add(t.getAmount().negate());
            }
        }
        List<MonthTotal> result = new ArrayList<>();
        totals.forEach((m, s) -> result.add(new MonthTotal(m, s[0], s[1])));
        return result;
    }

    /** dropdown: the last 12 months up to now, newest first, includ the selected month */
    private List<YearMonth> months(YearMonth selected) {
        YearMonth latest = YearMonth.now().isAfter(selected) ? YearMonth.now() : selected;
        List<YearMonth> list = new ArrayList<>();
        for (int i = 0; i < 12; i++) {
            list.add(latest.minusMonths(i));
        }
        if (!list.contains(selected)) {
            list.add(selected);
        }
        return list;
    }

    private static String month(YearMonth ym) {
        return ym.toString();
    }

    private YearMonth parseMonth(String month) {
        if (month == null || month.isBlank()) {
            return YearMonth.now();
        }
        try {
            return YearMonth.parse(month);
        } catch (DateTimeParseException e) {
            throw new FieldException(HttpStatus.BAD_REQUEST, "month", "Month must look like 2026-10");
        }
    }
}