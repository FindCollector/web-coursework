package com.fitness_centre.dto.subscription;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * @author
 * @Classname CoachSubscriptionListResponse
 * @Description TODO
 * @date 07/04/2025
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class SubscriptionListResponse {
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    @JsonSerialize(using = ToStringSerializer.class)
    private Long id;

    private String memberName;

    private String coachName;

    private String status;

    private String message;

    private String reply;

    private Boolean coachIsRead;

    private Boolean memberIsRead;

    private LocalDateTime requestTime;

    private LocalDateTime responseTime;
}