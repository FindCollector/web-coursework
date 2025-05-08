package com.fitness_centre;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootTest
class FitnessCentreApplicationTests {

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void PasswordEncode() {
        System.out.println(passwordEncoder.encode("@Mayday21"));
    }

}
