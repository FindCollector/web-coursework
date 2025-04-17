package com.fitness_centre.service.biz.interfaces;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;
import com.fitness_centre.domain.User;
import com.fitness_centre.dto.GeneralResponseResult;
import com.fitness_centre.dto.admin.UserListQueryRequest;
import com.fitness_centre.dto.auth.UserLoginRequest;
import com.fitness_centre.dto.auth.UserRegisterRequest;

import java.io.Serializable;
import java.util.List;

/**
 * @author
 * @Classname UserService
 * @Description TODO
 * @date 09/03/2025
 */
public interface UserService extends IService<User> {
    int cleanupInactiveUsers();

    GeneralResponseResult login(UserLoginRequest loginDTO);

    GeneralResponseResult logout();

    GeneralResponseResult basicInfoStore(UserRegisterRequest requestDTO);

    GeneralResponseResult sendCode(String email);

    GeneralResponseResult verifyRegister(String email,String verifyCode,String role);

    Page<User> pageQueryUser(UserListQueryRequest queryRequest);

    GeneralResponseResult deleteById(Serializable id);

    GeneralResponseResult updateStatus(Serializable id,Integer status);

    GeneralResponseResult userFilter();
}
