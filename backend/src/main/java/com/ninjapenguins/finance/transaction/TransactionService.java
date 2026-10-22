package com.ninjapenguins.finance.transaction;

import com.ninjapenguins.finance.account.Account;
import com.ninjapenguins.finance.account.AccountRepository;
import com.ninjapenguins.finance.common.FieldException;
import com.ninjapenguins.finance.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class TransactionService {

    /** A transaction plus the account name, so the page needs no second call */
    public record TransactionView(Transaction transaction, String accountName) {
    }

    private final TransactionRepository transactions;
    private final AccountRepository accounts;
    private final UserRepository users;

    public TransactionService(TransactionRepository transactions, AccountRepository accounts,
                              UserRepository users) {
        this.transactions = transactions;
        this.accounts = accounts;
        this.users = users;
    }

    @Transactional(readOnly = true)
    public List<TransactionView> list(String username, String month) {
        Long userId = userId(username);
        YearMonth ym = parseMonth(month);
        Map<Long, String> names = accounts.findAllByUserIdOrderByNameAsc(userId).stream()
                .collect(Collectors.toMap(Account::getId, Account::getName));
        return transactions
                .findByUserIdAndTxnDateBetweenOrderByTxnDateDescIdDesc(userId, ym.atDay(1), ym.atEndOfMonth())
                .stream()
                .map(t -> new TransactionView(t, names.getOrDefault(t.getAccountId(), "")))
                .toList();
    }

    @Transactional
    public TransactionView create(String username, Long accountId, LocalDate date,
                                  String description, String category, BigDecimal amount) {
        Long userId = userId(username);
        Account account = ownedAccount(accountId, userId);
        String cleanCategory = category.trim();
        checkAmount(cleanCategory, amount);

        Transaction t = new Transaction();
        t.setUserId(userId);
        t.setSource("manual");
        fill(t, account, date, description, cleanCategory, amount);
        return new TransactionView(transactions.save(t), account.getName());
    }

    @Transactional
    public TransactionView update(String username, Long id, Long accountId, LocalDate date,
                                  String description, String category, BigDecimal amount) {
        Long userId = userId(username);
        Transaction t = find(id, userId);
        Account account = ownedAccount(accountId, userId);
        String cleanCategory = category.trim();
        checkAmount(cleanCategory, amount);

        fill(t, account, date, description, cleanCategory, amount);
        return new TransactionView(transactions.save(t), account.getName());
    }

    @Transactional
    public void delete(String username, Long id) {
        Long userId = userId(username);
        transactions.delete(find(id, userId));
    }

    private void fill(Transaction t, Account account, LocalDate date, String description,
                      String category, BigDecimal amount) {
        t.setAccountId(account.getId());
        t.setTxnDate(date);
        t.setDescription(description.trim());
        t.setCategory(category);
        t.setAmount(amount);
    }

    /** amount can't be zero, and the "Income" category must be positive */
    private void checkAmount(String category, BigDecimal amount) {
        if (amount.signum() == 0) {
            throw new FieldException(HttpStatus.BAD_REQUEST, "amount", "Amount can't be zero");
        }
        if (category.equalsIgnoreCase("Income") && amount.signum() < 0) {
            throw new FieldException(HttpStatus.BAD_REQUEST, "amount", "Income must be a positive amount");
        }
    }

    /** The account must belong to the signed in user. */
    private Account ownedAccount(Long accountId, Long userId) {
        return accounts.findByIdAndUserId(accountId, userId)
                .orElseThrow(() -> new FieldException(HttpStatus.BAD_REQUEST, "accountId",
                        "Choose one of your accounts"));
    }

    /** Looks up by id and owner, so another user's transaction is "not found" */
    private Transaction find(Long id, Long userId) {
        return transactions.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new FieldException(HttpStatus.NOT_FOUND, "form", "Transaction not found"));
    }

    private YearMonth parseMonth(String month) {
        try {
            return YearMonth.parse(month);
        } catch (DateTimeParseException e) {
            throw new FieldException(HttpStatus.BAD_REQUEST, "month", "Month must look like 2026-10");
        }
    }

    private Long userId(String username) {
        return users.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new FieldException(HttpStatus.UNAUTHORIZED, "form", "Signed-in user not found"))
                .getId();
    }
}