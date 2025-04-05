package com.fitness_centre.dto.member;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * @author
 * @Classname CoachQueryRequest
 * @Description TODO
 * @date 05/04/2025
 */
@Data
@NoArgsConstructor
public class CoachQueryRequest {

    private String userName;

    private List<Long> tagIds;

    private List<Long> locationIds;


    private int pageNow = 1;
    private int pageSize = 10;
}