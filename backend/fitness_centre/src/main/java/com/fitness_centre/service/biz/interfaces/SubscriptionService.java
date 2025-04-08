package com.fitness_centre.service.biz.interfaces;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;
import com.fitness_centre.constant.RequestStatus;
import com.fitness_centre.constant.UserRole;
import com.fitness_centre.domain.Subscription;
import com.fitness_centre.dto.GeneralResponseResult;
import com.fitness_centre.dto.coach.SubscriptionListResponse;
import com.fitness_centre.dto.member.SubscriptionRequest;

import java.util.List;

/**
 * @author
 * @Classname Subscription
 * @Description TODO
 * @date 06/04/2025
 */
public interface SubscriptionService extends IService<Subscription> {
    GeneralResponseResult sendRequest(Long memberId,SubscriptionRequest request);

    IPage<SubscriptionListResponse> coachSubscriptionList(Long coachId, int pageNow, int pageSize, List<String> statusList);
    IPage<SubscriptionListResponse> memberSubscriptionList(Long memberId, int pageNow, int pageSize, List<String> statusList);

    GeneralResponseResult readRequest(Long requestId, Long userId, UserRole role);

    GeneralResponseResult countUnreadRequest(Long coachId,UserRole role);

    GeneralResponseResult CoachHandleRequest(Long requestId, Long coachId, RequestStatus status,String reply);
}
