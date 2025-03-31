package com.fitness_centre.domain;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * @author
 * @Classname Tag
 * @Description TODO
 * @date 31/03/2025
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@TableName("tag")
public class Tag {
    private Integer id;

    private String tagName;
}