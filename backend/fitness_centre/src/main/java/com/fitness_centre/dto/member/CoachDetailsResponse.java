package com.fitness_centre.dto.member;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import com.fitness_centre.domain.Location;
import com.fitness_centre.domain.Tag;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * @author
 * @Classname CoachListResponse
 * @Description TODO
 * @date 05/04/2025
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class CoachDetailsResponse {
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    @JsonSerialize(using = ToStringSerializer.class)
    private Long coachId;
    private String userName;

    private String photo;

    private Integer age;

    private String email;

    private String intro;

    private List<String> tagNames;

    private List<String> locationNames;

    // 这两个是为了配合 SQL 中的 group_concat 结果
    private String groupTagNames;
    private String groupLocationNames;

    private String status;
}