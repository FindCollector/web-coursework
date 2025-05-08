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
     * Calculate the start time (00:00:00) of the next Monday after a given time point.
     * For example:
     * - If the given time is Wednesday, returns next Monday 00:00:00
     * - If the given time is Sunday, returns tomorrow Monday 00:00:00
     * - If the given time is Monday, returns the Monday of the week after next 00:00:00 (because the cooling period is until *next* Monday)
     * @param time reference time point
     * @return start time of next Monday
     */
    public LocalDateTime calculateNextMondayStart(LocalDateTime time){
        return time.toLocalDate()
                .with(TemporalAdjusters.next(DayOfWeek.MONDAY))
                .atStartOfDay();
    }
}