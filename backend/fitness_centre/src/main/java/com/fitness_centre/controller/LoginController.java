package com.fitness_centre.controller;

import com.fitness_centre.dto.GeneralResponseResult;
import com.fitness_centre.dto.UserLoginRequest;
import com.fitness_centre.service.LoginService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/**
 * @author
 * @Classname LoginController
 * @Description TODO logout
 * @date 08/03/2025
 */
@RestController
public class LoginController {
    @Autowired
    private LoginService loginService;

    @PostMapping("/auth/login")
    // TODO 修改响应的格式
    public GeneralResponseResult login(@RequestBody UserLoginRequest loginDTO){
        return loginService.login(loginDTO);
    }

    @PostMapping("/auth/logout")
    public GeneralResponseResult logout(){
        return loginService.logout();
    }
}