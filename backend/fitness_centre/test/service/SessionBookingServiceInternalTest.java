package service;

import com.fitness_centre.service.biz.impl.SessionBookingServiceImpl;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Constructor;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Reflection-based tests for private inner TimeInterval and slot generation logic.
 */
public class SessionBookingServiceInternalTest {

    @Test
    @DisplayName("TimeInterval.overlaps should correctly detect overlap cases")
    public void testTimeIntervalOverlaps() throws Exception {
        Class<?> innerClass = getTimeIntervalClass();
        Constructor<?> ctor = innerClass.getDeclaredConstructor(Instant.class, Instant.class);
        ctor.setAccessible(true);

        Instant t0 = Instant.parse("2025-04-15T10:00:00Z");
        Instant t1 = Instant.parse("2025-04-15T11:00:00Z");
        Instant t2 = Instant.parse("2025-04-15T12:00:00Z");
        Instant t3 = Instant.parse("2025-04-15T13:00:00Z");

        Object intervalA = ctor.newInstance(t0, t2); // 10:00-12:00
        Object intervalB = ctor.newInstance(t1, t3); // 11:00-13:00 (overlap)
        Object intervalC = ctor.newInstance(t2, t3); // 12:00-13:00 (touching end)

        Method overlaps = innerClass.getDeclaredMethod("overlaps", innerClass);
        overlaps.setAccessible(true);

        boolean overlapAB = (boolean) overlaps.invoke(intervalA, intervalB);
        boolean overlapAC = (boolean) overlaps.invoke(intervalA, intervalC);

        Assertions.assertTrue(overlapAB, "Intervals A and B should overlap");
        Assertions.assertFalse(overlapAC, "Intervals A and C share only an endpoint, should not overlap");
    }

    @Test
    @DisplayName("generateBookableStartsFromFreeSlots should tile slots correctly")
    public void testGenerateBookableStarts() throws Exception {
        SessionBookingServiceImpl svc = new SessionBookingServiceImpl();

        // Access private methods and class
        Class<?> innerClass = getTimeIntervalClass();
        Constructor<?> ctor = innerClass.getDeclaredConstructor(Instant.class, Instant.class);
        ctor.setAccessible(true);

        Instant start = LocalDateTime.of(2025, 4, 16, 10, 0).toInstant(ZoneOffset.UTC);
        Instant end = LocalDateTime.of(2025, 4, 16, 14, 0).toInstant(ZoneOffset.UTC);
        Object freeSlot = ctor.newInstance(start, end);

        List<?> freeList = List.of(freeSlot);

        Method generator = SessionBookingServiceImpl.class.getDeclaredMethod(
                "generateBookableStartsFromFreeSlots", List.class, Duration.class);
        generator.setAccessible(true);

        List<Instant> result = (List<Instant>) generator.invoke(svc, freeList, Duration.ofHours(1));

        List<Instant> expected = Arrays.asList(
                LocalDateTime.of(2025, 4, 16, 10, 0).toInstant(ZoneOffset.UTC),
                LocalDateTime.of(2025, 4, 16, 11, 0).toInstant(ZoneOffset.UTC),
                LocalDateTime.of(2025, 4, 16, 12, 0).toInstant(ZoneOffset.UTC),
                LocalDateTime.of(2025, 4, 16, 13, 0).toInstant(ZoneOffset.UTC)
        );

        Assertions.assertEquals(expected, result);
    }

    private Class<?> getTimeIntervalClass() throws ClassNotFoundException {
        for (Class<?> clazz : SessionBookingServiceImpl.class.getDeclaredClasses()) {
            if (clazz.getSimpleName().equals("TimeInterval")) {
                return clazz;
            }
        }
        throw new ClassNotFoundException("TimeInterval inner class not found");
    }
} 