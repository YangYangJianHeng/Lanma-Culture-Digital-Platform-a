package com.lanma.culture.config;

import com.lanma.culture.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // 公开接口
                .requestMatchers("/api/health").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/v1/auth/register").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/v1/auth/login").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/v1/auth/wx-login").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/v1/auth/decrypt-phone").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/medals/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/landmarks/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/weather/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/foods/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/tourism/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/stories/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/marathons/**").permitAll()
                // 社交模块用户公共读端
                .requestMatchers(HttpMethod.GET, "/api/v1/activities/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/teams/**").permitAll()
                // 跑步记录公开端 / 挑战公开端
                .requestMatchers(HttpMethod.GET, "/api/v1/run-records/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/challenges/**").permitAll()
                // 团队动态 / 相册(团队内公开读)
                .requestMatchers(HttpMethod.GET, "/api/v1/teams/*/dynamics/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/recommend/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/v1/ai/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/ai/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/comments/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/publications/**").permitAll()
                .requestMatchers("/uploads/**").permitAll()
                .requestMatchers("/images/**").permitAll()
                // 管理员接口
                .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                // 其他接口需认证
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
