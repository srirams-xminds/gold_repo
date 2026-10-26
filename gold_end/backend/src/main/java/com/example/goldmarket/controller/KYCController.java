package com.example.goldmarket.controller;

import com.example.goldmarket.model.KYC;
import com.example.goldmarket.model.User;
import com.example.goldmarket.repository.KYCRepository;
import com.example.goldmarket.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/kyc")
@CrossOrigin(origins = { "http://localhost:5173", "http://localhost:5174" }, allowCredentials = "true")
public class KYCController {

    private final KYCRepository kycRepository;
    private final UserRepository userRepository;

    public KYCController(KYCRepository kycRepository, UserRepository userRepository) {
        this.kycRepository = kycRepository;
        this.userRepository = userRepository;
    }

    @PostMapping("/submit")
    public ResponseEntity<?> submitKyc(@AuthenticationPrincipal OAuth2User principal,
            @RequestBody Map<String, Object> data, jakarta.servlet.http.HttpSession session) {
        try {
            System.out.println("=== KYC SUBMIT REQUEST ===");
            System.out.println("Data keys: " + data.keySet());
            
            // Get user from OAuth or session
            User user = null;
            
            // Try OAuth first
            if (principal != null) {
                String email = principal.getAttribute("email");
                user = userRepository.findByEmail(email).orElse(null);
            }
            
            // If not OAuth, try session
            if (user == null) {
                Long userId = (Long) session.getAttribute("userId");
                if (userId != null) {
                    user = userRepository.findById(userId).orElse(null);
                }
            }
            
            if (user == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
            }

            // Check if KYC already exists
            KYC kyc;
            boolean isNew = false;
            if (kycRepository.existsByUserId(user.getId())) {
                kyc = kycRepository.findByUserId(user.getId()).get();
                if (kyc.getStatus() == KYC.Status.VERIFIED) {
                    return ResponseEntity.badRequest().body(Map.of("error", "KYC already verified"));
                }
            } else {
                kyc = new KYC();
                kyc.setUser(user);
                isNew = true;
            }

            // Update KYC data from request
            updateKycFromData(kyc, data);
            kyc.setSubmittedAt(LocalDateTime.now());

            // Auto-verify if both ID document and photo are present
            if (kyc.getIdDocumentData() != null && !kyc.getIdDocumentData().isEmpty() &&
                kyc.getPhotoData() != null && !kyc.getPhotoData().isEmpty()) {
                kyc.setStatus(KYC.Status.VERIFIED);
                kyc.setVerifiedAt(LocalDateTime.now());
                user.setKycStatus(User.KycStatus.VERIFIED);
                System.out.println("KYC AUTO-VERIFIED for user: " + user.getEmail());
            } else {
                kyc.setStatus(KYC.Status.SUBMITTED);
                user.setKycStatus(User.KycStatus.SUBMITTED);
            }

            kycRepository.save(kyc);
            userRepository.save(user);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("status", kyc.getStatus().name());
            response.put("message", kyc.getStatus() == KYC.Status.VERIFIED ? 
                "KYC verified successfully!" : "KYC submitted for review");
            response.put("verified", kyc.getStatus() == KYC.Status.VERIFIED);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private void updateKycFromData(KYC kyc, Map<String, Object> data) {
        if (data.containsKey("fullName")) {
            kyc.setFullName((String) data.get("fullName"));
        }
        if (data.containsKey("dateOfBirth")) {
            kyc.setDateOfBirth(LocalDate.parse((String) data.get("dateOfBirth")));
        }
        if (data.containsKey("documentType")) {
            kyc.setDocumentType((String) data.get("documentType"));
        }
        if (data.containsKey("documentNumber")) {
            kyc.setDocumentNumber((String) data.get("documentNumber"));
        }
        if (data.containsKey("address")) {
            kyc.setAddress((String) data.get("address"));
        }
        if (data.containsKey("city")) {
            kyc.setCity((String) data.get("city"));
        }
        if (data.containsKey("state")) {
            kyc.setState((String) data.get("state"));
        }
        if (data.containsKey("pincode")) {
            kyc.setPincode((String) data.get("pincode"));
        }
        if (data.containsKey("idDocumentData")) {
            kyc.setIdDocumentData((String) data.get("idDocumentData"));
        }
        if (data.containsKey("idDocumentFileName")) {
            kyc.setIdDocumentFileName((String) data.get("idDocumentFileName"));
        }
        if (data.containsKey("photoData")) {
            kyc.setPhotoData((String) data.get("photoData"));
        }
        if (data.containsKey("photoFileName")) {
            kyc.setPhotoFileName((String) data.get("photoFileName"));
        }
    }

    @GetMapping("/status")
    public ResponseEntity<?> getKycStatus(@AuthenticationPrincipal OAuth2User principal, jakarta.servlet.http.HttpSession session) {
        try {
            // Get user from OAuth or session
            User user = null;
            
            if (principal != null) {
                String email = principal.getAttribute("email");
                user = userRepository.findByEmail(email).orElse(null);
            }
            
            if (user == null) {
                Long userId = (Long) session.getAttribute("userId");
                if (userId != null) {
                    user = userRepository.findById(userId).orElse(null);
                }
            }
            
            if (user == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
            }

            Map<String, Object> response = new HashMap<>();
            response.put("status", user.getKycStatus().name());

            kycRepository.findByUserId(user.getId()).ifPresent(kyc -> {
                response.put("fullName", kyc.getFullName());
                response.put("documentType", kyc.getDocumentType());
                response.put("submittedAt", kyc.getSubmittedAt() != null ? kyc.getSubmittedAt().toString() : null);
                response.put("verifiedAt", kyc.getVerifiedAt() != null ? kyc.getVerifiedAt().toString() : null);
                response.put("rejectionReason", kyc.getRejectionReason());
                response.put("hasIdDocument", kyc.getIdDocumentData() != null && !kyc.getIdDocumentData().isEmpty());
                response.put("hasPhoto", kyc.getPhotoData() != null && !kyc.getPhotoData().isEmpty());
                response.put("idDocumentFileName", kyc.getIdDocumentFileName());
                response.put("photoFileName", kyc.getPhotoFileName());
            });

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
