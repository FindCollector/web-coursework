package com.fitness_centre.service.biz.interfaces;

import com.baomidou.mybatisplus.extension.service.IService;
import com.fitness_centre.domain.SessionBooking;
import com.fitness_centre.dto.GeneralResponseResult;
import com.fitness_centre.service.biz.impl.SessionBookingServiceImpl;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

/**
 * @author
 * @Classname SessionBookingService
 * @Description TODO
 * @date 12/04/2025
 */
public interface SessionBookingService extends IService<SessionBooking> {
    GeneralResponseResult getAppropriateBookingTime(Long coachId,int courseDurationMinutes);

}
