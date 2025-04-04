package com.fitness_centre.service.biz.impl;

import ch.qos.logback.core.read.ListAppender;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.fitness_centre.constant.ErrorCode;
import com.fitness_centre.domain.*;
import com.fitness_centre.dto.CoachInfoResponse;
import com.fitness_centre.dto.CoachInfoUpdateRequest;
import com.fitness_centre.dto.GeneralResponseResult;
import com.fitness_centre.exception.BusinessException;
import com.fitness_centre.mapper.*;
import com.fitness_centre.service.biz.interfaces.CoachInfoService;
import com.fitness_centre.service.infrastructure.FileService;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.*;
import java.util.*;
import java.util.List;
import java.util.stream.Collectors;

/**
 * @author
 * @Classname CoachInfoServiceImpl
 * @Description TODO
 * @date 01/04/2025
 */
@Service
public class CoachInfoServiceImpl extends ServiceImpl<CoachInfoMapper, CoachInfo> implements CoachInfoService {
    @Autowired
    private CoachInfoMapper coachInfoMapper;

    @Autowired
    private TagMapper tagMapper;

    @Autowired
    private CoachTagMapper coachTagMapper;

    @Autowired
    private LocationMapper locationMapper;
    @Autowired
    private CoachLocationMapper coachLocationMapper;

    @Autowired
    private FileService fileService;

    @Autowired
    private UserMapper userMapper;

    @Value("${upload.formal-path}")
    private String formalPath;




    @Override
    @Transactional
    public GeneralResponseResult updateInfo(CoachInfoUpdateRequest request,Long coachId) {
        User user_check = userMapper.selectById(coachId);
        if(Objects.isNull(user_check)){
            throw new BusinessException(ErrorCode.INVALID_PARAMETER.getCode(),"User not found");
        }
        CoachInfo coach_check = coachInfoMapper.selectById(coachId);
        if(Objects.isNull(coach_check)){
            throw new BusinessException(ErrorCode.INVALID_PARAMETER.getCode(),"Coach not found");
        }
        //domain配置后，只更新非空字段
        User user = new User();
        BeanUtils.copyProperties(request,user);
        userMapper.updateById(user);

        CoachInfo coach = new CoachInfo();
        BeanUtils.copyProperties(request,coach);

        updateCoachTags(request,coachId);

        return new GeneralResponseResult(ErrorCode.SUCCESS);

    }

    public void updateCoachTags(CoachInfoUpdateRequest request,Long coachId){
        //查询旧的tag关联
        List<CoachTag> oldCoachTags = coachTagMapper.selectList(
                new LambdaQueryWrapper<CoachTag>()
                        .eq(CoachTag::getCoachId,coachId)
        );

        //从中获取旧的tagId
        Set<Long> oldTagIdSet = oldCoachTags.stream()
                .map(CoachTag::getTagId)
                .collect(Collectors.toSet());
        //对比新旧，确定需要删除和需要新增的ID
        Set<Long> newTagIdSet = new HashSet<>(request.getCoachTagIds());

        //需要删除的
        Set<Long> toRemove = new HashSet<>(oldTagIdSet);
        toRemove.removeAll(newTagIdSet);

        //需要新增的 = 新集合 - 旧集合
        Set<Long> toAdd = new HashSet<>(newTagIdSet);
        toAdd.removeAll(oldTagIdSet);

        //开始删除
        if(!toRemove.isEmpty()){
            coachTagMapper.delete(
                    new LambdaQueryWrapper<CoachTag>()
                            .eq(CoachTag::getCoachId,coachId)
                            .in(CoachTag::getTagId,toRemove)
            );
        }

        //开始新增
        for(Long tagId : toAdd){
            CoachTag ct = new CoachTag();
            ct.setCoachId(coachId);
            ct.setTagId(tagId);
            coachTagMapper.insert(ct);
        }
    }

    @Override
    public GeneralResponseResult coachInfo(Long coachId) {
        CoachInfoResponse coachInfoResponse = new CoachInfoResponse();
        //得到user相关的基本信息
        User user = userMapper.selectById(coachId);
        coachInfoResponse.setAddress(user.getAddress());
        coachInfoResponse.setBirthday(user.getBirthday());
        coachInfoResponse.setUserName(user.getUserName());
        //得到coachInfo相关的基本信息
        CoachInfo coachInfo = coachInfoMapper.selectOne(
                new LambdaQueryWrapper<CoachInfo>()
                        .eq(CoachInfo::getId,coachId)
        );
        List<Long> coachTagIds = getTagIdsByCoachId(coachId);
        List<Tag> coachTags = getTagsByCoachId(coachTagIds);
        List<Tag> otherTags = getOtherTags(coachTagIds);

        List<Long> coachLocationIds = getLocationIdsByCoachId(coachId);
        List<Location> coachLocations = getLocationsByCoachId(coachLocationIds);
        List<Location> otherLocations = getOtherLocations(coachLocationIds);



        coachInfoResponse.setIntro(coachInfo.getIntro());
        coachInfoResponse.setCoachTags(coachTags);
        coachInfoResponse.setPhoto(coachInfo.getPhoto());
        coachInfoResponse.setOtherTags(otherTags);
        coachInfoResponse.setCoachLocations(coachLocations);
        coachInfoResponse.setOtherLocations(otherLocations);


        return new GeneralResponseResult(ErrorCode.SUCCESS,coachInfoResponse);
    }

    //获取现在教练有的id
    public List<Long> getTagIdsByCoachId(Long coachId){
        List<CoachTag> coachTagList = coachTagMapper.selectList(
                new LambdaQueryWrapper<CoachTag>()
                        .eq(CoachTag::getCoachId,coachId)
        );

        //提取coach对应的tagID(查关联表)
        List<Long> coachTagIds = coachTagList.stream()
                .map(CoachTag::getTagId)
                .distinct()
                .collect(Collectors.toList());


        return coachTagIds;
    }
    public List<Tag> getTagsByCoachId(List<Long> coachTagIds){
        //根据tagId获取tag的名字
        List<Tag> coachTags = coachTagIds.isEmpty() ? Collections.emptyList() : tagMapper.selectList(
                new LambdaQueryWrapper<Tag>()
                        .in(Tag::getId,coachTagIds)
        );
        return coachTags;
    }

    //获取现在教练没有的Tag
    public List<Tag> getOtherTags(List<Long> coachTagIds){
        /* 这里的otherTags中我需要获取去了教练的tags外的其他tags*/
        List<Tag> allTags = tagMapper.selectList(new LambdaQueryWrapper<>());
        List<Tag> otherTags = allTags.stream()
                .filter(tag->!coachTagIds.contains(tag.getId()))
                .collect(Collectors.toList());

        return otherTags;
    }

    public List<Long>getLocationIdsByCoachId(Long coachId){
        List<CoachLocation> coachLocationList = coachLocationMapper.selectList(
                new LambdaQueryWrapper<CoachLocation>()
                        .eq(CoachLocation::getCoachId,coachId)
        );

        List<Long> coachLocationIds = coachLocationList.stream()
                .map(CoachLocation::getLocationId)
                .distinct()
                .collect(Collectors.toList());

        return coachLocationIds;
    }

    public List<Location> getLocationsByCoachId(List<Long> coachLocationIds){
        List<Location> coachLocations = coachLocationIds.isEmpty() ? Collections.emptyList() : locationMapper.selectList(
                new LambdaQueryWrapper<Location>()
                        .in(Location::getId,coachLocationIds)
        );
        return coachLocations;
    }

    public  List<Location> getOtherLocations(List<Long> coachLocationsIds){
        List<Location> allLocations = locationMapper.selectList(new LambdaQueryWrapper<>());
        List<Location> othersTags = allLocations.stream()
                .filter(location -> !coachLocationsIds.contains(location.getId()))
                .collect(Collectors.toList());
        return othersTags;
    }

    @Override
    public GeneralResponseResult coachInfoCheck(Long coachId) {
        Map <String,Object> map = new HashMap<>();
        boolean isComplete = true;
        List<String> missingFields = new ArrayList();
        CoachInfo coachInfo = coachInfoMapper.selectOne(
                new LambdaQueryWrapper<CoachInfo>()
                        .eq(CoachInfo::getId,coachId)
        );

        if(Objects.isNull(coachInfo)){
            coachInfo = new CoachInfo();
            coachInfo.setId(coachId);
            coachInfo.setPhoto("/formal" + "/default.jpg");
            this.baseMapper.insert(coachInfo);
            missingFields.add("Tags");
            missingFields.add("Introduction");
            isComplete = false;
        }
        else {
            if(Objects.isNull(coachInfo.getIntro())){
                missingFields.add("Introduction");
                isComplete = false;
            }
        }

        boolean hasTags = coachTagMapper.exists(
                new LambdaQueryWrapper<CoachTag>().eq(CoachTag::getTagId,coachId)
        );

        if(!hasTags){
            missingFields.add("Tags");
        }

        boolean hasLocations = coachLocationMapper.exists(
                new LambdaQueryWrapper<CoachLocation>().eq(CoachLocation::getLocationId,coachId)
        );

        if(!hasLocations){
            missingFields.add("Locations");
        }


        map.put("isComplete",isComplete);
        map.put("missingFields",missingFields);
        return new GeneralResponseResult(ErrorCode.SUCCESS,map);
    }
}