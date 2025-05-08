package com.fitness_centre.domain;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * @author
 * @Classname TrainingHistory
 * @Description DONE
 * @date 18/04/2025
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@TableName("training_history")
public class TrainingHistory implements Serializable {
    private static final long serialVersionUID = -3493221730309898757L;
    @TableId(type = IdType.ASSIGN_ID)
    @JsonSerialize(using = ToStringSerializer.class)
    private Long id;
    @JsonSerialize(using = ToStringSerializer.class)
    private Long coachId;
    @JsonSerialize(using = ToStringSerializer.class)
    private Long memberId;

    private String message;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm")
    private LocalDateTime startTime;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm")
    private LocalDateTime endTime;
    private String feedback;
    private Boolean memberIsRead;
}