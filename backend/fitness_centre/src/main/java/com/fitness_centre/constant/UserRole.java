package com.fitness_centre.constant;

/**
 * @author
 * @Classname UserRole
 * @Description TODO
 * @date 01/04/2025
 */
public enum UserRole {
    ADMIN("admin"),

    COACH("coach"),

    MEMBER("member");

    private final String role;

    UserRole(String role){
        this.role = role;
    }

    public String getRole(){
        return this.role;
    }
}
