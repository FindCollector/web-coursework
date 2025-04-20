package com.fitness_centre.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.fitness_centre.domain.Tag;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;
import org.springframework.data.repository.query.Param;

import java.util.List;

/**
 * @author
 * @Classname TagMapper
 * @Description TODO
 * @date 01/04/2025
 */
@Mapper
public interface TagMapper extends BaseMapper<Tag> {
    @Select("SELECT  t.id, t.tag_name " +
            "FROM tag t " +
            "INNER JOIN history_tag ht ON t.id = ht.tag_id " +
            "WHERE ht.history_id = #{hisrotyId}")
    List<Tag> findTagsByHistoryId(@Param("historyId") Long historyId);
}
