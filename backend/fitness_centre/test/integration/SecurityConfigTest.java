package integration;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@TestConfiguration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfigTest {

    @Bean
    public SecurityFilterChain filterChainTest(HttpSecurity http) throws Exception {
        // 禁用CSRF，启用基本认证，允许方法级安全
        http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/auth/**").permitAll() // 允许所有认证相关的路径
                        .anyRequest().authenticated());
        
        return http.build();
    }
} 