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
 * @Classname Tag
 * @Description TODO
 * @date 31/03/2025
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@TableName("tag")
public class Tag implements Serializable {
    private static final long serialVersionUID = -3493221730309898757L;
    @TableId(type = IdType.ASSIGN_ID)
    @JsonSerialize(using = ToStringSerializer.class)
    private Long id;

    private String tagName;
}