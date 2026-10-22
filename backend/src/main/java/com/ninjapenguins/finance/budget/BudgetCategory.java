package com.ninjapenguins.finance.budget;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/** One category's spending limit for one month */
@Entity
@Table(name = "budget_categories")
@Getter
@Setter
@NoArgsConstructor
public class BudgetCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    /** First day of the month */
    @Column(nullable = false)
    private LocalDate month;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "budget_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal budgetAmount;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private LocalDateTime createdAt;
}