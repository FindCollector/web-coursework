package com.fitness_centre.dto.coach;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

/**
 * @author
 * @Classname AvailabilityInsertRequest
 * @Description TODO
 * @date 10/04/2025
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class AvailabilitySetRequest {
    private Integer dayOfWeek;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime startTime;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime endTime;
}