package com.fitness_centre.mapper;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.fitness_centre.dto.member.CoachDetailsResponse;
import com.fitness_centre.dto.member.CoachQueryRequest;
import org.apache.ibatis.annotations.Mapper;
import org.springframework.data.repository.query.Param;

/**
 * @author
 * @Classname CoachQueryMapper
 * @Description TODO
 * @date 05/04/2025
 */
@Mapper
public interface CoachQueryMapper {
    /**
     * 多表查询教练信息（分页）
     *
     * @param page   MyBatis-Plus 分页对象
     * @param memberId 当前登录的会员ID，用于查 member_coach 表是否存在 pending
     * @param request 查询条件（userName / tagIds / locationIds 等）
     * @return 分页后的教练信息
     */
    IPage<CoachDetailsResponse> selectCoachPage(
            Page<?> page,
            @Param("memberId") Long memberId,
            @Param("request") CoachQueryRequest request
    );
}
