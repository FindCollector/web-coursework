package com.fitness_centre.dto.member;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * @author
 * @Classname TimeSlotRequest
 * @Description TODO
 * @date 13/04/2025
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class TimeSlotRequest {
    @JsonFormat(pattern = "HH:mm")
    private LocalTime start;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime end;

    private LocalDate date;
}