package com.fitness_centre.domain;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import com.fitness_centre.constant.RequestStatus;
import com.fitness_centre.constant.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * @author
 * @Classname Subscription
 * @Description DONE
 * @date 06/04/2025
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@TableName("subscription")
public class Subscription implements Serializable {
    private static final long serialVersionUID = 3530935436809896779L;
    @TableId(type = IdType.ASSIGN_ID)
    @JsonSerialize(using = ToStringSerializer.class)
    private Long id;
    @JsonSerialize(using = ToStringSerializer.class)
    private Long memberId;

    @JsonSerialize(using = ToStringSerializer.class)
    private Long coachId;

    private String message;

    private RequestStatus status;

    private String reply;

    private LocalDateTime requestTime;

    private LocalDateTime responseTime;

    private LocalDateTime cancelTime;

    private Boolean coachIsRead;

    private Boolean memberIsRead;
}