package com.fitness_centre.service.biz.interfaces;

import com.baomidou.mybatisplus.extension.service.IService;
import com.fitness_centre.domain.Tag;

import java.util.List;
import java.util.Map;

/**
 * @author
 * @Classname TagService
 * @Description TODO
 * @date 06/04/2025
 */
public interface TagService extends IService<Tag> {
    Map<Long, String> getAllTags();
}
