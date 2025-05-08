package com.fitness_centre.domain;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Date;

/**
 * @author
 * @Classname User
 * @Description DONE
 * @date 08/03/2025
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@TableName("sys_user")
public class User implements Serializable {
    private static final long serialVersionUID = -40356785423868312L;

    @TableId(type = IdType.ASSIGN_ID)
    @JsonSerialize(using = ToStringSerializer.class)
    private Long id;

    private String email;

    @TableField(updateStrategy = FieldStrategy.NOT_NULL)
    private String password;


    @TableField(updateStrategy = FieldStrategy.NOT_NULL)
    private String role;

    @TableField(updateStrategy = FieldStrategy.NOT_NULL)
    private Integer gender;

    @TableField(updateStrategy = FieldStrategy.NOT_NULL)
    private LocalDate birthday;

    @TableField(updateStrategy = FieldStrategy.NOT_NULL)
    private String address;

    @TableField(updateStrategy = FieldStrategy.NOT_NULL)
    private LocalDateTime registerTime;

    @TableField(updateStrategy = FieldStrategy.NOT_NULL)
    private Integer status;

    @TableField(updateStrategy = FieldStrategy.NOT_NULL)
    private String userName;

    private String provider;

}