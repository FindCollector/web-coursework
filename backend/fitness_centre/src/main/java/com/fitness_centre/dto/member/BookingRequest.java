package com.fitness_centre.dto.member;

import com.fasterxml.jackson.annotation.JsonFormat;
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
    private Integer dayOfWeek;
    @JsonFormat(pattern = "HH:mm") // 控制 JSON 输出格式为 HH:mm
    private LocalTime start;

    @JsonFormat(pattern = "HH:mm") // 控制 JSON 输出格式为 HH:mm
    private LocalTime end;
}