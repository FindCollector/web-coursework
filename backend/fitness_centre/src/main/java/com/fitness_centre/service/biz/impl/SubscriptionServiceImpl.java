package com.fitness_centre.service.biz.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.fitness_centre.constant.ErrorCode;
import com.fitness_centre.constant.RequestStatus;
import com.fitness_centre.constant.UserRole;
import com.fitness_centre.domain.*;
import com.fitness_centre.dto.GeneralResponseResult;
import com.fitness_centre.dto.subscription.SubscriptionListResponse;
import com.fitness_centre.dto.member.SubscriptionCoach;
import com.fitness_centre.dto.member.SubscriptionRequest;
import com.fitness_centre.exception.BusinessException;
import com.fitness_centre.exception.SystemException;
import com.fitness_centre.mapper.*;
import com.fitness_centre.service.biz.interfaces.SubscriptionService;
import com.fitness_centre.utils.DateUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * @author
 * @Classname SubscriptionImpl
 * @Description TODO
 * @date 06/04/2025
 */
@Service
public class SubscriptionServiceImpl extends ServiceImpl<SubscriptionMapper,Subscription> implements SubscriptionService {

    @Autowired
    private DateUtil dateUtil;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private CoachMapper coachMapper;

    @Autowired
    private CoachTagMapper coachTagMapper;

    @Autowired
    private CoachLocationMapper coachLocationMapper;


    /**
     * 会员向特定教练发送订阅。
     * @param memberId 会员ID
     * @param request 订阅需要的信息
     */
    @Override
    public GeneralResponseResult sendRequest(Long memberId,SubscriptionRequest request) {
        Subscription subscription = new Subscription();

        //查看是不是在周日
        checkIfBookingAllowedToday();

        //检查是否在拒绝的冷静期
        checkSubscriptionCooldown(memberId,request.getCoachId());

        //检查是否已经是已订阅或者待回复的状态
        checkExistingPendingOrActiveSubscription(memberId,request.getCoachId());

        subscription.setMemberId(memberId);
        subscription.setCoachId(request.getCoachId());
        subscription.setMessage(request.getMessage());
        subscription.setStatus(RequestStatus.PENDING);
        subscription.setRequestTime(LocalDateTime.now());
        //member发送请求对于member是已读的
        subscription.setCoachIsRead(false);
        //对于coach是未读的
        subscription.setMemberIsRead(true);
        this.baseMapper.insert(subscription);
        return new GeneralResponseResult(ErrorCode.SUCCESS);
    }


    /**
     * 检查会员向特定教练发送订阅请求是否处于冷却期。
     * @param memberId 会员ID
     * @param coachId 教练ID
     */
    private void checkSubscriptionCooldown(Long memberId,Long coachId){
        LambdaQueryWrapper<Subscription> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(Subscription::getCoachId,coachId)
                .eq(Subscription::getMemberId,memberId)
                .eq(Subscription::getStatus,RequestStatus.REJECT)
                .orderByDesc(Subscription::getResponseTime)
                .last("LIMIT 1");

        Subscription latestRejection = this.getOne(queryWrapper);

        if(latestRejection != null && latestRejection.getResponseTime() != null){
            LocalDateTime rejectionTime = latestRejection.getResponseTime();

            //计算拒绝时间点之后的下一个周一
            LocalDateTime cooldownEndTime = dateUtil.calculateNextMondayStart(rejectionTime);

            //当前的时间
            LocalDateTime currentTime = LocalDateTime.now();

            if(currentTime.isBefore(cooldownEndTime)){
                throw new BusinessException(ErrorCode.INVALID_PARAMETER.getCode(),"You have been rejected please wait for a cooling off period");
            }
        }
    }

    private void checkIfBookingAllowedToday(){
        LocalDateTime currentTime = LocalDateTime.now();
        DayOfWeek cuttentDayyOfWeek = currentTime.getDayOfWeek();
        if(cuttentDayyOfWeek.equals(DayOfWeek.SUNDAY)){
            throw new BusinessException(ErrorCode.INVALID_PARAMETER.getCode(),"You can't subscribe on Sunday. Please wait until next week.");
        }
    }

    /**
     * 检查是否存在待处理或已激活的订阅请求/订阅
     * @param memberId 会员ID
     * @param coachId 教练ID
     */
    private void checkExistingPendingOrActiveSubscription(Long memberId,Long coachId){
        LambdaQueryWrapper<Subscription> pendingRequestQuery = new LambdaQueryWrapper<>();
        pendingRequestQuery.eq(Subscription::getMemberId,memberId)
                .eq(Subscription::getCoachId,coachId)
                .eq(Subscription::getStatus,RequestStatus.PENDING);

        if(this.count(pendingRequestQuery) > 0){
            throw new BusinessException(ErrorCode.INVALID_PARAMETER.getCode(),"You have already sent a request, please wait for it to be processed");
        }

        LambdaQueryWrapper<Subscription> activeRequestQuery = new LambdaQueryWrapper<>();
        activeRequestQuery.eq(Subscription::getMemberId,memberId)
                .eq(Subscription::getCoachId,coachId)
                .eq(Subscription::getStatus,RequestStatus.ACCEPT);

        if(this.count(activeRequestQuery) > 0){
            throw new BusinessException(ErrorCode.INVALID_PARAMETER.getCode(),"You have subscribed to the coach");
        }
    }


    /**
     * coach检查自己的订阅请求
     * @param coachId 教练ID
     * @param pageNow 页数
     * @param pageSize 一页的大小
     * @param statusList request的状态
     */
    public IPage<SubscriptionListResponse> coachSubscriptionList(Long coachId, int pageNow, int pageSize, List<String> statusList){
        Page page = new Page<>(pageNow,pageSize);
        return this.baseMapper.findSubscriptionByCoachId(page,coachId,statusList);
    }

    /**
     * member检查自己的订阅请求
     * @param memberId 会员ID
     * @param pageNow 页数
     * @param pageSize 一页的大小
     * @param statusList request的状态
     */
    @Override
    public IPage<SubscriptionListResponse> memberSubscriptionRequestList(Long memberId, int pageNow, int pageSize, List<String> statusList) {
        Page page = new Page<>(pageNow,pageSize);
        return this.baseMapper.findSubscriptionByMemberId(page,memberId,statusList);
    }

    /**
     * 将请求更新为教练已读的状态
     * @param requestId 请求的id
     */
    @Override
    public GeneralResponseResult readRequest(Long requestId, Long userId, UserRole role) {
        LambdaUpdateWrapper<Subscription> updateWrapper = new LambdaUpdateWrapper<>();

        switch (role){
            case COACH ->
                updateWrapper.eq(Subscription::getCoachId,userId)
                        .eq(Subscription::getId,requestId)
                        .set(Subscription::getCoachIsRead,true);
            case MEMBER ->
                updateWrapper.eq(Subscription::getMemberId,userId)
                        .eq(Subscription::getId,requestId)
                        .set(Subscription::getMemberIsRead,true);
            default ->
                throw new BusinessException(ErrorCode.INVALID_PARAMETER.getCode(),"Illegal roles");
        }

        try{
            int rows = this.baseMapper.update(null,updateWrapper);
            if(rows < 0 || rows == 0){
                throw new SystemException(ErrorCode.DB_OPERATION_ERROR);
            }
        }
        catch (Exception e){
            throw new SystemException(ErrorCode.DB_OPERATION_ERROR.getCode(),"Database connection error");
        }
        return new GeneralResponseResult(ErrorCode.SUCCESS);
    }

    /**
     * 获取某个用户未读的请求的个数
     * @param userId
     */
    @Override
    public GeneralResponseResult countUnreadRequest(Long userId,UserRole role) {
        LambdaQueryWrapper<Subscription> queryWrapper = new LambdaQueryWrapper<>();
        switch (role){
            case COACH -> queryWrapper.eq(Subscription::getCoachId,userId)
                    .eq(Subscription::getCoachIsRead,false);
            case MEMBER -> queryWrapper.eq(Subscription::getMemberId,userId)
                    .eq(Subscription::getMemberIsRead,false);
        }

        Long count = this.baseMapper.selectCount(queryWrapper);
        Map<String,Long> map = new HashMap<>();
        map.put("count",count);

        return new GeneralResponseResult(ErrorCode.SUCCESS,map);
    }

    /**
     * 处理member的请求
     * @param coachId
     * @param status 请求拒绝接收
     * @param reply 文字回复
     */
    @Override
    public GeneralResponseResult coachHandleRequest(Long requestId, Long coachId,RequestStatus status,String reply) {
        if(Objects.isNull(reply)){
            throw new BusinessException(ErrorCode.INVALID_PARAMETER.getCode(),"Please bring your reply");
        }
        LambdaUpdateWrapper<Subscription> updateWrapper = new LambdaUpdateWrapper<>();
        updateWrapper.eq(Subscription::getCoachId,coachId)
                .eq(Subscription::getId,requestId)
                .set(Subscription::getStatus,status)
                .set(Subscription::getReply,reply)
                .set(Subscription::getResponseTime,LocalDateTime.now())
                .set(Subscription::getMemberIsRead,false);

        try{
            int rows = this.baseMapper.update(null,updateWrapper);
            if(rows < 0 || rows == 0){
                throw new SystemException(ErrorCode.DB_OPERATION_ERROR);
            }
        }
        catch (Exception e){
            throw new SystemException(ErrorCode.DB_OPERATION_ERROR.getCode(),"Database connection error");
        }
        return new GeneralResponseResult(ErrorCode.SUCCESS);
    }


    //todo 取消订阅
    public GeneralResponseResult memberCancelSubscription(Long memberId,Long coachId){
        LambdaUpdateWrapper<Subscription> updateWrapper = new LambdaUpdateWrapper<>();
        updateWrapper.eq(Subscription::getCoachId,coachId)
                .eq(Subscription::getMemberId,memberId)
                .set(Subscription::getStatus,RequestStatus.CANCEL)
                .set(Subscription::getCancelTime,LocalDateTime.now());
        int row = this.baseMapper.update(updateWrapper);
        if(row <= 0){
            throw new SystemException(ErrorCode.DB_OPERATION_ERROR);
        }
        return new GeneralResponseResult(ErrorCode.SUCCESS);
    }

    @Override
    public GeneralResponseResult mySubscriptionCoach(Long memberId) {
        LambdaQueryWrapper<Subscription> subscriptionLambdaQueryWrapper = new LambdaQueryWrapper<>();
        subscriptionLambdaQueryWrapper.eq(Subscription::getMemberId,memberId)
                .eq(Subscription::getStatus,RequestStatus.ACCEPT);

        List<Subscription> subscriptionList = this.baseMapper.selectList(subscriptionLambdaQueryWrapper);

        List<SubscriptionCoach> subscriptionCoachList = subscriptionList.stream()
                .map(subscription -> {
                    LambdaQueryWrapper<User> userLambdaQueryWrapper = new LambdaQueryWrapper<>();
                    userLambdaQueryWrapper.eq(User::getId,subscription.getCoachId());
                    User user = userMapper.selectOne(userLambdaQueryWrapper);
                    String coachName = user.getUserName();
                    String email = user.getEmail();
                    Integer age = Period.between(user.getBirthday(), LocalDate.now()).getYears();

                    LambdaQueryWrapper<CoachInfo> coachInfoLambdaQueryWrapper = new LambdaQueryWrapper<>();
                    coachInfoLambdaQueryWrapper.eq(CoachInfo::getId,subscription.getCoachId());
                    CoachInfo coachInfo = coachMapper.selectOne(coachInfoLambdaQueryWrapper);
                    String intro = coachInfo.getIntro();
                    String photo = coachInfo.getPhoto();

                    List<Tag> tagList = coachTagMapper.selectTagsByCoachId(subscription.getCoachId());
                    List<String> tagNames = tagList.stream()
                            .map(tag -> tag.getTagName()).collect(Collectors.toList());

                    List<Location> locationList = coachLocationMapper.selectLocationsByCoachId(subscription.getCoachId());
                    List<String> locationNames = locationList.stream()
                            .map(location -> location.getLocationName()).collect(Collectors.toList());

                    return new SubscriptionCoach(
                            subscription.getCoachId(),
                            coachName,
                            photo,
                            age,
                            email,
                            intro,
                            tagNames,
                            locationNames
                    );
                }).collect(Collectors.toList());
        return new GeneralResponseResult(ErrorCode.SUCCESS,subscriptionCoachList);
    }

}