package com.fitness_centre.service.biz.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.fitness_centre.constant.ErrorCode;
import com.fitness_centre.domain.HistoryTag;
import com.fitness_centre.domain.SessionBooking;
import com.fitness_centre.domain.TrainingHistory;
import com.fitness_centre.domain.User;
import com.fitness_centre.dto.GeneralResponseResult;
import com.fitness_centre.dto.TrainingHistoryListResponse;
import com.fitness_centre.exception.SystemException;
import com.fitness_centre.mapper.*;
import com.fitness_centre.service.biz.interfaces.TrainingHistoryService;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * @author
 * @Classname TrainingHistoryServiceImpl
 * @Description DONE
 * @date 19/04/2025
 */
@Service
public class TrainingHistoryServiceImpl extends ServiceImpl<TrainingHistoryMapper,TrainingHistory> implements TrainingHistoryService {
    @Autowired
    private SessionBookingMapper sessionBookingMapper;

    @Autowired
    private HistoryTagMapper historyTagMapper;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private TagMapper tagMapper;

    @Autowired
    private TrainingHistoryMapper trainingHistoryMapper;

    @Autowired
    public void setTrainingHistoryMapper(TrainingHistoryMapper trainingHistoryMapper) {
        this.trainingHistoryMapper = trainingHistoryMapper;
        super.baseMapper = trainingHistoryMapper;
    }

    @Override
    public GeneralResponseResult addTrainingHistory(Long coachId,Long sessionId, String feedback,List<Long> tagList) {
        // 使用普通QueryWrapper代替LambdaQueryWrapper
        QueryWrapper<SessionBooking> sessionQueryWrapper = new QueryWrapper<>();
        sessionQueryWrapper.eq("id", sessionId).eq("coach_id", coachId);
        SessionBooking sessionBooking = sessionBookingMapper.selectOne(sessionQueryWrapper);
        TrainingHistory trainingHistory = new TrainingHistory();
        BeanUtils.copyProperties(sessionBooking,trainingHistory,"id");
        trainingHistory.setMemberIsRead(false);
        trainingHistory.setFeedback(feedback);
        //为了之后的主键回填
        trainingHistory.setId(null);
        int rows = this.trainingHistoryMapper.insert(trainingHistory);
        if (rows <= 0){
            throw new SystemException(ErrorCode.DB_OPERATION_ERROR);
        }
        //将这条Session标记为已记录
        // 使用普通UpdateWrapper代替LambdaUpdateWrapper
        UpdateWrapper<SessionBooking> sessionUpdateWrapper = new UpdateWrapper<>();
        sessionUpdateWrapper.eq("id", sessionId).set("is_record", true);
        rows = sessionBookingMapper.update(sessionUpdateWrapper);
        if (rows <= 0){
            throw new SystemException(ErrorCode.DB_OPERATION_ERROR);
        }
        Long newHistoryId = trainingHistory.getId();
        if(!tagList.isEmpty() && !Objects.isNull(tagList)){
            //将history和tag关联
            for(Long tagId:tagList){
                HistoryTag historyTag = new HistoryTag();
                historyTag.setHistoryId(newHistoryId);
                historyTag.setTagId(tagId);
                int linkRows = historyTagMapper.insert(historyTag);
                if(linkRows <= 0){
                    throw new SystemException(ErrorCode.DB_OPERATION_ERROR);
                }
            }
        }
        return new GeneralResponseResult(ErrorCode.SUCCESS);
    }

    @Override
    public GeneralResponseResult viewTrainingHistory(Long memberId, int pageNow, int pageSize, LocalDate startDate, LocalDate endDate) {
// 1. 创建分页参数对象
        Page<TrainingHistory> pageParam = new Page<>(pageNow, pageSize);

        // 2. 设置查询条件
        // 使用普通QueryWrapper代替LambdaQueryWrapper
        QueryWrapper<TrainingHistory> trainHistoryWrapper = new QueryWrapper<>();
        trainHistoryWrapper.eq("member_id", memberId);
        if(startDate != null && endDate != null){
            LocalDateTime startTime = startDate.atStartOfDay();
            LocalDateTime endTime = endDate.atStartOfDay();
            trainHistoryWrapper.ge("start_time", startTime)
                    .le("end_time", endTime);
        }
        trainHistoryWrapper.orderByDesc("start_time");

        // 3. 执行分页查询，获取分页结果 IPage<TrainingHistory>
        IPage<TrainingHistory> historyPage = this.trainingHistoryMapper.selectPage(pageParam, trainHistoryWrapper);

        // 4. 将查询到的实体列表 (TrainingHistory) 转换为响应列表 (TrainingHistoryListResponse)
        //    注意：此处的 .map() 内部仍然会为每条记录执行数据库查询，存在 N+1 问题
        List<TrainingHistoryListResponse> responseList = historyPage.getRecords().stream()
                .map(trainingHistory -> {
                    TrainingHistoryListResponse response = new TrainingHistoryListResponse();
                    // 复制基础属性: id, startTime, endTime, message, feedback 等
                    BeanUtils.copyProperties(trainingHistory, response);

                    // --- 以下查询未优化 ---
                    // 根据 memberId 查询会员名称
                    // **重要修正**：原代码使用 response.getId() 查询是错误的，应使用 trainingHistory 中的 ID。
                    // 这里假设使用 trainingHistory.getMemberId() 获取会员ID。
                    // 使用普通QueryWrapper代替LambdaQueryWrapper
                    QueryWrapper<User> memberQueryWrapper = new QueryWrapper<>();
                    memberQueryWrapper.eq("id", trainingHistory.getMemberId()); // 使用 trainingHistory 的 memberId
                    User member = userMapper.selectOne(memberQueryWrapper);
                    response.setMemberName(member != null ? member.getUserName() : "未知用户");

                    // 根据 coachId 查询教练名称
                    // **重要假设与修正**：假设 TrainingHistory 实体中有 coachId 字段，并且原代码意图是查询教练。
                    // 原代码使用 response.getId() 是错误的。这里假设使用 trainingHistory.getCoachId()。
                    // 如果 TrainingHistory 没有 coachId，你需要调整这里的逻辑。
                    // 使用普通QueryWrapper代替LambdaQueryWrapper
                    QueryWrapper<User> coachQueryWrapper = new QueryWrapper<>();
                    coachQueryWrapper.eq("id", trainingHistory.getCoachId()); // 假设有 getCoachId() 方法
                    User coach = userMapper.selectOne(coachQueryWrapper);
                    response.setCoachName(coach != null ? coach.getUserName() : "未知教练");

                    // 查询标签列表
                    response.setTagList(tagMapper.findTagsByHistoryId(trainingHistory.getId()));
                    // --- 查询结束 ---

                    return response;
                }).collect(Collectors.toList());

        // 5. 创建用于返回的 Page 对象 (IPage<TrainingHistoryListResponse>)
        //    将原始分页信息（页码、大小、总数）和转换后的列表组合起来
        Page<TrainingHistoryListResponse> responsePage = new Page<>(historyPage.getCurrent(), historyPage.getSize(), historyPage.getTotal());
        responsePage.setRecords(responseList);

        // 6. 返回包含分页结果的响应对象
        //    假设 GeneralResponseResult 支持泛型 <T>
        return new GeneralResponseResult<>(ErrorCode.SUCCESS, responsePage);
    }

    @Override
    public GeneralResponseResult countUnReadTrainingHistory(Long memberId) {
        // 使用普通QueryWrapper代替LambdaQueryWrapper
        QueryWrapper<TrainingHistory> trainingHistoryWrapper = new QueryWrapper<>();
        trainingHistoryWrapper.eq("member_id", memberId).eq("member_is_read", false);
        Long count = this.trainingHistoryMapper.selectCount(trainingHistoryWrapper);
        Map<String,Long> dataMap = new HashMap<>();
        dataMap.put("count",count);
        return new GeneralResponseResult(ErrorCode.SUCCESS,dataMap);
    }

    @Override
    public GeneralResponseResult readTrainingHistory(Long memberId,Long historyId) {
        // 使用普通UpdateWrapper代替LambdaUpdateWrapper
        UpdateWrapper<TrainingHistory> updateWrapper = new UpdateWrapper<>();
        updateWrapper.eq("member_id", memberId)
                .eq("id", historyId)
                .set("member_is_read", true);
        int rows = this.trainingHistoryMapper.update(updateWrapper);
        if (rows <= 0){
            throw new SystemException(ErrorCode.DB_OPERATION_ERROR);
        }
        return new GeneralResponseResult(ErrorCode.SUCCESS);
    }


}