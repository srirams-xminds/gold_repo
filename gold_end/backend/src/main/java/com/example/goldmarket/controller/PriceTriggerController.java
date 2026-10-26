package com.example.goldmarket.controller;

import com.example.goldmarket.model.PriceTrigger;
import com.example.goldmarket.model.User;
import com.example.goldmarket.repository.PriceTriggerRepository;
import com.example.goldmarket.repository.UserRepository;
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
@RequestMapping("/api/price-trigger")
@CrossOrigin(origins = { "http://localhost:5173", "http://localhost:5174" }, allowCredentials = "true")
public class PriceTriggerController {

    private final PriceTriggerRepository priceTriggerRepository;
    private final UserRepository userRepository;

    public PriceTriggerController(PriceTriggerRepository priceTriggerRepository, UserRepository userRepository) {
        this.priceTriggerRepository = priceTriggerRepository;
        this.userRepository = userRepository;
    }

    @PostMapping("/create")
    public ResponseEntity<?> createTrigger(@AuthenticationPrincipal OAuth2User principal,
            @RequestBody Map<String, Object> data) {
        try {
            String email = principal.getAttribute("email");
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            BigDecimal triggerPrice = new BigDecimal(data.get("triggerPrice").toString());
            String action = (String) data.get("action"); // BUY or SELL
            BigDecimal goldAmount = new BigDecimal(data.get("goldAmount").toString());

            if (triggerPrice.compareTo(BigDecimal.ZERO) <= 0) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid trigger price"));
            }

            if (goldAmount.compareTo(BigDecimal.ZERO) <= 0) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid gold amount"));
            }

            if (!action.equals("BUY") && !action.equals("SELL")) {
                return ResponseEntity.badRequest().body(Map.of("error", "Action must be BUY or SELL"));
            }

            PriceTrigger trigger = new PriceTrigger();
            trigger.setUser(user);
            trigger.setTriggerPrice(triggerPrice);
            trigger.setAction(action);
            trigger.setGoldAmount(goldAmount);
            trigger.setStatus(PriceTrigger.Status.ACTIVE);
            trigger.setCreatedAt(LocalDateTime.now());

            priceTriggerRepository.save(trigger);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Price trigger created successfully");
            response.put("triggerId", trigger.getId());
            response.put("trigger", formatTrigger(trigger));

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/list")
    public ResponseEntity<?> listTriggers(@AuthenticationPrincipal OAuth2User principal) {
        try {
            String email = principal.getAttribute("email");
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            List<Map<String, Object>> triggers = priceTriggerRepository
                    .findByUserIdOrderByCreatedAtDesc(user.getId())
                    .stream()
                    .map(this::formatTrigger)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(triggers);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/active")
    public ResponseEntity<?> getActiveTriggers(@AuthenticationPrincipal OAuth2User principal) {
        try {
            String email = principal.getAttribute("email");
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            List<Map<String, Object>> triggers = priceTriggerRepository
                    .findByUserIdAndStatus(user.getId(), PriceTrigger.Status.ACTIVE)
                    .stream()
                    .map(this::formatTrigger)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(triggers);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> cancelTrigger(@AuthenticationPrincipal OAuth2User principal, @PathVariable Long id) {
        try {
            String email = principal.getAttribute("email");
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            PriceTrigger trigger = priceTriggerRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Trigger not found"));

            if (!trigger.getUser().getId().equals(user.getId())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Unauthorized"));
            }

            if (trigger.getStatus() != PriceTrigger.Status.ACTIVE) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Can only cancel active triggers"));
            }

            trigger.setStatus(PriceTrigger.Status.CANCELLED);
            priceTriggerRepository.save(trigger);

            return ResponseEntity.ok(Map.of("success", true, "message", "Trigger cancelled"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private Map<String, Object> formatTrigger(PriceTrigger trigger) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", trigger.getId());
        map.put("triggerPrice", trigger.getTriggerPrice());
        map.put("action", trigger.getAction());
        map.put("goldAmount", trigger.getGoldAmount());
        map.put("status", trigger.getStatus().name());
        map.put("createdAt", trigger.getCreatedAt().toString());
        map.put("executedAt", trigger.getExecutedAt() != null ? trigger.getExecutedAt().toString() : null);
        map.put("executionDetails", trigger.getExecutionDetails());
        return map;
    }
}
