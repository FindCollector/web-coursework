package com.fitness_centre.service.biz.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.fitness_centre.domain.Location;
import com.fitness_centre.dto.GeneralResponseResult;
import com.fitness_centre.mapper.LocationMapper;
import com.fitness_centre.service.biz.interfaces.LocationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * @author
 * @Classname LocationServiceImpl
 * @Description DONE
 * @date 06/04/2025
 */
@Service
public class LocationServiceImpl extends ServiceImpl<LocationMapper, Location> implements LocationService {

    @Override
    public Map<Long, String> getAllLocations() {
        LambdaQueryWrapper<Location> queryWrapper = new LambdaQueryWrapper();
        queryWrapper.select(Location::getId,Location::getLocationName);
        List<Location> allLocations = this.baseMapper.selectList(queryWrapper);
        Map<Long,String> map = new HashMap<>();
        for(Location l : allLocations){
            map.put(l.getId(),l.getLocationName());
        }
        return map;
    }
}