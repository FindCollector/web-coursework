package com.fitness_centre.controller;

import com.fitness_centre.annotation.RequireRecaptcha;
import com.fitness_centre.dto.coach.CoachInfoUpdateRequest;
import com.fitness_centre.dto.GeneralResponseResult;
import com.fitness_centre.security.LoginUser;
import com.fitness_centre.service.biz.interfaces.CoachService;
import com.fitness_centre.service.infrastructure.FileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * @author
 * @Classname CoachController
 * @Description TODO
 * @date 31/03/2025
 */
@RestController
@RequestMapping("/coach")
public class CoachController {
    @Autowired
    private CoachService coachService;

    @Autowired
    FileService fileService;

    //上传文件
    @PreAuthorize("hasRole(T(com.fitness_centre.constant.UserRole).COACH.getRole())")
    @PostMapping("/photo")
    public GeneralResponseResult uploadFile(MultipartFile file,Authentication authentication){
        LoginUser loginUser = (LoginUser)  authentication.getPrincipal();
        Long userId = loginUser.getId();
        return coachService.coachPhoto(file,userId);
    }

    @PreAuthorize("hasRole(T(com.fitness_centre.constant.UserRole).COACH.getRole())")
    @PostMapping("/details")
    public GeneralResponseResult updateDetails(@RequestBody CoachInfoUpdateRequest request, Authentication authentication){
        //Spring MVC 会自动把当前登录用户的 Authentication 注入进来
        LoginUser loginUser = (LoginUser) authentication.getPrincipal();
        Long userId = loginUser.getId();
        return coachService.updateInfo(request,userId);
    }

    @PreAuthorize("hasRole(T(com.fitness_centre.constant.UserRole).COACH.getRole())")
    @GetMapping("/details")
    public GeneralResponseResult coachDetails(Authentication authentication){
        LoginUser loginUser = (LoginUser) authentication.getPrincipal();
        Long userId = loginUser.getId();
        return coachService.coachInfo(userId);
    }

    @PreAuthorize("hasRole(T(com.fitness_centre.constant.UserRole).COACH.getRole())")
    @GetMapping("/details/check")
    public GeneralResponseResult coachDetailsCheck(Authentication authentication){
        LoginUser loginUser = (LoginUser) authentication.getPrincipal();
        Long userId = loginUser.getId();
        return coachService.coachInfoCheck(userId);
    }
}