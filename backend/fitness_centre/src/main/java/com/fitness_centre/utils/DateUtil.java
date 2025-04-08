package com.fitness_centre.utils;

import org.springframework.stereotype.Component;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;

/**
 * @author
 * @Classname DateUtil
 * @Description TODO
 * @date 07/04/2025
 */
@Component
public class DateUtil {
    /**
     * 计算给定时间点之后，下一个周一的开始时间 (00:00:00)。
     * 例如:
     * - 如果给定时间是周三，返回下周一 00:00:00
     * - 如果给定时间是周日，返回明天周一 00:00:00
     * - 如果给定时间是周一，返回下下周一 00:00:00 (因为冷却期是到 *下* 周一)
     * @param time 基准时间点
     * @return 下一个周一的开始时间
     */
    public LocalDateTime calculateNextMondayStart(LocalDateTime time){
        return time.toLocalDate()
                .with(TemporalAdjusters.next(DayOfWeek.MONDAY))
                .atStartOfDay();
    }
}