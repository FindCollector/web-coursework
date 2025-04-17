package com.fitness_centre.constant;

import java.util.HashMap;
import java.util.Map;

/**
 * @author
 * @Classname UserRole
 * @Description TODO
 * @date 01/04/2025
 */
public enum UserRole {
    ADMIN("admin","Admin"),

    COACH("coach","Coach"),

    MEMBER("member","Member");

    private final String role;

    private final String desc;

    UserRole(String role,String desc){
        this.role = role;
        this.desc = desc;
    }

    public String getRole(){
        return this.role;
    }

    public String getDesc(){
        return this.desc;
    }

    public static Map<String,String> getAllRole(){
        Map<String,String> allRole = new HashMap<>();
        for(UserRole ur : UserRole.values()){
            allRole.put(ur.getRole(),ur.getDesc());
        }
        return allRole;
    }
}
