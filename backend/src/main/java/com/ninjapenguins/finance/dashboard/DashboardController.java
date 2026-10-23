package com.ninjapenguins.finance.dashboard;

import com.ninjapenguins.finance.dashboard.DashboardService.Dashboard;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** One call that returns everything on the dashboard like in sampleDashboard */
@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService service;

    public DashboardController(DashboardService service) {
        this.service = service;
    }

    public record CategoryDto(String name, BigDecimal budget, BigDecimal spent, BigDecimal lastMonth) {
    }

    public record TransactionDto(Long id, LocalDate date, String description, String category,
                                 String account, BigDecimal amount) {
    }

    public record AccountDto(Long id, String name, String type, BigDecimal balance) {
    }

    public record NextDto(String name, BigDecimal amount, LocalDate dueDate) {
    }

    public record LoansDto(BigDecimal totalBalance, NextDto next) {
    }

    public record GoalDto(Long id, String name, BigDecimal saved, BigDecimal target, LocalDate targetDate) {
    }

    public record HistoryDto(String month, BigDecimal income, BigDecimal spending) {
    }

    public record DashboardResponse(List<String> months, boolean empty, BigDecimal income,
                                    List<CategoryDto> categories, List<TransactionDto> transactions,
                                    List<AccountDto> accounts, LoansDto loans, List<GoalDto> goals,
                                    List<HistoryDto> history) {
    }

    @GetMapping
    public DashboardResponse get(@RequestParam(required = false) String month, Authentication auth) {
        Dashboard d = service.build(auth.getName(), month);

        var next = d.loans().next();
        return new DashboardResponse(
                d.months().stream().map(Object::toString).toList(),
                d.empty(),
                d.income(),
                d.categories().stream().map(v -> new CategoryDto(v.category().getName(),
                        v.category().getBudgetAmount(), v.spent(), v.lastMonth())).toList(),
                d.transactions().stream().map(v -> new TransactionDto(v.transaction().getId(),
                        v.transaction().getTxnDate(), v.transaction().getDescription(),
                        v.transaction().getCategory(), v.accountName(), v.transaction().getAmount())).toList(),
                d.accounts().stream().map(v -> new AccountDto(v.account().getId(), v.account().getName(),
                        v.account().getType(), v.balance())).toList(),
                new LoansDto(d.loans().totalBalance(),
                        next == null ? null : new NextDto(next.getName(), next.getMonthlyPayment(),
                                next.getNextDueDate())),
                d.goals().stream().map(g -> new GoalDto(g.getId(), g.getName(), g.getSavedAmount(),
                        g.getTargetAmount(), g.getTargetDate())).toList(),
                d.history().stream().map(h -> new HistoryDto(h.month().toString(), h.income(),
                        h.spending())).toList());
    }
}