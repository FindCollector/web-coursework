package com.fitness_centre.service;

import com.fitness_centre.domain.ResponseResult;
import com.fitness_centre.domain.User;

/**
 * @author
 * @Classname LoginService
 * @Description TODO
 * @date 08/03/2025
 */
public interface LoginService {
    ResponseResult login(User user);
}
