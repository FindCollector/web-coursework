package com.fitness_centre.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.fitness_centre.domain.User;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;

/**
 * @author
 * @Classname UserMapper
 * @Description DONE
 * @date 08/03/2025
 */
@Mapper
public interface UserMapper extends BaseMapper<User> {
    /**
     * Delete users that have remained inactive for more than a specified period of time
     */
    @Delete("DELETE FROM sys_user WHERE status = 0 AND register_time < DATE_SUB(NOW(), INTERVAL 48 HOUR)")
    int deleteInactiveUsers();
}
