package com.fitness_centre.constant;

import java.util.*;

/**
 * @author
 * @Classname UserStatus
 * @Description TODO
 * @date 30/03/2025
 */
public enum UserStatus {
    //激活
    ACTIVE(0,"Normal"),
    WAITING_APPROVAL(1,"Pending"),
    BLOCKED(2,"Banned");
    private final Integer status;

    private final String desc;



    UserStatus(Integer status,String desc) {
        this.status = status;
        this.desc = desc;
    }

    public Integer getStatus(){
        return this.status;
    }
    public String getDesc(){
        return this.desc;
    }
    public static Map<Integer,String> getAllStatus(){
        Map<Integer,String> allStatus = new LinkedHashMap<>();
        for(UserStatus us : UserStatus.values()){
           allStatus.put(us.getStatus(),us.getDesc());
        }
        return allStatus;
    }
}