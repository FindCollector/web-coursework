package com.fitness_centre.utils;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import java.time.LocalDateTime;
import java.time.Month;
import static org.junit.jupiter.api.Assertions.*;

public class DateUtilTest {

    private final DateUtil dateUtil = new DateUtil();

    @Test
    @DisplayName("当日期为周二时，应返回下周一零点")
    void shouldReturnNextMondayStart_whenGivenTuesday() {
        LocalDateTime given = LocalDateTime.of(2025, Month.APRIL, 8, 15, 30); // 周二
        LocalDateTime expected = LocalDateTime.of(2025, Month.APRIL, 14, 0, 0); // 下周一
        assertEquals(expected, dateUtil.calculateNextMondayStart(given));
    }

    @Test
    @DisplayName("当日期为周日时，应返回次日周一零点")
    void shouldReturnNextDayMondayStart_whenGivenSunday() {
        LocalDateTime given = LocalDateTime.of(2025, Month.APRIL, 6, 23, 59); // 周日
        LocalDateTime expected = LocalDateTime.of(2025, Month.APRIL, 7, 0, 0); // 次日周一
        assertEquals(expected, dateUtil.calculateNextMondayStart(given));
    }

    @Test
    @DisplayName("当日期为周一时，应返回下下周一零点")
    void shouldReturnNextNextMondayStart_whenGivenMonday() {
        LocalDateTime given = LocalDateTime.of(2025, Month.APRIL, 7, 13, 0); // 周一
        LocalDateTime expected = LocalDateTime.of(2025, Month.APRIL, 14, 0, 0); // 下周一（next）
        assertEquals(expected, dateUtil.calculateNextMondayStart(given));
    }
} 