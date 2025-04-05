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
 * @Classname Location
 * @Description TODO
 * @date 03/04/2025
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@TableName("location")
public class Location implements Serializable {
    private static final long serialVersionUID = 7473859158752471480L;
    @TableId(type = IdType.ASSIGN_ID)
    @JsonSerialize(using = ToStringSerializer.class)
    private Long id;

    private String locationName;

    private Double longitude;

    private Double latitude;
}