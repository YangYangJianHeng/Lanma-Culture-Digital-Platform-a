package com.lanma.culture.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
public class TokenService {

    private final StringRedisTemplate redisTemplate;
    private final long expirationMs;

    public TokenService(StringRedisTemplate redisTemplate,
                        @Value("${app.jwt.expiration-ms}") long expirationMs) {
        this.redisTemplate = redisTemplate;
        this.expirationMs = expirationMs;
    }

    private String key(Long userId) {
        return "token:" + userId;
    }

    public void storeToken(Long userId, String token) {
        redisTemplate.opsForValue().set(key(userId), token, expirationMs, TimeUnit.MILLISECONDS);
    }

    public boolean isValid(Long userId, String token) {
        String stored = redisTemplate.opsForValue().get(key(userId));
        return stored != null && stored.equals(token);
    }

    public void removeToken(Long userId) {
        redisTemplate.delete(key(userId));
    }
}
