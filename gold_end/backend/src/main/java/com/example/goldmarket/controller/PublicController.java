package com.example.goldmarket.controller;

import com.example.goldmarket.model.User;
import com.example.goldmarket.model.Wallet;
import com.example.goldmarket.repository.UserRepository;
import com.example.goldmarket.repository.WalletRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/public")
@CrossOrigin(origins = { "http://localhost:5173", "http://localhost:5174" }, allowCredentials = "true")
public class PublicController {

    private final UserRepository userRepository;
    private final WalletRepository walletRepository;

    public PublicController(UserRepository userRepository, WalletRepository walletRepository) {
        this.userRepository = userRepository;
        this.walletRepository = walletRepository;
    }

    @GetMapping("/demo-login")
    public ResponseEntity<?> ensureDemoUser() {
        try {
            if (userRepository.findByEmail("demo@example.com").isEmpty()) {
                User demo = new User();
                demo.setEmail("demo@example.com");
                demo.setName("Demo User");
                demo.setPassword("demo123");
                demo.setProvider("local");
                demo.setOauthProviderId("demo@example.com");
                demo.setRole(User.Role.INVESTOR);
                demo = userRepository.save(demo);

                Wallet wallet = new Wallet();
                wallet.setUser(demo);
                wallet.setCurrency("INR");
                wallet.setBalance(BigDecimal.ZERO);
                walletRepository.save(wallet);
            }
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/setup-admin")
    public ResponseEntity<?> setupAdmin() {
        try {
            // Check if admin exists
            var existingAdmin = userRepository.findByEmail("admin@goldmarket.com");
            
            if (existingAdmin.isEmpty()) {
                // Create admin user
                User admin = new User();
                admin.setEmail("admin@goldmarket.com");
                admin.setName("Admin User");
                admin.setPassword("12345678");
                admin.setProvider("local");
                admin.setOauthProviderId("admin@goldmarket.com");
                admin.setRole(User.Role.ADMIN);
                admin.setKycStatus(User.KycStatus.VERIFIED);
                admin = userRepository.save(admin);

                // Create admin wallet
                Wallet wallet = new Wallet();
                wallet.setUser(admin);
                wallet.setCurrency("INR");
                wallet.setBalance(new BigDecimal("100000.00"));
                walletRepository.save(wallet);

                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Admin user created successfully",
                    "email", "admin@goldmarket.com",
                    "password", "12345678"
                ));
            } else {
                User admin = existingAdmin.get();
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Admin user already exists",
                    "email", admin.getEmail(),
                    "role", admin.getRole().name(),
                    "hasPassword", admin.getPassword() != null && !admin.getPassword().isEmpty()
                ));
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(Map.of("status", "ok", "database", "connected"));
    }
}
