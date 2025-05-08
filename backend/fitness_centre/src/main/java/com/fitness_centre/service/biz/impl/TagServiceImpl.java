package com.fitness_centre.service.biz.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.fitness_centre.domain.Tag;
import com.fitness_centre.mapper.TagMapper;
import com.fitness_centre.service.biz.interfaces.TagService;
import org.springframework.beans.factory.annotation.Autowired;
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
    @Autowired
    private TagMapper tagMapper;
    
    @Autowired
    public void setTagMapper(TagMapper tagMapper) {
        this.tagMapper = tagMapper;
        super.baseMapper = tagMapper;
    }

    @Override
    public Map<Long, String> getAllTags() {
        // 使用普通 QueryWrapper 代替 LambdaQueryWrapper，避免在测试中 Lambda 缓存初始化问题
        QueryWrapper<Tag> queryWrapper = new QueryWrapper<>();
        queryWrapper.select("id", "tag_name");
        List<Tag> allTags = this.tagMapper.selectList(queryWrapper);
        Map<Long,String> map = new HashMap<>();
        for(Tag t : allTags){
            map.put(t.getId(),t.getTagName());
        }
        return map;
    }
}