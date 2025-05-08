package service;

import com.fitness_centre.constant.ErrorCode;
import com.fitness_centre.dto.GeneralResponseResult;
import com.fitness_centre.dto.member.BookingRequest;
import com.fitness_centre.exception.BusinessException;
import com.fitness_centre.mapper.*;
import com.fitness_centre.service.biz.impl.SessionBookingServiceImpl;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalTime;

/**
 * Tests for SessionBookingServiceImpl.bookingSession validation logic
 */
@ExtendWith(MockitoExtension.class)
public class SessionBookingServiceBookingTest {

    @Mock private SubscriptionMapper subscriptionMapper;
    @Mock private SessionBookingMapper sessionBookingMapper;
    @Mock private AvailabilityMapper availabilityMapper;
    @Mock private UserMapper userMapper;
    @Mock private TrainingHistoryMapper historyMapper;

    @InjectMocks private SessionBookingServiceImpl service;

    private BookingRequest buildRequest(long coachId) {
        BookingRequest req = new BookingRequest();
        req.setCoachId(coachId);
        req.setDayOfWeek(1); // Monday
        req.setStartTime(LocalTime.of(10,0));
        req.setEndTime(LocalTime.of(11,0));
        req.setMessage("hi");
        return req;
    }

    @Test
    @DisplayName("bookingSession should throw when member not subscribed")
    public void testNotSubscribed() {
        BookingRequest req = buildRequest(2L);
        Mockito.when(subscriptionMapper.selectCount(Mockito.any())).thenReturn(0L);
        Assertions.assertThrows(BusinessException.class, () -> service.bookingSession(1L, req));
    }

    @Test
    @DisplayName("bookingSession should throw when overlapping accepted booking exists")
    public void testOverlapAccepted() {
        BookingRequest req = buildRequest(2L);
        Mockito.when(subscriptionMapper.selectCount(Mockito.any())).thenReturn(1L);
        Mockito.when(sessionBookingMapper.selectCount(Mockito.any())).thenReturn(1L, 0L); // first accepted overlap, second pending = 0
        Assertions.assertThrows(BusinessException.class, () -> service.bookingSession(1L, req));
    }

    @Test
    @DisplayName("bookingSession should succeed when subscribed and no overlaps")
    public void testSuccess() {
        BookingRequest req = buildRequest(2L);
        Mockito.when(subscriptionMapper.selectCount(Mockito.any())).thenReturn(1L);
        Mockito.when(sessionBookingMapper.selectCount(Mockito.any())).thenReturn(0L, 0L);
        Mockito.when(sessionBookingMapper.insert(Mockito.any(com.fitness_centre.domain.SessionBooking.class))).thenReturn(1);

        GeneralResponseResult res = service.bookingSession(1L, req);
        Assertions.assertEquals(ErrorCode.SUCCESS.getCode(), res.getCode());
    }
} 