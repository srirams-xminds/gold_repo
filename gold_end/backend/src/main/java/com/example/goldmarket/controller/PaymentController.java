package com.example.goldmarket.controller;

import com.example.goldmarket.model.User;
import com.example.goldmarket.model.Wallet;
import com.example.goldmarket.model.Transaction;
import com.example.goldmarket.repository.UserRepository;
import com.example.goldmarket.repository.WalletRepository;
import com.example.goldmarket.repository.TransactionRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/payment")
@CrossOrigin(origins = { "http://localhost:5173", "http://localhost:5174" }, allowCredentials = "true")
public class PaymentController {

    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;

    public PaymentController(UserRepository userRepository, WalletRepository walletRepository,
            TransactionRepository transactionRepository) {
        this.userRepository = userRepository;
        this.walletRepository = walletRepository;
        this.transactionRepository = transactionRepository;
    }

    @PostMapping("/mock-deposit")
    public ResponseEntity<?> mockDeposit(@AuthenticationPrincipal OAuth2User principal,
            @RequestBody Map<String, Object> data) {
        try {
            String email = principal.getAttribute("email");
            BigDecimal amount = new BigDecimal(data.get("amount").toString());

            if (amount.compareTo(BigDecimal.ZERO) <= 0) {
                return ResponseEntity.badRequest().body(Map.of("error", "Amount must be greater than 0"));
            }

            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            Wallet wallet = walletRepository.findByUserId(user.getId())
                    .orElseThrow(() -> new RuntimeException("Wallet not found"));

            // Simulate payment processing delay
            Thread.sleep(1000);

            // Add money to wallet
            wallet.setBalance(wallet.getBalance().add(amount));
            walletRepository.save(wallet);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Payment successful! ₹" + amount + " added to wallet");
            response.put("newBalance", wallet.getBalance());
            response.put("transactionId", "MOCK_" + System.currentTimeMillis());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/upi")
    public ResponseEntity<?> processUpiPayment(@AuthenticationPrincipal OAuth2User principal,
            @RequestBody Map<String, Object> data) {
        try {
            String email = principal.getAttribute("email");
            BigDecimal amount = new BigDecimal(data.get("amount").toString());
            String upiId = (String) data.get("upiId");

            if (amount.compareTo(BigDecimal.ZERO) <= 0) {
                return ResponseEntity.badRequest().body(Map.of("error", "Amount must be greater than 0"));
            }

            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            Wallet wallet = walletRepository.findByUserId(user.getId())
                    .orElseThrow(() -> new RuntimeException("Wallet not found"));

            // Simulate UPI payment processing
            Thread.sleep(1500);

            // Add money to wallet
            wallet.setBalance(wallet.getBalance().add(amount));
            walletRepository.save(wallet);

            String transactionId = "UPI_" + System.currentTimeMillis();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "UPI payment successful!");
            response.put("transactionId", transactionId);
            response.put("amount", amount);
            response.put("newBalance", wallet.getBalance());
            response.put("paymentMethod", "UPI");
            response.put("upiId", upiId != null ? upiId : "goldmarket@upi");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/card")
    public ResponseEntity<?> processCardPayment(@AuthenticationPrincipal OAuth2User principal,
            @RequestBody Map<String, Object> data) {
        try {
            String email = principal.getAttribute("email");
            BigDecimal amount = new BigDecimal(data.get("amount").toString());
            String cardNumber = (String) data.get("cardNumber");
            String expiryDate = (String) data.get("expiryDate");
            String cvv = (String) data.get("cvv");
            String cardType = (String) data.get("cardType"); // DEBIT or CREDIT

            if (amount.compareTo(BigDecimal.ZERO) <= 0) {
                return ResponseEntity.badRequest().body(Map.of("error", "Amount must be greater than 0"));
            }

            // Basic validation
            if (cardNumber == null || cardNumber.length() < 16) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid card number"));
            }
            if (cvv == null || cvv.length() < 3) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid CVV"));
            }

            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            Wallet wallet = walletRepository.findByUserId(user.getId())
                    .orElseThrow(() -> new RuntimeException("Wallet not found"));

            // Simulate card payment processing
            Thread.sleep(2000);

            // Add money to wallet
            wallet.setBalance(wallet.getBalance().add(amount));
            walletRepository.save(wallet);

            String transactionId = "CARD_" + System.currentTimeMillis();
            String maskedCard = "****" + cardNumber.substring(cardNumber.length() - 4);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", cardType + " card payment successful!");
            response.put("transactionId", transactionId);
            response.put("amount", amount);
            response.put("newBalance", wallet.getBalance());
            response.put("paymentMethod", cardType + "_CARD");
            response.put("maskedCard", maskedCard);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/generate-upi-qr")
    public ResponseEntity<?> generateUpiQr(@AuthenticationPrincipal OAuth2User principal,
            @RequestParam BigDecimal amount) {
        try {
            // Generate UPI payment string
            String upiId = "goldmarket@upi";
            String payeeName = "Gold Marketplace";
            String upiString = String.format(
                "upi://pay?pa=%s&pn=%s&am=%s&cu=INR&tn=Add%%20Money%%20to%%20Wallet",
                upiId, payeeName.replace(" ", "%20"), amount
            );

            Map<String, Object> response = new HashMap<>();
            response.put("upiId", upiId);
            response.put("payeeName", payeeName);
            response.put("amount", amount);
            response.put("upiString", upiString);
            // For QR code, frontend will use a library to generate from upiString

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/confirm")
    public ResponseEntity<?> confirmPayment(@AuthenticationPrincipal OAuth2User principal,
            @RequestBody Map<String, Object> data) {
        // Legacy endpoint for compatibility
        return mockDeposit(principal, data);
    }
}
