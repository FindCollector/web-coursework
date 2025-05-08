package utils;

import com.fitness_centre.utils.JwtUtil;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Unit tests for JwtUtil
 */
public class JwtUtilTest {

    @Test
    @DisplayName("createJWT should generate a token that can be parsed and returns original subject")
    public void testCreateAndParseToken() throws Exception {
        String subject = "42";
        String token = JwtUtil.createJWT(subject);

        Claims claims = JwtUtil.parseJWT(token);
        Assertions.assertEquals(subject, claims.getSubject());
    }

    @Test
    @DisplayName("createJWT with custom TTL should respect expiration time")
    public void testCustomTTL() throws Exception {
        String subject = "customTTL";
        long ttl = 5_000L; // 5 seconds
        String token = JwtUtil.createJWT(subject, ttl);
        Claims claims = JwtUtil.parseJWT(token);

        long issuedAt = claims.getIssuedAt().getTime();
        long expiration = claims.getExpiration().getTime();

        Assertions.assertEquals(ttl, expiration - issuedAt, 200L); // allow 200ms tolerance
        
        // 额外验证：过期时间应该大于签发时间
        Assertions.assertTrue(expiration > issuedAt, "过期时间应大于签发时间");
    }

    @Test
    @DisplayName("parseJWT should throw ExpiredJwtException for expired tokens")
    public void testExpiredToken() throws Exception {
        String token = JwtUtil.createJWT("expired", 5L); // 5 ms TTL
        // Ensure the token is expired
        Thread.sleep(10L);
        Assertions.assertThrows(ExpiredJwtException.class, () -> JwtUtil.parseJWT(token));
    }
} 