package com.fitness_centre;

import com.fitness_centre.domain.User;
import com.fitness_centre.mapper.UserMapper;
import com.github.javafaker.Faker;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.concurrent.ThreadLocalRandom;

/**
 * @author
 * @Classname GenerateUser
 * @Description TODO
 * @date 24/03/2025
 */
@SpringBootTest
public class GenerateUser {
    @Autowired
    private UserMapper userMapper;

    @Test
    void testInsertMockUsers() {
        Faker faker = new Faker();
        for (int i = 1; i <= 40; i++) {
            User user = new User();
            user.setEmail(faker.internet().emailAddress());
            user.setPassword(faker.internet().password());
            user.setRole(ThreadLocalRandom.current().nextBoolean() ? "member" : "coach");
            user.setGender(ThreadLocalRandom.current().nextBoolean() ? 0 : 1);
            user.setBirthday(
                    faker.date()
                            .birthday(18, 55) // 18~55岁
                            .toInstant()
                            .atZone(ZoneId.systemDefault())
                            .toLocalDate()
            );
            user.setAddress(faker.address().fullAddress());
            user.setRegisterTime(LocalDateTime.now().minusDays(ThreadLocalRandom.current().nextInt(365)));
            user.setStatus(1);
            user.setUserName(faker.name().username());

            userMapper.insert(user);
        }
        System.out.println("插入测试数据成功！");
    }
}