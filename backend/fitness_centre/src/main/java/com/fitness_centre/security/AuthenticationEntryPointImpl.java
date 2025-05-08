package com.fitness_centre.security;

import com.alibaba.fastjson.JSON;
import com.fitness_centre.constant.ErrorCode;
import com.fitness_centre.dto.GeneralResponseResult;
import com.fitness_centre.utils.WebUtils;
import com.nimbusds.jose.shaded.gson.Gson;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.apache.coyote.Response;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * @author
 * @Classname AuthenticationEntryPoint
 * @Description DONE
 * @date 08/03/2025
 */
@Component
public class AuthenticationEntryPointImpl implements AuthenticationEntryPoint {
    @Override
    public void commence(HttpServletRequest request,
                         HttpServletResponse response,
                         AuthenticationException authException) throws IOException, ServletException {
        GeneralResponseResult<?> GeneralResponseResult = new GeneralResponseResult<>(ErrorCode.UNAUTHORIZED,authException.getMessage());
        String json = JSON.toJSONString(GeneralResponseResult);
        WebUtils.renderString(response,json);
    }
}