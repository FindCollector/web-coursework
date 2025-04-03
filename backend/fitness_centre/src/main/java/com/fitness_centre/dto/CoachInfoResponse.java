package com.fitness_centre.dto;

import com.fitness_centre.domain.Tag;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * @author
 * @Classname CoachInfoResponse
 * @Description TODO
 * @date 02/04/2025
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class CoachInfoResponse {

    private String intro;

    private String photo;

    private List<Tag> coachTags;

    private List<Tag> otherTags;
}