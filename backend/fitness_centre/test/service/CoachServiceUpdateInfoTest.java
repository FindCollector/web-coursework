package service;

import com.fitness_centre.domain.CoachInfo;
import com.fitness_centre.domain.User;
import com.fitness_centre.dto.coach.CoachInfoUpdateRequest;
import com.fitness_centre.exception.BusinessException;
import com.fitness_centre.mapper.*;
import com.fitness_centre.service.biz.impl.CoachServiceImpl;
import com.fitness_centre.service.infrastructure.FileService;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

/**
 * Tests for CoachServiceImpl.updateInfo basic validation and mapper calls.
 */
@ExtendWith(MockitoExtension.class)
public class CoachServiceUpdateInfoTest {

    @Mock private CoachMapper coachMapper;
    @Mock private UserMapper userMapper;
    @Mock private CoachTagMapper coachTagMapper;
    @Mock private CoachLocationMapper coachLocationMapper;
    @Mock private FileService fileService;

    @InjectMocks private CoachServiceImpl coachService;

    private CoachInfoUpdateRequest buildRequest() {
        CoachInfoUpdateRequest req = new CoachInfoUpdateRequest();
        req.setUserName("John");
        req.setIntro("hi");
        req.setCoachTagIds(List.of(1L,2L));
        req.setCoachLocationIds(List.of(3L));
        return req;
    }

    @Test
    @DisplayName("updateInfo should throw when user not found")
    public void testUserNotFound() {
        Long coachId = 10L;
        Mockito.when(userMapper.selectById(coachId)).thenReturn(null);
        CoachInfoUpdateRequest req = buildRequest();
        Assertions.assertThrows(BusinessException.class, () -> coachService.updateInfo(req, coachId));
    }

    @Test
    @DisplayName("updateInfo should throw when coach info not found")
    public void testCoachInfoNotFound() {
        Long coachId = 11L;
        Mockito.when(userMapper.selectById(coachId)).thenReturn(new User());
        Mockito.when(coachMapper.selectById(coachId)).thenReturn(null);
        CoachInfoUpdateRequest req = buildRequest();
        Assertions.assertThrows(BusinessException.class, () -> coachService.updateInfo(req, coachId));
    }

    @Test
    @DisplayName("updateInfo should update user, coach, tags, locations")
    public void testSuccess() {
        Long coachId = 12L;
        Mockito.when(userMapper.selectById(coachId)).thenReturn(new User());
        Mockito.when(coachMapper.selectById(coachId)).thenReturn(new CoachInfo());

        CoachInfoUpdateRequest req = buildRequest();
        coachService.updateInfo(req, coachId);

        // verify updates
        Mockito.verify(userMapper).updateById(Mockito.any(User.class));
        Mockito.verify(coachMapper).updateById(Mockito.any(CoachInfo.class));
        Mockito.verify(coachTagMapper).deleteTagsNotInList(coachId, req.getCoachTagIds());
        Mockito.verify(coachTagMapper).insertTagsIfNotExists(coachId, req.getCoachTagIds());
        Mockito.verify(coachLocationMapper).deleteLocationsNotInList(coachId, req.getCoachLocationIds());
        Mockito.verify(coachLocationMapper).insertLocationsIfNotExists(coachId, req.getCoachLocationIds());
    }
} 