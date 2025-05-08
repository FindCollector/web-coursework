package com.fitness_centre.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.fitness_centre.domain.CoachInfo;
import com.fitness_centre.domain.CoachLocation;
import com.fitness_centre.domain.Location;
import org.apache.ibatis.annotations.*;

import java.util.List;

/**
 * @author
 * @Classname CoachLocationMapper
 * @Description TODO
 * @date 03/04/2025
 */
@Mapper
public interface CoachLocationMapper extends BaseMapper<CoachLocation> {
    //根据location查出来教练
    @Select("""
        SELECT c.*
        FROM coach c
        JOIN coach_location cl ON c.id = cl.coach_id
        WHERE cl.location_id = #{locationId}
""")
    List<CoachInfo> selectCoachByLocationId(@Param("location") Long locationId);

    //根据教练查location
    @Select("""
        SELECT l.*
        FROM location l 
        JOIN coach_location cl on l.id = cl.location_id
        WHERE cl.coach_id = #{coachId}
""")
    List<Location> selectLocationsByCoachId(@Param("coachId") Long coachId);

    //查教练没选的location
    @Select("""
        SELECT l.*
        FROM location l
        LEFT JOIN coach_location cl 
            ON  l.id = cl.location_id
            AND cl.coach_id = #{coachId}
        WHERE cl.coach_id IS NULL
""")
    List<Location> selectLocationsNotChosenByCoach(@Param("coachId") Long coachId);

    @Delete({
            "<script>",
            "DELETE FROM coach_location",
            " WHERE coach_id = #{coachId}",
            " <if test='locationIds != null and locationIds.size() > 0'>",
            "   AND location_id NOT IN ",
            "   <foreach item='locId' collection='locationIds' open='(' separator=',' close=')'>",
            "     #{locId}",
            "   </foreach>",
            " </if>",
            "</script>"
    })
    void deleteLocationsNotInList(@Param("coachId") Long coachId,
                                  @Param("locationIds") List<Long> locationIds);

    @Insert({
            "<script>",
            "<if test='locationIds != null and locationIds.size() > 0'>",
            "  INSERT IGNORE INTO coach_location (coach_id, location_id)",
            "  VALUES",
            "  <foreach item='locId' collection='locationIds' separator=','>",
            "     (#{coachId}, #{locId})",
            "  </foreach>",
            "</if>",
            "</script>"
    })
    void insertLocationsIfNotExists(@Param("coachId") Long coachId,
                                    @Param("locationIds") List<Long> locationIds);
}
