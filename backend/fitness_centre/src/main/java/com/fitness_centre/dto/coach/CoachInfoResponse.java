package com.fitness_centre.dto.coach;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import com.fitness_centre.domain.Location;
import com.fitness_centre.domain.Tag;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * @author
 * @Classname CoachInfoResponse
 * @Description TODO
 * @date 02/04/2025
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class CoachInfoResponse {

    private String intro;

    private String photo;

    private String userName;

    private String address;

    private LocalDate birthday;
    private List<Tag> coachTags;

    private List<Tag> otherTags;

    private List<Location> coachLocations;

    private List<Location> otherLocations;
}