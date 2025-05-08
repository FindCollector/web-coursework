package com.fitness_centre.service.biz.interfaces;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;
import com.fitness_centre.domain.CoachInfo;
import com.fitness_centre.dto.coach.CoachInfoUpdateRequest;
import com.fitness_centre.dto.GeneralResponseResult;
import com.fitness_centre.dto.member.CoachDetailsResponse;
import com.fitness_centre.dto.member.CoachQueryRequest;
import org.springframework.web.multipart.MultipartFile;

/**
 * @author
 * @Classname CoachInfoService
 * @Description DONE
 * @date 01/04/2025
 */
public interface CoachService extends IService<CoachInfo> {
    GeneralResponseResult updateInfo(CoachInfoUpdateRequest request, Long coachId);

    GeneralResponseResult coachInfo(Long coachId);

    GeneralResponseResult coachPhoto(MultipartFile file,Long coachId);

    GeneralResponseResult coachInfoCheck(Long coachId);

    IPage<CoachDetailsResponse> coachList(Long id, CoachQueryRequest request);

}
