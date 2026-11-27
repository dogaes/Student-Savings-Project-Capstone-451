package com.ninjapenguins.finance.auth;

import com.ninjapenguins.finance.auth.AuthDtos.LoginRequest;
import com.ninjapenguins.finance.auth.AuthDtos.RegisterRequest;
import com.ninjapenguins.finance.auth.AuthDtos.UserResponse;
import com.ninjapenguins.finance.user.User;
import com.ninjapenguins.finance.user.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.Principal;
import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final AppUserDetailsService userDetailsService;
    private final SecurityContextRepository contextRepository = new HttpSessionSecurityContextRepository();

    // Two-step sign-in (simulated text message). The code is fixed so the team can demo it;
    // change it with the TWO_FACTOR_CODE environment variable.
    private final String twoFactorCode;
    private static final String PENDING_USER = "twoFactor.username";
    private static final String PENDING_EXPIRES = "twoFactor.expires";
    private static final String PENDING_ATTEMPTS = "twoFactor.attempts";
    private static final long CODE_LIFETIME_SECONDS = 5 * 60;
    private static final int MAX_ATTEMPTS = 5;

    public AuthController(AuthenticationManager authenticationManager, UserRepository users,
                          PasswordEncoder passwordEncoder, AppUserDetailsService userDetailsService,
                          @Value("${TWO_FACTOR_CODE:123456}") String twoFactorCode) {
        this.authenticationManager = authenticationManager;
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.userDetailsService = userDetailsService;
        this.twoFactorCode = twoFactorCode;
    }

    /** Body for POST /api/auth/verify-code */
    public record VerifyCodeRequest(String code) {
    }

    /** Create an account (UC-AUTH-02), then sign the new user in. */
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest body,
                                      HttpServletRequest request, HttpServletResponse response) {
        if (users.existsByUsernameIgnoreCase(body.username())) {
            return error(HttpStatus.CONFLICT, Map.of("username", "That username is taken"));
        }
        if (users.existsByEmailIgnoreCase(body.email())) {
            return error(HttpStatus.CONFLICT,
                    Map.of("email", "An account with this email may already exist. Sign in or reset your password."));
        }

        User user = new User();
        user.setFirstName(body.firstName().trim());
        user.setLastName(body.lastName().trim());
        user.setUsername(body.username().trim());
        user.setEmail(body.email().trim().toLowerCase());
        user.setPasswordHash(passwordEncoder.encode(body.password()));
        users.save(user);

        signIn(user.getUsername(), body.password(), request, response);
        return ResponseEntity.status(HttpStatus.CREATED).body(UserResponse.from(user));
    }

    /**
     * Sign in, step 1 (UC-AUTH-03): check the username/email and password. If they're right,
     * nobody is signed in yet. We "text" a code and wait for step 2 (POST /api/auth/verify-code).
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest body, HttpServletRequest request) {
        Authentication auth;
        try {
            auth = authenticationManager.authenticate(
                    UsernamePasswordAuthenticationToken.unauthenticated(body.usernameOrEmail(), body.password()));
        } catch (AuthenticationException e) {
            // Same message whether the username or the password was wrong.
            return error(HttpStatus.UNAUTHORIZED, Map.of("form", "Username/email or password is incorrect."));
        }
        User user = users.findByUsernameIgnoreCase(auth.getName()).orElseThrow();

        // Remember who is halfway through signing in (not signed in yet)
        SecurityContextHolder.clearContext();
        HttpSession session = freshSession(request);
        session.setAttribute(PENDING_USER, user.getUsername());
        session.setAttribute(PENDING_EXPIRES, Instant.now().plusSeconds(CODE_LIFETIME_SECONDS));
        session.setAttribute(PENDING_ATTEMPTS, 0);

        return ResponseEntity.ok(Map.of("twoFactorRequired", true, "sentTo", phoneHint(user)));
    }

    /** Sign in, step 2: check the code from the (simulated) text message, then sign the user in. */
    @PostMapping("/verify-code")
    public ResponseEntity<?> verifyCode(@RequestBody VerifyCodeRequest body,
                                        HttpServletRequest request, HttpServletResponse response) {
        HttpSession session = request.getSession(false);
        String username = session == null ? null : (String) session.getAttribute(PENDING_USER);
        Instant expires = session == null ? null : (Instant) session.getAttribute(PENDING_EXPIRES);
        if (username == null || expires == null || Instant.now().isAfter(expires)) {
            clearPending(session);
            return error(HttpStatus.UNAUTHORIZED, Map.of("form", "Your code expired. Please sign in again."));
        }

        int attempts = (Integer) session.getAttribute(PENDING_ATTEMPTS) + 1;
        session.setAttribute(PENDING_ATTEMPTS, attempts);
        String code = body.code() == null ? "" : body.code().trim();
        boolean correct = MessageDigest.isEqual(code.getBytes(StandardCharsets.UTF_8),
                twoFactorCode.getBytes(StandardCharsets.UTF_8));
        if (!correct) {
            if (attempts >= MAX_ATTEMPTS) {
                clearPending(session);
                return error(HttpStatus.UNAUTHORIZED, Map.of("form", "Too many wrong codes. Please sign in again."));
            }
            return error(HttpStatus.BAD_REQUEST, Map.of("code",
                    "That code isn't right. " + (MAX_ATTEMPTS - attempts) + " tries left."));
        }

        // Code is right: sign in for real
        clearPending(session);
        UserDetails details = userDetailsService.loadUserByUsername(username);
        Authentication auth = UsernamePasswordAuthenticationToken.authenticated(
                details, null, details.getAuthorities());
        freshSession(request);
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);
        contextRepository.saveContext(context, request, response);

        User user = users.findByUsernameIgnoreCase(username).orElseThrow();
        return ResponseEntity.ok(UserResponse.from(user));
    }

    /** "Send a new code": restarts the 5-minute timer and the attempt count. */
    @PostMapping("/resend-code")
    public ResponseEntity<?> resendCode(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute(PENDING_USER) == null) {
            return error(HttpStatus.UNAUTHORIZED, Map.of("form", "Please sign in again."));
        }
        session.setAttribute(PENDING_EXPIRES, Instant.now().plusSeconds(CODE_LIFETIME_SECONDS));
        session.setAttribute(PENDING_ATTEMPTS, 0);
        return ResponseEntity.noContent().build();
    }

    /** "•••-•••-1234" from the phone on the profile, or a generic label. */
    private static String phoneHint(User user) {
        String digits = user.getPhone() == null ? "" : user.getPhone().replaceAll("\\D", "");
        return digits.length() >= 4 ? "•••-•••-" + digits.substring(digits.length() - 4) : "the phone on your account";
    }

    /** New session ID (prevents session fixation), or a new session if there isn't one. */
    private static HttpSession freshSession(HttpServletRequest request) {
        if (request.getSession(false) != null) {
            request.changeSessionId();
        }
        return request.getSession(true);
    }

    private static void clearPending(HttpSession session) {
        if (session != null) {
            session.removeAttribute(PENDING_USER);
            session.removeAttribute(PENDING_EXPIRES);
            session.removeAttribute(PENDING_ATTEMPTS);
        }
    }

    /** Sign out (UC-AUTH-04). */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        SecurityContextHolder.clearContext();
        return ResponseEntity.noContent().build();
    }

    /** Who is signed in? The front end calls this on page load. Returns 401 if nobody is. */
    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(Principal principal) {
        return users.findByUsernameIgnoreCase(principal.getName())
                .map(UserResponse::from)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
    }

    private Authentication signIn(String login, String password,
                                  HttpServletRequest request, HttpServletResponse response) {
        Authentication auth = authenticationManager.authenticate(
                UsernamePasswordAuthenticationToken.unauthenticated(login, password));
        
            if (request.getSession(false) != null) {
                request.changeSessionId(); // Session exists, change ID (prevents session fixation)
            } else {

                request.getSession(true); // Create a new session
            }

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);
        contextRepository.saveContext(context, request, response);
        return auth;
    }

    private static ResponseEntity<Map<String, Object>> error(HttpStatus status, Map<String, String> errors) {
        return ResponseEntity.status(status).body(Map.of("errors", errors));
    }
}
