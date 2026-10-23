package com.ninjapenguins.finance.goal;

import com.ninjapenguins.finance.common.FieldException;
import com.ninjapenguins.finance.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class GoalService {

    private final GoalRepository goals;
    private final UserRepository users;

    public GoalService(GoalRepository goals, UserRepository users) {
        this.goals = goals;
        this.users = users;
    }

    @Transactional(readOnly = true)
    public List<Goal> list(String username) {
        return goals.findByUserIdOrderByTargetDateAsc(userId(username));
    }

    @Transactional
    public Goal create(String username, String name, BigDecimal saved, BigDecimal target, LocalDate date) {
        Long userId = userId(username);
        String cleanName = name.trim();
        requireUniqueName(userId, cleanName, null);

        Goal g = new Goal();
        g.setUserId(userId);
        fill(g, cleanName, saved, target, date);
        return goals.save(g);
    }

    @Transactional
    public Goal update(String username, Long id, String name, BigDecimal saved, BigDecimal target,
                       LocalDate date) {
        Long userId = userId(username);
        Goal g = find(id, userId);
        String cleanName = name.trim();
        requireUniqueName(userId, cleanName, id);

        fill(g, cleanName, saved, target, date);
        return goals.save(g);
    }

    @Transactional
    public void delete(String username, Long id) {
        goals.delete(find(id, userId(username)));
    }

    private void fill(Goal g, String name, BigDecimal saved, BigDecimal target, LocalDate date) {
        g.setName(name);
        g.setSavedAmount(saved);
        g.setTargetAmount(target);
        g.setTargetDate(date);
    }

    private Goal find(Long id, Long userId) {
        return goals.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new FieldException(HttpStatus.NOT_FOUND, "form", "Goal not found"));
    }

    private void requireUniqueName(Long userId, String name, Long ownId) {
        goals.findByUserIdAndNameIgnoreCase(userId, name).ifPresent(existing -> {
            if (!existing.getId().equals(ownId)) {
                throw new FieldException(HttpStatus.CONFLICT, "name", "You already have a goal with that name");
            }
        });
    }

    private Long userId(String username) {
        return users.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new FieldException(HttpStatus.UNAUTHORIZED, "form", "Signed-in user not found"))
                .getId();
    }
}