package com.fitness_centre.constant;

import lombok.Data;

import java.util.HashMap;
import java.util.Map;

/**
 * @author
 * @Classname RequestStatus
 * @Description DONE
 * @date 06/04/2025
 */

public enum RequestStatus {
    PENDING("pending","Pending"),

    REJECT("reject","Reject"),

    ACCEPT("accept","Accept"),

    CANCEL("cancel","Cancel"),

    DELETE("delete","Delete");

    private final String status;
    private final String desc;

    RequestStatus(String status,String desc){
        this.status = status;
        this.desc = desc;
    }

    public String getStatus(){
        return this.status;
    }

    public String getDesc(){
        return this.desc;
    }

    public static Map<String,String> getAllStatus(){
        Map<String,String> allStatus = new HashMap<>();
        for(RequestStatus rs : RequestStatus.values()){
            allStatus.put(rs.getStatus(),rs.getDesc());
        }
        return allStatus;
    }

}