package com.ninjapenguins.finance.goal;

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
import java.time.LocalDate;
import java.util.List;

/** Savings goals. Field names match the dashboard: saved, target, targetDate*/
@RestController
@RequestMapping("/api/goals")
public class GoalController {

    private final GoalService service;

    public GoalController(GoalService service) {
        this.service = service;
    }

    public record GoalRequest(
            @NotBlank(message = "Goal name is required")
            @Size(max = 100, message = "Name is too long") String name,
            @NotNull(message = "Amount saved is required")
            @DecimalMin(value = "0.00", message = "Saved amount can't be negative")
            @Digits(integer = 10, fraction = 2, message = "Use at most 2 decimal places") BigDecimal saved,
            @NotNull(message = "Target amount is required")
            @DecimalMin(value = "0.01", message = "Target must be greater than zero")
            @Digits(integer = 10, fraction = 2, message = "Use at most 2 decimal places") BigDecimal target,
            @NotNull(message = "Target date is required") LocalDate targetDate) {
    }

    public record GoalResponse(Long id, String name, BigDecimal saved, BigDecimal target, LocalDate targetDate) {
        static GoalResponse from(Goal g) {
            return new GoalResponse(g.getId(), g.getName(), g.getSavedAmount(), g.getTargetAmount(),
                    g.getTargetDate());
        }
    }

    @GetMapping
    public List<GoalResponse> list(Authentication auth) {
        return service.list(auth.getName()).stream().map(GoalResponse::from).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public GoalResponse create(@Valid @RequestBody GoalRequest b, Authentication auth) {
        return GoalResponse.from(service.create(auth.getName(), b.name(), b.saved(), b.target(), b.targetDate()));
    }

    @PutMapping("/{id}")
    public GoalResponse update(@PathVariable Long id, @Valid @RequestBody GoalRequest b, Authentication auth) {
        return GoalResponse.from(service.update(auth.getName(), id, b.name(), b.saved(), b.target(),
                b.targetDate()));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, Authentication auth) {
        service.delete(auth.getName(), id);
    }
}