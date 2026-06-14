package com.lanma.culture.security;

import com.lanma.culture.service.TokenService;
import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtTokenProvider {

    private final byte[] secretKey;
    private final long expirationMs;
    private final TokenService tokenService;

    public JwtTokenProvider(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-ms}") long expirationMs,
            TokenService tokenService) {
        String fullSecret = secret;
        while (fullSecret.length() < 32) {
            fullSecret += secret;
        }
        this.secretKey = fullSecret.substring(0, 32).getBytes(StandardCharsets.UTF_8);
        this.expirationMs = expirationMs;
        this.tokenService = tokenService;
    }

    public String generateToken(Long userId, String role) {
        try {
            Date now = new Date();
            Date expiry = new Date(now.getTime() + expirationMs);

            JWTClaimsSet claims = new JWTClaimsSet.Builder()
                    .subject(String.valueOf(userId))
                    .claim("role", role)
                    .issueTime(now)
                    .expirationTime(expiry)
                    .build();

            SignedJWT signedJWT = new SignedJWT(
                    new JWSHeader(JWSAlgorithm.HS256),
                    claims
            );
            signedJWT.sign(new MACSigner(secretKey));
            String token = signedJWT.serialize();

            tokenService.storeToken(userId, token);

            return token;
        } catch (JOSEException e) {
            throw new RuntimeException("JWT 生成失败", e);
        }
    }

    public Long getUserIdFromToken(String token) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);
            return Long.parseLong(signedJWT.getJWTClaimsSet().getSubject());
        } catch (Exception e) {
            throw new RuntimeException("JWT 解析失败", e);
        }
    }

    public String getRoleFromToken(String token) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);
            return signedJWT.getJWTClaimsSet().getStringClaim("role");
        } catch (Exception e) {
            throw new RuntimeException("JWT 解析失败", e);
        }
    }

    public boolean validateToken(String token) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);
            MACVerifier verifier = new MACVerifier(secretKey);
            if (!signedJWT.verify(verifier)) {
                return false;
            }
            if (signedJWT.getJWTClaimsSet().getExpirationTime().before(new Date())) {
                return false;
            }
            Long userId = Long.parseLong(signedJWT.getJWTClaimsSet().getSubject());
            return tokenService.isValid(userId, token);
        } catch (Exception e) {
            return false;
        }
    }

    public void invalidateToken(Long userId) {
        tokenService.removeToken(userId);
    }
}
