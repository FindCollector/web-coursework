package com.fitness_centre.schedule;

import com.fitness_centre.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * @author
 * @Classname UserCleanupScheduler
 * @Description TODO 还未测试
 * @date 09/03/2025
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class UserCleanupScheduler {

    @Autowired
    private UserService userService;
    //executed once at 2 a.m. every day
    // cron Expression
    @Scheduled(cron = "0 0 2 * * ?")
    public void cleanupInactiveUsers(){
        int deletedCount = userService.cleanupInactiveUsers();
        log.info("delete inactive => {}",deletedCount);
    }
}