package com.fitness_centre.security;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fitness_centre.domain.User;
import com.fitness_centre.mapper.UserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Objects;

/**
 * @author
 * @Classname UserDetailService
 * @Description DONE
 * @date 11/03/2025
 */
@Service
public class UserDetailService implements UserDetailsService {

    @Autowired
    public UserMapper userMapper;
    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        LambdaQueryWrapper<User> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(User::getEmail,email);
        User user = userMapper.selectOne(queryWrapper);
        //Can only throw exceptions defined by Spring Security here
        if(Objects.isNull(user)){
            throw new BadCredentialsException("Wrong email or password");
        }
        return new LoginUser(user);
    }
}