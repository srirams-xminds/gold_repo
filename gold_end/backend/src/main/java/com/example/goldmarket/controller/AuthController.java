package com.example.goldmarket.controller;

import com.example.goldmarket.model.User;
import com.example.goldmarket.model.Wallet;
import com.example.goldmarket.repository.UserRepository;
import com.example.goldmarket.repository.WalletRepository;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = { "http://localhost:5173", "http://localhost:5174" }, allowCredentials = "true")
public class AuthController {

    private final UserRepository userRepository;
    private final WalletRepository walletRepository;

    public AuthController(UserRepository userRepository, WalletRepository walletRepository) {
        this.userRepository = userRepository;
        this.walletRepository = walletRepository;
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody SignupRequest request, HttpSession session) {
        try {
            // Check if user already exists
            if (userRepository.findByEmail(request.getEmail()).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Email already registered"));
            }

            // Create new user
            User user = new User();
            user.setEmail(request.getEmail());
            user.setName(request.getName());
            user.setPassword(request.getPassword());
            user.setProvider("local");
            user.setOauthProviderId(request.getEmail());
            user.setRole(User.Role.INVESTOR); // Default role
            User savedUser = userRepository.save(user);

            // Create initial wallet with 0 balance
            Wallet wallet = new Wallet();
            wallet.setUser(savedUser);
            wallet.setCurrency("INR");
            wallet.setBalance(BigDecimal.ZERO); // Start with 0 balance
            walletRepository.save(wallet);

            // Set authentication
            setAuthentication(savedUser, session);

            // Return user data
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("user", Map.of(
                    "id", savedUser.getId(),
                    "email", savedUser.getEmail(),
                    "name", savedUser.getName(),
                    "role", savedUser.getRole().name()));

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", "Signup failed: " + e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request, HttpSession session) {
        try {
            // Find user by email
            User user = userRepository.findByEmail(request.getEmail())
                    .orElse(null);

            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid email or password"));
            }

            // Check password
            if (user.getPassword() != null && !user.getPassword().equals(request.getPassword())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid email or password"));
            }

            // Set authentication
            setAuthentication(user, session);

            // Return user data
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("user", Map.of(
                    "id", user.getId(),
                    "email", user.getEmail(),
                    "name", user.getName(),
                    "role", user.getRole().name()));

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", "Login failed: " + e.getMessage()));
        }
    }

    @PostMapping("/admin-login")
    public ResponseEntity<?> adminLogin(@RequestBody LoginRequest request, HttpSession session) {
        try {
            System.out.println("=== ADMIN LOGIN ATTEMPT ===");
            System.out.println("Email: " + request.getEmail());
            
            // Find user by email
            User user = userRepository.findByEmail(request.getEmail())
                    .orElse(null);

            if (user == null) {
                System.out.println("ERROR: User not found with email: " + request.getEmail());
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid email or password"));
            }

            System.out.println("User found: " + user.getEmail());
            System.out.println("User role: " + user.getRole());
            System.out.println("Has password: " + (user.getPassword() != null && !user.getPassword().isEmpty()));

            // Check if user is admin
            if (user.getRole() != User.Role.ADMIN) {
                System.out.println("ERROR: User is not admin. Role: " + user.getRole());
                return ResponseEntity.badRequest().body(Map.of("error", "Access denied. Admin privileges required."));
            }

            // Check password
            if (user.getPassword() != null && !user.getPassword().equals(request.getPassword())) {
                System.out.println("ERROR: Password mismatch");
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid email or password"));
            }

            System.out.println("Admin login successful!");
            
            // Set authentication
            setAuthentication(user, session);

            // Return user data
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("user", Map.of(
                    "id", user.getId(),
                    "email", user.getEmail(),
                    "name", user.getName(),
                    "role", user.getRole().name()));

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("ADMIN LOGIN EXCEPTION: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", "Login failed: " + e.getMessage()));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@AuthenticationPrincipal OAuth2User principal, HttpSession session) {
        try {
            System.out.println("=== /me REQUEST DEBUG ===");
            System.out.println("Session ID: " + session.getId());
            java.util.Enumeration<String> attributeNames = session.getAttributeNames();
            while (attributeNames.hasMoreElements()) {
                String name = attributeNames.nextElement();
                System.out.println("Session Attribute: " + name + " = " + session.getAttribute(name));
            }
            System.out.println("Principal: " + (principal != null ? principal.getName() : "NULL"));
            
            // Check if OAuth user
            if (principal != null) {
                String email = principal.getAttribute("email");
                User user = userRepository.findByEmail(email)
                        .orElseThrow(() -> new RuntimeException("User not found"));
                
                System.out.println("OAuth /me request for: " + email);
                
                return ResponseEntity.ok(Map.of(
                    "id", user.getId(),
                    "email", user.getEmail(),
                    "name", user.getName(),
                    "role", user.getRole().name(),
                    "kycStatus", user.getKycStatus().name()
                ));
            }
            
            // Check session for regular auth
            Long userId = (Long) session.getAttribute("userId");
            if (userId != null) {
                User user = userRepository.findById(userId)
                        .orElseThrow(() -> new RuntimeException("User not found"));
                
                System.out.println("Session /me request for: " + user.getEmail());
                
                return ResponseEntity.ok(Map.of(
                    "id", user.getId(),
                    "email", user.getEmail(),
                    "name", user.getName(),
                    "role", user.getRole().name(),
                    "kycStatus", user.getKycStatus().name()
                ));
            }
            
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpSession session) {
        session.invalidate();
        SecurityContextHolder.clearContext();
        return ResponseEntity.ok(Map.of("success", true));
    }

    @GetMapping("/oauth-exchange")
    public ResponseEntity<?> exchangeOAuthToken(@RequestParam String token, HttpSession session) {
        try {
            System.out.println("=== OAUTH TOKEN EXCHANGE ===");
            System.out.println("Token: " + token);
            
            // Validate and get userId from token
            Long userId = com.example.goldmarket.config.SecurityConfig.validateAndRemoveToken(token);
            
            if (userId == null) {
                System.out.println("Token invalid or expired");
                return ResponseEntity.status(401).body(Map.of("error", "Invalid or expired token"));
            }
            
            // Find user
            User user = userRepository.findById(userId).orElse(null);
            if (user == null) {
                System.out.println("User not found for id: " + userId);
                return ResponseEntity.status(401).body(Map.of("error", "User not found"));
            }
            
            System.out.println("Token exchange successful for: " + user.getEmail());
            
            // Set up the session properly
            session.setAttribute("userId", user.getId());
            setAuthentication(user, session);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "user", Map.of(
                    "id", user.getId(),
                    "email", user.getEmail(),
                    "name", user.getName(),
                    "role", user.getRole().name(),
                    "kycStatus", user.getKycStatus().name()
                )
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/update")
    public ResponseEntity<?> updateProfile(@RequestBody UpdateProfileRequest request, HttpSession session) {
        try {
            // Get current user
            OAuth2User principal = (OAuth2User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            String email = principal.getAttribute("email");

            User user = userRepository.findByEmail(email).orElse(null);
            if (user == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
            }

            // Update fields
            if (request.getName() != null)
                user.setName(request.getName());
            if (request.getPhone() != null)
                user.setPhone(request.getPhone());
            if (request.getBio() != null)
                user.setBio(request.getBio());

            userRepository.save(user);

            // Update session if name changed
            if (request.getName() != null) {
                setAuthentication(user, session);
            }

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "user", Map.of(
                            "id", user.getId(),
                            "email", user.getEmail(),
                            "name", user.getName(),
                            "phone", user.getPhone() != null ? user.getPhone() : "",
                            "bio", user.getBio() != null ? user.getBio() : "",
                            "role", user.getRole().name())));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to update profile: " + e.getMessage()));
        }
    }

    private void setAuthentication(User user, HttpSession session) {
        try {
            Map<String, Object> attributes = Map.of(
                    "sub", user.getOauthProviderId(),
                    "name", user.getName(),
                    "email", user.getEmail(),
                    "role", user.getRole().name());

            OAuth2User principal = new DefaultOAuth2User(
                    Collections.emptyList(),
                    attributes,
                    "email");

            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    principal, null, Collections.emptyList());

            SecurityContextHolder.getContext().setAuthentication(authentication);
            session.setAttribute("SPRING_SECURITY_CONTEXT", SecurityContextHolder.getContext());
            System.out.println("Authentication set for user: " + user.getEmail() + " with role: " + user.getRole());
        } catch (Exception e) {
            System.err.println("Error setting authentication: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    // Request DTOs
    static class SignupRequest {
        private String email;
        private String password;
        private String name;

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }
    }

    static class LoginRequest {
        private String email;
        private String password;

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }
    }

    static class UpdateProfileRequest {
        private String name;
        private String phone;
        private String bio;

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getPhone() {
            return phone;
        }

        public void setPhone(String phone) {
            this.phone = phone;
        }

        public String getBio() {
            return bio;
        }

        public void setBio(String bio) {
            this.bio = bio;
        }
    }
}
