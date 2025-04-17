package com.fitness_centre.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.fitness_centre.constant.ErrorCode;
import com.fitness_centre.constant.RequestStatus;
import com.fitness_centre.constant.UserRole;
import com.fitness_centre.dto.GeneralResponseResult;
import com.fitness_centre.dto.subscription.SubscriptionListResponse;
import com.fitness_centre.dto.member.BookingRequest;
import com.fitness_centre.dto.member.CoachDetailsResponse;
import com.fitness_centre.dto.member.CoachQueryRequest;
import com.fitness_centre.dto.subscription.SubscriptionRequest;
import com.fitness_centre.security.LoginUser;
import com.fitness_centre.service.biz.interfaces.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
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
    //--------------------------------------- 教练订阅 --------------------------------------------

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
        return subscriptionService.memberSubscriptionRequestList(userId,pageNow,pageSize,statusList);
    }

    @PreAuthorize("hasRole(T(com.fitness_centre.constant.UserRole).MEMBER.getRole())")
    @GetMapping("/unreadRequest/count")
    public GeneralResponseResult countUnreadSubscriptionRequest(Authentication authentication){
        LoginUser loginUser = (LoginUser) authentication.getPrincipal();
        Long userId = loginUser.getId();
        return subscriptionService.countUnreadRequest(userId,UserRole.MEMBER);
    }

    @PreAuthorize("hasRole(T(com.fitness_centre.constant.UserRole).MEMBER.getRole())")
    @PatchMapping("/subscription/{id}/read")
    public GeneralResponseResult readSubscriptionRequest(@PathVariable("id") Long requestId,Authentication authentication){
        LoginUser loginUser = (LoginUser) authentication.getPrincipal();
        Long userId = loginUser.getId();
        return subscriptionService.readRequest(requestId,userId, UserRole.MEMBER);
    }
    @PreAuthorize("hasRole(T(com.fitness_centre.constant.UserRole).MEMBER.getRole())")
    @GetMapping("/subscriptionCoachList")
    public GeneralResponseResult subscriptionCoachList(Authentication authentication){
        LoginUser loginUser = (LoginUser) authentication.getPrincipal();
        Long userId = loginUser.getId();
        return subscriptionService.mySubscriptionCoach(userId);
    }


    @PreAuthorize("hasRole(T(com.fitness_centre.constant.UserRole).MEMBER.getRole())")
    @PatchMapping("/subscription/{coachId}")
    public GeneralResponseResult cancelSubscription(@PathVariable("coachId") Long coachId,Authentication authentication){
        LoginUser loginUser = (LoginUser) authentication.getPrincipal();
        Long userId = loginUser.getId();
        return subscriptionService.memberCancelSubscription(userId,coachId);
    }
    //--------------------------------------- 课程订阅 --------------------------------------------

    @PreAuthorize("hasRole(T(com.fitness_centre.constant.UserRole).MEMBER.getRole())")
    @GetMapping("/appropriateTimeList/{coachId}")
    public GeneralResponseResult getAppropriateBookingTime(@PathVariable("coachId") Long coachId,Authentication authentication){
        LoginUser loginUser = (LoginUser) authentication.getPrincipal();
        return sessionBookingService.getAppropriateBookingTime(coachId,60);
    }

    @PreAuthorize("hasRole(T(com.fitness_centre.constant.UserRole).MEMBER.getRole())")
    @PostMapping("/bookingSession")
    public GeneralResponseResult bookingSession(@RequestBody BookingRequest request,Authentication authentication){
        LoginUser loginUser = (LoginUser) authentication.getPrincipal();
        Long userId = loginUser.getId();
        return sessionBookingService.bookingSession(userId,request);
    }

    @PreAuthorize("hasRole(T(com.fitness_centre.constant.UserRole).MEMBER.getRole())")
    @DeleteMapping ("/withdrawRequest/{id}")
    public GeneralResponseResult withdrawRequest( @PathVariable("id") Long id,Authentication authentication){
        LoginUser loginUser = (LoginUser) authentication.getPrincipal();
        Long userId = loginUser.getId();
        return sessionBookingService.withdrawRequest(userId,id);
    }

    @PreAuthorize("hasRole(T(com.fitness_centre.constant.UserRole).MEMBER.getRole())")
    @PatchMapping("/cancelSession/{id}")
    public GeneralResponseResult cancelBooking(@PathVariable("id") Long id,Authentication authentication){
        LoginUser loginUser = (LoginUser) authentication.getPrincipal();
        Long userId = loginUser.getId();
        return sessionBookingService.cancelBooking(userId,id);
    }

    @PreAuthorize("hasRole(T(com.fitness_centre.constant.UserRole).MEMBER.getRole())")
    @GetMapping("/session-requests")
    public GeneralResponseResult sessionRequestList(Authentication authentication,
                                                    @RequestParam(defaultValue = "1")int pageNow,
                                                    @RequestParam(defaultValue = "10") int pageSize,
                                                    @RequestParam(required = false)List<RequestStatus> statusList){
        LoginUser loginUser = (LoginUser) authentication.getPrincipal();
        Long userId = loginUser.getId();
        return sessionBookingService.getBookingRequest(userId,pageNow,pageSize,statusList,UserRole.MEMBER);
    }

    @PreAuthorize("hasRole(T(com.fitness_centre.constant.UserRole).MEMBER.getRole())")
    @GetMapping("/sessionSchedule")
    public GeneralResponseResult sessionSchedule(Authentication authentication){
        LoginUser loginUser = (LoginUser) authentication.getPrincipal();
        Long userId = loginUser.getId();
        return sessionBookingService.getBookingSchedule(userId,UserRole.MEMBER);
    }

    @PreAuthorize("hasRole(T(com.fitness_centre.constant.UserRole).MEMBER.getRole())")
    @PatchMapping("/session/request/{id}/read")
    public GeneralResponseResult readSessionRequest(@PathVariable("id") Long requestId,Authentication authentication){
        LoginUser loginUser = (LoginUser) authentication.getPrincipal();
        Long userId = loginUser.getId();
        return sessionBookingService.readRequest(requestId,userId,UserRole.MEMBER);
    }

    @PreAuthorize("hasRole(T(com.fitness_centre.constant.UserRole).MEMBER.getRole())")
    @GetMapping("/session/unreadRequest/count")
    public GeneralResponseResult countUnreadSessionRequest(Authentication authentication){
        LoginUser loginUser = (LoginUser) authentication.getPrincipal();
        Long userId = loginUser.getId();
        return sessionBookingService.countUnreadRequest(userId,UserRole.MEMBER);
    }

}