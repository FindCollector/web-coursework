package com.fitness_centre.handle;

import com.fitness_centre.dto.GeneralResponseResult;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

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
        return new GeneralResponseResult<>(HttpStatus.UNAUTHORIZED.value(),ex.getMessage());
    }

    //字段的格式检查
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public GeneralResponseResult<?> handleMethodArgumentNotValidException(MethodArgumentNotValidException ex){
        // 用来存放字段的错误信息（key：字段名，value：错误信息）
        Map<String, String> fieldErrors = new HashMap<>();

        ex.getBindingResult().getAllErrors().forEach(error -> {
            if (error instanceof FieldError fieldError) {
                // 1. fieldError.getField() 是字段名
                // 2. fieldError.getDefaultMessage() 对应 @NotBlank、@Email、@Size 等注解的 message
                fieldErrors.put(fieldError.getField(), fieldError.getDefaultMessage());
            } else {
                // 如果是类级别错误（比如 @Valid 对象级别校验），用 objectName 作为 key
                fieldErrors.put(error.getObjectName(), error.getDefaultMessage());
            }
        });
//        String raw = fieldErrors.toString();
//        String withoutBraces = raw.replaceAll("^\\{|\\}$", "");
        String combinedErrorMsg = fieldErrors.values()
                .stream()
                .collect(Collectors.joining(", "));
        return new GeneralResponseResult<>(HttpStatus.BAD_REQUEST.value(),combinedErrorMsg);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public GeneralResponseResult<?> handleHttpMessageNotReadableException(HttpMessageNotReadableException ex) {
        // 打印异常信息
        // log.error("JSON parse error", e);
        Throwable rootCause = ex.getMostSpecificCause();
        GeneralResponseResult result;
        if(rootCause instanceof DateTimeParseException){
            result = new GeneralResponseResult<>(400,"The date format is wrong");
        }
        else{
            result = new GeneralResponseResult<>(400, "JSON format error or cannot be parsed");
        }

        return result;
    }

    @ExceptionHandler(ResponseStatusException.class)
    public GeneralResponseResult<?> handleResponseStatusException(ResponseStatusException ex){
        HttpStatusCode code = ex.getStatusCode();
        String msg = ex.getReason();
        return new GeneralResponseResult<>(code.value(),msg);
    }


}