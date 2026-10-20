package com.ninjapenguins.finance.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

/** Request and response bodies for /api/users/me (UC-PROF-01). */
public final class ProfileDtos {

    private ProfileDtos() {
    }

    /** Everything the Profile page shows. Never includes the password hash. */
    public record ProfileResponse(Long id, String firstName, String lastName, String username, String email,
                                  String phone, String address, LocalDateTime createdAt) {
        public static ProfileResponse from(User u) {
            return new ProfileResponse(u.getId(), u.getFirstName(), u.getLastName(), u.getUsername(),
                    u.getEmail(), u.getPhone(), u.getAddress(), u.getCreatedAt());
        }
    }

    public record UpdateProfileRequest(
            @NotBlank(message = "First name is required") @Size(max = 100) String firstName,
            @NotBlank(message = "Last name is required") @Size(max = 100) String lastName,
            @NotBlank(message = "Email is required") @Email(message = "Enter a valid email") @Size(max = 255)
            String email,
            @Pattern(regexp = "^$|^[0-9+()\\-\\s]{7,30}$", message = "Enter a valid phone number")
            String phone,
            @Size(max = 255, message = "Address must be 255 characters or fewer") String address) {
    }

    public record ChangePasswordRequest(
            @NotBlank(message = "Enter your current password") String currentPassword,
            // Same policy as registration (FR-AUTH-003)
            @NotBlank(message = "Enter a new password")
            @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).{8,72}$",
                    message = "Password must be at least 8 characters and include a letter and a number")
            String newPassword) {
    }

    public record DeleteAccountRequest(@NotBlank(message = "Enter your password to confirm") String password) {
    }
}