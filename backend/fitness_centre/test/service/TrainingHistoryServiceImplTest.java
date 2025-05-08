package service;

import com.fitness_centre.constant.ErrorCode;
import com.fitness_centre.domain.SessionBooking;
import com.fitness_centre.domain.TrainingHistory;
import com.fitness_centre.dto.GeneralResponseResult;
import com.fitness_centre.exception.SystemException;
import com.fitness_centre.mapper.*;
import com.fitness_centre.service.biz.impl.TrainingHistoryServiceImpl;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Tests for TrainingHistoryServiceImpl
 */
@ExtendWith(MockitoExtension.class)
public class TrainingHistoryServiceImplTest {

    @Mock private TrainingHistoryMapper trainingHistoryMapper;
    @Mock private SessionBookingMapper sessionBookingMapper;
    @Mock private HistoryTagMapper historyTagMapper;
    @Mock private UserMapper userMapper;
    @Mock private TagMapper tagMapper;

    @InjectMocks private TrainingHistoryServiceImpl service;

    private SessionBooking buildSession() {
        SessionBooking sb = new SessionBooking();
        sb.setId(100L);
        sb.setMemberId(1L);
        sb.setCoachId(2L);
        sb.setStartTime(LocalDateTime.now());
        sb.setEndTime(LocalDateTime.now().plusHours(1));
        sb.setMessage("msg");
        return sb;
    }

    @Test
    @DisplayName("addTrainingHistory should succeed and link tags")
    public void testAddSuccess() {
        SessionBooking sb = buildSession();
        Mockito.when(sessionBookingMapper.selectOne(Mockito.any())).thenReturn(sb);
        Mockito.when(trainingHistoryMapper.insert(Mockito.any(TrainingHistory.class))).thenAnswer(inv -> {
            TrainingHistory th = inv.getArgument(0);
            th.setId(500L); // mimic pk fill
            return 1;
        });
        Mockito.when(sessionBookingMapper.update(Mockito.any())).thenReturn(1);
        Mockito.when(historyTagMapper.insert(Mockito.any(com.fitness_centre.domain.HistoryTag.class))).thenReturn(1);

        GeneralResponseResult res = service.addTrainingHistory(2L, 100L, "good", List.of(10L,11L));
        Assertions.assertEquals(ErrorCode.SUCCESS.getCode(), res.getCode());

        // verify inserts for tags
        Mockito.verify(historyTagMapper, Mockito.times(2)).insert(Mockito.any(com.fitness_centre.domain.HistoryTag.class));
    }

    @Test
    @DisplayName("addTrainingHistory should throw when insert fails")
    public void testAddFailInsert() {
        SessionBooking sb = buildSession();
        Mockito.when(sessionBookingMapper.selectOne(Mockito.any())).thenReturn(sb);
        Mockito.when(trainingHistoryMapper.insert(Mockito.any(com.fitness_centre.domain.TrainingHistory.class))).thenReturn(0);

        Assertions.assertThrows(SystemException.class, () -> service.addTrainingHistory(2L, 100L, "bad", List.of()));
    }

    @Test
    @DisplayName("countUnReadTrainingHistory should return count map")
    public void testCountUnread() {
        Mockito.when(trainingHistoryMapper.selectCount(Mockito.any())).thenReturn(5L);
        GeneralResponseResult res = service.countUnReadTrainingHistory(1L);
        Assertions.assertEquals(ErrorCode.SUCCESS.getCode(), res.getCode());
        Assertions.assertEquals(5L, ((java.util.Map<?,?>)res.getData()).get("count"));
    }

    @Test
    @DisplayName("readTrainingHistory should throw when db update fails")
    public void testReadFail() {
        Mockito.when(trainingHistoryMapper.update(Mockito.any())).thenReturn(0);
        Assertions.assertThrows(SystemException.class, () -> service.readTrainingHistory(1L, 2L));
    }
} 