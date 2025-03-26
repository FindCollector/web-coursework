package com.fitness_centre;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@MapperScan("com.fitness_centre.mapper")
@EnableScheduling
public class FitnessCentreApplication {

    public static void main(String[] args) {
        SpringApplication.run(FitnessCentreApplication.class, args);
    }

}
