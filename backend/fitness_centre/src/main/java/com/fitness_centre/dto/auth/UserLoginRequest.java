package com.fitness_centre.dto.auth;

import lombok.Data;

/**
 * @author
 * @Classname UserLoginDTO
 * @Description TODO
 * @date 08/03/2025
 */
@Data
public class UserLoginRequest {
    private String email;
    private String password;

}