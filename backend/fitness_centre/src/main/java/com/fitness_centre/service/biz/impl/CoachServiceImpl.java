package com.fitness_centre.service.biz.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.fitness_centre.constant.ErrorCode;
import com.fitness_centre.domain.*;
import com.fitness_centre.dto.coach.CoachInfoResponse;
import com.fitness_centre.dto.coach.CoachInfoUpdateRequest;
import com.fitness_centre.dto.GeneralResponseResult;
import com.fitness_centre.dto.member.CoachDetailsResponse;
import com.fitness_centre.dto.member.CoachQueryRequest;
import com.fitness_centre.exception.BusinessException;
import com.fitness_centre.mapper.*;
import com.fitness_centre.service.biz.interfaces.CoachService;
import com.fitness_centre.service.infrastructure.FileService;
import com.fitness_centre.utils.StringSplitUtil;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.List;

/**
 * @author
 * @Classname CoachInfoServiceImpl
 * @Description TODO
 * @date 01/04/2025
 */
@Service
public class CoachServiceImpl extends ServiceImpl<CoachMapper, CoachInfo> implements CoachService {
    @Autowired
    private CoachMapper coachMapper;

    @Autowired
    private CoachTagMapper coachTagMapper;

    @Autowired
    private CoachLocationMapper coachLocationMapper;

    @Autowired
    private FileService fileService;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private CoachQueryMapper coachQueryMapper;


    @Override
    @Transactional
    public GeneralResponseResult updateInfo(CoachInfoUpdateRequest request,Long coachId) {
        User user_check = userMapper.selectById(coachId);
        if(Objects.isNull(user_check)){
            throw new BusinessException(ErrorCode.INVALID_PARAMETER.getCode(),"User not found");
        }
        CoachInfo coach_check = coachMapper.selectById(coachId);
        if(Objects.isNull(coach_check)){
            throw new BusinessException(ErrorCode.INVALID_PARAMETER.getCode(),"Coach not found");
        }

        //domain配置后，只更新非空字段
        User user = new User();
        user.setId(coachId);
        BeanUtils.copyProperties(request,user);
        if(!Objects.isNull(user.getBirthday()) || !Objects.isNull(user.getUserName()) || !Objects.isNull(user.getAddress())){
            userMapper.updateById(user);
        }

        CoachInfo coach = new CoachInfo();
        BeanUtils.copyProperties(request,coach);
        if(!Objects.isNull(coach.getIntro())){
            coach.setId(coachId);
            coachMapper.updateById(coach);
        }
        List<Long> locationIds = request.getCoachLocationIds();
        List<Long> tagIds = request.getCoachTagIds();
        if(!Objects.isNull(locationIds)){
            coachLocationMapper.deleteLocationsNotInList(coachId,locationIds);
            if(!locationIds.isEmpty()){
                coachLocationMapper.insertLocationsIfNotExists(coachId,locationIds);
            }
        }
        if(!Objects.isNull(tagIds)){
            coachTagMapper.deleteTagsNotInList(coachId,tagIds);
            if(!tagIds.isEmpty()){
                coachTagMapper.insertTagsIfNotExists(coachId,tagIds);
            }
        }
        return new GeneralResponseResult(ErrorCode.SUCCESS);

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
        CoachInfo coachInfo = coachMapper.selectOne(
                new LambdaQueryWrapper<CoachInfo>()
                        .eq(CoachInfo::getId,coachId)
        );
        List<Tag> coachTags = coachTagMapper.selectTagsByCoachId(coachId);
        List<Tag> otherTags = coachTagMapper.selectTagsNotChosenByCoachId(coachId);

        List<Location> coachLocations = coachLocationMapper.selectLocationsByCoachId(coachId);
        List<Location> otherLocations = coachLocationMapper.selectLocationsNotChosenByCoach(coachId);



        coachInfoResponse.setIntro(coachInfo.getIntro());
        coachInfoResponse.setCoachTags(coachTags);
        coachInfoResponse.setPhoto(coachInfo.getPhoto());
        coachInfoResponse.setOtherTags(otherTags);
        coachInfoResponse.setCoachLocations(coachLocations);
        coachInfoResponse.setOtherLocations(otherLocations);


        return new GeneralResponseResult(ErrorCode.SUCCESS,coachInfoResponse);
    }

    @Override
    public GeneralResponseResult coachPhoto(MultipartFile file,Long coachId) {
        String url = fileService.uploadFileToTemp(file,coachId);
        CoachInfo coach = new CoachInfo();
        coach.setId(coachId);
        coach.setPhoto(url);
        coachMapper.updateById(coach);
        Map<String,String> map = new HashMap<>();
        map.put("photo",url);
        return new GeneralResponseResult(ErrorCode.SUCCESS,map);
    }


    @Override
    public GeneralResponseResult coachInfoCheck(Long coachId) {
        Map <String,Object> map = new HashMap<>();
        boolean isComplete = true;
        List<String> missingFields = new ArrayList();
        CoachInfo coachInfo = coachMapper.selectOne(
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

    @Override
    public IPage<CoachDetailsResponse> coachList(Long memberId, CoachQueryRequest request) {
        // 使用 MyBatis-Plus 的分页对象
        Page<CoachDetailsResponse> pageParam =
                new Page<>(request.getPageNow(), request.getPageSize());

        // 执行自定义多表分页查询
        IPage<CoachDetailsResponse> rawPage =
                coachQueryMapper.selectCoachPage(pageParam, memberId, request);

        // 取出结果列表
        List<CoachDetailsResponse> records = rawPage.getRecords();

        // 4) 遍历每个 CoachDetailsResponse，把数据库里 GROUP_CONCAT 出来的逗号分隔字符串，拆分成 List
        for (CoachDetailsResponse resp : records) {
            // 拆分 tagNames
            if (resp.getGroupTagNames() != null) {
                resp.setTagNames(StringSplitUtil.splitByComma(resp.getGroupTagNames()));
            }
            // 拆分 locationNames
            if (resp.getGroupLocationNames() != null) {
                resp.setLocationNames(StringSplitUtil.splitByComma(resp.getGroupLocationNames()));
            }
        }
        return rawPage;
    }

}