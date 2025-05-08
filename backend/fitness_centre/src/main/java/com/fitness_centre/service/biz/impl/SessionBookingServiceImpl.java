package com.fitness_centre.service.biz.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.fitness_centre.constant.ErrorCode;
import com.fitness_centre.constant.RequestStatus;
import com.fitness_centre.constant.UserRole;
import com.fitness_centre.domain.*;
import com.fitness_centre.dto.GeneralResponseResult;
import com.fitness_centre.dto.member.BookingRequest;
import com.fitness_centre.dto.session.ScheduleListResponse;
import com.fitness_centre.dto.session.SessionListResponse;
import com.fitness_centre.dto.member.TimeSlotRequest;
import com.fitness_centre.exception.BusinessException;
import com.fitness_centre.exception.SystemException;
import com.fitness_centre.mapper.*;
import com.fitness_centre.service.biz.interfaces.SessionBookingService;
import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

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

    @Autowired
    private SubscriptionMapper subscriptionMapper;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private TrainingHistoryMapper historyMapper;

    @Autowired
    private SessionBookingMapper sessionBookingMapper; // 显式注入，供单元测试 Mock

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
                                    LocalDate date = startDateTime.toLocalDate();
                                    return new TimeSlotRequest(startTime, endTime,date); // 创建 DTO
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

    public GeneralResponseResult bookingSession(Long memberId, BookingRequest request){
        //先检查是不是已经订阅了的
        LambdaQueryWrapper<Subscription> subscriptionLambdaQueryWrapper = new LambdaQueryWrapper<>();
        subscriptionLambdaQueryWrapper.eq(Subscription::getMemberId,memberId)
                .eq(Subscription::getCoachId,request.getCoachId());
        Long subscriptionCount = subscriptionMapper.selectCount(subscriptionLambdaQueryWrapper);
        if(Objects.isNull(subscriptionCount) || subscriptionCount == 0){
            throw new BusinessException(ErrorCode.INVALID_PARAMETER.getCode(),"Please subscribe to this coach first");
        }

        SessionBooking sessionBooking = new SessionBooking();

        LocalDate today = LocalDate.now();
        LocalDate nextMonday = today.with(TemporalAdjusters.next(DayOfWeek.MONDAY));

        LocalDate targetDate = nextMonday.plusDays(request.getDayOfWeek() - 1);

        LocalDateTime startTime = targetDate.atTime(request.getStartTime());
        LocalDateTime endTime = targetDate.atTime(request.getEndTime());


        // 检查已经被接受的预定的课是否有重叠
        LambdaQueryWrapper<SessionBooking> overlapCheckWrapper = new LambdaQueryWrapper<>();
        overlapCheckWrapper.eq(SessionBooking::getMemberId,memberId)
                        .eq(SessionBooking::getStatus,RequestStatus.ACCEPT)
                        .lt(SessionBooking::getStartTime,endTime)
                        .gt(SessionBooking::getEndTime,startTime);
        Long overlappingCount = this.baseMapper.selectCount(overlapCheckWrapper);
        if(overlappingCount != 0){
            throw new BusinessException(ErrorCode.INVALID_PARAMETER.getCode(),"You already exist in the course at this time");
        }

        //检查还在等待中的预定的课是否有重叠
        LambdaQueryWrapper<SessionBooking> pendingOverlapCheckWrapper = new LambdaQueryWrapper<>();
        pendingOverlapCheckWrapper.eq(SessionBooking::getMemberId,memberId)
                .eq(SessionBooking::getStatus,RequestStatus.PENDING)
                .lt(SessionBooking::getStartTime,endTime)
                .gt(SessionBooking::getEndTime,startTime);
        Long pendingOverlappingCount = this.baseMapper.selectCount(pendingOverlapCheckWrapper);
        if(pendingOverlappingCount != 0){
            throw new BusinessException(ErrorCode.INVALID_PARAMETER.getCode(),"There is a time overlap between the course you are booking and the pending course, please withdraw the pending course before booking this course.");
        }

        sessionBooking.setStartTime(startTime);
        sessionBooking.setEndTime(endTime);
        sessionBooking.setCoachId(request.getCoachId());
        sessionBooking.setMemberId(memberId);
        sessionBooking.setStatus(RequestStatus.PENDING);
        sessionBooking.setRequestTime(LocalDateTime.now());
        sessionBooking.setMessage(request.getMessage());
        sessionBooking.setCoachIsRead(false);
        sessionBooking.setMemberIsRead(true);
        sessionBooking.setIsRecord(false);

        int row = this.baseMapper.insert(sessionBooking);
        if(row <= 0){
            throw new SystemException(ErrorCode.DB_OPERATION_ERROR);
        }

        return new GeneralResponseResult(ErrorCode.SUCCESS);
    }

    @Override
    public GeneralResponseResult withdrawRequest(Long memberId, Long requestId) {
        LambdaQueryWrapper<SessionBooking>lambdaQueryWrapper = new LambdaQueryWrapper<>();
        lambdaQueryWrapper.eq(SessionBooking::getMemberId,memberId)
                .eq(SessionBooking::getId,requestId);
        SessionBooking sessionBooking = this.baseMapper.selectOne(lambdaQueryWrapper);
        if(!sessionBooking.getStatus().equals(RequestStatus.PENDING)){
            throw new BusinessException(ErrorCode.INVALID_PARAMETER.getCode(),"Only pending requests can be withdrawn.");
        }
        int rows = this.baseMapper.delete(lambdaQueryWrapper);
        if (rows <= 0){
            throw new SystemException(ErrorCode.DB_OPERATION_ERROR);
        }
        return new GeneralResponseResult(ErrorCode.SUCCESS);
    }


    public GeneralResponseResult cancelBooking(Long memberId,Long bookingId){
        //只能提前24小时取消，否则这节课算是上了（也就是要付费了）
        LambdaQueryWrapper<SessionBooking> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(SessionBooking::getMemberId,memberId)
                .eq(SessionBooking::getId,bookingId);
        SessionBooking sessionBooking = this.baseMapper.selectOne(queryWrapper);
        LocalDate yesterday = LocalDate.now().minusDays(1);
        if(sessionBooking.getStartTime().toLocalDate().isAfter(yesterday)){
            throw new BusinessException(ErrorCode.INVALID_PARAMETER.getCode(),"Free cancellation only 24 hours in advance");
        }
        LambdaUpdateWrapper<SessionBooking> updateWrapper = new LambdaUpdateWrapper<>();
        updateWrapper.eq(SessionBooking::getId,bookingId)
                .eq(SessionBooking::getMemberId,memberId)
                .set(SessionBooking::getStatus,RequestStatus.CANCEL)
                .set(SessionBooking::getCancelTime,LocalDateTime.now())
                .set(SessionBooking::getMemberIsRead,true)
                .set(SessionBooking::getCoachIsRead,false);
        int row = this.baseMapper.update(updateWrapper);
        if(row <= 0){
            throw new SystemException(ErrorCode.DB_OPERATION_ERROR);
        }
        return new GeneralResponseResult(ErrorCode.SUCCESS);
    }

    public GeneralResponseResult getBookingSchedule(Long userId,UserRole role){
        LocalDate today = LocalDate.now();

        // --- 计算本周时间范围 ---
        // 找到本周的周一 (如果是周一，则返回当天)
        LocalDate currentMonday = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        // 找到下周的周一
        LocalDate nextMonday = today.with(TemporalAdjusters.next(DayOfWeek.MONDAY));
        // 本周的开始时间 (本周一 00:00:00)
        LocalDateTime currentWeekStart = currentMonday.atStartOfDay();
        // 本周的结束时间 (下周一 00:00:00, 查询时用 <)
        LocalDateTime currentWeekEnd = nextMonday.atStartOfDay(); // 查询区间 [currentWeekStart, currentWeekEnd)


        // --- 计算下周时间范围 ---
        // 下周的开始时间 (下周一 00:00:00)
        LocalDateTime nextWeekStart = nextMonday.atStartOfDay();
        // 找到下下周的周一
        LocalDate followingMonday = nextMonday.plusWeeks(1);
        // 下周的结束时间 (下下周一 00:00:00, 查询时用 <)
        LocalDateTime nextWeekEnd = followingMonday.atStartOfDay(); // 查询区间 [nextWeekStart, nextWeekEnd)

        // --- 查询并处理本周数据 ---
        List<SessionBooking> currentWeekBookings = fetchBookingsForRange(userId, role, currentWeekStart, currentWeekEnd);
        Map<String, Object> currentWeekData = processBookings(currentWeekBookings);


        // --- 查询并处理下周数据 ---
        List<SessionBooking> nextWeekBookings = fetchBookingsForRange(userId, role, nextWeekStart, nextWeekEnd);
        Map<String, Object> nextWeekData = processBookings(nextWeekBookings);

        // --- 构建最终响应 ---
        Map<String, Object> dataMap = new HashMap<>();
        dataMap.put("currentWeek", currentWeekData);
        dataMap.put("nextWeek", nextWeekData);

        return new GeneralResponseResult(ErrorCode.SUCCESS, dataMap);
    }

    private List<SessionBooking> fetchBookingsForRange(Long userId,UserRole role,LocalDateTime rangeStart,LocalDateTime rangeEnd){
        LambdaQueryWrapper<SessionBooking> queryWrapper = new LambdaQueryWrapper<>();
        switch (role){
            case MEMBER -> queryWrapper.eq(SessionBooking::getMemberId,userId);
            case COACH -> queryWrapper.eq(SessionBooking::getCoachId,userId);
        }
        queryWrapper.eq(SessionBooking::getStatus,RequestStatus.ACCEPT)
                .ge(SessionBooking::getStartTime,rangeStart)
                .lt(SessionBooking::getStartTime,rangeEnd)
                .orderByDesc(SessionBooking::getStartTime);
        return this.baseMapper.selectList(queryWrapper);
    }
    /**
     * 处理查询到的预订列表，生成 listView 和 calendarView
     */
    private Map<String, Object> processBookings(List<SessionBooking> bookings) {
        // 注意：这里的用户名查询存在N+1问题，如果性能敏感，建议优化
        // 优化方法：先收集所有需要的 coachId 和 memberId，然后一次性查询User表，再进行映射
        List<ScheduleListResponse> listView = bookings.stream()
                .map(booking -> {
                    // --- 获取教练名称 ---
                    // 考虑缓存或批量查询优化
                    LambdaQueryWrapper<User> coachNameQueryWrapper = new LambdaQueryWrapper<>();
                    coachNameQueryWrapper.eq(User::getId, booking.getCoachId()).select(User::getUserName); // 仅查询需要的字段
                    User coach = userMapper.selectOne(coachNameQueryWrapper);
                    String coachName = (coach != null) ? coach.getUserName() : "N/A"; // 添加null检查

                    // --- 获取会员名称 ---
                    // 考虑缓存或批量查询优化
                    LambdaQueryWrapper<User> memberNameQueryWrapper = new LambdaQueryWrapper<>();
                    memberNameQueryWrapper.eq(User::getId, booking.getMemberId()).select(User::getUserName); // 仅查询需要的字段
                    User member = userMapper.selectOne(memberNameQueryWrapper);
                    String memberName = (member != null) ? member.getUserName() : "N/A"; // 添加null检查

                    // --- 时间处理 ---
                    LocalTime startTime = booking.getStartTime().toLocalTime();
                    LocalTime endTime = booking.getEndTime().toLocalTime();
                    int dayOfWeek = booking.getStartTime().getDayOfWeek().getValue(); // 1 (Monday) to 7 (Sunday)

                    return new ScheduleListResponse(
                            booking.getId(),
                            booking.getCoachId(),
                            booking.getMemberId(),
                            dayOfWeek,
                            startTime,
                            endTime,
                            coachName,
                            memberName,
                            booking.getMessage()
                    );
                })
                // .filter(Objects::nonNull) // map 中已处理null用户，除非ScheduleListResponse构造函数会返回null
                .collect(Collectors.toList());

        // 按星期几分组，并使用 TreeMap 保证按键（星期几）排序
        Map<Integer, List<ScheduleListResponse>> calendarView = listView.stream()
                .collect(Collectors.groupingBy(
                        ScheduleListResponse::getDayOfWeek, // 分组依据
                        TreeMap::new,                     // 使用 TreeMap 保证按星期排序
                        Collectors.toList()               // 收集为 List
                ));
        // 将 listView 和 calendarView 放入结果 Map
        Map<String, Object> resultData = new HashMap<>();
        resultData.put("listView", listView);
        resultData.put("calendarView", calendarView); // 注意这里的 key 是 calenderView 还是 calendarView
        return resultData;
    }

    public GeneralResponseResult getBookingRequest(Long userId, int pageNow, int pageSize, List<RequestStatus> statusList,UserRole role){
        //todo coach要将返回的时间分组,每周清空请求
        LambdaQueryWrapper<SessionBooking> queryWrapper = new LambdaQueryWrapper<>();
        switch (role){
            case MEMBER -> {
                queryWrapper.eq(SessionBooking::getMemberId,userId);
                queryWrapper.orderByAsc(SessionBooking::getMemberIsRead);
            }
            case COACH -> {
                queryWrapper.eq(SessionBooking::getCoachId,userId);
                queryWrapper.orderByAsc(SessionBooking::getCoachIsRead);
            }
            default -> throw new BusinessException(ErrorCode.INVALID_PARAMETER.getCode(),"Illegal roles");
        }
        queryWrapper.ne(SessionBooking::getStatus,RequestStatus.DELETE);

        if(!Objects.isNull(statusList) && !statusList.isEmpty()){
            queryWrapper.in(SessionBooking::getStatus,statusList);
        }
        //排序
        queryWrapper.orderByDesc(SessionBooking::getRequestTime);

        // 创建分页对象，pageNow 表示当前页数，pageSize 表示每页显示的记录数
        Page<SessionBooking> bookingPage = new Page<>(pageNow, pageSize);

        // 分页查询
        bookingPage = this.baseMapper.selectPage(bookingPage, queryWrapper);

        List<SessionListResponse> responseList = sessionToSessionResponse(bookingPage);

//        Map<LocalDateTime, List<SessionListResponse>> dataMap = responseList.stream()
//                .collect(Collectors.groupingBy(
//                        SessionListResponse::getStartTime,
//                        LinkedHashMap::new,
//                        Collectors.toList()
//                ));

        Page<SessionListResponse> responsePage = new Page<>();
        responsePage.setCurrent(bookingPage.getCurrent());
        responsePage.setSize(bookingPage.getSize());
        responsePage.setTotal(bookingPage.getTotal());
        responsePage.setRecords(responseList);


        return new GeneralResponseResult(ErrorCode.SUCCESS,responsePage);
    }

    public List<SessionListResponse> sessionToSessionResponse(Page<SessionBooking> bookingPage){
        List<SessionListResponse> responseList = bookingPage.getRecords().stream()
                .map(sessionBooking -> {
                    SessionListResponse response = new SessionListResponse();
                    BeanUtils.copyProperties(sessionBooking,response);

                    LambdaQueryWrapper<User> memberLambdaQueryWrapper = new LambdaQueryWrapper<>();
                    memberLambdaQueryWrapper.eq(User::getId,sessionBooking.getMemberId());
                    response.setMemberName(userMapper.selectOne(memberLambdaQueryWrapper).getUserName());

                    LambdaQueryWrapper<User> coachLambdaQueryWrapper = new LambdaQueryWrapper<>();
                    coachLambdaQueryWrapper.eq(User::getId,sessionBooking.getCoachId());
                    response.setCoachName(userMapper.selectOne(coachLambdaQueryWrapper).getUserName());

                    return response;
                }).collect(Collectors.toList());

        return responseList;
    }

    public GeneralResponseResult countUnreadRequest(Long userId, UserRole role){
        LambdaQueryWrapper<SessionBooking> queryWrapper = new LambdaQueryWrapper<>();
        switch (role){
            case MEMBER -> queryWrapper.eq(SessionBooking::getMemberId,userId)
                    .eq(SessionBooking::getMemberIsRead,false);
            case COACH -> queryWrapper.eq(SessionBooking::getCoachId,userId)
                    .eq(SessionBooking::getCoachIsRead,false);
        }
        Long count = this.baseMapper.selectCount(queryWrapper);
        Map<String,Long> map = new HashMap<>();
        map.put("count",count);
        return new GeneralResponseResult(ErrorCode.SUCCESS,map);
    }

    @Override
    public GeneralResponseResult readRequest(Long requestId, Long userId, UserRole role) {
        LambdaUpdateWrapper<SessionBooking> updateWrapper = new LambdaUpdateWrapper<>();
        switch (role){
            case  MEMBER ->
                updateWrapper.eq(SessionBooking::getMemberId,userId)
                        .eq(SessionBooking::getId,requestId)
                        .set(SessionBooking::getMemberIsRead,true);

            case COACH ->
                updateWrapper.eq(SessionBooking::getCoachId,userId)
                        .eq(SessionBooking::getId,requestId)
                        .set(SessionBooking::getCoachIsRead,true);
            default ->
                throw new BusinessException(ErrorCode.INVALID_PARAMETER.getCode(),"Illegal roles");
        }

        try{
            int rows = this.baseMapper.update(updateWrapper);
            if(rows <= 0){
                throw new SystemException(ErrorCode.DB_OPERATION_ERROR);
            }
        }
        catch (Exception e){
            throw new SystemException(ErrorCode.DB_OPERATION_ERROR);
        }
        return new GeneralResponseResult(ErrorCode.SUCCESS);
    }

    @Override
    public GeneralResponseResult coachHandleRequest(Long requestId, Long coachId, RequestStatus status,String reply) {
        if(Objects.isNull(reply)){
            throw new BusinessException(ErrorCode.INVALID_PARAMETER.getCode(),"Please bring your reply");
        }
        LambdaUpdateWrapper<SessionBooking> updateAcceptWrapper = new LambdaUpdateWrapper<>();
        updateAcceptWrapper.eq(SessionBooking::getCoachId,coachId)
                .eq(SessionBooking::getId,requestId)
                .set(SessionBooking::getStatus,status)
                .set(SessionBooking::getReply,reply)
                .set(SessionBooking::getResponseTime,LocalDateTime.now())
                .set(SessionBooking::getCoachIsRead,true)
                .set(SessionBooking::getMemberIsRead,false);

        int rows = this.baseMapper.update(updateAcceptWrapper);
        if(rows <= 0){
            throw new SystemException(ErrorCode.DB_OPERATION_ERROR.getCode(),"Database connection error");
        }
        LambdaQueryWrapper<SessionBooking> sessionBookingLambdaQueryWrapper = new LambdaQueryWrapper<>();
        sessionBookingLambdaQueryWrapper.eq(SessionBooking::getId,requestId);
        SessionBooking sessionBooking = this.baseMapper.selectOne(sessionBookingLambdaQueryWrapper);
        String autoReply = "Sorry, this slot is already taken.";

        LambdaUpdateWrapper<SessionBooking> updateRejectWrapper = new LambdaUpdateWrapper<>();
        updateRejectWrapper.eq(SessionBooking::getCoachId,coachId)
                .ne(SessionBooking::getId,requestId)
                .eq(SessionBooking::getStartTime,sessionBooking.getStartTime())
                .eq(SessionBooking::getEndTime,sessionBooking.getEndTime())
                .set(SessionBooking::getReply,autoReply)
                .set(SessionBooking::getStatus,RequestStatus.REJECT)
                .set(SessionBooking::getResponseTime,LocalDateTime.now())
                .set(SessionBooking::getCoachIsRead,true)
                .set(SessionBooking::getMemberIsRead,false);

        this.baseMapper.update(updateRejectWrapper);

        return new GeneralResponseResult(ErrorCode.SUCCESS);
    }

    @Override
    public GeneralResponseResult coachGetUnRecordSession(Long coachId,int pageNow,int pageSize) {
        LambdaQueryWrapper<SessionBooking> sessionBookingLambdaQueryWrapper = new LambdaQueryWrapper<>();
        sessionBookingLambdaQueryWrapper.le(SessionBooking::getEndTime,LocalDateTime.now())
                .eq(SessionBooking::getIsRecord,false);
        Page<SessionBooking> bookingPage = new Page<>(pageNow, pageSize);
        bookingPage= this.baseMapper.selectPage(bookingPage,sessionBookingLambdaQueryWrapper);
        List<SessionListResponse> responseList = sessionToSessionResponse(bookingPage);
        Page<SessionListResponse> responsePage = new Page<>();
        responsePage.setCurrent(bookingPage.getCurrent());
        responsePage.setSize(bookingPage.getSize());
        responsePage.setTotal(bookingPage.getTotal());
        responsePage.setRecords(responseList);
        return new GeneralResponseResult(ErrorCode.SUCCESS,responsePage);

    }

    @Override
    public GeneralResponseResult countUnRecordSession(Long coachId) {
        LambdaQueryWrapper<SessionBooking> sessionQueryWrapper = new LambdaQueryWrapper<>();
        sessionQueryWrapper.eq(SessionBooking::getCoachId,coachId)
                .le(SessionBooking::getEndTime,LocalDateTime.now())
                .eq(SessionBooking::getIsRecord,false);
        Long count = this.baseMapper.selectCount(sessionQueryWrapper);
        Map<String,Long> dataMap = new HashMap<>();
        dataMap.put("count",count);
        return new GeneralResponseResult(ErrorCode.SUCCESS,dataMap);
    }

    // setter 注入在单元测试 @InjectMocks 时也会被调用，从而同步 baseMapper
    @Autowired
    public void setSessionBookingMapper(SessionBookingMapper sessionBookingMapper) {
        this.sessionBookingMapper = sessionBookingMapper;
        super.baseMapper = sessionBookingMapper;
    }

}