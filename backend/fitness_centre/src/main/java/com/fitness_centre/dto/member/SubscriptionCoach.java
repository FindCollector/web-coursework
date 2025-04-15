package com.fitness_centre.dto.member;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * @author
 * @Classname SubscriptionCoach
 * @Description TODO
 * @date 15/04/2025
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class SubscriptionCoach {
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    @JsonSerialize(using = ToStringSerializer.class)
    private Long coachId;

    private String coachName;

    private String photo;

    private Integer age;

    private String email;

    private String intro;

    private List<String> tagNames;

    private List<String> locationName;
}