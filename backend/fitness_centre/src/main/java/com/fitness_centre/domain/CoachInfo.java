package com.fitness_centre.domain;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * @author
 * @Classname Member
 * @Description TODO
 * @date 31/03/2025
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@TableName("coach_info")
public class CoachInfo {
    private Integer userId;

    private String intro;

    private Double rating;
}