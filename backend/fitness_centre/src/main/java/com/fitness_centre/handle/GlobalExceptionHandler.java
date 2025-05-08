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


    //Field format validation
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public void handleMethodArgumentNotValidException(MethodArgumentNotValidException ex){
        // Store field error messages (key: field name, value: error message)
        Map<String, String> fieldErrors = new HashMap<>();

        ex.getBindingResult().getAllErrors().forEach(error -> {
            if (error instanceof FieldError fieldError) {
                // 1. fieldError.getField() is the field name
                // 2. fieldError.getDefaultMessage() corresponds to the message in annotations like @NotBlank, @Email, @Size, etc.
                fieldErrors.put(fieldError.getField(), fieldError.getDefaultMessage());
            } else {
                // If it's a class-level error (such as @Valid object-level validation), use objectName as key
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
        // Print exception information
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
                "The server is busy, please try again later"  // We can avoid using ex.getMessage() directly to prevent exposing system details
        );
        // System-level errors typically return 500 INTERNAL_SERVER_ERROR
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
     * Fallback exception (Exception)
     * - Used to catch any exceptions not caught by the methods above, to prevent returning a 500 stack trace to the frontend
     */
    @ExceptionHandler(Exception.class)
    public GeneralResponseResult<?> handleException(Exception ex) {
        // log.error("Unknown exception: {}", ex.getMessage(), ex);

        // Here we can return a general error code, such as 9999 or 500
        // We can also define a 'custom error code table' in the configuration file
        GeneralResponseResult<?> result = new GeneralResponseResult<>(
                9999,
                "The system is busy, please try again later"
        );
        return result;
    }


}