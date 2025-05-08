package service;

import com.fitness_centre.dto.auth.UserRegisterRequest;
import com.fitness_centre.exception.AuthException;
import com.fitness_centre.exception.ValidationException;
import com.fitness_centre.service.biz.impl.UserServiceImpl;
import com.fitness_centre.service.infrastructure.MailService;
import com.fitness_centre.utils.RedisCache;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * Tests for UserServiceImpl.basicInfoStore validation logic
 */
@ExtendWith(MockitoExtension.class)
public class UserServiceBasicInfoTest {

    @Mock private RedisCache redisCache;
    @Mock private MailService mailService;
    @Mock private PasswordEncoder passwordEncoder;

    @InjectMocks private UserServiceImpl userService;

    private UserRegisterRequest buildRequest(String email, String pwd, String confirmPwd) {
        UserRegisterRequest req = new UserRegisterRequest();
        req.setEmail(email);
        req.setPassword(pwd);
        req.setConfirmPassword(confirmPwd);
        return req;
    }

    @Test
    @DisplayName("basicInfoStore should throw ValidationException when passwords mismatch")
    public void testPasswordMismatch() {
        UserRegisterRequest req = buildRequest("a@b.com", "123456", "xxxx");
        Assertions.assertThrows(ValidationException.class, () -> userService.basicInfoStore(req));
    }
} 