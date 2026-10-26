package com.example.goldmarket.security;

import com.example.goldmarket.model.User;
import com.example.goldmarket.model.Wallet;
import com.example.goldmarket.repository.UserRepository;
import com.example.goldmarket.repository.WalletRepository;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Optional;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;
    private final WalletRepository walletRepository;

    public CustomOAuth2UserService(UserRepository userRepository, WalletRepository walletRepository) {
        this.userRepository = userRepository;
        this.walletRepository = walletRepository;
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        try {
            System.out.println("=== CUSTOM OAUTH2 USER SERVICE - START ===");
            OAuth2User oauth2User = super.loadUser(userRequest);

            String email = oauth2User.getAttribute("email");
            String name = oauth2User.getAttribute("name");
            System.out.println("OAuth user email: " + email + ", name: " + name);

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
                
                System.out.println("Created new OAuth user: " + email + " with role: INVESTOR and balance: 0");
            } else {
                user = userOptional.get();
                System.out.println("Existing OAuth user logged in: " + email + " with role: " + user.getRole());
            }

            // Add isNewUser flag and dbUserId to attributes for success handler
            java.util.Map<String, Object> attributes = new java.util.HashMap<>(oauth2User.getAttributes());
            attributes.put("isNewUser", userOptional.isEmpty());
            attributes.put("dbUserId", user.getId()); // Add user ID for success handler
            
            // Google uses 'sub' as the user identifier - always use 'sub' for Google
            String userNameAttributeName = "sub";
            
            // If 'sub' is not in attributes, try 'email' as last resort
            if (!attributes.containsKey(userNameAttributeName)) {
                System.out.println("'sub' not found in attributes, using 'email'");
                userNameAttributeName = "email";
            }
            
            System.out.println("OAuth user name attribute: " + userNameAttributeName);
            System.out.println("=== CUSTOM OAUTH2 USER SERVICE - SUCCESS ===");
            
            return new org.springframework.security.oauth2.core.user.DefaultOAuth2User(
                oauth2User.getAuthorities(),
                attributes,
                userNameAttributeName
            );
        } catch (Exception e) {
            System.out.println("=== CUSTOM OAUTH2 USER SERVICE - ERROR ===");
            System.out.println("Error: " + e.getMessage());
            e.printStackTrace();
            throw new OAuth2AuthenticationException(new org.springframework.security.oauth2.core.OAuth2Error("user_processing_error", "Failed to process OAuth user: " + e.getMessage(), null));
        }
    }
}
