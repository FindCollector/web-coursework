package com.fitness_centre.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.fitness_centre.domain.Subscription;
import com.fitness_centre.dto.subscription.SubscriptionListResponse;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * @author
 * @Classname Subscription
 * @Description DONE
 * @date 06/04/2025
 */
@Mapper
public interface SubscriptionMapper extends BaseMapper<Subscription> {

    IPage<SubscriptionListResponse> findSubscriptionByCoachId(Page<SubscriptionListResponse> page,
                                                              @Param("coachId") Long coachId,
                                                              @Param("statusList") List<String> statusList);

    IPage<SubscriptionListResponse> findSubscriptionByMemberId(Page<SubscriptionListResponse> page,
                                                              @Param("memberId") Long memberId,
                                                              @Param("statusList") List<String> statusList);
}
