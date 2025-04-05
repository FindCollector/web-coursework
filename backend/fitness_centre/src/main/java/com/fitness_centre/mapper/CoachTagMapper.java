package com.fitness_centre.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.fitness_centre.domain.CoachTag;
import com.fitness_centre.domain.Location;
import com.fitness_centre.domain.Tag;
import org.apache.ibatis.annotations.*;

import java.util.List;

/**
 * @author
 * @Classname CoachTagMMapper
 * @Description TODO
 * @date 02/04/2025
 */
@Mapper
public interface CoachTagMapper extends BaseMapper<CoachTag> {
    //选出某个教练对应的Tag
    @Select("""
        SELECT t.*
        FROM tag t 
        JOIN coach_tag ct on t.id = ct.tag_id
        WHERE ct.coach_id = #{coachId}
""")
    List<Tag> selectTagsByCoachId(@Param("coachId") Long coachId);

    //选出某个Tag对应的教练


    //选出教练没有选择的Tag
    @Select("""
        SELECT t.*
        FROM tag t 
        LEFT JOIN coach_tag ct 
            ON t.id = ct.tag_id
            AND ct.coach_id = #{coach_id}
        WHERE ct.coach_id IS NULL
""")
    List<Tag> selectTagsNotChosenByCoachId(@Param("coach_id") Long coachId);

    @Delete({
            "<script>",
            "DELETE FROM coach_tag",
            " WHERE coach_id = #{coachId}",
            " <if test='tagIds != null and tagIds.size() > 0'>",
            "   AND tag_id NOT IN ",
            "   <foreach item='tagId' collection='tagIds' open='(' separator=',' close=')'>",
            "     #{tagId}",
            "   </foreach>",
            " </if>",
            "</script>"
    })
    void deleteTagsNotInList(@Param("coachId") Long coachId,
                             @Param("tagIds") List<Long> tagIds);

    @Insert({
            "<script>",
            "INSERT IGNORE INTO coach_tag (coach_id, tag_id)",
            "VALUES",
            "<foreach item='tagId' collection='tagIds' separator=','>",
            "   (#{coachId}, #{tagId})",
            "</foreach>",
            "</script>"
    })
    void insertTagsIfNotExists(@Param("coachId") Long coachId,
                               @Param("tagIds") List<Long> tagIds);
}
