package com.fitness_centre.dto.auth;

import lombok.Data;

import java.time.LocalDate;

/**
 * @author
 * @Classname UserLoginResponse
 * @Description TODO
 * @date 31/03/2025
 */
@Data
public class UserLoginResponse {
    private String email;

    private String role;

    private Integer gender;

    private LocalDate birthday;

    private String address;

    private String userName;

    private String token;
}