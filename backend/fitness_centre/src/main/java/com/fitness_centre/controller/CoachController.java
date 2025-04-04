package com.fitness_centre.controller;

import com.fitness_centre.constant.ErrorCode;
import com.fitness_centre.dto.CoachInfoUpdateRequest;
import com.fitness_centre.dto.GeneralResponseResult;
import com.fitness_centre.security.LoginUser;
import com.fitness_centre.service.biz.interfaces.CoachInfoService;
import com.fitness_centre.service.infrastructure.FileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

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
    private CoachInfoService coachInfoService;

    @Autowired
    FileService fileService;

    //上传文件
    @PostMapping("/uploadFile")
    public GeneralResponseResult uploadFile(MultipartFile file){
        String tempUrl = fileService.uploadFileToTemp(file);
        Map<String,String> map = new HashMap<>();
        map.put("tempUrl",tempUrl);
        GeneralResponseResult responseResult = new GeneralResponseResult<>(ErrorCode.SUCCESS,map);
        return responseResult;
    }
    @PostMapping("/details")
    public GeneralResponseResult updateDetails(@RequestBody CoachInfoUpdateRequest request, Authentication authentication){
        //Spring MVC 会自动把当前登录用户的 Authentication 注入进来
        LoginUser loginUser = (LoginUser) authentication.getPrincipal();
        Long userId = loginUser.getId();
        return coachInfoService.updateInfo(request,userId);
    }

    @GetMapping("/details")
    public GeneralResponseResult coachDetails(Authentication authentication){
        LoginUser loginUser = (LoginUser) authentication.getPrincipal();
        Long userId = loginUser.getId();
        return coachInfoService.coachInfo(userId);
    }

    @GetMapping("/details/check")
    public GeneralResponseResult coachDetailsCheck(Authentication authentication){
        LoginUser loginUser = (LoginUser) authentication.getPrincipal();
        Long userId = loginUser.getId();
        return coachInfoService.coachInfoCheck(userId);
    }
}