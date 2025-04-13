package com.fitness_centre.service.biz.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.fitness_centre.constant.ErrorCode;
import com.fitness_centre.constant.RequestStatus;
import com.fitness_centre.domain.Availability;
import com.fitness_centre.domain.SessionBooking;
import com.fitness_centre.dto.GeneralResponseResult;
import com.fitness_centre.dto.member.TimeSlotRequest;
import com.fitness_centre.mapper.AvailabilityMapper;
import com.fitness_centre.mapper.SessionBookingMapper;
import com.fitness_centre.service.biz.interfaces.SessionBookingService;
import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.sql.Time;
import java.time.*;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

/**
 * @author
 * @Classname SessionBookingServiceImpl
 * @Description TODO
 * @date 12/04/2025
 */
@Service
public class SessionBookingServiceImpl extends ServiceImpl<SessionBookingMapper, SessionBooking> implements SessionBookingService {

    @Autowired
    private AvailabilityMapper availabilityMapper;

    //检查可用时间的步长
    private static final int BOOKING_STEP_MINUTES = 15;


    @Override
    public GeneralResponseResult getAppropriateBookingTime(Long coachId,int courseDurationMinutes) {
        LocalDate today = LocalDate.now();

        final Duration courseDuration = Duration.ofMinutes(courseDurationMinutes);

        //找到下一个周一作为开始日期
        LocalDate nextWeekStartDate = today.with(TemporalAdjusters.next((DayOfWeek.MONDAY)));

        //下一周结束的日期是下下周一(不包含)
        LocalDate nextWeekEndDate = nextWeekStartDate.plusWeeks(1);
        List<LocalDateTime> detailedBookableStartTimes = calculateBookableStartTimesInternal(
                coachId,nextWeekStartDate,nextWeekEndDate,courseDurationMinutes
        );

        Map<Integer, List<TimeSlotRequest>> groupedResult = detailedBookableStartTimes.stream()
                .collect(Collectors.groupingBy(
//                        () -> new EnumMap<>(DayOfWeek.class), // 使用 EnumMap 保证顺序和完整性
                        // 修改点 1: 使用 DayOfWeek 的 getValue() 获取数字 1-7
                        ldt -> ldt.getDayOfWeek().getValue(),
                        // 修改点 2: 使用 TreeMap 保持数字键的顺序
                        TreeMap::new,
                        Collectors.mapping(
                                // 将 LocalDateTime (开始时间) 映射为 TimeSlotDTO
                                startDateTime -> {
                                    LocalTime startTime = startDateTime.toLocalTime();
                                    // 根据课程时长计算结束时间
                                    LocalTime endTime = startTime.plus(courseDuration);
                                    return new TimeSlotRequest(startTime, endTime); // 创建 DTO
                                },
                                // 先收集成 List<TimeSlotDTO>
                                Collectors.toList()
                        )
                ));

        return new GeneralResponseResult(ErrorCode.SUCCESS,groupedResult);
    }

    /**
     * 内部核心计算方法：计算指定教练在给定日期范围内所有可预订的课程开始时间点。
     * 此方法执行了主要的业务逻辑：
     * 1. 获取教练的空闲模板和已确认的预订。
     * 2. 逐日遍历查询范围。
     * 3. 对每一天：
     * a. 应用空闲模板生成潜在的空闲时间段。
     * b. 从潜在空闲时间段中减去已预订的时间段，得到实际空闲时间段。
     * c. 在实际空闲时间段内，根据课程时长和步长生成具体的、可预约的开始时间点。
     * 4. 收集所有计算出的开始时间点并返回。
     *
     * @param coachId             教练的唯一标识符，用于查询相关数据。
     * @param queryStartDate      查询范围的开始日期 (包含)。
     * @param queryEndDate        查询范围的结束日期 (不包含)。方法会计算到 queryEndDate 前一天。
     * @param courseDurationMinutes 课程的时长（分钟），用于确定空闲时段是否足够长以及生成有效的结束时间。
     * @return 一个包含所有可预约开始时间 (LocalDateTime) 的列表，按时间先后顺序排序。
     * 如果课程时长无效、教练无空闲模板或计算过程中未找到任何可预约时间，则返回空列表。
     */
    private List<LocalDateTime> calculateBookableStartTimesInternal(Long coachId, LocalDate queryStartDate, LocalDate queryEndDate, int courseDurationMinutes) {
        ZoneId systemZoneId = ZoneId.systemDefault();

        // 将传入的分钟数转换为 Duration 对象，方便后续进行时间计算。
        Duration courseDuration = Duration.ofMinutes(courseDurationMinutes);

        // 初始化一个列表，用于存储最终计算出的所有可预约开始时间点。
        List<LocalDateTime> allBookableStartTimes = new ArrayList<>();

        //从数据库中查到教练的所有空闲时间模版
        LambdaQueryWrapper<Availability> availabilityLambdaQueryWrapper = new LambdaQueryWrapper<>();
        availabilityLambdaQueryWrapper.eq(Availability::getCoachId,coachId);
        List<Availability> templates = availabilityMapper.selectList( availabilityLambdaQueryWrapper);
        if(templates.isEmpty()){
            return Collections.emptyList();
        }

        // 定义查询时间范围的精确边界 (LocalDateTime)，可能用于后续查询预订记录。
        LocalDateTime rangeStart = queryStartDate.atStartOfDay();
        LocalDateTime rangeEnd = queryEndDate.atStartOfDay();

        // 获取该教练在指定时间范围内所有已确认的预订 (SessionBooking)。
        LambdaQueryWrapper<SessionBooking> sessionBookingLambdaQueryWrapper = new LambdaQueryWrapper<>();
        sessionBookingLambdaQueryWrapper.eq(SessionBooking::getCoachId,coachId)
                .eq(SessionBooking::getStatus, RequestStatus.ACCEPT)
                .lt(SessionBooking::getStartTime,rangeEnd)
                .gt(SessionBooking::getEndTime,rangeStart);
        List<SessionBooking> acceptedBookings = this.baseMapper.selectList(sessionBookingLambdaQueryWrapper);

        // 将获取到的预订记录 (SessionBooking) 转换为 TimeInterval 对象列表。
        // TimeInterval 使用 Instant 表示时间点，更适合进行精确的区间计算。
        List<TimeInterval> bookedIntervals = acceptedBookings.stream()
                .map(sessionBooking -> {
                    Instant startInstant = sessionBooking.getStartTime().atZone(systemZoneId).toInstant();
                    Instant endInstant = sessionBooking.getEndTime().atZone(systemZoneId).toInstant();
                    return new TimeInterval(startInstant,endInstant);
                })
                .filter(Objects::nonNull)
                .sorted(Comparator.comparing(TimeInterval::getStart))
                .collect(Collectors.toList());

        // 遍历查询范围内的每一天，从 queryStartDate 开始，直到 queryEndDate 的前一天。
        for (LocalDate currentDate = queryStartDate; currentDate.isBefore(queryEndDate); currentDate = currentDate.plusDays(1)) {
            // 获取当前日期是星期几 (1=周一, 7=周日)
            int currentDayOfWeek = currentDate.getDayOfWeek().getValue();

            // --- 3. 生成当天潜在空闲时段 (Generate Potential Slots) ---
            // 调用辅助方法，根据教练的空闲模板，生成当天理论上所有可能的空闲时间段。
            // 此时尚未考虑当天是否已被预订。
            List<TimeInterval> potentialSlotsToday = generatePotentialSlotsForDate(templates, currentDate, currentDayOfWeek, systemZoneId);
            if (potentialSlotsToday.isEmpty()) {
                continue; // 如果当天没有任何潜在空闲，直接处理下一天
            }

            // --- 4. 计算当天实际空闲时段 (Calculate Actual Free Slots) ---
            // 调用辅助方法，从当天的潜在空闲时段中，减去所有与之重叠的已预订时段。
            // bookedIntervals 包含整个查询范围的预订，calculateFreeSlots 内部会通过 overlaps 判断哪些预订与当天的 potentialSlots 相关。
            List<TimeInterval> actualFreeSlotsToday = calculateFreeSlots(potentialSlotsToday, bookedIntervals);
            if (actualFreeSlotsToday.isEmpty()) {
                continue; // 如果当天减去预订后没有空闲，直接处理下一天
            }

            // --- 5. 从实际空闲区间生成可预约的开始时间点 (Instant) (Generate Bookable Starts) ---
            // 调用辅助方法，遍历当天每一个实际空闲的时间段。
            // 在每个足够长的空闲段内，按照指定的课程时长 (courseDuration) 和时间步长 (BOOKING_STEP_MINUTES)，
            // 生成所有可能的、精确的课程开始时间点 (以 Instant 形式表示)。
            List<Instant> bookableStartsOnDate = generateBookableStartsFromFreeSlots(actualFreeSlotsToday, courseDuration);

            // --- 转换并添加到结果列表 (Convert & Collect Results) ---
            // 将当天计算出的所有可预约开始时间点 (Instant) 转换为 LocalDateTime (使用系统时区)。
            // 并将它们添加到最终的总结果列表中。
            bookableStartsOnDate.forEach(instant -> {
                LocalDateTime bookableDateTime = LocalDateTime.ofInstant(instant, systemZoneId);
                allBookableStartTimes.add(bookableDateTime);
            });

        } // --- 结束逐日循环 ---

        // 对所有收集到的可预约开始时间点进行时间先后排序。
        Collections.sort(allBookableStartTimes);
        return allBookableStartTimes;
    }

    /**
     * 为指定日期，根据教练的空闲时间模板，生成当天所有潜在的、未考虑预订的空闲时间段列表。
     *
     * @param templates       教练的所有空闲时间模板列表 (通常定义了星期几和时间范围)。
     * @param currentDate     需要为其生成空闲时段的具体日期。
     * @param currentDayOfWeek currentDate 对应的星期几 (整数表示，例如 1=周一, 7=周日，与 DayOfWeek.getValue() 对应)。
     * 传入此参数是为了避免在循环中重复计算。
     * @param zoneId          计算时区。用于将模板中的 LocalTime 结合具体日期转换为精确的时间点 (Instant)，
     * 正确处理夏令时等时区规则。
     * @return 一个包含当天所有潜在空闲时间段 (TimeInterval) 的列表，按开始时间排序。如果模板无效或当天无匹配模板，则列表为空。
     */
    private List<TimeInterval> generatePotentialSlotsForDate(List<Availability> templates, LocalDate currentDate, int currentDayOfWeek, ZoneId zoneId) {
        List<TimeInterval> potentialSlots = new ArrayList<>();
        for(Availability template : templates){
            if(!Objects.isNull(template.getDayOfWeek()) && template.getDayOfWeek() == currentDayOfWeek){
               //将模版的时间转化为精确时间点
               //结合具体的日期（currentDate），模版的本地开始时间和指定的时区
               //创建一个ZoneDateTime对象，代表有时区的精确日期和时间
               ZonedDateTime potentialStart = ZonedDateTime.of(currentDate,template.getStartTime(),zoneId);

               ZonedDateTime potentialEnd = ZonedDateTime.of(currentDate,template.getEndTime(),zoneId);

               //创建TimeInterval并添加到列表
               //将ZoneDateTime转化为Instant，不带时区信息，适合进行时间段的比较和计算
               potentialSlots.add(new TimeInterval(potentialStart.toInstant(),potentialEnd.toInstant()));
            }
        }

        // --- 排序和日志记录 ---
        // 对生成的所有潜在空闲时段按开始时间进行排序。
        // 这有助于提高后续处理（如下一步的区间减法）的可读性
        potentialSlots.sort(Comparator.comparing(TimeInterval::getStart));

        return potentialSlots;
    }

    /**
     * 通过从潜在空闲区间中减去已预订的区间，计算实际的空闲时间区间。
     * 此方法执行区间减法。
     */
    public List<TimeInterval> calculateFreeSlots(List<TimeInterval> potentialSlots,List<TimeInterval> bookedIntervals){
        List<TimeInterval> currentFreeSlots = new ArrayList<>(potentialSlots);

        //遍历每一个已预订的区间，将其从当前空余时间删除
        for(TimeInterval booked : bookedIntervals){
            List<TimeInterval> nextIterationFreeSlots = new ArrayList<>();
            for (TimeInterval free : currentFreeSlots){
                if(free.overlaps(booked)){
                    //计算预定时间段前和后的部分
                    if(free.getStart().isBefore(booked.getStart())){
                        nextIterationFreeSlots.add(new TimeInterval(free.getStart(),booked.getStart()));
                    }
                    if(free.getEnd().isAfter(booked.getEnd())){
                        nextIterationFreeSlots.add(new TimeInterval(booked.getEnd(),free.getEnd()));
                    }
                }
                else {
                    nextIterationFreeSlots.add(free);
                }
            }
            //更新空闲区间列表，为下一个booked区间作准备
            currentFreeSlots = nextIterationFreeSlots;
        }
        return currentFreeSlots;
    }

    /**
     * **(策略 C: 铺满/Tiling)** 从实际空闲时间区间列表生成刚好能放下
     * 的、背靠背的课程开始时间点（以Instant表示）。
     * 这个版本最不灵活，但结果最清晰，不会产生误导。
     *
     * @param freeSlots 实际空闲时间区间列表
     * @param courseDuration 课程所需的时长
     * @return 可预约的开始时间点 (Instant) 列表
     */
    private List<Instant> generateBookableStartsFromFreeSlots(List<TimeInterval> freeSlots, Duration courseDuration) {
        List<Instant> bookableStarts = new ArrayList<>();

        // 确保课程时长有效
        if (courseDuration == null || courseDuration.isZero() || courseDuration.isNegative()) {
            return bookableStarts;
        }

        for (TimeInterval free : freeSlots) {
            Instant potentialStart = free.getStart();
            Instant slotEnd = free.getEnd();

            // 核心逻辑：只要从 potentialStart 开始加上课程时长，不超过空闲时段的结束点
            while (!potentialStart.plus(courseDuration).isAfter(slotEnd)) {
                // 添加这个有效的开始时间点
                bookableStarts.add(potentialStart);
                // 直接移动到下一节课可能开始的时间点 (课程时长)
                potentialStart = potentialStart.plus(courseDuration);
            }
        }
        return bookableStarts;
    }


    @Data
    @AllArgsConstructor
    private static class TimeInterval {
        private Instant start; // 开始时间（包含）
        private Instant end;   // 结束时间（不包含）

        /**
         * 计算区间的时长。如果 end 不在 start 之后，则返回 ZERO。
         */
        public Duration getDuration() {
            if (start == null || end == null || !end.isAfter(start)) {
                return Duration.ZERO;
            }
            return Duration.between(start, end);
        }

        /**
         * 检查此时间区间是否与另一个时间区间重叠。
         * 假设两个区间的 start 和 end 都不为 null。
         * 重叠条件: this.start < other.end AND this.end > other.start
         */
        public boolean overlaps(TimeInterval other) {
            // 基本的空值检查以保证安全
            if (other == null || this.start == null || this.end == null || other.start == null || other.end == null) {
                return false; // 无效区间不重叠
            }
            return this.start.isBefore(other.end) && this.end.isAfter(other.start);
        }
    }
}