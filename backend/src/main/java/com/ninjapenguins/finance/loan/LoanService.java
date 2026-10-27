package com.ninjapenguins.finance.loan;

import com.ninjapenguins.finance.common.FieldException;
import com.ninjapenguins.finance.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class LoanService {

    /** All loans, the total owed, and the soonest unpaid loan (null if none). */
    public record LoanSummary(List<Loan> loans, BigDecimal totalBalance, Loan next) {
    }

    private final LoanRepository loans;
    private final UserRepository users;

    public LoanService(LoanRepository loans, UserRepository users) {
        this.loans = loans;
        this.users = users;
    }

    @Transactional(readOnly = true)
    public LoanSummary list(String username) {
        List<Loan> all = loans.findByUserIdOrderByNextDueDateAsc(userId(username));
        BigDecimal total = all.stream().map(Loan::getRemainingBalance)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        // The list is already sorted by due date, so the first loan still owing money is next.
        Loan next = all.stream()
                .filter(l -> l.getRemainingBalance().signum() > 0)
                .findFirst().orElse(null);
        return new LoanSummary(all, total, next);
    }

    @Transactional
    public Loan create(String username, String name, String lender, BigDecimal principal,
                       BigDecimal rate, BigDecimal monthlyPayment, BigDecimal remaining, LocalDate due) {
        Long userId = userId(username);
        String cleanName = name.trim();
        requireUniqueName(userId, cleanName, null);
        checkBalance(principal, remaining);

        Loan l = new Loan();
        l.setUserId(userId);
        fill(l, cleanName, lender, principal, rate, monthlyPayment, remaining, due);
        return loans.save(l);
    }

    @Transactional
    public Loan update(String username, Long id, String name, String lender, BigDecimal principal,
                       BigDecimal rate, BigDecimal monthlyPayment, BigDecimal remaining, LocalDate due) {
        Long userId = userId(username);
        Loan l = find(id, userId);
        String cleanName = name.trim();
        requireUniqueName(userId, cleanName, id);
        checkBalance(principal, remaining);

        fill(l, cleanName, lender, principal, rate, monthlyPayment, remaining, due);
        return loans.save(l);
    }

    @Transactional
    public void delete(String username, Long id) {
        loans.delete(find(id, userId(username)));
    }

    private void fill(Loan l, String name, String lender, BigDecimal principal, BigDecimal rate,
                      BigDecimal monthlyPayment, BigDecimal remaining, LocalDate due) {
        l.setName(name);
        l.setLender(lender == null || lender.isBlank() ? null : lender.trim());
        l.setPrincipal(principal);
        l.setInterestRate(rate);
        l.setMonthlyPayment(monthlyPayment);
        l.setRemainingBalance(remaining);
        l.setNextDueDate(due);
    }

    private void checkBalance(BigDecimal principal, BigDecimal remaining) {
        if (remaining.compareTo(principal) > 0) {
            throw new FieldException(HttpStatus.BAD_REQUEST, "remainingBalance",
                    "Remaining balance can't be more than the original amount");
        }
    }

    private Loan find(Long id, Long userId) {
        return loans.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new FieldException(HttpStatus.NOT_FOUND, "form", "Loan not found"));
    }

    private void requireUniqueName(Long userId, String name, Long ownId) {
        loans.findByUserIdAndNameIgnoreCase(userId, name).ifPresent(existing -> {
            if (!existing.getId().equals(ownId)) {
                throw new FieldException(HttpStatus.CONFLICT, "name", "You already have a loan with that name");
            }
        });
    }

    private Long userId(String username) {
        return users.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new FieldException(HttpStatus.UNAUTHORIZED, "form", "Signed-in user not found"))
                .getId();
    }
}