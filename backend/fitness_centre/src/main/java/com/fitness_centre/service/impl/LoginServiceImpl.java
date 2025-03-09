package com.fitness_centre.service.impl;

import com.fitness_centre.domain.LoginUser;
import com.fitness_centre.dto.GeneralResponseResult;
import com.fitness_centre.dto.UserLoginRequest;
import com.fitness_centre.service.LoginService;
import com.fitness_centre.utils.JwtUtil;
import com.fitness_centre.utils.RedisCache;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * @author
 * @Classname LoginServiceImpl
 * @Description TODO logout
 * @date 08/03/2025
 */
@Service
public class LoginServiceImpl implements LoginService {
    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private RedisCache redisCache;

    //expire time minutes
    @Autowired private final static int expireTime = 1441;

    @Override
    public GeneralResponseResult login(UserLoginRequest loginRequest) {
        UsernamePasswordAuthenticationToken authenticationToken =
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getEmail(),
                        loginRequest.getPassword());
        Authentication authentication = null;
        try {
            authentication = authenticationManager.authenticate((authenticationToken));
        } catch (Exception e) {
                throw new BadCredentialsException("邮箱或者密码错误");
        }



        LoginUser loginUser = (LoginUser) authentication.getPrincipal();
        String email = loginUser.getUser().getEmail();
        String jwt = JwtUtil.createJWT(email);

        redisCache.setCacheObject("login:" + email, loginUser,expireTime, TimeUnit.MINUTES);

        Map<String, String> map = new HashMap<>();
        map.put("token", jwt);

        return new GeneralResponseResult(HttpStatus.OK.value(), "登录成功", map);
    }

    //TODO 删除不成功
    @Override
    public GeneralResponseResult logout() {
        UsernamePasswordAuthenticationToken authenticationToken = (UsernamePasswordAuthenticationToken) SecurityContextHolder.getContext()
                .getAuthentication();
        LoginUser loginUser = (LoginUser) authenticationToken.getPrincipal();
        String email = loginUser.getUser().getEmail();
        boolean flag = redisCache.deleteObject("login:" + email);
        if (flag == false){
            return new GeneralResponseResult<>(HttpStatus.UNAUTHORIZED.value(), "退出失败");
        }
        return new GeneralResponseResult<>(HttpStatus.OK.value(), "退出成功");
    }
}