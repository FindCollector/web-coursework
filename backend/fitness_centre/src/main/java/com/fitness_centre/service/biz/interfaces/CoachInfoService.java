package com.fitness_centre.service.biz.interfaces;

import com.baomidou.mybatisplus.extension.service.IService;
import com.fitness_centre.domain.CoachInfo;
import com.fitness_centre.dto.GeneralResponseResult;

import java.util.List;

/**
 * @author
 * @Classname CoachInfoService
 * @Description DONE
 * @date 01/04/2025
 */
public interface CoachInfoService extends IService<CoachInfo> {
    GeneralResponseResult createIno(String info);
    GeneralResponseResult updateInfo(String intro, List<Integer> tagId);

    GeneralResponseResult coachInfo(Long coachId);

    GeneralResponseResult coachInfoCheck(Long coachId);

}
