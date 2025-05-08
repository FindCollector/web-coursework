package com.fitness_centre.service.biz.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.fitness_centre.domain.Location;
import com.fitness_centre.dto.GeneralResponseResult;
import com.fitness_centre.mapper.LocationMapper;
import com.fitness_centre.service.biz.interfaces.LocationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;
import jakarta.annotation.PostConstruct;

/**
 * @author
 * @Classname LocationServiceImpl
 * @Description DONE
 * @date 06/04/2025
 */
@Service
public class LocationServiceImpl extends ServiceImpl<LocationMapper, Location> implements LocationService {

    /**
     * 直接注入 Mapper，避免在测试场景中 {@code baseMapper} 为空导致的 NPE。
     * 在运行时，MyBatis-Plus 仍旧会为 {@code baseMapper} 进行注入，因此两者均可正常工作。
     */
    @Autowired
    private LocationMapper locationMapper;

    @PostConstruct
    private void initBaseMapper() {
        // 在测试场景下显式为 ServiceImpl 中的 baseMapper 赋值，避免其他继承方法因空指针异常而失败
        super.baseMapper = this.locationMapper;
    }

    @Override
    public Map<Long, String> getAllLocations() {
        QueryWrapper<Location> queryWrapper = new QueryWrapper<>();
        queryWrapper.select("id", "location_name");
        List<Location> allLocations = this.locationMapper.selectList(queryWrapper);
        Map<Long,String> map = new HashMap<>();
        for(Location l : allLocations){
            map.put(l.getId(),l.getLocationName());
        }
        return map;
    }

    @Override
    public List<Location> mapLocation() {
        List<Location> locations = list();
        return locations;
    }
}