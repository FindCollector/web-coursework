package com.fitness_centre.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

/**
 * @author
 * @Classname CoachInfoUpdateResponse
 * @Description TODO
 * @date 04/04/2025
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class CoachInfoUpdateRequest {

    private String intro;

    private String photo;

    @NotBlank(message = "The username cannot be empty.")
    private String userName;

    @NotBlank(message = "The address cannot be empty.")
    private String address;

    @Past(message = "birthday must be in the past")
    @NotNull(message = "Birthday cannot be null.")
    private LocalDate birthday;
    private List<Long> coachTagIds;

    private List<Long> coachLocationIds;

}