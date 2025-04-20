package com.fitness_centre.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.fasterxml.jackson.databind.ser.Serializers;
import com.fitness_centre.domain.HistoryTag;
import com.fitness_centre.domain.Tag;
import org.apache.ibatis.annotations.Mapper;
import org.springframework.data.repository.query.Param;

import java.util.List;

/**
 * @author
 * @Classname HistoryTagMapper
 * @Description DONE
 * @date 19/04/2025
 */
@Mapper
public interface HistoryTagMapper extends BaseMapper<HistoryTag> {
}
