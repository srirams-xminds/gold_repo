package com.example.goldmarket.config;

import com.example.goldmarket.model.User;
import com.example.goldmarket.repository.UserRepository;
import com.example.goldmarket.repository.WalletRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

        private final UserRepository userRepository;
        private final WalletRepository walletRepository;

        public SecurityConfig(UserRepository userRepository, WalletRepository walletRepository) {
                this.userRepository = userRepository;
                this.walletRepository = walletRepository;
        }

        // Store for one-time OAuth tokens (simple in-memory, could use Redis in production)
        private static final java.util.concurrent.ConcurrentHashMap<String, Long> oauthTokens = new java.util.concurrent.ConcurrentHashMap<>();
        
        public static Long validateAndRemoveToken(String token) {
                return oauthTokens.remove(token);
        }
        
        @Bean
        public AuthenticationSuccessHandler oauth2AuthenticationSuccessHandler() {
                return (request, response, authentication) -> {
                        try {
                                OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
                                String email = oAuth2User.getAttribute("email");
                                Long dbUserId = oAuth2User.getAttribute("dbUserId");
                                
                                System.out.println("=== OAUTH SUCCESS HANDLER ===");
                                System.out.println("Email: " + email);
                                System.out.println("DB User ID: " + dbUserId);
                                
                                if (dbUserId != null) {
                                        // Generate a random one-time token
                                        String token = java.util.UUID.randomUUID().toString();
                                        oauthTokens.put(token, dbUserId);
                                        System.out.println("Token generated: " + token);
                                        
                                        // Store in session as backup
                                        request.getSession().setAttribute("userId", dbUserId);
                                        request.getSession().setAttribute("SPRING_SECURITY_CONTEXT", 
                                                org.springframework.security.core.context.SecurityContextHolder.getContext());
                                        
                                        // Redirect to frontend with the token
                                        String redirectUrl = "http://localhost:5173/oauth-callback?token=" + token;
                                        System.out.println("Redirecting to: " + redirectUrl);
                                        response.sendRedirect(redirectUrl);
                                } else {
                                        System.out.println("ERROR: dbUserId not found in OAuth2User attributes for: " + email);
                                        response.sendRedirect("http://localhost:5173/login?error=user_not_found");
                                }
                        } catch (Exception e) {
                                System.out.println("=== OAUTH SUCCESS HANDLER ERROR ===");
                                e.printStackTrace();
                                try {
                                        response.sendRedirect("http://localhost:5173/login?error=handler_error");
                                } catch (Exception ignored) {}
                        }
                };
        }

        @Bean
        public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
                http
                                // Disable unused default mechanisms
                                .csrf(csrf -> csrf.disable())
                                .formLogin(form -> form.disable())
                                .httpBasic(basic -> basic.disable())

                                // Enable CORS for React
                                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                                // Authorization rules
                                .authorizeHttpRequests(auth -> auth
                                                .requestMatchers(
                                                                "/", "/error",
                                                                "/api/public/**",
                                                                "/api/auth/**",
                                                                "/oauth2/**",
                                                                "/login/oauth2/**",
                                                                "/h2-console/**",
                                                                "/api/test/**",
                                                                "/api/chat/**")
                                                .permitAll()
                                                // Admin endpoints require authentication (role check done in controller)
                                                .requestMatchers("/api/admin/**").authenticated()
                                                .anyRequest().authenticated())

                                // Google OAuth2 login with proper redirect
                                .oauth2Login(oauth -> oauth
                                                .authorizationEndpoint(authEndpoint -> authEndpoint
                                                                .baseUri("/oauth2/authorization"))
                                                .redirectionEndpoint(redirect -> redirect
                                                                .baseUri("/login/oauth2/code/*"))
                                                .userInfoEndpoint(userInfo -> {
                                                    userInfo.userService(new com.example.goldmarket.security.CustomOAuth2UserService(
                                                                    userRepository,
                                                                    walletRepository));
                                                    userInfo.oidcUserService(new com.example.goldmarket.security.CustomOidcUserService(
                                                                    userRepository,
                                                                    walletRepository));
                                                })
                                                .successHandler(oauth2AuthenticationSuccessHandler())
                                                .failureHandler((request, response, exception) -> {
                                                    System.out.println("=== OAUTH2 LOGIN FAILED ===");
                                                    System.out.println("Error: " + exception.getMessage());
                                                    System.out.println("Exception type: " + exception.getClass().getName());
                                                    if (exception.getCause() != null) {
                                                        System.out.println("Cause: " + exception.getCause().getMessage());
                                                    }
                                                    exception.printStackTrace();
                                                    System.out.println("=== END OAUTH2 FAILURE ===");
                                                    response.sendRedirect("http://localhost:5173/login?error=true");
                                                }))

                                // Return 401 instead of redirecting to /login
                                .exceptionHandling(e -> e
                                                .authenticationEntryPoint(
                                                                new HttpStatusEntryPoint(
                                                                                org.springframework.http.HttpStatus.UNAUTHORIZED)))

                                // Needed for H2 console (can remove when fully on MySQL)
                                .headers(headers -> headers.frameOptions(frame -> frame.disable()));

                return http.build();
        }

        @Bean
        public CorsConfigurationSource corsConfigurationSource() {
                CorsConfiguration configuration = new CorsConfiguration();
                configuration.setAllowedOrigins(List.of(
                                "http://localhost:5173",
                                "http://localhost:5174",
                                "http://127.0.0.1:5173",
                                "http://127.0.0.1:5174"));
                configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
                configuration.setAllowedHeaders(List.of("*"));
                configuration.setAllowCredentials(true);
                configuration.setExposedHeaders(List.of("Set-Cookie"));

                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
                source.registerCorsConfiguration("/**", configuration);
                return source;
        }
}
