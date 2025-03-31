package com.fitness_centre.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;
import com.fitness_centre.domain.User;
import com.fitness_centre.dto.GeneralResponseResult;
import com.fitness_centre.dto.UserLoginRequest;
import com.fitness_centre.dto.UserRegisterRequest;

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

    GeneralResponseResult verifyRegister(String email,String verifyCode);

    Page<User> pageQueryUser(String role, Integer status,String userName,String email,List<String> sortFields, List<String> sortOrders, int pageNow, int pageSize);

    GeneralResponseResult deleteById(Serializable id);

    GeneralResponseResult updateStatus(Serializable id,Integer status);
}
