package com.ninjapenguins.finance.transaction;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    List<Transaction> findByUserIdAndTxnDateBetweenOrderByTxnDateDescIdDesc(
            Long userId, LocalDate start, LocalDate end);

    Optional<Transaction> findByIdAndUserId(Long id, Long userId);

    // Query that sums amounts per account for the user
    @Query("select t.accountId, sum(t.amount) from Transaction t where t.userId = :userId group by t.accountId")
    List<Object[]> sumByAccount(@Param("userId") Long userId);

    @Query("select coalesce(sum(t.amount), 0) from Transaction t where t.accountId = :accountId and t.userId = :userId")
    BigDecimal sumForAccount(@Param("accountId") Long accountId, @Param("userId") Long userId);
}