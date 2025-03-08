package com.fitness_centre.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.fitness_centre.domain.User;
import org.apache.ibatis.annotations.Mapper;

/**
 * @author
 * @Classname UserMapper
 * @Description DONE
 * @date 08/03/2025
 */
@Mapper
public interface UserMapper extends BaseMapper<User> {
}
