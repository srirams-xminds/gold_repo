package com.example.goldmarket.config;

import com.example.goldmarket.model.User;
import com.example.goldmarket.model.Wallet;
import com.example.goldmarket.repository.UserRepository;
import com.example.goldmarket.repository.WalletRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner initData(UserRepository userRepository, WalletRepository walletRepository) {
        return args -> {
            // Create default admin user if not exists
            if (userRepository.findByEmail("admin@goldmarket.com").isEmpty()) {
                User admin = new User();
                admin.setEmail("admin@goldmarket.com");
                admin.setName("Admin User");
                admin.setPassword("12345678");
                admin.setProvider("local");
                admin.setOauthProviderId("admin@goldmarket.com");
                admin.setRole(User.Role.ADMIN);
                admin.setKycStatus(User.KycStatus.VERIFIED);
                admin = userRepository.save(admin);

                // Create wallet for admin
                Wallet adminWallet = new Wallet();
                adminWallet.setUser(admin);
                adminWallet.setCurrency("INR");
                adminWallet.setBalance(new BigDecimal("100000.00"));
                walletRepository.save(adminWallet);

                System.out.println("===========================================");
                System.out.println("DEFAULT ADMIN USER CREATED:");
                System.out.println("Email: admin@goldmarket.com");
                System.out.println("Password: 12345678");
                System.out.println("===========================================");
            }

            // Create demo user if not exists
            if (userRepository.findByEmail("demo@example.com").isEmpty()) {
                User demo = new User();
                demo.setEmail("demo@example.com");
                demo.setName("Demo User");
                demo.setPassword("demo123");
                demo.setProvider("local");
                demo.setOauthProviderId("demo@example.com");
                demo.setRole(User.Role.INVESTOR);
                demo = userRepository.save(demo);

                // Create wallet for demo user with 0 balance
                Wallet demoWallet = new Wallet();
                demoWallet.setUser(demo);
                demoWallet.setCurrency("INR");
                demoWallet.setBalance(BigDecimal.ZERO);
                walletRepository.save(demoWallet);

                System.out.println("Demo user created: demo@example.com / demo123");
            }
        };
    }
}
