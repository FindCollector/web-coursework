package com.fitness_centre.service.biz.interfaces;

import com.baomidou.mybatisplus.extension.service.IService;
import com.fitness_centre.domain.Availability;
import com.fitness_centre.dto.GeneralResponseResult;
import com.fitness_centre.dto.coach.AvailabilitySetRequest;

/**
 * @author
 * @Classname AvailabilityService
 * @Description TODO
 * @date 10/04/2025
 */
public interface AvailabilityService extends IService<Availability> {
    GeneralResponseResult deleteAvailability(Long availabilityId);

    GeneralResponseResult getAllAvailability(Long coachId);

    GeneralResponseResult insertAvailability(Long coachId, AvailabilitySetRequest insertRequest);

    GeneralResponseResult updateAvailability(Long coachId, Long availabilityId, AvailabilitySetRequest insertRequest);

}
