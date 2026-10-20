package com.ninjapenguins.finance.user;

import com.ninjapenguins.finance.user.ProfileDtos.ChangePasswordRequest;
import com.ninjapenguins.finance.user.ProfileDtos.DeleteAccountRequest;
import com.ninjapenguins.finance.user.ProfileDtos.ProfileResponse;
import com.ninjapenguins.finance.user.ProfileDtos.UpdateProfileRequest;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.Map;

/** Profile and settings for the signed-in user (UC-PROF-01). All endpoints require sign-in. */
@RestController
@RequestMapping("/api/users/me")
public class UserController {

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;

    public UserController(UserRepository users, PasswordEncoder passwordEncoder) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
    }

    /** View profile (FR-PROF-001). */
    @GetMapping
    public ResponseEntity<ProfileResponse> get(Principal principal) {
        return ResponseEntity.ok(ProfileResponse.from(current(principal)));
    }

    /** Edit profile (FR-PROF-001). Rejects an email another account already uses (FR-PROF-003). */
    @PutMapping
    public ResponseEntity<?> update(@Valid @RequestBody UpdateProfileRequest body, Principal principal) {
        User user = current(principal);
        String email = body.email().trim().toLowerCase();
        if (!email.equalsIgnoreCase(user.getEmail()) && users.existsByEmailIgnoreCase(email)) {
            return error(HttpStatus.CONFLICT, Map.of("email", "That email is already used by another account"));
        }
        user.setFirstName(body.firstName().trim());
        user.setLastName(body.lastName().trim());
        user.setEmail(email);
        user.setPhone(blankToNull(body.phone()));
        user.setAddress(blankToNull(body.address()));
        return ResponseEntity.ok(ProfileResponse.from(users.save(user)));
    }

    /** Change password; requires the current password (FR-PROF-002). */
    @PutMapping("/password")
    public ResponseEntity<?> changePassword(@Valid @RequestBody ChangePasswordRequest body, Principal principal) {
        User user = current(principal);
        if (!passwordEncoder.matches(body.currentPassword(), user.getPasswordHash())) {
            return error(HttpStatus.BAD_REQUEST, Map.of("currentPassword", "Current password is incorrect"));
        }
        if (passwordEncoder.matches(body.newPassword(), user.getPasswordHash())) {
            return error(HttpStatus.BAD_REQUEST, Map.of("newPassword", "New password must be different from the current one"));
        }
        user.setPasswordHash(passwordEncoder.encode(body.newPassword()));
        users.save(user);
        return ResponseEntity.noContent().build();
    }

    /** Permanently delete the account after password confirmation, then sign out (FR-PROF-004). */
    @PostMapping("/delete")
    public ResponseEntity<?> delete(@Valid @RequestBody DeleteAccountRequest body, Principal principal,
                                    HttpServletRequest request) {
        User user = current(principal);
        if (!passwordEncoder.matches(body.password(), user.getPasswordHash())) {
            return error(HttpStatus.BAD_REQUEST, Map.of("password", "Password is incorrect"));
        }
        users.delete(user);
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        SecurityContextHolder.clearContext();
        return ResponseEntity.noContent().build();
    }

    private User current(Principal principal) {
        return users.findByUsernameIgnoreCase(principal.getName())
                .orElseThrow(() -> new IllegalStateException("Signed-in user not found"));
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    private static ResponseEntity<Map<String, Object>> error(HttpStatus status, Map<String, String> errors) {
        return ResponseEntity.status(status).body(Map.of("errors", errors));
    }
}
