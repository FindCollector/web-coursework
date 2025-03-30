package com.fitness_centre.constant;

/**
 * @author
 * @Classname UserStatus
 * @Description TODO
 * @date 30/03/2025
 */
public enum UserStatus {
    //激活
    ACTIVE(0),
    WAITING_APPROVAL(1),
    BLOCKED(2);
    private final Integer status;


    UserStatus(Integer status) {
        this.status = status;
    }

    public Integer getStatus(){
        return this.status;
    }
}