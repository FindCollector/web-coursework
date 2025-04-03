package com.fitness_centre.domain;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * @author
 * @Classname CoachTag
 * @Description TODO
 * @date 01/04/2025
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@TableName("coach_tag")
public class CoachTag implements Serializable {
    private static final long serialVersionUID = -2000998187811391358L;
    private Long coachId;
    private Long tagId;
}