package com.ninjapenguins.finance.account;

import com.ninjapenguins.finance.common.FieldException;
import com.ninjapenguins.finance.user.User;
import com.ninjapenguins.finance.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;

@Service
public class AccountService {

    private final AccountRepository accounts;
    private final UserRepository users;

    public AccountService(AccountRepository accounts, UserRepository users) {
        this.accounts = accounts;
        this.users = users;
    }

    @Transactional(readOnly = true)
    public List<Account> list(String username) {
        return accounts.findAllByUserIdOrderByNameAsc(userId(username));
    }

    @Transactional
    public Account create(String username, String name, String type, BigDecimal openingBalance) {
        Long userId = userId(username);
        String cleanName = name.trim();
        requireUniqueName(userId, cleanName, null);

        Account a = new Account();
        a.setUserId(userId);
        a.setName(cleanName);
        a.setType(normalizeType(type));
        a.setOpeningBalance(openingBalance);
        return accounts.save(a);
    }

    @Transactional
    public Account update(String username, Long id, String name, String type, BigDecimal openingBalance) {
        Long userId = userId(username);
        Account a = find(id, userId);
        String cleanName = name.trim();
        requireUniqueName(userId, cleanName, id);

        a.setName(cleanName);
        a.setType(normalizeType(type));
        a.setOpeningBalance(openingBalance);
        return accounts.save(a);
    }

    @Transactional
    public void delete(String username, Long id) {
        Long userId = userId(username);
        accounts.delete(find(id, userId));
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