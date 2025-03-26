package com.fitness_centre.dto;

import lombok.Data;

import java.time.LocalDate;
import jakarta.validation.constraints.*;

/**
 * @author
 * @Classname UserRegisterRequest
 * @Description TODO
 * @date 10/03/2025
 */
@Data
public class UserRegisterRequest {
    @NotBlank(message = "The username cannot be empty.")
    private String userName;

    @Min(value = 0, message = "gender must be 0 or 1")
    @Max(value = 1, message = "gender must be 0 or 1")
    @NotNull(message = "Gender cannot be null.")
    private Integer gender;

    @Past(message = "birthday must be in the past")
    @NotNull(message = "Birthday cannot be null.")
    private LocalDate birthday;

    @NotBlank(message = "The address cannot be empty.")
    private String address;

    @NotBlank(message = "The email cannot be empty.")
    @Email(message = "The email format is incorrect.")
    private String email;

    @NotBlank(message = "The password cannot be empty.")
    @Size(min = 6, message = "The password length is at least 6 digits")
    //todo 密码包含的特殊字符拓展
    @Pattern(
            regexp = "^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]+$",
            message = "The password must contain both uppercase letters, lowercase letters, numbers and special symbols."
    )
    private String password;

    private String confirmPassword;

    private String verifyCode;

    private String recaptchaToken;

    public boolean confirmPasswordValid(){
        if(password.equals(confirmPassword)){
            return true;
        }
        return false;
    }
}