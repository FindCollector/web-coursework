package service;

import com.fitness_centre.constant.ErrorCode;
import com.fitness_centre.exception.BusinessException;
import com.fitness_centre.service.biz.impl.UserServiceImpl;
import com.fitness_centre.service.infrastructure.MailService;
import com.fitness_centre.utils.RedisCache;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.concurrent.TimeUnit;

/**
 * Tests for UserServiceImpl.sendCode
 */
@ExtendWith(MockitoExtension.class)
public class UserServiceSendCodeTest {

    private UserServiceImpl buildService(RedisCache redis, MailService mail) {
        UserServiceImpl svc = new UserServiceImpl();
        ReflectionTestUtils.setField(svc, "redisCache", redis);
        ReflectionTestUtils.setField(svc, "mailService", mail);
        return svc;
    }

    @Test
    @DisplayName("sendCode should limit frequency and throw BusinessException when called too often")
    public void testFrequencyLimit() {
        String email = "test@example.com";
        RedisCache redis = Mockito.mock(RedisCache.class);
        MailService mail = Mockito.mock(MailService.class);

        // redis already has sendFreq key
        Mockito.when(redis.getCacheObject("emailSendFreq:" + email)).thenReturn(LocalDateTime.now());

        UserServiceImpl svc = buildService(redis, mail);

        Assertions.assertThrows(BusinessException.class, () -> svc.sendCode(email));
    }

    @Test
    @DisplayName("sendCode should store frequency key, call mail service, and cache verification code")
    public void testSendCodeSuccess() throws Exception {
        String email = "user@example.com";
        RedisCache redis = Mockito.mock(RedisCache.class);
        MailService mail = Mockito.mock(MailService.class);

        // No frequency key present
        Mockito.when(redis.getCacheObject("emailSendFreq:" + email)).thenReturn(null);
        Mockito.when(mail.sendVerificationCode(email)).thenReturn("123456");

        UserServiceImpl svc = buildService(redis, mail);

        svc.sendCode(email);

        // Verify frequency key stored
        Mockito.verify(redis).setCacheObject(Mockito.eq("emailSendFreq:" + email), Mockito.any(LocalDateTime.class), Mockito.eq(1), Mockito.eq(TimeUnit.MINUTES));
        // Verify verification code stored
        Mockito.verify(redis).setCacheObject("verifyCode:" + email, "123456", 5, TimeUnit.MINUTES);
        // Verify mail called
        Mockito.verify(mail).sendVerificationCode(email);
    }
} 