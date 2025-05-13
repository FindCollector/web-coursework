package com.fitness_centre.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.fitness_centre.domain.Location;
import com.fitness_centre.dto.member.LocationLite;
import lombok.Data;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * @author
 * @Classname LocationMapper
 * @Description TODO
 * @date 03/04/2025
 */
@Mapper
public interface LocationMapper extends BaseMapper<Location> {
    @Select(
            """
    SELECT l.*
    FROM location l 
    JOIN coach_location cl ON l.id = cl.location_id
    WHERE cl.coach_id = #{coachId}
"""
    )
    List<Location> selectByCoachId(@Param("coachId") Long coachId);
}


