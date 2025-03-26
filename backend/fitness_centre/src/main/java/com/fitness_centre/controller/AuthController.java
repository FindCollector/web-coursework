package com.fitness_centre.controller;

import com.fitness_centre.dto.GeneralResponseResult;
import com.fitness_centre.dto.UserLoginRequest;
import com.fitness_centre.dto.UserRegisterRequest;
import com.fitness_centre.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * @author
 * @Classname LoginController
 * @Description DONE
 * @date 08/03/2025
 */
@RestController
public class AuthController {
    @Autowired
    private UserService userService;

    @PostMapping("/auth/login")
    public GeneralResponseResult login(@RequestBody UserLoginRequest loginDTO){
        return userService.login(loginDTO);
    }

    @PostMapping("/auth/logout")
    public GeneralResponseResult logout(){
        return userService.logout();
    }

    @PostMapping("/auth/sendCode")
    public GeneralResponseResult sendCode(@Valid @RequestBody UserRegisterRequest requestDTO){
        return userService.sendCode(requestDTO);
    }

    @PostMapping("/auth/verifyRegister")
    public GeneralResponseResult verifyRegister(@RequestBody Map<String,String> request){
        String email = request.get("email");
        String verifyCode = request.get("verifyCode");
        return userService.verifyRegister(email,verifyCode);
    }
}