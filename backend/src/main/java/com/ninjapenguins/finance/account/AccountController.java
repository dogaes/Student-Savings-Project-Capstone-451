package com.ninjapenguins.finance.account;
import com.ninjapenguins.finance.account.AccountService.AccountView;

import jakarta.validation.Valid;
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
import java.util.List;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {

    private final AccountService service;

    public AccountController(AccountService service) {
        this.service = service;
    }

    public record AccountRequest(
            @NotBlank(message = "Account name is required")
            @Size(max = 100, message = "Name must be 100 characters or fewer")
            String name,

            @NotBlank(message = "Account type is required")
            @Size(max = 30, message = "Type is too long")
            String type,

            @NotNull(message = "Opening balance is required")
            @Digits(integer = 10, fraction = 2, message = "Use at most 2 decimal places")
            @DecimalMin(value = "-9999999999.99", message = "Balance is too small")
            BigDecimal openingBalance) {
    }

    /** openingBalance is included so the edit form can show the current value. */
    public record AccountResponse(Long id, String name, String type, BigDecimal openingBalance, BigDecimal balance) {
        static AccountResponse from(AccountView v) {
            Account a = v.account();
            return new AccountResponse(a.getId(), a.getName(), a.getType(), a.getOpeningBalance(), v.balance());
        }
    }

    @GetMapping
    public List<AccountResponse> list(Authentication auth) {
        return service.list(auth.getName()).stream().map(AccountResponse::from).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AccountResponse create(@Valid @RequestBody AccountRequest body, Authentication auth) {
        return AccountResponse.from(
                service.create(auth.getName(), body.name(), body.type(), body.openingBalance()));
    }

    @PutMapping("/{id}")
    public AccountResponse update(@PathVariable Long id, @Valid @RequestBody AccountRequest body,
                                  Authentication auth) {
        return AccountResponse.from(
                service.update(auth.getName(), id, body.name(), body.type(), body.openingBalance()));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, Authentication auth) {
        service.delete(auth.getName(), id);
    }
}