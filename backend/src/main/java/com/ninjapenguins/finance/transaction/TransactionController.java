package com.ninjapenguins.finance.transaction;

import com.ninjapenguins.finance.transaction.TransactionService.TransactionView;
import jakarta.validation.Valid;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** Income and spending entries, Negative amount = spending, positive = income. */
@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TransactionService service;

    public TransactionController(TransactionService service) {
        this.service = service;
    }

    public record TransactionRequest(
            @NotNull(message = "Choose an account") Long accountId,
            @NotNull(message = "Date is required") LocalDate date,
            @NotBlank(message = "Description is required")
            @Size(max = 255, message = "Description is too long") String description,
            @NotBlank(message = "Category is required")
            @Size(max = 100, message = "Category is too long") String category,
            @NotNull(message = "Amount is required")
            @Digits(integer = 10, fraction = 2, message = "Use at most 2 decimal places") BigDecimal amount) {
    }

    public record TransactionResponse(Long id, LocalDate date, String description, String category,
                                      Long accountId, String account, BigDecimal amount) {
        static TransactionResponse from(TransactionView v) {
            Transaction t = v.transaction();
            return new TransactionResponse(t.getId(), t.getTxnDate(), t.getDescription(), t.getCategory(),
                    t.getAccountId(), v.accountName(), t.getAmount());
        }
    }

    @GetMapping
    public List<TransactionResponse> list(@RequestParam String month, Authentication auth) {
        return service.list(auth.getName(), month).stream().map(TransactionResponse::from).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TransactionResponse create(@Valid @RequestBody TransactionRequest b, Authentication auth) {
        return TransactionResponse.from(service.create(auth.getName(), b.accountId(), b.date(),
                b.description(), b.category(), b.amount()));
    }

    @PutMapping("/{id}")
    public TransactionResponse update(@PathVariable Long id, @Valid @RequestBody TransactionRequest b,
                                      Authentication auth) {
        return TransactionResponse.from(service.update(auth.getName(), id, b.accountId(), b.date(),
                b.description(), b.category(), b.amount()));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, Authentication auth) {
        service.delete(auth.getName(), id);
    }
}