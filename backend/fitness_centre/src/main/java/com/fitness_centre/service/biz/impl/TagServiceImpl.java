package com.fitness_centre.service.biz.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.fitness_centre.domain.Tag;
import com.fitness_centre.mapper.TagMapper;
import com.fitness_centre.service.biz.interfaces.TagService;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * @author
 * @Classname TagService
 * @Description DONE
 * @date 06/04/2025
 */
@Service
public class TagServiceImpl extends ServiceImpl<TagMapper, Tag> implements TagService {
    @Override
    public Map<Long, String> getAllTags() {
        LambdaQueryWrapper<Tag> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.select(Tag::getId,Tag::getTagName);
        List<Tag> allTags = this.baseMapper.selectList(queryWrapper);
        Map<Long,String> map = new HashMap<>();
        for(Tag t : allTags){
            map.put(t.getId(),t.getTagName());
        }
        return map;
    }
}