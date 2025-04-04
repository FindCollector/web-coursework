package com.fitness_centre.service.biz.interfaces;

import com.baomidou.mybatisplus.extension.service.IService;
import com.fitness_centre.domain.CoachInfo;
import com.fitness_centre.dto.CoachInfoUpdateRequest;
import com.fitness_centre.dto.GeneralResponseResult;

import java.util.List;

/**
 * @author
 * @Classname CoachInfoService
 * @Description DONE
 * @date 01/04/2025
 */
public interface CoachInfoService extends IService<CoachInfo> {
    GeneralResponseResult updateInfo(CoachInfoUpdateRequest request, Long coachId);

    GeneralResponseResult coachInfo(Long coachId);

    GeneralResponseResult coachInfoCheck(Long coachId);

}
