package com.fitness_centre.service.biz.interfaces;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.fitness_centre.domain.Tag;
import com.fitness_centre.domain.TrainingHistory;
import com.fitness_centre.dto.GeneralResponseResult;
import com.fitness_centre.dto.TrainingHistoryListResponse;
import org.springframework.cglib.core.Local;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * @author
 * @Classname TrainingHistoryService
 * @Description TODO
 * @date 19/04/2025
 */

public interface TrainingHistoryService extends IService<TrainingHistory> {
    GeneralResponseResult addTrainingHistory(Long coachId,Long sessionId, String feedback, List<Long> tagList);

    GeneralResponseResult<IPage<TrainingHistoryListResponse>> viewTrainingHistory(Long memberId, int pageNow, int pageSize, LocalDate startDate, LocalDate endDate);

    GeneralResponseResult countUnReadTrainingHistory(Long memberId);

    GeneralResponseResult readTrainingHistory(Long memberId,Long historyId);

}
