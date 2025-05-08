package com.fitness_centre.security;

import com.fitness_centre.filter.JwtAuthenticationTokenFilter;
import com.fitness_centre.filter.JwtAuthenticationTokenFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.access.AccessDeniedHandlerImpl;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * @author
 * @Classname SecurityConfig
 * @Description TODO
 * @date 03/03/2025
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity  // Enable method-level security
public class SecurityConfig{
    @Bean
    public PasswordEncoder passwordEncoder(){
        return new BCryptPasswordEncoder();
    }

    public static final String[] WHILELIST = {
            "/auth/login",
            "/test_recaptcha.html",
            "/auth/resendCode",
            "/auth/sendCode",
            "/auth/verifyCode",
            "/formal/default.jpg",
            "/auth/google-login",
            "/auth/google-login/complete-profile",
            "/auth/google-login/link",

//            "/coach/photo"
            //todo how to verify token for these images
            "/temp/**",
//            "/member/coach/filter"
//            "/member/subscription",
    };

    //Permit access
    /**
     * Core configuration: Configure HttpSecurity through SecurityFilterChain
     */
    @Autowired
    private JwtAuthenticationTokenFilter jwtAuthenticationTokenFilter;

    @Autowired
    private AuthenticationEntryPoint authenticationEntryPoint;

    @Autowired
    private AccessDeniedHandler accessDeniedHandler;



    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // 1. Disable CSRF
                .csrf(csrf -> csrf.disable())
                //Configure Spring Security to allow cross-origin
                .cors(cors ->{})

                // 2. Set Session strategy to stateless
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // 3. Configure request authorization rules
                .authorizeHttpRequests(auth -> auth
                        // Allow anonymous access to interfaces
                        .requestMatchers(WHILELIST).anonymous()
                        //Captured in the global exception handler
                        .requestMatchers("/auth/sendCode","/auth/verifyRegister","/auth/logout","/auth/google-login/complete-profile").permitAll()
                        //todo remove test page access
                        // All other requests require authentication
                        .anyRequest().authenticated())

                 //Configure exception handlers (Lambda DSL)
                .exceptionHandling(exceptionHandling ->
                        exceptionHandling
                                .authenticationEntryPoint(authenticationEntryPoint)
                                .accessDeniedHandler(accessDeniedHandler)
                );



        //Add custom filter to Spring Security filter chain at specified position
        http.addFilterBefore(jwtAuthenticationTokenFilter, UsernamePasswordAuthenticationFilter.class);

        // You can also add .httpBasic(), .formLogin(), custom filters, etc. as needed

        // 4. Finally return the built SecurityFilterChain
        return http.build();
    }


    //Get AuthenticationManager object to call its methods
//    @Bean
//    public AuthenticationManager authenticationManagerBean(AuthenticationConfiguration configuration) throws Exception {
//        return configuration.getAuthenticationManager();
//    }

    @Bean
    public AuthenticationManager authenticationManager(
            HttpSecurity http,
            AuthenticationProviderImpl authenticationProvider
    ) throws Exception {
        // 1. Get AuthenticationManagerBuilder from HttpSecurity
        AuthenticationManagerBuilder builder =
                http.getSharedObject(AuthenticationManagerBuilder.class);

        // 2. Add custom Provider
        builder.authenticationProvider(authenticationProvider);

        // 3. Other configurations like builder.userDetailsService(...) or builder.inMemoryAuthentication() can be added here
        //    omitted...

        // 4. Finally build and return an AuthenticationManager
        return builder.build();
    }
}