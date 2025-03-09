package com.fitness_centre.domain;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
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
@TableName("user")
public class User implements Serializable {
    private static final long serialVersionUID = -40356785423868312L;

    @TableId
    private Long id;

    private String email;

    private String password;

    private String role;

    private Integer gender;

    private Date birthday;

    private String address;

    private String registerTime;

    private Integer status;

    private String userName;

}