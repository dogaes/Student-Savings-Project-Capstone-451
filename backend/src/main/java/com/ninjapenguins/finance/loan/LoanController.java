package com.ninjapenguins.finance.loan;

import com.ninjapenguins.finance.loan.LoanService.LoanSummary;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/loans")
public class LoanController {

    private final LoanService service;

    public LoanController(LoanService service) {
        this.service = service;
    }

    public record LoanRequest(
            @NotBlank(message = "Loan name is required")
            @Size(max = 100, message = "Name is too long") String name,
            @Size(max = 100, message = "Lender is too long") String lender,
            @NotNull(message = "Original amount is required")
            @DecimalMin(value = "0.00", message = "Amount can't be negative")
            @Digits(integer = 10, fraction = 2, message = "Use at most 2 decimal places") BigDecimal principal,
            @NotNull(message = "Interest rate is required")
            @DecimalMin(value = "0.00", message = "Rate can't be negative")
            @DecimalMax(value = "100.00", message = "Rate can't be more than 100%")
            @Digits(integer = 3, fraction = 2, message = "Use at most 2 decimal places") BigDecimal interestRate,
            @NotNull(message = "Monthly payment is required")
            @DecimalMin(value = "0.00", message = "Payment can't be negative")
            @Digits(integer = 10, fraction = 2, message = "Use at most 2 decimal places") BigDecimal monthlyPayment,
            @NotNull(message = "Remaining balance is required")
            @DecimalMin(value = "0.00", message = "Balance can't be negative")
            @Digits(integer = 10, fraction = 2, message = "Use at most 2 decimal places") BigDecimal remainingBalance,
            @NotNull(message = "Next due date is required") LocalDate nextDueDate) {
    }

    public record LoanResponse(Long id, String name, String lender, BigDecimal principal,
                               BigDecimal interestRate, BigDecimal monthlyPayment,
                               BigDecimal remainingBalance, LocalDate nextDueDate) {
        static LoanResponse from(Loan l) {
            return new LoanResponse(l.getId(), l.getName(), l.getLender(), l.getPrincipal(),
                    l.getInterestRate(), l.getMonthlyPayment(), l.getRemainingBalance(), l.getNextDueDate());
        }
    }

    /** Matches the dashboard's "next payment"  */
    public record NextPayment(String name, BigDecimal amount, LocalDate dueDate) {
    }

    public record LoansResponse(BigDecimal totalBalance, NextPayment next, List<LoanResponse> loans) {
        static LoansResponse from(LoanSummary s) {
            NextPayment next = s.next() == null ? null
                    : new NextPayment(s.next().getName(), s.next().getMonthlyPayment(), s.next().getNextDueDate());
            return new LoansResponse(s.totalBalance(), next, s.loans().stream().map(LoanResponse::from).toList());
        }
    }

    @GetMapping
    public LoansResponse list(Authentication auth) {
        return LoansResponse.from(service.list(auth.getName()));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public LoanResponse create(@Valid @RequestBody LoanRequest b, Authentication auth) {
        return LoanResponse.from(service.create(auth.getName(), b.name(), b.lender(), b.principal(),
                b.interestRate(), b.monthlyPayment(), b.remainingBalance(), b.nextDueDate()));
    }

    @PutMapping("/{id}")
    public LoanResponse update(@PathVariable Long id, @Valid @RequestBody LoanRequest b, Authentication auth) {
        return LoanResponse.from(service.update(auth.getName(), id, b.name(), b.lender(), b.principal(),
                b.interestRate(), b.monthlyPayment(), b.remainingBalance(), b.nextDueDate()));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, Authentication auth) {
        service.delete(auth.getName(), id);
    }
}