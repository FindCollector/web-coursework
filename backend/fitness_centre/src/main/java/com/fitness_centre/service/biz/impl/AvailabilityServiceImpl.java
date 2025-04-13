package com.fitness_centre.service.biz.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.fitness_centre.constant.ErrorCode;
import com.fitness_centre.domain.Availability;
import com.fitness_centre.dto.GeneralResponseResult;
import com.fitness_centre.dto.coach.AvailabilitySetRequest;
import com.fitness_centre.exception.BusinessException;
import com.fitness_centre.exception.SystemException;
import com.fitness_centre.mapper.AvailabilityMapper;
import com.fitness_centre.service.biz.interfaces.AvailabilityService;
import org.springframework.beans.BeanUtils;
import org.springframework.cglib.core.Local;
import org.springframework.stereotype.Service;

import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collector;
import java.util.stream.Collectors;

/**
 * @author
 * @Classname AvailabilityServiceImpl
 * @Description TODO
 * @date 10/04/2025
 */
@Service
public class AvailabilityServiceImpl extends ServiceImpl<AvailabilityMapper, Availability> implements AvailabilityService {

    private final static LocalTime EARLIEST = LocalTime.of(8,0);
    private final static LocalTime LATEST = LocalTime.of(22,0);


    /**
     * 删除某一段空闲时间
     * @param availabilityId 空闲时间ID
     */
    @Override
    public GeneralResponseResult deleteAvailability(Long availabilityId) {
        int row = this.baseMapper.deleteById(availabilityId);
        if(row == 0 || row < 0){
            throw new SystemException(ErrorCode.DB_OPERATION_ERROR);
        }
        return new GeneralResponseResult(ErrorCode.SUCCESS);
    }


    /**
     * 获取教练一周以来的空闲日期
     * @param coachId 教练ID
     */
    @Override
    public GeneralResponseResult getAllAvailability(Long coachId) {
        LambdaQueryWrapper<Availability> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(Availability::getCoachId,coachId);
        List<Availability> availabilityList = this.baseMapper.selectList(queryWrapper);

        Map<Integer,List<Availability>> calendarView = availabilityList.stream()
                .collect(Collectors.groupingBy(Availability::getDayOfWeek));

        Map<String,Object> dataMap = new HashMap<>();
        dataMap.put("listView",availabilityList);
        dataMap.put("calendarView",calendarView);
        return new GeneralResponseResult(ErrorCode.SUCCESS,dataMap);
    }

    /**
     * 插入一段空闲日期
     * @param coachId 教练的Id
     * @param insertRequest 插入空闲时间所需要的数据
     */
    @Override
    public GeneralResponseResult insertAvailability(Long coachId, AvailabilitySetRequest insertRequest) {

        if(isLegalTime(coachId,insertRequest,null)){
            throw new BusinessException(ErrorCode.INVALID_PARAMETER.getCode(),"Time overlaps.");
        }
        Availability availability = new Availability();
        availability.setCoachId(coachId);
        availability.setDayOfWeek(insertRequest.getDayOfWeek());
        availability.setStartTime(insertRequest.getStartTime());
        availability.setEndTime(insertRequest.getEndTime());
        try{
            this.baseMapper.insert(availability);
        }
        catch (Exception e){
            throw new SystemException(ErrorCode.DB_OPERATION_ERROR);
        }
        return new GeneralResponseResult(ErrorCode.SUCCESS);
    }

    @Override
    public GeneralResponseResult updateAvailability(Long coachId, Long availabilityId, AvailabilitySetRequest insertRequest) {
        if(isLegalTime(coachId,insertRequest,availabilityId)){
            throw new BusinessException(ErrorCode.INVALID_PARAMETER.getCode(),"Time overlaps.");
        }
        Availability availability = new Availability();
        BeanUtils.copyProperties(insertRequest,availability);
        availability.setId(availabilityId);
        try{
            this.baseMapper.updateById(availability);
        }
        catch (Exception e){
            throw new SystemException(ErrorCode.DB_OPERATION_ERROR);
        }
        return new GeneralResponseResult(ErrorCode.SUCCESS);
    }


    /**
     * 判断日期是否重叠
     * @param coachId 教练的Id
     * @param insertRequest 插入空闲时间所需要的数据
     */
    public boolean isLegalTime(Long coachId, AvailabilitySetRequest insertRequest, Long availabilityId){
        if(insertRequest.getStartTime().isBefore(EARLIEST)){
            throw new BusinessException(ErrorCode.INVALID_PARAMETER.getCode(), "Start time cannot be earlier than " + EARLIEST);
        }

        if(insertRequest.getEndTime().isAfter(LATEST)){
            throw new BusinessException(ErrorCode.INVALID_PARAMETER.getCode(),"End time cannot be later than " + LATEST);
        }

        if(insertRequest.getEndTime().isBefore(insertRequest.getStartTime())){
            throw new BusinessException(ErrorCode.INVALID_PARAMETER.getCode(),"Time is illegal.");
        }
        if(insertRequest.getEndTime().isBefore(insertRequest.getStartTime().plusHours(1))){
            throw new BusinessException(ErrorCode.INVALID_PARAMETER.getCode(),"Need to set longer availability times to meet course requirements");
        }
        LambdaQueryWrapper<Availability> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(Availability::getCoachId,coachId)
                .eq(Availability::getDayOfWeek,insertRequest.getDayOfWeek())
                .lt(Availability::getStartTime,insertRequest.getEndTime())
                .gt(Availability::getEndTime,insertRequest.getStartTime());

        if(!Objects.isNull(availabilityId)){
            queryWrapper.ne(Availability::getId,availabilityId);
        }
        Long result = this.baseMapper.selectCount(queryWrapper);
        if(result != 0L){
            return true;
        }
        return false;
    }

}