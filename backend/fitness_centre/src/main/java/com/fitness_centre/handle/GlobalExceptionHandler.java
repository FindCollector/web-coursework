package com.fitness_centre.handle;

import com.fitness_centre.dto.GeneralResponseResult;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * @author
 * @Classname GlobalExceptionHandler
 * @Description TODO
 * @date 08/03/2025
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BadCredentialsException.class)
    public  GeneralResponseResult<?> handleBadCredentialsException(BadCredentialsException ex){
        return new GeneralResponseResult<>(401,ex.getMessage());
    }

}