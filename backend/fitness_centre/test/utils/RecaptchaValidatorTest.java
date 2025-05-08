package utils;

import com.fitness_centre.utils.RecaptchaValidator;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

/**
 * Unit tests for RecaptchaValidator.verify
 */
@ExtendWith(MockitoExtension.class)
public class RecaptchaValidatorTest {

    @Mock
    private RestTemplate restTemplate;

    private RecaptchaValidator createValidator() {
        RecaptchaValidator validator = new RecaptchaValidator();
        // Inject mock RestTemplate and dummy keys via reflection
        ReflectionTestUtils.setField(validator, "restTemplate", restTemplate);
        ReflectionTestUtils.setField(validator, "secretKey", "dummySiteKey");
        ReflectionTestUtils.setField(validator, "API_KEY", "dummyApiKey");
        return validator;
    }

    private Map<String, Object> buildResponse(boolean valid, double score, String action) {
        Map<String, Object> tokenProps = new HashMap<>();
        tokenProps.put("valid", valid);
        tokenProps.put("action", action);

        Map<String, Object> riskAnalysis = new HashMap<>();
        riskAnalysis.put("score", score);

        Map<String, Object> body = new HashMap<>();
        body.put("tokenProperties", tokenProps);
        body.put("riskAnalysis", riskAnalysis);
        return body;
    }

    @Test
    @DisplayName("empty token should return false")
    public void testEmptyToken() {
        RecaptchaValidator validator = createValidator();
        boolean result = validator.verify("", 0.5, "login");
        Assertions.assertFalse(result);
    }

    @Test
    @DisplayName("successful verification should return true")
    public void testSuccess() {
        RecaptchaValidator validator = createValidator();
        Mockito.when(restTemplate.postForObject(Mockito.anyString(), Mockito.any(), Mockito.eq(Map.class)))
                .thenReturn(buildResponse(true, 0.9, "login"));

        boolean result = validator.verify("token", 0.5, "login");
        Assertions.assertTrue(result);
    }

    @Test
    @DisplayName("score below threshold should return false")
    public void testLowScore() {
        RecaptchaValidator validator = createValidator();
        Mockito.when(restTemplate.postForObject(Mockito.anyString(), Mockito.any(), Mockito.eq(Map.class)))
                .thenReturn(buildResponse(true, 0.3, "login"));

        boolean result = validator.verify("token", 0.5, "login");
        Assertions.assertFalse(result);
    }

    @Test
    @DisplayName("invalid flag false should return false")
    public void testInvalidFlag() {
        RecaptchaValidator validator = createValidator();
        Mockito.when(restTemplate.postForObject(Mockito.anyString(), Mockito.any(), Mockito.eq(Map.class)))
                .thenReturn(buildResponse(false, 0.9, "login"));

        boolean result = validator.verify("token", 0.5, "login");
        Assertions.assertFalse(result);
    }

    @Test
    @DisplayName("action mismatch should return false")
    public void testActionMismatch() {
        RecaptchaValidator validator = createValidator();
        Mockito.when(restTemplate.postForObject(Mockito.anyString(), Mockito.any(), Mockito.eq(Map.class)))
                .thenReturn(buildResponse(true, 0.9, "signup"));

        boolean result = validator.verify("token", 0.5, "login");
        Assertions.assertFalse(result);
    }

    @Test
    @DisplayName("RestTemplate error should return false")
    public void testRestTemplateException() {
        RecaptchaValidator validator = createValidator();
        Mockito.when(restTemplate.postForObject(Mockito.anyString(), Mockito.any(), Mockito.eq(Map.class)))
                .thenThrow(new RuntimeException("network error"));

        boolean result = validator.verify("token", 0.5, "login");
        Assertions.assertFalse(result);
    }
} 