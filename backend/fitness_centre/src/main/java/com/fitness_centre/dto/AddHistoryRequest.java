package com.fitness_centre.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * @author
 * @Classname AddHisoryRequest
 * @Description TODO
 * @date 20/04/2025
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class AddHistoryRequest {
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    @JsonSerialize(using = ToStringSerializer.class)
    private Long sessionId;

    List<Long> tagList;

    private String feedback;
}