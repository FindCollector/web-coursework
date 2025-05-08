package service;

import com.fitness_centre.constant.ErrorCode;
import com.fitness_centre.dto.GeneralResponseResult;
import com.fitness_centre.domain.CoachInfo;
import com.fitness_centre.domain.CoachLocation;
import com.fitness_centre.domain.CoachTag;
import com.fitness_centre.mapper.*;
import com.fitness_centre.service.biz.impl.CoachServiceImpl;
import com.fitness_centre.service.infrastructure.FileService;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Map;

/**
 * Tests for CoachServiceImpl.coachInfoCheck logic
 */
@ExtendWith(MockitoExtension.class)
public class CoachServiceInfoCheckTest {

    @Mock private CoachMapper coachMapper;
    @Mock private CoachTagMapper coachTagMapper;
    @Mock private CoachLocationMapper coachLocationMapper;
    @Mock private UserMapper userMapper; // not used but required by service
    @Mock private FileService fileService;

    @InjectMocks private CoachServiceImpl coachService;
    
    @BeforeEach
    public void setup() {
        ReflectionTestUtils.setField(coachService, "baseMapper", coachMapper);
    }

    @Test
    @DisplayName("coachInfoCheck should mark profile complete when intro, tags, locations exist")
    public void testCompleteProfile() {
        Long coachId = 1L;
        CoachInfo info = new CoachInfo(coachId, "/img.jpg", "Hello", 4.5);
        Mockito.when(coachMapper.selectOne(Mockito.any())).thenReturn(info);
        Mockito.when(coachTagMapper.exists(Mockito.any())).thenReturn(true);
        Mockito.when(coachLocationMapper.exists(Mockito.any())).thenReturn(true);

        GeneralResponseResult res = coachService.coachInfoCheck(coachId);
        System.out.println("Actual Code: " + res.getCode());
        System.out.println("SUCCESS Code: " + ErrorCode.SUCCESS.getCode());
        
        Assertions.assertEquals(ErrorCode.SUCCESS.getCode(), res.getCode());
        Map<?,?> data = (Map<?,?>) res.getData();
        Assertions.assertTrue((Boolean) data.get("isComplete"));
        Assertions.assertTrue(((List<?>) data.get("missingFields")).isEmpty());
    }

    @Test
    @DisplayName("coachInfoCheck should list missing fields when intro and tags/locations absent")
    public void testIncompleteProfile() {
        Long coachId = 2L;
        // coachInfo not found (null) triggers insert path
        Mockito.when(coachMapper.selectOne(Mockito.any())).thenReturn(null);
        Mockito.when(coachTagMapper.exists(Mockito.any())).thenReturn(false);
        Mockito.when(coachLocationMapper.exists(Mockito.any())).thenReturn(false);
        Mockito.when(coachMapper.insert(Mockito.any(com.fitness_centre.domain.CoachInfo.class))).thenReturn(1);

        GeneralResponseResult res = coachService.coachInfoCheck(coachId);
        Map<?,?> data = (Map<?,?>) res.getData();
        Assertions.assertFalse((Boolean) data.get("isComplete"));
        List<?> missing = (List<?>) data.get("missingFields");
        Assertions.assertTrue(missing.contains("Tags"));
        Assertions.assertTrue(missing.contains("Introduction"));
        Assertions.assertTrue(missing.contains("Locations"));
    }
} 