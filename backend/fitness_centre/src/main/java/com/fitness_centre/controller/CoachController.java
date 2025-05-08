package com.fitness_centre.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.fitness_centre.constant.ErrorCode;
import com.fitness_centre.constant.RequestStatus;
import com.fitness_centre.constant.UserRole;
import com.fitness_centre.domain.Tag;
import com.fitness_centre.domain.TrainingHistory;
import com.fitness_centre.dto.AddHistoryRequest;
import com.fitness_centre.dto.coach.AvailabilitySetRequest;
import com.fitness_centre.dto.coach.CoachInfoUpdateRequest;
import com.fitness_centre.dto.GeneralResponseResult;
import com.fitness_centre.dto.subscription.SubscriptionListResponse;
import com.fitness_centre.security.LoginUser;
import com.fitness_centre.service.biz.interfaces.*;
import org.ietf.jgss.GSSName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.PublicKey;
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

    @Autowired
    private TrainingHistoryService trainingHistoryService;

    @Autowired
    private TagService tagService;

    //Upload file
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
    @GetMapping("/subscription/unreadRequest/count")
    public GeneralResponseResult countUnreadSubscriptionRequest(Authentication authentication){
        LoginUser loginUser = (LoginUser) authentication.getPrincipal();
        Long userId = loginUser.getId();
        return subscriptionService.countUnreadRequest(userId,UserRole.COACH);
    }

    @PreAuthorize("hasRole(T(com.fitness_centre.constant.UserRole).COACH.getRole())")
    @PatchMapping("/subscription/{id}/read")
    public GeneralResponseResult readSubscriptionRequest(@PathVariable("id") Long requestId,Authentication authentication){
        LoginUser loginUser = (LoginUser) authentication.getPrincipal();
        Long userId = loginUser.getId();
        return subscriptionService.readRequest(requestId,userId, UserRole.COACH);
    }

    @PreAuthorize("hasRole(T(com.fitness_centre.constant.UserRole).COACH.getRole())")
    @PatchMapping("/subscription/{id}/accept")
    public GeneralResponseResult acceptSubscriptionRequest(@PathVariable("id") Long requestId,
                                                    @RequestBody Map<String,Object> requestBody,
                                                    Authentication authentication){
        LoginUser loginUser = (LoginUser) authentication.getPrincipal();
        Long userId = loginUser.getId();
        String reply = (String)requestBody.get("reply");
        return subscriptionService.coachHandleRequest(requestId,userId, RequestStatus.ACCEPT,reply);
    }

    @PreAuthorize("hasRole(T(com.fitness_centre.constant.UserRole).COACH.getRole())")
    @PatchMapping("/subscription/{id}/reject")
    public GeneralResponseResult rejectSubscriptionRequest(@PathVariable("id") Long requestId,
                                                    @RequestBody Map<String,Object> requestBody,
                                                    Authentication authentication){
        LoginUser loginUser = (LoginUser) authentication.getPrincipal();
        Long userId = loginUser.getId();
        String reply = (String)requestBody.get("reply");
        return subscriptionService.coachHandleRequest(requestId,userId, RequestStatus.REJECT,reply);
    }
    //--------------------------------------- Availability --------------------------------------------

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

    //--------------------------------------- Session Booking --------------------------------------------
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

    @PreAuthorize("hasRole(T(com.fitness_centre.constant.UserRole).COACH.getRole())")
    @PatchMapping("/session/request/{id}/read")
    public GeneralResponseResult readSessionRequest(@PathVariable("id") Long requestId,Authentication authentication){
        LoginUser loginUser = (LoginUser) authentication.getPrincipal();
        Long userId = loginUser.getId();
        return sessionBookingService.readRequest(requestId,userId,UserRole.COACH);
    }

    @PreAuthorize("hasRole(T(com.fitness_centre.constant.UserRole).COACH.getRole())")
    @GetMapping("/session/unreadRequest/count")
    public GeneralResponseResult countUnreadSessionRequest(Authentication authentication){
        LoginUser loginUser = (LoginUser) authentication.getPrincipal();
        Long userId = loginUser.getId();
        return sessionBookingService.countUnreadRequest(userId,UserRole.COACH);
    }
    @PreAuthorize("hasRole(T(com.fitness_centre.constant.UserRole).COACH.getRole())")
    @PatchMapping("/session/request/{id}/handle")
    public GeneralResponseResult handleSessionRequest(@PathVariable("id")Long requestId,@RequestBody Map<String,Object> map,Authentication authentication){
        LoginUser loginUser = (LoginUser) authentication.getPrincipal();
        Long userId = loginUser.getId();
        RequestStatus status = RequestStatus.valueOf((String) map.get("status"));
        String reply = (String) map.get("reply");
        return sessionBookingService.coachHandleRequest(requestId,userId,status,reply);
    }

    @PreAuthorize("hasRole(T(com.fitness_centre.constant.UserRole).COACH.getRole())")
    @GetMapping("/sessionSchedule")
    public GeneralResponseResult sessionSchedule(Authentication authentication){
        LoginUser loginUser = (LoginUser) authentication.getPrincipal();
        Long userId = loginUser.getId();
        return sessionBookingService.getBookingSchedule(userId,UserRole.COACH);
    }

    //--------------------------------------- Add Member Training History --------------------------------------------
    @PreAuthorize("hasRole(T(com.fitness_centre.constant.UserRole).COACH.getRole())")
    @PostMapping("/training/history")
    public GeneralResponseResult addSessionHistory(Authentication authentication, @RequestBody AddHistoryRequest request){
        LoginUser loginUser = (LoginUser) authentication.getPrincipal();
        Long userId = loginUser.getId();
        Long sessionId = request.getSessionId();
        String feedback = request.getFeedback();
        List<Long> tagList = request.getTagList();
        return trainingHistoryService.addTrainingHistory(userId,sessionId,feedback,tagList);
    }

    @PreAuthorize("hasRole(T(com.fitness_centre.constant.UserRole).COACH.getRole())")
    @GetMapping("/session/unrecord")
    public GeneralResponseResult getUnRecordSession(Authentication authentication,
                                                    @RequestParam(defaultValue = "1")int pageNow,
                                                    @RequestParam(defaultValue = "10") int pageSize){
        LoginUser loginUser = (LoginUser) authentication.getPrincipal();
        Long userId = loginUser.getId();
        return sessionBookingService.coachGetUnRecordSession(userId,pageNow,pageSize);
    }

    @PreAuthorize("hasRole(T(com.fitness_centre.constant.UserRole).COACH.getRole())")
    @GetMapping("/session/unrecord/count")
    public GeneralResponseResult countUnRecordsession(Authentication authentication){
        LoginUser loginUser = (LoginUser) authentication.getPrincipal();
        Long userId = loginUser.getId();
        return sessionBookingService.countUnRecordSession(userId);
    }

    @PreAuthorize("hasRole(T(com.fitness_centre.constant.UserRole).COACH.getRole())")
    @GetMapping("/tags")
    public GeneralResponseResult getAllTags(){
        return new GeneralResponseResult(ErrorCode.SUCCESS,tagService.getAllTags());
    }
}