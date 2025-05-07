package com.fitness_centre.service.biz.interfaces;

import com.baomidou.mybatisplus.extension.service.IService;
import com.fitness_centre.domain.Location;
import com.fitness_centre.dto.GeneralResponseResult;

import java.util.List;
import java.util.Map;

/**
 * @author
 * @Classname LocationService
 * @Description TODO
 * @date 06/04/2025
 */
public interface LocationService extends IService<Location> {
    Map<Long, String> getAllLocations();

    List<Location> mapLocation();
}
