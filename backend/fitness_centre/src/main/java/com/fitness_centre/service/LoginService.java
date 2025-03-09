package com.fitness_centre.service;

import com.fitness_centre.dto.GeneralResponseResult;
import com.fitness_centre.dto.GeneralResponseResult;
import com.fitness_centre.dto.UserLoginRequest;

/**
 * @author
 * @Classname LoginService
 * @Description TODO
 * @date 08/03/2025
 */
public interface LoginService {
    GeneralResponseResult login(UserLoginRequest loginDTO);

    GeneralResponseResult logout();
}
