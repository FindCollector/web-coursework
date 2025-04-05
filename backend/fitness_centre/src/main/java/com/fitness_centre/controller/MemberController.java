package com.fitness_centre.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.fitness_centre.dto.GeneralResponseResult;
import com.fitness_centre.dto.member.CoachDetailsResponse;
import com.fitness_centre.dto.member.CoachQueryRequest;
import com.fitness_centre.security.LoginUser;
import com.fitness_centre.service.biz.interfaces.CoachService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * @author
 * @Classname MemberController
 * @Description TODO
 * @date 04/04/2025
 */
@RestController
@RequestMapping("/member")
public class MemberController {
    @Autowired
    private CoachService coachService;

    @GetMapping("/coachList")
    IPage<CoachDetailsResponse> coachList(@ModelAttribute CoachQueryRequest request, Authentication authentication){
//        LoginUser loginUser = (LoginUser) authentication.getPrincipal();
//        Long userId = loginUser.getId();
        Long ID= 112l;
        return coachService.coachList(ID,request);
    }
}