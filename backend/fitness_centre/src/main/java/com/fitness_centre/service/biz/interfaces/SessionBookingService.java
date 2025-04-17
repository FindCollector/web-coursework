package com.fitness_centre.service.biz.interfaces;

import com.baomidou.mybatisplus.extension.service.IService;
import com.fitness_centre.constant.RequestStatus;
import com.fitness_centre.constant.UserRole;
import com.fitness_centre.domain.SessionBooking;
import com.fitness_centre.dto.GeneralResponseResult;
import com.fitness_centre.dto.member.BookingRequest;
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

    GeneralResponseResult bookingSession(Long memberId, BookingRequest request);

    GeneralResponseResult withdrawRequest(Long memberId,Long requestId);

    GeneralResponseResult cancelBooking(Long memberId,Long bookingId);

    GeneralResponseResult getBookingSchedule(Long memberId,UserRole role);

    GeneralResponseResult getBookingRequest(Long memberId, int pageNow, int pageSize, List<RequestStatus> statusList,UserRole role);

    GeneralResponseResult countUnreadRequest(Long userId, UserRole role);

    GeneralResponseResult readRequest(Long requestId,Long userId,UserRole role);

    GeneralResponseResult coachHandleRequest(Long requestId,Long coachId,RequestStatus status,String reply);
    
}
