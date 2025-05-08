package utils;

import com.fitness_centre.utils.DateUtil;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

/**
 * DateUtil.calculateNextMondayStart 的单元测试
 */
public class DateUtilTest {

    private final DateUtil dateUtil = new DateUtil();

    @Test
    @DisplayName("给定周三日期，应返回下一周一零点")
    public void testNextMondayFromWednesday() {
        LocalDateTime wednesday = LocalDateTime.of(2025, 4, 9, 10, 30); // 周三
        LocalDateTime expected = LocalDateTime.of(2025, 4, 14, 0, 0);  // 下周一 00:00
        Assertions.assertEquals(expected, dateUtil.calculateNextMondayStart(wednesday));
    }

    @Test
    @DisplayName("给定周日日期，应返回次日周一零点")
    public void testNextMondayFromSunday() {
        LocalDateTime sunday = LocalDateTime.of(2025, 4, 13, 23, 59); // 周日
        LocalDateTime expected = LocalDateTime.of(2025, 4, 14, 0, 0);
        Assertions.assertEquals(expected, dateUtil.calculateNextMondayStart(sunday));
    }

    @Test
    @DisplayName("给定周一日期，应返回下下周一零点")
    public void testNextMondayFromMonday() {
        LocalDateTime monday = LocalDateTime.of(2025, 4, 7, 11, 11); // 周一
        LocalDateTime expected = LocalDateTime.of(2025, 4, 14, 0, 0);
        Assertions.assertEquals(expected, dateUtil.calculateNextMondayStart(monday));
    }
} 