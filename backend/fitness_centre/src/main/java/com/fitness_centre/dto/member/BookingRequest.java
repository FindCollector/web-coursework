package com.fitness_centre.dto.member;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

/**
 * @author
 * @Classname BookingRequest
 * @Description TODO
 * @date 13/04/2025
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class BookingRequest {
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    @JsonSerialize(using = ToStringSerializer.class)
    private Long coachId;
    private Integer dayOfWeek;
    @JsonFormat(pattern = "HH:mm") // 控制 JSON 输出格式为 HH:mm
    private LocalTime startTime;

    @JsonFormat(pattern = "HH:mm") // 控制 JSON 输出格式为 HH:mm
    private LocalTime endTime;

    private String message;
}