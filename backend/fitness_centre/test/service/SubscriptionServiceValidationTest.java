package service;

import com.fitness_centre.dto.subscription.SubscriptionRequest;
import com.fitness_centre.exception.BusinessException;
import com.fitness_centre.service.biz.impl.SubscriptionServiceImpl;
import com.fitness_centre.domain.Subscription;
import com.fitness_centre.utils.DateUtil;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.lang.reflect.Method;
import java.time.LocalDateTime;

/**
 * Validation tests for SubscriptionServiceImpl
 */
@ExtendWith(MockitoExtension.class)
public class SubscriptionServiceValidationTest {

    private SubscriptionServiceImpl createService(DateUtil dateUtilMock) {
        SubscriptionServiceImpl svc = Mockito.spy(new SubscriptionServiceImpl());
        ReflectionTestUtils.setField(svc, "dateUtil", dateUtilMock);
        return svc;
    }

    @Test
    @DisplayName("checkSubscriptionCooldown should throw when still in cooldown period")
    public void testCooldownViolation() throws Exception {
        DateUtil dateUtil = Mockito.mock(DateUtil.class);
        SubscriptionServiceImpl svc = createService(dateUtil);

        // Build mock latest rejection
        Subscription rejection = new Subscription();
        rejection.setResponseTime(LocalDateTime.now().minusDays(1));

        // Stub getOne to return the rejection record
        Mockito.doReturn(rejection).when(svc).getOne(Mockito.any());
        // Next Monday calculated to be in the future
        Mockito.when(dateUtil.calculateNextMondayStart(Mockito.any())).thenReturn(LocalDateTime.now().plusDays(3));

        // Access private method via reflection
        Method m = SubscriptionServiceImpl.class.getDeclaredMethod("checkSubscriptionCooldown", Long.class, Long.class);
        m.setAccessible(true);

        try {
            m.invoke(svc, 1L, 2L);
            Assertions.fail("Expected BusinessException was not thrown");
        } catch (java.lang.reflect.InvocationTargetException e) {
            Assertions.assertTrue(e.getCause() instanceof BusinessException, 
                "Expected cause to be BusinessException, but was: " + e.getCause().getClass().getName());
            BusinessException be = (BusinessException) e.getCause();
            Assertions.assertEquals("You have been rejected please wait for a cooling off period", be.getMessage());
        }
    }

    @Test
    @DisplayName("checkSubscriptionCooldown should pass when cooldown elapsed")
    public void testCooldownPassed() throws Exception {
        DateUtil dateUtil = Mockito.mock(DateUtil.class);
        SubscriptionServiceImpl svc = createService(dateUtil);

        Subscription rejection = new Subscription();
        rejection.setResponseTime(LocalDateTime.now().minusDays(10));
        Mockito.doReturn(rejection).when(svc).getOne(Mockito.any());
        Mockito.when(dateUtil.calculateNextMondayStart(Mockito.any())).thenReturn(LocalDateTime.now().minusDays(2));

        Method m = SubscriptionServiceImpl.class.getDeclaredMethod("checkSubscriptionCooldown", Long.class, Long.class);
        m.setAccessible(true);

        Assertions.assertDoesNotThrow(() -> m.invoke(svc, 1L, 2L));
    }

    @Test
    @DisplayName("checkExistingPendingOrActiveSubscription should throw for pending request")
    public void testExistingPending() throws Exception {
        DateUtil dateUtil = Mockito.mock(DateUtil.class);
        SubscriptionServiceImpl svc = createService(dateUtil);

        // First count call returns 1 (pending), second returns 0
        Mockito.doReturn(1L, 0L).when(svc).count(Mockito.any());

        Method m = SubscriptionServiceImpl.class.getDeclaredMethod("checkExistingPendingOrActiveSubscription", Long.class, Long.class);
        m.setAccessible(true);

        try {
            m.invoke(svc, 1L, 2L);
            Assertions.fail("Expected BusinessException was not thrown");
        } catch (java.lang.reflect.InvocationTargetException e) {
            Assertions.assertTrue(e.getCause() instanceof BusinessException, 
                "Expected cause to be BusinessException, but was: " + e.getCause().getClass().getName());
            BusinessException be = (BusinessException) e.getCause();
            Assertions.assertEquals("You have already sent a request, please wait for it to be processed", be.getMessage());
        }
    }

    @Test
    @DisplayName("checkExistingPendingOrActiveSubscription should throw for active subscription")
    public void testExistingActive() throws Exception {
        DateUtil dateUtil = Mockito.mock(DateUtil.class);
        SubscriptionServiceImpl svc = createService(dateUtil);

        // First call returns 0 (no pending), second returns 1 (active)
        Mockito.doReturn(0L, 1L).when(svc).count(Mockito.any());

        Method m = SubscriptionServiceImpl.class.getDeclaredMethod("checkExistingPendingOrActiveSubscription", Long.class, Long.class);
        m.setAccessible(true);

        try {
            m.invoke(svc, 1L, 2L);
            Assertions.fail("Expected BusinessException was not thrown");
        } catch (java.lang.reflect.InvocationTargetException e) {
            Assertions.assertTrue(e.getCause() instanceof BusinessException, 
                "Expected cause to be BusinessException, but was: " + e.getCause().getClass().getName());
            BusinessException be = (BusinessException) e.getCause();
            Assertions.assertEquals("You have subscribed to the coach", be.getMessage());
        }
    }

    @Test
    @DisplayName("checkExistingPendingOrActiveSubscription should pass when no conflicts")
    public void testNoExisting() throws Exception {
        DateUtil dateUtil = Mockito.mock(DateUtil.class);
        SubscriptionServiceImpl svc = createService(dateUtil);

        Mockito.doReturn(0L, 0L).when(svc).count(Mockito.any());

        Method m = SubscriptionServiceImpl.class.getDeclaredMethod("checkExistingPendingOrActiveSubscription", Long.class, Long.class);
        m.setAccessible(true);

        Assertions.assertDoesNotThrow(() -> m.invoke(svc, 1L, 2L));
    }
} 