package com.fitness_centre.controller;

import com.fitness_centre.annotation.RequireRecaptcha;
import com.fitness_centre.dto.GeneralResponseResult;
import com.fitness_centre.dto.auth.UserLoginRequest;
import com.fitness_centre.dto.auth.UserRegisterRequest;
import com.fitness_centre.service.biz.interfaces.UserService;
import jakarta.validation.Valid;
import org.aspectj.weaver.patterns.IToken;
import org.springframework.beans.factory.annotation.Autowired;
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
    @RequireRecaptcha
    public GeneralResponseResult login(@RequestBody UserLoginRequest loginDTO){
        return userService.login(loginDTO);
    }

    @PostMapping("/auth/logout")
    public GeneralResponseResult logout(){
        return userService.logout();
    }

    @PostMapping("/auth/sendCode")
    @RequireRecaptcha
    public GeneralResponseResult sendCode(@Valid @RequestBody UserRegisterRequest requestDTO){
        return userService.basicInfoStore(requestDTO);
    }

    @PostMapping("/auth/resendCode")
    @RequireRecaptcha
    public GeneralResponseResult resendCode(@RequestBody Map<String,String> request){
        String email = request.get("email");
        return userService.sendCode(email);
    }

    @PostMapping("/auth/verifyCode")
    @RequireRecaptcha
    public GeneralResponseResult verifyRegister(@RequestBody Map<String,String> request){
        String email = request.get("email");
        String verifyCode = request.get("code");
        String role = request.get("role");
        return userService.verifyRegister(email,verifyCode,role);
    }

    @PostMapping("/auth/google-login")
    public GeneralResponseResult googleLogin(@RequestBody Map<String,String> request){
        String idToken = request.get("token");
        return userService.googleLogin(idToken);
    }

    @PostMapping("/auth/google-login/complete-profile")
    public GeneralResponseResult completeProfileAndLogin(@RequestBody UserRegisterRequest request){
        return userService.googleAccountBoundBasicInformation(request);
    }

    @PostMapping("/auth/google-login/link")
    public GeneralResponseResult emailLinkGoogleAccount(@RequestBody Map<String,String> request){
        String email = request.get("email");
        return userService.emailLinkGoogleAccount(email);
    }
}