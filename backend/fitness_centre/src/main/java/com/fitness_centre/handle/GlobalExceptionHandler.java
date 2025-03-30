package com.fitness_centre.handle;

import com.fitness_centre.constant.ErrorCode;
import com.fitness_centre.dto.GeneralResponseResult;
import com.fitness_centre.exception.AuthException;
import com.fitness_centre.exception.BusinessException;
import com.fitness_centre.exception.SystemException;
import jakarta.xml.bind.ValidationException;
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


    //字段的格式检查
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public void handleMethodArgumentNotValidException(MethodArgumentNotValidException ex){
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
        throw new com.fitness_centre.exception.ValidationException(ErrorCode.VALIDATION_ERROR.getCode(),combinedErrorMsg);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public void handleHttpMessageNotReadableException(HttpMessageNotReadableException ex) {
        // 打印异常信息
        // log.error("JSON parse error", e);
        Throwable rootCause = ex.getMostSpecificCause();
        GeneralResponseResult result;
        if(rootCause instanceof DateTimeParseException){
            throw new com.fitness_centre.exception.ValidationException(ErrorCode.VALIDATION_ERROR.getCode(),"The date format is wrong");
        }
        else{
           throw new com.fitness_centre.exception.ValidationException(ErrorCode.VALIDATION_ERROR.getCode(), "JSON format error or cannot be parsed");
        }

    }



    @ExceptionHandler(BusinessException.class)
    public GeneralResponseResult<?> handleBusinessException(BusinessException ex){
        GeneralResponseResult result =  new GeneralResponseResult<>(
                ex.getCode(),
                ex.getMessage()
        );
        return result;
    }

    @ExceptionHandler(AuthException.class)
    public GeneralResponseResult<?> handleAuthException(AuthException ex){
        GeneralResponseResult result =  new GeneralResponseResult<>(
                ex.getCode(),
                ex.getMessage()
        );
        return result;
    }
    @ExceptionHandler(SystemException.class)
    public GeneralResponseResult<?> handleSystemException(SystemException ex) {
        // log.error("SystemException: code={}, message={}", ex.getCode(), ex.getMessage(), ex);

        GeneralResponseResult<?> result = new GeneralResponseResult<>(
                ex.getCode(),
                "The server is busy, please try again later"  // 可以不直接使用 ex.getMessage()，以免暴露系统细节
        );
        // 系统层面错误，典型地返回 500 INTERNAL_SERVER_ERROR
        return result;
    }

    @ExceptionHandler(ValidationException.class)
    public GeneralResponseResult<?> handleValidationException(com.fitness_centre.exception.ValidationException ex){
        GeneralResponseResult result =  new GeneralResponseResult<>(
                ex.getCode(),
                ex.getMessage()
        );
        return result;
    }

    /**
     * 兜底异常（Exception）
     * - 用来捕获任何未被上面方法捕获的异常，防止返回 500 堆栈给前端
     */
    @ExceptionHandler(Exception.class)
    public GeneralResponseResult<?> handleException(Exception ex) {
        // log.error("Unknown exception: {}", ex.getMessage(), ex);

        // 这里可以返回一个通用的错误码，比如 9999 或 500
        // 也可以在配置文件中做“自定义错误码表”
        GeneralResponseResult<?> result = new GeneralResponseResult<>(
                9999,
                "The system is busy, please try again later"
        );
        return result;
    }


}