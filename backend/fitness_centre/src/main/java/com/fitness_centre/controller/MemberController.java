package com.fitness_centre.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.fitness_centre.constant.ErrorCode;
import com.fitness_centre.constant.UserRole;
import com.fitness_centre.dto.GeneralResponseResult;
import com.fitness_centre.dto.coach.SubscriptionListResponse;
import com.fitness_centre.dto.member.CoachDetailsResponse;
import com.fitness_centre.dto.member.CoachQueryRequest;
import com.fitness_centre.dto.member.SubscriptionRequest;
import com.fitness_centre.security.LoginUser;
import com.fitness_centre.service.biz.interfaces.*;
import org.apache.ibatis.annotations.Delete;
import org.ietf.jgss.GSSName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

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

    @Autowired
    private TagService tagService;

    @Autowired
    private LocationService locationService;

    @Autowired
    private SubscriptionService subscriptionService;

    @Autowired
    private SessionBookingService sessionBookingService;

    @PreAuthorize("hasRole(T(com.fitness_centre.constant.UserRole).MEMBER.getRole())")
    @GetMapping("/coachList")
    IPage<CoachDetailsResponse> coachList(@ModelAttribute CoachQueryRequest request, Authentication authentication){
        LoginUser loginUser = (LoginUser) authentication.getPrincipal();
        Long userId = loginUser.getId();
        return coachService.coachList(userId,request);
    }

    @PreAuthorize("hasRole(T(com.fitness_centre.constant.UserRole).MEMBER.getRole())")
    @GetMapping("/coach/filter")
    GeneralResponseResult coachFiler(){
        Map<String,Map> map = new HashMap<>();
        map.put("tags",tagService.getAllTags());
        map.put("locations",locationService.getAllLocations());
        return new GeneralResponseResult(ErrorCode.SUCCESS,map);
    }

    @PreAuthorize("hasRole(T(com.fitness_centre.constant.UserRole).MEMBER.getRole())")
    @PostMapping("/subscription")
    GeneralResponseResult subscription(@RequestBody SubscriptionRequest request,Authentication authentication){
        LoginUser loginUser = (LoginUser) authentication.getPrincipal();
        Long userId = loginUser.getId();
        return subscriptionService.sendRequest(userId,request);
    }

    @PreAuthorize("hasRole(T(com.fitness_centre.constant.UserRole).MEMBER.getRole())")
    @GetMapping("/subscriptionRequest")
    public IPage<SubscriptionListResponse> subscriptionRequest(Authentication authentication,
                                                               @RequestParam(defaultValue = "1")int pageNow,
                                                               @RequestParam(defaultValue = "10")int pageSize,
                                                               @RequestParam(required = false) List<String> statusList){
        LoginUser loginUser = (LoginUser) authentication.getPrincipal();
        Long userId = loginUser.getId();
        return subscriptionService.memberSubscriptionList(userId,pageNow,pageSize,statusList);
    }

    @PreAuthorize("hasRole(T(com.fitness_centre.constant.UserRole).MEMBER.getRole())")
    @GetMapping("/unreadRequest/count")
    public GeneralResponseResult countUnreadRequest(Authentication authentication){
        LoginUser loginUser = (LoginUser) authentication.getPrincipal();
        Long userId = loginUser.getId();
        return subscriptionService.countUnreadRequest(userId,UserRole.MEMBER);
    }

    @PreAuthorize("hasRole(T(com.fitness_centre.constant.UserRole).MEMBER.getRole())")
    @PatchMapping("/subscription/{id}/read")
    public GeneralResponseResult readRequest(@PathVariable("id") Long requestId,Authentication authentication){
        LoginUser loginUser = (LoginUser) authentication.getPrincipal();
        Long userId = loginUser.getId();
        return subscriptionService.readRequest(requestId,userId, UserRole.MEMBER);
    }

    @PreAuthorize("hasRole(T(com.fitness_centre.constant.UserRole).MEMBER.getRole())")
    @DeleteMapping("/subscription/{id}")
    public GeneralResponseResult cancel(@PathVariable("id") Long requestId){
        //todo 取消订阅
        return null;
    }

    @PreAuthorize("hasRole(T(com.fitness_centre.constant.UserRole).MEMBER.getRole())")
    @GetMapping("/appropriateTimeList/{id}")
    public GeneralResponseResult getAppropriateBookingTime(@PathVariable("id") Long coachId,Authentication authentication){
        LoginUser loginUser = (LoginUser) authentication.getPrincipal();
        System.out.println(coachId);
        return sessionBookingService.getAppropriateBookingTime(coachId,60);
    }
}