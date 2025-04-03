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
@EnableMethodSecurity  // 启用方法级别安全
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
            "/formal/default.jpg"
    };

    //放行
    /**
     * 核心配置：通过 SecurityFilterChain 来配置 HttpSecurity
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
                // 1. 关闭 CSRF
                .csrf(csrf -> csrf.disable())
                //配置Spring Security允许跨域
                .cors(cors ->{})

                // 2. 设置 Session 策略为无状态
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // 3. 配置请求的权限规则
                .authorizeHttpRequests(auth -> auth
                        // 接口允许匿名访问
                        .requestMatchers(WHILELIST).anonymous()
                        //在全局异常类中捕获
                        .requestMatchers("/auth/sendCode","/auth/verifyRegister").permitAll()
                        //todo 删除测试页面的放行
                        // 其余所有请求均需要认证
                        .anyRequest().authenticated())

                 //配置异常处理器（Lambda DSL）
                .exceptionHandling(exceptionHandling ->
                        exceptionHandling
                                .authenticationEntryPoint(authenticationEntryPoint)
                                .accessDeniedHandler(accessDeniedHandler)
                );



        //将自己的过滤器放在SpringSecurity的过滤器链中，指定位置
        http.addFilterBefore(jwtAuthenticationTokenFilter, UsernamePasswordAuthenticationFilter.class);

        // 也可以根据需要添加 .httpBasic()、.formLogin()、自定义过滤器等

        // 4. 最后返回构建好的 SecurityFilterChain
        return http.build();
    }


    //获取AuthenticationManager对象，去调用其中的方法
//    @Bean
//    public AuthenticationManager authenticationManagerBean(AuthenticationConfiguration configuration) throws Exception {
//        return configuration.getAuthenticationManager();
//    }

    @Bean
    public AuthenticationManager authenticationManager(
            HttpSecurity http,
            AuthenticationProviderImpl authenticationProvider
    ) throws Exception {
        // 1. 从 HttpSecurity 中拿到 AuthenticationManagerBuilder
        AuthenticationManagerBuilder builder =
                http.getSharedObject(AuthenticationManagerBuilder.class);

        // 2. 加入自定义的 Provider
        builder.authenticationProvider(authenticationProvider);

        // 3. 其他如 builder.userDetailsService(...) 或 builder.inMemoryAuthentication() 等都可以在这里配置
        //    省略...

        // 4. 最后构建一个 AuthenticationManager 返回
        return builder.build();
    }


}