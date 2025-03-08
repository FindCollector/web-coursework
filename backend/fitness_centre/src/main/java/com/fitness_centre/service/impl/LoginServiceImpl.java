package com.fitness_centre.service.impl;

import com.fitness_centre.domain.LoginUser;
import com.fitness_centre.domain.ResponseResult;
import com.fitness_centre.domain.User;
import com.fitness_centre.service.LoginService;
import com.fitness_centre.utils.JwtUtil;
import com.fitness_centre.utils.RedisCache;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

/**
 * @author
 * @Classname LoginServiceImpl
 * @Description TODO
 * @date 08/03/2025
 */
@Service
public class LoginServiceImpl implements LoginService {
    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private RedisCache redisCache;

    @Override
    public ResponseResult login(User user){
        UsernamePasswordAuthenticationToken authenticationToken =
                new UsernamePasswordAuthenticationToken(
                        user.getUserName(),
                        user.getPassword());

        Authentication authentication = authenticationManager.authenticate((authenticationToken));

        //TODO 前面会捕获异常了，这里需要修改
        if(Objects.isNull(authentication)){
            throw new RuntimeException("登录失败");
        }

        LoginUser loginUser = (LoginUser) authentication.getPrincipal();
        String userid = loginUser.getUser().getId().toString();
        String jwt = JwtUtil.createJWT(userid);

        redisCache.setCacheObject("login:" + userid,loginUser);

        Map<String,String> map = new HashMap<>();
        map.put("token",jwt);

        return new ResponseResult(200,"登录成功",map);
    }
}