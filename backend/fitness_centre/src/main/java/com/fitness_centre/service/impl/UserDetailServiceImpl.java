package com.fitness_centre.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fitness_centre.domain.LoginUser;
import com.fitness_centre.mapper.UserMapper;
import com.fitness_centre.domain.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.awt.*;
import java.util.Objects;

/**
 * @author
 * @Classname UserDetailServiceImpl
 * @Description DONE
 * @date 08/03/2025
 */
@Service
public class UserDetailServiceImpl implements UserDetailsService {
    @Autowired
    private UserMapper userMapper;


    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        LambdaQueryWrapper<User> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(User::getEmail,email);
        User user = userMapper.selectOne(queryWrapper);

        if(Objects.isNull(user)){
            throw new RuntimeException("用户名或者密码错误");
        }

        return new LoginUser(user);
    }
}