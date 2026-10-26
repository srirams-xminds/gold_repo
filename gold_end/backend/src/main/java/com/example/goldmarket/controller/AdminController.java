package com.example.goldmarket.controller;

import com.example.goldmarket.model.KYC;
import com.example.goldmarket.model.User;
import com.example.goldmarket.model.Wallet;
import com.example.goldmarket.repository.KYCRepository;
import com.example.goldmarket.repository.UserRepository;
import com.example.goldmarket.repository.WalletRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = { "http://localhost:5173", "http://localhost:5174" }, allowCredentials = "true")
public class AdminController {

    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    private final KYCRepository kycRepository;

    public AdminController(UserRepository userRepository, WalletRepository walletRepository, KYCRepository kycRepository) {
        this.userRepository = userRepository;
        this.walletRepository = walletRepository;
        this.kycRepository = kycRepository;
    }

    // Verify admin role
    private User verifyAdmin(OAuth2User principal) {
        String email = principal.getAttribute("email");
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getRole() != User.Role.ADMIN) {
            throw new RuntimeException("Unauthorized: Admin access required");
        }
        return user;
    }

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers(@AuthenticationPrincipal OAuth2User principal) {
        try {
            verifyAdmin(principal);
            List<Map<String, Object>> users = userRepository.findAll().stream()
                    .map(user -> {
                        Map<String, Object> userMap = new HashMap<>();
                        userMap.put("id", user.getId());
                        userMap.put("email", user.getEmail());
                        userMap.put("name", user.getName());
                        userMap.put("role", user.getRole().name());
                        userMap.put("kycStatus", user.getKycStatus().name());
                        userMap.put("provider", user.getProvider());
                        
                        // Get wallet balance
                        walletRepository.findByUserId(user.getId())
                                .ifPresent(wallet -> userMap.put("balance", wallet.getBalance()));
                        
                        return userMap;
                    })
                    .collect(Collectors.toList());
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getStats(@AuthenticationPrincipal OAuth2User principal) {
        try {
            verifyAdmin(principal);
            Map<String, Object> stats = new HashMap<>();
            
            long totalUsers = userRepository.count();
            long totalAdmins = userRepository.findAll().stream()
                    .filter(u -> u.getRole() == User.Role.ADMIN).count();
            
            // Count KYC statuses
            long submittedKyc = userRepository.findAll().stream()
                    .filter(u -> u.getKycStatus() == User.KycStatus.SUBMITTED)
                    .count();
            
            long notSubmittedKyc = userRepository.findAll().stream()
                    .filter(u -> u.getKycStatus() == User.KycStatus.PENDING)
                    .count();
            
            BigDecimal totalBalance = walletRepository.findAll().stream()
                    .map(Wallet::getBalance)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            stats.put("totalUsers", totalUsers);
            stats.put("totalAdmins", totalAdmins);
            stats.put("totalInvestors", totalUsers - totalAdmins);
            stats.put("pendingKyc", submittedKyc);
            stats.put("notSubmittedKyc", notSubmittedKyc);
            stats.put("totalBalance", totalBalance);
            
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<?> updateUser(@AuthenticationPrincipal OAuth2User principal,
            @PathVariable Long id, @RequestBody Map<String, Object> updates) {
        try {
            verifyAdmin(principal);
            User user = userRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            if (updates.containsKey("name")) {
                user.setName((String) updates.get("name"));
            }
            if (updates.containsKey("role")) {
                user.setRole(User.Role.valueOf((String) updates.get("role")));
            }
            if (updates.containsKey("kycStatus")) {
                user.setKycStatus(User.KycStatus.valueOf((String) updates.get("kycStatus")));
            }
            
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("success", true, "message", "User updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@AuthenticationPrincipal OAuth2User principal, @PathVariable Long id) {
        try {
            User admin = verifyAdmin(principal);
            
            if (admin.getId().equals(id)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Cannot delete your own account"));
            }
            
            User user = userRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            // Delete wallet first
            walletRepository.findByUserId(id).ifPresent(walletRepository::delete);
            
            // Delete KYC if exists
            kycRepository.findByUserId(id).ifPresent(kycRepository::delete);
            
            userRepository.delete(user);
            return ResponseEntity.ok(Map.of("success", true, "message", "User deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/users/{id}/balance")
    public ResponseEntity<?> modifyBalance(@AuthenticationPrincipal OAuth2User principal,
            @PathVariable Long id, @RequestBody Map<String, Object> data) {
        try {
            verifyAdmin(principal);
            BigDecimal newBalance = new BigDecimal(data.get("balance").toString());
            
            Wallet wallet = walletRepository.findByUserId(id)
                    .orElseThrow(() -> new RuntimeException("Wallet not found"));
            
            wallet.setBalance(newBalance);
            walletRepository.save(wallet);
            
            return ResponseEntity.ok(Map.of("success", true, "newBalance", newBalance));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }



    @GetMapping("/kyc/pending")
    public ResponseEntity<?> getPendingKyc(@AuthenticationPrincipal OAuth2User principal) {
        try {
            verifyAdmin(principal);
            
            // Get all users with SUBMITTED KYC status
            List<Map<String, Object>> pendingKyc = userRepository.findAll().stream()
                    .filter(user -> user.getKycStatus() == User.KycStatus.SUBMITTED)
                    .map(user -> {
                        Map<String, Object> kycMap = new HashMap<>();
                        kycMap.put("userId", user.getId());
                        kycMap.put("userEmail", user.getEmail());
                        kycMap.put("userName", user.getName());
                        
                        // Try to get KYC details if they exist
                        kycRepository.findByUserId(user.getId()).ifPresentOrElse(
                            kyc -> {
                                kycMap.put("id", kyc.getId());
                                kycMap.put("fullName", kyc.getFullName());
                                kycMap.put("documentType", kyc.getDocumentType());
                                kycMap.put("documentNumber", kyc.getDocumentNumber());
                                kycMap.put("dateOfBirth", kyc.getDateOfBirth() != null ? kyc.getDateOfBirth().toString() : null);
                                kycMap.put("address", kyc.getAddress());
                                kycMap.put("city", kyc.getCity());
                                kycMap.put("state", kyc.getState());
                                kycMap.put("pincode", kyc.getPincode());
                                kycMap.put("submittedAt", kyc.getSubmittedAt() != null ? kyc.getSubmittedAt().toString() : null);
                                kycMap.put("hasIdDocument", kyc.getIdDocumentData() != null && !kyc.getIdDocumentData().isEmpty());
                                kycMap.put("hasPhoto", kyc.getPhotoData() != null && !kyc.getPhotoData().isEmpty());
                            },
                            () -> {
                                // No KYC record, use user data
                                kycMap.put("id", null);
                                kycMap.put("fullName", user.getName());
                                kycMap.put("documentType", "N/A");
                                kycMap.put("documentNumber", "N/A");
                                kycMap.put("submittedAt", "Recently");
                            }
                        );
                        
                        return kycMap;
                    })
                    .collect(Collectors.toList());
            
            System.out.println("Returning " + pendingKyc.size() + " pending KYC requests (from User table)");
            return ResponseEntity.ok(pendingKyc);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/kyc/unsubmitted")
    public ResponseEntity<?> getUnsubmittedKyc(@AuthenticationPrincipal OAuth2User principal) {
        try {
            verifyAdmin(principal);
            
            // Get all users with PENDING (Not Started) KYC status
            List<Map<String, Object>> unsubmittedKyc = userRepository.findAll().stream()
                    .filter(user -> user.getKycStatus() == User.KycStatus.PENDING)
                    .map(user -> {
                        Map<String, Object> kycMap = new HashMap<>();
                        kycMap.put("userId", user.getId());
                        kycMap.put("userEmail", user.getEmail());
                        kycMap.put("userName", user.getName());
                        kycMap.put("status", "Not Started");
                        kycMap.put("joinedAt", "Recently"); // Ideally would use created_at from DB
                        return kycMap;
                    })
                    .collect(Collectors.toList());
            
            System.out.println("Returning " + unsubmittedKyc.size() + " unsubmitted KYC users");
            return ResponseEntity.ok(unsubmittedKyc);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/kyc/{id}/approve")
    public ResponseEntity<?> approveKyc(@AuthenticationPrincipal OAuth2User principal, @PathVariable Long id) {
        try {
            verifyAdmin(principal);
            KYC kyc = kycRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("KYC not found"));
            
            kyc.setStatus(KYC.Status.VERIFIED);
            kyc.setVerifiedAt(LocalDateTime.now());
            kycRepository.save(kyc);
            
            // Update user's KYC status
            User user = kyc.getUser();
            user.setKycStatus(User.KycStatus.VERIFIED);
            userRepository.save(user);
            
            return ResponseEntity.ok(Map.of("success", true, "message", "KYC approved successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/kyc/{id}/reject")
    public ResponseEntity<?> rejectKyc(@AuthenticationPrincipal OAuth2User principal,
            @PathVariable Long id, @RequestBody Map<String, String> data) {
        try {
            verifyAdmin(principal);
            KYC kyc = kycRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("KYC not found"));
            
            kyc.setStatus(KYC.Status.REJECTED);
            kyc.setRejectionReason(data.get("reason"));
            kycRepository.save(kyc);
            
            // Update user's KYC status
            User user = kyc.getUser();
            user.setKycStatus(User.KycStatus.REJECTED);
            userRepository.save(user);
            
            return ResponseEntity.ok(Map.of("success", true, "message", "KYC rejected"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
