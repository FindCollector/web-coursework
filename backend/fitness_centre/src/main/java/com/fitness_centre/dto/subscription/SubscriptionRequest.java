package com.fitness_centre.dto.subscription;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * @author
 * @Classname SubscriptionRequest
 * @Description DONE
 * @date 06/04/2025
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class SubscriptionRequest {
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    @JsonSerialize(using = ToStringSerializer.class)
    private Long coachId;
    private String message;
}