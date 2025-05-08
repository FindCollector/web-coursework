package service;

import com.fitness_centre.domain.Location;
import com.fitness_centre.mapper.LocationMapper;
import com.fitness_centre.service.biz.impl.LocationServiceImpl;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Unit tests for LocationServiceImpl.getAllLocations
 */
@ExtendWith(MockitoExtension.class)
public class LocationServiceImplTest {

    @Mock
    private LocationMapper locationMapper;

    @InjectMocks
    private LocationServiceImpl locationService;

    @Test
    @DisplayName("getAllLocations should return id to name map")
    public void testGetAllLocations() {
        List<Location> mockList = Arrays.asList(
                new Location(1L, "Downtown", null, null, null),
                new Location(2L, "East Side", null, null, null)
        );
        Mockito.when(locationMapper.selectList(Mockito.any())).thenReturn(mockList);

        Map<Long, String> result = locationService.getAllLocations();

        Assertions.assertEquals(mockList.stream().collect(Collectors.toMap(Location::getId, Location::getLocationName)), result);
        Mockito.verify(locationMapper).selectList(Mockito.any());
    }
} 