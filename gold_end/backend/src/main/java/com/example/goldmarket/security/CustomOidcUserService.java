package com.example.goldmarket.security;

import com.example.goldmarket.model.User;
import com.example.goldmarket.model.Wallet;
import com.example.goldmarket.repository.UserRepository;
import com.example.goldmarket.repository.WalletRepository;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Optional;

@Service
public class CustomOidcUserService extends OidcUserService {

    private final UserRepository userRepository;
    private final WalletRepository walletRepository;

    public CustomOidcUserService(UserRepository userRepository, WalletRepository walletRepository) {
        this.userRepository = userRepository;
        this.walletRepository = walletRepository;
    }

    @Override
    public OidcUser loadUser(OidcUserRequest userRequest) throws OAuth2AuthenticationException {
        try {
            System.out.println("=== CUSTOM OIDC USER SERVICE - START ===");
            OidcUser oidcUser = super.loadUser(userRequest);

            String email = oidcUser.getAttribute("email");
            String name = oidcUser.getAttribute("name");
            System.out.println("OIDC user email: " + email + ", name: " + name);

            Optional<User> userOptional = userRepository.findByEmail(email);
            User user;
            if (userOptional.isEmpty()) {
                // Create new user with INVESTOR role
                user = new User();
                user.setEmail(email);
                user.setName(name);
                user.setProvider("google");
                user.setOauthProviderId(email);
                user.setRole(User.Role.INVESTOR); // Default role for OAuth users
                user = userRepository.save(user);

                // Create wallet for new user with 0 balance
                Wallet wallet = new Wallet();
                wallet.setUser(user);
                wallet.setCurrency("INR");
                wallet.setBalance(BigDecimal.ZERO); // Initial balance is 0
                walletRepository.save(wallet);
                
                System.out.println("Created new OIDC user: " + email + " with role: INVESTOR and balance: 0");
            } else {
                user = userOptional.get();
                System.out.println("Existing OIDC user logged in: " + email + " with role: " + user.getRole());
            }

            // Add isNewUser flag and dbUserId to attributes for success handler
            java.util.Map<String, Object> attributes = new java.util.HashMap<>(oidcUser.getAttributes());
            attributes.put("isNewUser", userOptional.isEmpty());
            attributes.put("dbUserId", user.getId()); // Add user ID for success handler
            
            System.out.println("OIDC attributes updated with dbUserId: " + user.getId());
            System.out.println("=== CUSTOM OIDC USER SERVICE - SUCCESS ===");
            
            return new DefaultOidcUser(
                oidcUser.getAuthorities(),
                oidcUser.getIdToken(),
                oidcUser.getUserInfo(),
                "sub"
            ) {
                 @Override
                 public java.util.Map<String, Object> getAttributes() {
                     return attributes;
                 }
            };
        } catch (Exception e) {
            System.out.println("=== CUSTOM OIDC USER SERVICE - ERROR ===");
            System.out.println("Error: " + e.getMessage());
            e.printStackTrace();
            throw new OAuth2AuthenticationException(new org.springframework.security.oauth2.core.OAuth2Error("user_processing_error", "Failed to process OIDC user: " + e.getMessage(), null));
        }
    }
}
