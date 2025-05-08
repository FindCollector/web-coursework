package com.fitness_centre.domain;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * @author
 * @Classname CoachLocation
 * @Description TODO
 * @date 03/04/2025
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@TableName("coach_location")
public class CoachLocation implements Serializable {
    private static final long serialVersionUID = 5520517869577276281L;
    private Long coachId;

    private Long locationId;
}