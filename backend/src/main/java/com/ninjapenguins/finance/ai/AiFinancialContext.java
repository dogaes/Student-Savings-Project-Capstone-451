
package com.ninjapenguins.finance.ai;

import com.ninjapenguins.finance.dashboard.DashboardService;
import com.ninjapenguins.finance.dashboard.DashboardService.Dashboard;
import com.ninjapenguins.finance.dashboard.DashboardService.MonthTotal;
import com.ninjapenguins.finance.budget.BudgetService.BudgetView;
import com.ninjapenguins.finance.goal.Goal;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.YearMonth;

@Service
public class AiFinancialContext {

    private final DashboardService dashboardService;

    public AiFinancialContext(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    public String build(String username) {
        return build(username, YearMonth.now().toString());
    }

    public String build(String username, String month) {
        YearMonth currentMonth = YearMonth.parse(month);

        Dashboard dashboard =
                dashboardService.build(username, currentMonth.toString());

        StringBuilder context = new StringBuilder();

        context.append("FINANCIAL DATA FOR ")
                .append(currentMonth)
                .append("\n");

        context.append("Monthly income: $")
                .append(dashboard.income())
                .append("\n");

        MonthTotal current = dashboard.history()
                .get(dashboard.history().size() - 1);

        BigDecimal spending = current.spending();
        BigDecimal remaining = dashboard.income().subtract(spending);

        context.append("Monthly spending: $")
                .append(spending)
                .append("\n");

        context.append("Income minus spending: $")
                .append(remaining)
                .append("\n");

        context.append("\nBUDGET CATEGORIES:\n");

        BigDecimal totalBudget = BigDecimal.ZERO;

        for (BudgetView view : dashboard.categories()) {
            String name = view.category().getName();
            BigDecimal budget = view.category().getBudgetAmount();

            totalBudget = totalBudget.add(budget);

            context.append("- Category: ")
                    .append(name)
                    .append(", Budget: $")
                    .append(budget)
                    .append(", Spent: $")
                    .append(view.spent())
                    .append(", Last month: $")
                    .append(view.lastMonth())
                    .append("\n");
        }

        context.append("Total category budgets: $")
                .append(totalBudget)
                .append("\n");

        context.append("\nLOANS:\n");
        context.append("Total remaining loan balance: $")
                .append(dashboard.loans().totalBalance())
                .append("\n");

        context.append("\nSAVINGS GOALS:\n");

        for (Goal goal : dashboard.goals()) {
            context.append("- Saved: $")
                    .append(goal.getSavedAmount())
                    .append(", Target: $")
                    .append(goal.getTargetAmount())
                    .append("\n");
        }

        context.append("\nMONTHLY HISTORY:\n");

        for (MonthTotal monthTotal : dashboard.history()) {
            context.append("- ")
                    .append(monthTotal.month())
                    .append(": Income $")
                    .append(monthTotal.income())
                    .append(", Spending $")
                    .append(monthTotal.spending())
                    .append("\n");
        }

        return context.toString();
    }
}
