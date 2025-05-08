package service;

import com.fitness_centre.service.biz.impl.SessionBookingServiceImpl;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Constructor;
import java.lang.reflect.Method;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;

/**
 * Tests for SessionBookingServiceImpl.calculateFreeSlots
 */
public class SessionBookingServiceFreeSlotsTest {

    @Test
    @DisplayName("calculateFreeSlots should subtract booked intervals from potential slots")
    public void testCalculateFreeSlots() throws Exception {
        SessionBookingServiceImpl svc = new SessionBookingServiceImpl();
        Class<?> timeIntervalClass = null;
        for (Class<?> c : SessionBookingServiceImpl.class.getDeclaredClasses()) {
            if (c.getSimpleName().equals("TimeInterval")) {
                timeIntervalClass = c;
                break;
            }
        }
        if (timeIntervalClass == null) {
            throw new AssertionError("TimeInterval not found");
        }
        Constructor<?> ctor = timeIntervalClass.getDeclaredConstructor(Instant.class, Instant.class);
        ctor.setAccessible(true);

        Instant t10 = Instant.parse("2025-04-20T10:00:00Z");
        Instant t12 = Instant.parse("2025-04-20T12:00:00Z");
        Instant t14 = Instant.parse("2025-04-20T14:00:00Z");

        // potentialSlot: 10:00 - 14:00
        Object potential = ctor.newInstance(t10, t14);

        // booked interval: 11:00 - 12:00
        Instant t11 = Instant.parse("2025-04-20T11:00:00Z");
        Object booked = ctor.newInstance(t11, t12);

        List<?> potentialList = List.of(potential);
        List<?> bookedList = List.of(booked);

        Method calculateFree = SessionBookingServiceImpl.class.getDeclaredMethod(
                "calculateFreeSlots", List.class, List.class);
        calculateFree.setAccessible(true);

        List<?> freeSlots = (List<?>) calculateFree.invoke(svc, potentialList, bookedList);

        // Expect two free slots: 10-11 and 12-14
        Assertions.assertEquals(2, freeSlots.size());

        // Extract intervals for assertion
        Object first = freeSlots.get(0);
        Object second = freeSlots.get(1);

        Method getStart = timeIntervalClass.getDeclaredMethod("getStart");
        Method getEnd = timeIntervalClass.getDeclaredMethod("getEnd");
        getStart.setAccessible(true);
        getEnd.setAccessible(true);

        Instant firstStart = (Instant) getStart.invoke(first);
        Instant firstEnd = (Instant) getEnd.invoke(first);
        Instant secondStart = (Instant) getStart.invoke(second);
        Instant secondEnd = (Instant) getEnd.invoke(second);

        Assertions.assertEquals(t10, firstStart);
        Assertions.assertEquals(t11, firstEnd);
        Assertions.assertEquals(t12, secondStart);
        Assertions.assertEquals(t14, secondEnd);
    }
} 