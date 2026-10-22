package com.ninjapenguins.finance.budget;

import com.ninjapenguins.finance.budget.BudgetService.BudgetView;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.List;

/** Monthly budget categories with spending computed from transactions. */
@RestController
@RequestMapping("/api/budgets")
public class BudgetController {

    private final BudgetService service;

    public BudgetController(BudgetService service) {
        this.service = service;
    }

    public record BudgetRequest(
            @NotBlank(message = "Month is required")
            @Pattern(regexp = "^\\d{4}-(0[1-9]|1[0-2])$", message = "Month must look like 2026-10")
            String month,
            @NotBlank(message = "Category name is required")
            @Size(max = 100, message = "Category name is too long")
            String name,
            @NotNull(message = "Budget amount is required")
            @DecimalMin(value = "0.00", message = "Budget can't be negative")
            @Digits(integer = 10, fraction = 2, message = "Use at most 2 decimal places")
            BigDecimal budget) {
    }

    public record BudgetResponse(Long id, String month, String name, BigDecimal budget,
                                 BigDecimal spent, BigDecimal lastMonth) {
        static BudgetResponse from(BudgetView v) {
            BudgetCategory b = v.category();
            return new BudgetResponse(b.getId(), YearMonth.from(b.getMonth()).toString(), b.getName(),
                    b.getBudgetAmount(), v.spent(), v.lastMonth());
        }
    }

    @GetMapping
    public List<BudgetResponse> list(@RequestParam String month, Authentication auth) {
        return service.list(auth.getName(), month).stream().map(BudgetResponse::from).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BudgetResponse create(@Valid @RequestBody BudgetRequest b, Authentication auth) {
        return BudgetResponse.from(service.create(auth.getName(), b.month(), b.name(), b.budget()));
    }

    @PutMapping("/{id}")
    public BudgetResponse update(@PathVariable Long id, @Valid @RequestBody BudgetRequest b,
                                 Authentication auth) {
        return BudgetResponse.from(service.update(auth.getName(), id, b.month(), b.name(), b.budget()));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, Authentication auth) {
        service.delete(auth.getName(), id);
    }
}