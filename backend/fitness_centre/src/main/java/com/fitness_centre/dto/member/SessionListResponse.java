package com.fitness_centre.dto.member;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import com.fitness_centre.constant.RequestStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.NonNull;

import java.time.LocalDateTime;

/**
 * @author
 * @Classname SessionRequestList
 * @Description TODO
 * @date 15/04/2025
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class SessionListResponse {
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    @JsonSerialize(using = ToStringSerializer.class)
    private Long id;

    private String memberName;

    private String coachName;

    private RequestStatus status;

    private String message;

    private String reply;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private Boolean coachIsRead;

    private Boolean memberIsRead;

    private LocalDateTime requestTime;

    private LocalDateTime responseTime;
}