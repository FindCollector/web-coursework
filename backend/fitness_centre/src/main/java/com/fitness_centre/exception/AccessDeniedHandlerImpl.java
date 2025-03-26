package com.fitness_centre.exception;

import com.alibaba.fastjson.JSON;
import com.fitness_centre.dto.GeneralResponseResult;
import com.fitness_centre.utils.WebUtils;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * @author
 * @Classname AccessDeniedHandlerImpl
 * @Description TODO
 * @date 08/03/2025
 */
@Component
public class AccessDeniedHandlerImpl implements AccessDeniedHandler {
    @Override
    public void handle(HttpServletRequest request,
                       HttpServletResponse response,
                       AccessDeniedException accessDeniedException)
            throws IOException, ServletException {
        GeneralResponseResult result = new GeneralResponseResult(HttpStatus.FORBIDDEN.value(), "Insufficient authority");
        String json = JSON.toJSONString(result);
        WebUtils.renderString(response,json);

    }
}