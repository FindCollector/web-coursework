package utils;

import com.fitness_centre.utils.RedisCache;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.BeforeEach;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.concurrent.TimeUnit;

/**
 * Unit tests for RedisCache focusing on basic object operations.
 */
@ExtendWith(MockitoExtension.class)
public class RedisCacheTest {

    @Mock
    private RedisTemplate<String, Object> redisTemplate;

    @Mock
    private ValueOperations<String, Object> valueOperations;

    private RedisCache redisCache;
    
    @BeforeEach
    public void setUp() {
        // 手动创建RedisCache实例
        redisCache = new RedisCache();
        // 通过反射设置redisTemplate字段
        ReflectionTestUtils.setField(redisCache, "redisTemplate", redisTemplate);
    }

    @Test
    @DisplayName("setCacheObject and getCacheObject should delegate to ValueOperations")
    public void testSetAndGetCacheObject() {
        String key = "k";
        String value = "v";

        Mockito.when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        Mockito.when(valueOperations.get(key)).thenReturn(value);

        // Act
        redisCache.setCacheObject(key, value);
        String cached = redisCache.getCacheObject(key);

        // Assert
        Mockito.verify(valueOperations).set(key, value);
        Assertions.assertEquals(value, cached);
    }

    @Test
    @DisplayName("expire should call RedisTemplate.expire with seconds time unit")
    public void testExpire() {
        String key = "expireKey";
        long timeout = 60L;
        Mockito.when(redisTemplate.expire(key, timeout, TimeUnit.SECONDS)).thenReturn(true);

        boolean result = redisCache.expire(key, timeout);

        Mockito.verify(redisTemplate).expire(key, timeout, TimeUnit.SECONDS);
        Assertions.assertTrue(result);
    }
} 