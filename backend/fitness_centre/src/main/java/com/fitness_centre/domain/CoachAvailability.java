package com.fitness_centre.domain;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalTime;

/**
 * @author
 * @Classname Availability
 * @Description TODO
 * @date 06/04/2025
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@TableName("coach_availability")
public class CoachAvailability implements Serializable {
    private static final long serialVersionUID = -8566309550909182243L;

    @TableId(type = IdType.ASSIGN_ID)
    @JsonSerialize(using = ToStringSerializer.class)
    private Long id;

    private Long coachId;

    private Integer dayOfWeek;

    private LocalTime startTime;

    private LocalTime endTime;
}