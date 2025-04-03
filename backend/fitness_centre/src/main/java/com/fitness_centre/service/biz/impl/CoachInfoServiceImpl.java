package com.fitness_centre.service.biz.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.fitness_centre.constant.ErrorCode;
import com.fitness_centre.domain.CoachInfo;
import com.fitness_centre.domain.CoachTag;
import com.fitness_centre.domain.Tag;
import com.fitness_centre.dto.CoachInfoResponse;
import com.fitness_centre.dto.GeneralResponseResult;
import com.fitness_centre.exception.BusinessException;
import com.fitness_centre.mapper.CoachInfoMapper;
import com.fitness_centre.mapper.CoachTagMapper;
import com.fitness_centre.mapper.TagMapper;
import com.fitness_centre.service.biz.interfaces.CoachInfoService;
import com.fitness_centre.service.infrastructure.FileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

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
    private FileService fileService;

    @Value("${upload.formal-path}")
    private String formalPath;



    @Override
    public GeneralResponseResult createIno(String info) {
        return null;
    }

    @Override
    public GeneralResponseResult updateInfo(String intro, List<Integer> tagId) {
        return null;
    }

    @Override
    public GeneralResponseResult coachInfo(Long coachId) {
        CoachInfoResponse coachInfoResponse = new CoachInfoResponse();
        //得到coach的基本信息
        CoachInfo coachInfo = coachInfoMapper.selectOne(
                new LambdaQueryWrapper<CoachInfo>()
                        .eq(CoachInfo::getId,coachId)
        );


        List<CoachTag> coachTagList = coachTagMapper.selectList(
                new LambdaQueryWrapper<CoachTag>()
                        .eq(CoachTag::getCoachId,coachId)
        );


        List<Long> tagIds = coachTagList.stream()
                .map(CoachTag::getTagId)
                .distinct()
                .collect(Collectors.toList());
        List<Tag> coachTags = tagIds.isEmpty() ? Collections.emptyList() : tagMapper.selectList(
                new LambdaQueryWrapper<Tag>()
                        .in(Tag::getId,tagIds)
        );
        /* 这里的otherTags中我需要获取去了教练的tags外的其他tags*/
        List<Tag> allTags = tagMapper.selectList(new LambdaQueryWrapper<>());
        List<Tag> otherTags = allTags.stream()
                .filter(tag->!tagIds.contains(tag.getId()))
                        .collect(Collectors.toList());


        coachInfoResponse.setIntro(coachInfo.getIntro());
        coachInfoResponse.setCoachTags(coachTags);
        coachInfoResponse.setPhoto(coachInfo.getPhoto());
        coachInfoResponse.setOtherTags(otherTags);


        return new GeneralResponseResult(ErrorCode.SUCCESS,coachInfoResponse);
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

        map.put("isComplete",isComplete);
        map.put("missingFields",missingFields);
        return new GeneralResponseResult(ErrorCode.SUCCESS,map);
    }
}