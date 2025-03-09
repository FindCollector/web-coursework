package com.fitness_centre.filter;

import com.fitness_centre.domain.LoginUser;
import com.fitness_centre.utils.JwtUtil;
import com.fitness_centre.utils.RedisCache;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Objects;

/**
 * @author
 * @Classname JwtAuthenticationTokenFilter
 * @Description DONE
 * @date 04/03/2025
 */
@Component
public class JwtAuthenticationTokenFilter extends OncePerRequestFilter {

    @Autowired
    private RedisCache redisCache;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        //获取token(前端如果已经登录的话，要从请求头获取token)
        String token = request.getHeader("token");
        if (!StringUtils.hasText(token)) {
            //放行，不用解析了,被后面过滤器捕获去登录
            filterChain.doFilter(request, response);
            return;
        }
        //解析token
        String email;
        //TODO 修改响应格式
        try {
            Claims claims = JwtUtil.parseJWT(token);
            email = claims.getSubject();
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("token非法");
        }
        //从redis中获取用户信息
        String redisKey = "login:" + email;
        LoginUser loginUser =  redisCache.getCacheObject(redisKey);
        if(Objects.isNull(loginUser)){
            throw new RuntimeException("用户未登录");
        }

        //区别于LoginServiceImpl，这里要用三个参数的构造函数，它会设置成员变量为已认证的状态
        UsernamePasswordAuthenticationToken authenticationToken =
                new UsernamePasswordAuthenticationToken(loginUser,null,loginUser.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(authenticationToken);
        //放行
        filterChain.doFilter(request,response);
    }
}