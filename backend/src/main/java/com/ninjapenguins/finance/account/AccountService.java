package com.ninjapenguins.finance.account;

import com.ninjapenguins.finance.common.FieldException;
import com.ninjapenguins.finance.transaction.TransactionRepository;
import com.ninjapenguins.finance.user.User;
import com.ninjapenguins.finance.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class AccountService {

    /** An account plus its computed balance (opening balance + sum of its transactions)*/
    public record AccountView(Account account, BigDecimal balance) {
    }

    private final AccountRepository accounts;
    private final UserRepository users;
    private final TransactionRepository transactions;

    public AccountService(AccountRepository accounts, UserRepository users,
                          TransactionRepository transactions) {
        this.accounts = accounts;
        this.users = users;
        this.transactions = transactions;
    }

    /** One grouped query for all totals, instead of one query per account. */
    @Transactional(readOnly = true)
    public List<AccountView> list(String username) {
        Long userId = userId(username);
        Map<Long, BigDecimal> sums = new HashMap<>();
        for (Object[] row : transactions.sumByAccount(userId)) {
            sums.put((Long) row[0], (BigDecimal) row[1]);
        }
        return accounts.findAllByUserIdOrderByNameAsc(userId).stream()
                .map(a -> new AccountView(a,
                        a.getOpeningBalance().add(sums.getOrDefault(a.getId(), BigDecimal.ZERO))))
                .toList();
    }

    @Transactional
    public AccountView create(String username, String name, String type, BigDecimal openingBalance) {
        Long userId = userId(username);
        String cleanName = name.trim();
        requireUniqueName(userId, cleanName, null);

        Account a = new Account();
        a.setUserId(userId);
        a.setName(cleanName);
        a.setType(normalizeType(type));
        a.setOpeningBalance(openingBalance);
        return view(accounts.save(a), userId);
    }

    @Transactional
    public AccountView update(String username, Long id, String name, String type, BigDecimal openingBalance) {
        Long userId = userId(username);
        Account a = find(id, userId);
        String cleanName = name.trim();
        requireUniqueName(userId, cleanName, id);

        a.setName(cleanName);
        a.setType(normalizeType(type));
        a.setOpeningBalance(openingBalance);
        return view(accounts.save(a), userId);
    }

    @Transactional
    public void delete(String username, Long id) {
        Long userId = userId(username);
        accounts.delete(find(id, userId));
    }

    private AccountView view(Account a, Long userId) {
        BigDecimal sum = transactions.sumForAccount(a.getId(), userId);
        return new AccountView(a, a.getOpeningBalance().add(sum));
    }

    private Account find(Long id, Long userId) {
        return accounts.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new FieldException(HttpStatus.NOT_FOUND, "form", "Account not found"));
    }

    private void requireUniqueName(Long userId, String name, Long ownId) {
        accounts.findByUserIdAndNameIgnoreCase(userId, name).ifPresent(existing -> {
            if (!existing.getId().equals(ownId)) {
                throw new FieldException(HttpStatus.CONFLICT, "name", "You already have an account with that name");
            }
        });
    }

    private Long userId(String username) {
        User u = users.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new FieldException(HttpStatus.UNAUTHORIZED, "form", "Signed-in user not found"));
        return u.getId();
    }

    private String normalizeType(String type) {
        return switch (type.trim().toLowerCase(Locale.ROOT)) {
            case "checking" -> "Checking";
            case "savings" -> "Savings";
            case "credit card", "credit_card", "creditcard" -> "Credit card";
            default -> throw new FieldException(HttpStatus.BAD_REQUEST, "type",
                    "Account type must be Checking, Savings, or Credit card");
        };
    }
}