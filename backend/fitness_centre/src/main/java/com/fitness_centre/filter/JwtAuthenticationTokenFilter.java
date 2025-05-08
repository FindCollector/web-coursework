package com.fitness_centre.filter;

import com.fitness_centre.constant.ErrorCode;
import com.fitness_centre.security.LoginUser;
import com.fitness_centre.exception.AuthException;
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
        //Get token (if the frontend is already logged in, get the token from the request header)
        String token = request.getHeader("token");
        if (!StringUtils.hasText(token)) {
            //Let it pass, no need to parse, will be caught by later filters for login
            filterChain.doFilter(request, response);
            return;
        }
        //Parse token
        String email;
        //TODO modify response format
        try {
            Claims claims = JwtUtil.parseJWT(token);
            email = claims.getSubject();
        } catch (Exception e) {
            e.printStackTrace();
            throw new AuthException(ErrorCode.TOKEN_INVALID);
        }
        //Get user information from redis
        String redisKey = "login:" + email;
        LoginUser loginUser =  redisCache.getCacheObject(redisKey);
        if(Objects.isNull(loginUser)){
            throw new AuthException(ErrorCode.UNAUTHORIZED);
        }

        //Different from LoginServiceImpl, here we need to use the constructor with three parameters, which will set the member variable to an authenticated state
        UsernamePasswordAuthenticationToken authenticationToken =
                new UsernamePasswordAuthenticationToken(loginUser,null,loginUser.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(authenticationToken);
        //Let it pass
        filterChain.doFilter(request,response);
    }
}