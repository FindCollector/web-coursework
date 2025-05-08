package com.fitness_centre.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import com.fitness_centre.domain.Tag;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.NonNull;

import java.time.LocalDateTime;
import java.util.List;

/**
 * @author
 * @Classname TrainingHistoryListResponse
 * @Description DONE
 * @date 19/04/2025
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class TrainingHistoryListResponse {

    @JsonFormat(shape = JsonFormat.Shape.STRING)
    @JsonSerialize(using = ToStringSerializer.class)
    private Long id;

    private String memberName;

    private String coachName;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm")
    private LocalDateTime startTime;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm")
    private LocalDateTime endTime;

    private String message;

    private Boolean memberIsRead;

    private String feedback;

    private List<Tag> tagList;
}