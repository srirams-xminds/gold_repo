package com.example.goldmarket.service;

import com.example.goldmarket.model.PriceTrigger;
import com.example.goldmarket.model.Transaction;
import com.example.goldmarket.model.Wallet;
import com.example.goldmarket.repository.PriceTriggerRepository;
import com.example.goldmarket.repository.TransactionRepository;
import com.example.goldmarket.repository.WalletRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class PriceMonitorService {

    private final PriceTriggerRepository priceTriggerRepository;
    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;

    // Mock current price - in production this would come from a real market API
    private BigDecimal currentGoldPrice = new BigDecimal("6500.00");

    public PriceMonitorService(PriceTriggerRepository priceTriggerRepository,
                                WalletRepository walletRepository,
                                TransactionRepository transactionRepository) {
        this.priceTriggerRepository = priceTriggerRepository;
        this.walletRepository = walletRepository;
        this.transactionRepository = transactionRepository;
    }

    // Check triggers every 10 seconds
    @Scheduled(fixedRate = 10000)
    public void checkPriceTriggers() {
        // Simulate price fluctuation for demo
        simulatePriceChange();

        List<PriceTrigger> activeTriggers = priceTriggerRepository.findByStatus(PriceTrigger.Status.ACTIVE);

        for (PriceTrigger trigger : activeTriggers) {
            if (shouldExecuteTrigger(trigger)) {
                executeTrigger(trigger);
            }
        }
    }

    private void simulatePriceChange() {
        // Fluctuate price by ±50 rupees randomly
        double change = (Math.random() - 0.5) * 100;
        currentGoldPrice = currentGoldPrice.add(new BigDecimal(change));
        
        // Keep price in reasonable range
        if (currentGoldPrice.compareTo(new BigDecimal("6000")) < 0) {
            currentGoldPrice = new BigDecimal("6000");
        }
        if (currentGoldPrice.compareTo(new BigDecimal("7000")) > 0) {
            currentGoldPrice = new BigDecimal("7000");
        }
    }

    private boolean shouldExecuteTrigger(PriceTrigger trigger) {
        if (trigger.getAction().equals("BUY")) {
            // Execute if current price is at or below trigger price
            return currentGoldPrice.compareTo(trigger.getTriggerPrice()) <= 0;
        } else if (trigger.getAction().equals("SELL")) {
            // Execute if current price is at or above trigger price
            return currentGoldPrice.compareTo(trigger.getTriggerPrice()) >= 0;
        }
        return false;
    }

    private void executeTrigger(PriceTrigger trigger) {
        try {
            Wallet wallet = walletRepository.findByUserId(trigger.getUser().getId())
                    .orElse(null);

            if (wallet == null) {
                trigger.setStatus(PriceTrigger.Status.FAILED);
                trigger.setExecutionDetails("Wallet not found");
                priceTriggerRepository.save(trigger);
                return;
            }

            BigDecimal totalCost = trigger.getGoldAmount().multiply(currentGoldPrice);

            if (trigger.getAction().equals("BUY")) {
                // Check sufficient balance
                if (wallet.getBalance().compareTo(totalCost) < 0) {
                    trigger.setStatus(PriceTrigger.Status.FAILED);
                    trigger.setExecutionDetails("Insufficient balance. Required: ₹" + totalCost + ", Available: ₹" + wallet.getBalance());
                    priceTriggerRepository.save(trigger);
                    return;
                }

                // Deduct from wallet
                wallet.setBalance(wallet.getBalance().subtract(totalCost));
            } else if (trigger.getAction().equals("SELL")) {
                // Add to wallet
                wallet.setBalance(wallet.getBalance().add(totalCost));
            }

            walletRepository.save(wallet);

            // Create transaction record
            Transaction transaction = new Transaction();
            transaction.setWallet(wallet);
            transaction.setType(trigger.getAction());
            transaction.setSymbol("GOLD");
            transaction.setAmount(trigger.getGoldAmount());
            transaction.setPrice(currentGoldPrice);
            transaction.setTimestamp(LocalDateTime.now());
            transactionRepository.save(transaction);

            // Mark trigger as executed
            trigger.setStatus(PriceTrigger.Status.EXECUTED);
            trigger.setExecutedAt(LocalDateTime.now());
            trigger.setExecutionDetails(String.format(
                "Executed at price ₹%.2f. %s %.2fg gold. Total: ₹%.2f. New balance: ₹%.2f",
                currentGoldPrice, trigger.getAction(), trigger.getGoldAmount(), totalCost, wallet.getBalance()
            ));
            priceTriggerRepository.save(trigger);

            System.out.println("PRICE TRIGGER EXECUTED: " + trigger.getAction() + " " + 
                              trigger.getGoldAmount() + "g at ₹" + currentGoldPrice + 
                              " for user " + trigger.getUser().getEmail());

        } catch (Exception e) {
            trigger.setStatus(PriceTrigger.Status.FAILED);
            trigger.setExecutionDetails("Execution failed: " + e.getMessage());
            priceTriggerRepository.save(trigger);
            e.printStackTrace();
        }
    }

    public BigDecimal getCurrentPrice() {
        return currentGoldPrice;
    }

    public void setCurrentPrice(BigDecimal price) {
        this.currentGoldPrice = price;
    }
}
