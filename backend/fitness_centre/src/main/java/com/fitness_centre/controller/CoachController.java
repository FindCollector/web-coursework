package com.fitness_centre.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.fitness_centre.constant.RequestStatus;
import com.fitness_centre.constant.UserRole;
import com.fitness_centre.dto.coach.AvailabilitySetRequest;
import com.fitness_centre.dto.coach.CoachInfoUpdateRequest;
import com.fitness_centre.dto.GeneralResponseResult;
import com.fitness_centre.dto.subscription.SubscriptionListResponse;
import com.fitness_centre.security.LoginUser;
import com.fitness_centre.service.biz.interfaces.AvailabilityService;
import com.fitness_centre.service.biz.interfaces.CoachService;
import com.fitness_centre.service.biz.interfaces.SessionBookingService;
import com.fitness_centre.service.biz.interfaces.SubscriptionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
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
    private CoachService coachService;

    @Autowired
    private SubscriptionService subscriptionService;

    @Autowired
    private AvailabilityService availabilityService;

    @Autowired
    private SessionBookingService sessionBookingService;

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
    public GeneralResponseResult details(Authentication authentication){
        LoginUser loginUser = (LoginUser) authentication.getPrincipal();
        Long userId = loginUser.getId();
        return coachService.coachInfo(userId);
    }

    @PreAuthorize("hasRole(T(com.fitness_centre.constant.UserRole).COACH.getRole())")
    @GetMapping("/details/check")
    public GeneralResponseResult detailsCheck(Authentication authentication){
        LoginUser loginUser = (LoginUser) authentication.getPrincipal();
        Long userId = loginUser.getId();
        return coachService.coachInfoCheck(userId);
    }

    @PreAuthorize("hasRole(T(com.fitness_centre.constant.UserRole).COACH.getRole())")
    @GetMapping("/subscriptionRequest")
    public IPage<SubscriptionListResponse> subscriptionRequestList(Authentication authentication,
                                                               @RequestParam(defaultValue = "1")int pageNow,
                                                               @RequestParam(defaultValue = "10")int pageSize,
                                                               @RequestParam(required = false) List<String> statusList){
        LoginUser loginUser = (LoginUser) authentication.getPrincipal();
        Long userId = loginUser.getId();
        return subscriptionService.coachSubscriptionList(userId,pageNow,pageSize,statusList);
    }

    @PreAuthorize("hasRole(T(com.fitness_centre.constant.UserRole).COACH.getRole())")
    @GetMapping("/unreadRequest/count")
    public GeneralResponseResult countUnreadRequest(Authentication authentication){
        LoginUser loginUser = (LoginUser) authentication.getPrincipal();
        Long userId = loginUser.getId();
        return subscriptionService.countUnreadRequest(userId,UserRole.COACH);
    }

    @PreAuthorize("hasRole(T(com.fitness_centre.constant.UserRole).COACH.getRole())")
    @PatchMapping("/subscription/{id}/read")
    public GeneralResponseResult readRequest(@PathVariable("id") Long requestId,Authentication authentication){
        LoginUser loginUser = (LoginUser) authentication.getPrincipal();
        Long userId = loginUser.getId();
        return subscriptionService.readRequest(requestId,userId, UserRole.COACH);
    }

    @PreAuthorize("hasRole(T(com.fitness_centre.constant.UserRole).COACH.getRole())")
    @PatchMapping("/subscription/{id}/accept")
    public GeneralResponseResult acceptRequest(@PathVariable("id") Long requestId,
                                                    @RequestBody Map<String,Object> requestBody,
                                                    Authentication authentication){
        LoginUser loginUser = (LoginUser) authentication.getPrincipal();
        Long userId = loginUser.getId();
        String reply = (String)requestBody.get("reply");
        return subscriptionService.coachHandleRequest(requestId,userId, RequestStatus.ACCEPT,reply);
    }

    @PreAuthorize("hasRole(T(com.fitness_centre.constant.UserRole).COACH.getRole())")
    @PatchMapping("/subscription/{id}/reject")
    public GeneralResponseResult rejectRequest(@PathVariable("id") Long requestId,
                                                    @RequestBody Map<String,Object> requestBody,
                                                    Authentication authentication){
        LoginUser loginUser = (LoginUser) authentication.getPrincipal();
        Long userId = loginUser.getId();
        String reply = (String)requestBody.get("reply");
        return subscriptionService.coachHandleRequest(requestId,userId, RequestStatus.REJECT,reply);
    }
    //--------------------------------------- 空闲时间 --------------------------------------------

    @PreAuthorize("hasRole(T(com.fitness_centre.constant.UserRole).COACH.getRole())")
    @PatchMapping("/availability/{id}")
    public GeneralResponseResult updateAvailability(@PathVariable("id") Long availabilityId,@RequestBody AvailabilitySetRequest request,Authentication authentication){
        LoginUser loginUser = (LoginUser) authentication.getPrincipal();
        Long userId = loginUser.getId();
        return availabilityService.updateAvailability(userId,availabilityId,request);
    }
    @PreAuthorize("hasRole(T(com.fitness_centre.constant.UserRole).COACH.getRole())")
    @DeleteMapping("/availability/{id}")
    public GeneralResponseResult deleteAvailability(@PathVariable("id") Long availabilityId){
        return availabilityService.deleteAvailability(availabilityId);
    }

    @PreAuthorize("hasRole(T(com.fitness_centre.constant.UserRole).COACH.getRole())")
    @PostMapping("/availability")
    public GeneralResponseResult insertAvailability(@RequestBody AvailabilitySetRequest request,Authentication authentication){
        LoginUser loginUser = (LoginUser) authentication.getPrincipal();
        Long userId = loginUser.getId();
        return availabilityService.insertAvailability(userId,request);
    }

    @PreAuthorize("hasRole(T(com.fitness_centre.constant.UserRole).COACH.getRole())")
    @GetMapping("/availability")
    public GeneralResponseResult availabilityList(Authentication authentication){
        LoginUser loginUser = (LoginUser) authentication.getPrincipal();
        Long userId = loginUser.getId();
        return availabilityService.getAllAvailability(userId);
    }

    //--------------------------------------- 课程预定 --------------------------------------------
    @PreAuthorize("hasRole(T(com.fitness_centre.constant.UserRole).COACH.getRole())")
    @GetMapping("/session-requests")
    public GeneralResponseResult sessionRequestList(Authentication authentication,
                                                    @RequestParam(defaultValue = "1")int pageNow,
                                                    @RequestParam(defaultValue = "10") int pageSize,
                                                    @RequestParam(required = false)List<RequestStatus> statusList){
        LoginUser loginUser = (LoginUser) authentication.getPrincipal();
        Long userId = loginUser.getId();
        return sessionBookingService.getBookingRequest(userId,pageNow,pageSize,statusList,UserRole.COACH);
    }

}