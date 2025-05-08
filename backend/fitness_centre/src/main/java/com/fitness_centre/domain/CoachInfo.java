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
 * @Classname Member
 * @Description TODO
 * @date 31/03/2025
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@TableName("coach_info")
public class CoachInfo implements Serializable {
    private static final long serialVersionUID = 8895813557172311955L;

    @TableId(type = IdType.ASSIGN_ID)
    @JsonSerialize(using = ToStringSerializer.class)
    private Long id;

    private String photo;

    private String intro;
    //todo 定时任务计算
    private Double rating;
}