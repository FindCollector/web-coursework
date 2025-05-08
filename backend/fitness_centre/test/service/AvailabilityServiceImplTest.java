package service;

import com.fitness_centre.constant.ErrorCode;
import com.fitness_centre.dto.coach.AvailabilitySetRequest;
import com.fitness_centre.exception.BusinessException;
import com.fitness_centre.mapper.AvailabilityMapper;
import com.fitness_centre.service.biz.impl.AvailabilityServiceImpl;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalTime;

/**
 * Unit tests for AvailabilityServiceImpl.isLegalTime validation logic.
 */
@ExtendWith(MockitoExtension.class)
public class AvailabilityServiceImplTest {

    @Mock
    private AvailabilityMapper availabilityMapper;

    @InjectMocks
    private AvailabilityServiceImpl availabilityService;
    
    @BeforeEach
    public void setup() {
        // 手动设置baseMapper字段，解决ServiceImpl中baseMapper为null的问题
        ReflectionTestUtils.setField(availabilityService, "baseMapper", availabilityMapper);
    }

    private AvailabilitySetRequest buildRequest(int day, String start, String end) {
        AvailabilitySetRequest req = new AvailabilitySetRequest();
        req.setDayOfWeek(day);
        req.setStartTime(LocalTime.parse(start));
        req.setEndTime(LocalTime.parse(end));
        return req;
    }

    @Test
    @DisplayName("start time earlier than 08:00 should throw BusinessException")
    public void testStartTimeTooEarly() {
        AvailabilitySetRequest req = buildRequest(1, "07:30", "09:30");
        Assertions.assertThrows(BusinessException.class, () -> availabilityService.isLegalTime(1L, req, null));
    }

    @Test
    @DisplayName("end time later than 22:00 should throw BusinessException")
    public void testEndTimeTooLate() {
        AvailabilitySetRequest req = buildRequest(1, "21:30", "22:30");
        Assertions.assertThrows(BusinessException.class, () -> availabilityService.isLegalTime(1L, req, null));
    }

    @Test
    @DisplayName("end time before start time should throw BusinessException")
    public void testEndBeforeStart() {
        AvailabilitySetRequest req = buildRequest(1, "15:00", "14:00");
        Assertions.assertThrows(BusinessException.class, () -> availabilityService.isLegalTime(1L, req, null));
    }

    @Test
    @DisplayName("duration shorter than 1 hour should throw BusinessException")
    public void testDurationTooShort() {
        AvailabilitySetRequest req = buildRequest(1, "15:00", "15:30");
        Assertions.assertThrows(BusinessException.class, () -> availabilityService.isLegalTime(1L, req, null));
    }

    @Test
    @DisplayName("overlapping time should return true")
    public void testOverlapping() {
        AvailabilitySetRequest req = buildRequest(1, "10:00", "11:30");
        Mockito.when(availabilityMapper.selectCount(Mockito.any())).thenReturn(1L);
        boolean result = availabilityService.isLegalTime(1L, req, null);
        Assertions.assertTrue(result);
    }

    @Test
    @DisplayName("non-overlapping time should return false")
    public void testNonOverlapping() {
        AvailabilitySetRequest req = buildRequest(1, "12:00", "13:30");
        Mockito.when(availabilityMapper.selectCount(Mockito.any())).thenReturn(0L);
        boolean result = availabilityService.isLegalTime(1L, req, null);
        Assertions.assertFalse(result);
    }
} 