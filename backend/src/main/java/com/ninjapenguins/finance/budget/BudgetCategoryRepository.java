package com.ninjapenguins.finance.budget;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface BudgetCategoryRepository extends JpaRepository<BudgetCategory, Long> {

    List<BudgetCategory> findByUserIdAndMonthOrderByNameAsc(Long userId, LocalDate month);

    Optional<BudgetCategory> findByIdAndUserId(Long id, Long userId);

    Optional<BudgetCategory> findByUserIdAndMonthAndNameIgnoreCase(Long userId, LocalDate month, String name);
}