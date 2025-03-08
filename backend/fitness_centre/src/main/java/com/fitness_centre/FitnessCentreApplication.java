package com.fitness_centre;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.fitness_centre.mapper")
public class FitnessCentreApplication {

    public static void main(String[] args) {
        SpringApplication.run(FitnessCentreApplication.class, args);
    }

}
