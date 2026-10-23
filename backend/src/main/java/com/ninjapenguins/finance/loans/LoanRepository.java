package com.ninjapenguins.finance.loan;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LoanRepository extends JpaRepository<Loan, Long> {

    List<Loan> findByUserIdOrderByNextDueDateAsc(Long userId);

    Optional<Loan> findByIdAndUserId(Long id, Long userId);

    Optional<Loan> findByUserIdAndNameIgnoreCase(Long userId, String name);
}