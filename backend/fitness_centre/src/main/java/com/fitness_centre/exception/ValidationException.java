package com.fitness_centre.exception;

import com.fitness_centre.constant.ErrorCode;

/**
 * @author
 * @Classname ValidationException
 * @Description TODO
 * @date 29/03/2025
 */
public class ValidationException extends BaseException{
    public ValidationException(ErrorCode errorCode) {
        super(errorCode.getCode(), errorCode.getMessage());
    }

    public ValidationException(int code, String message) {
        super(code, message);
    }

    public ValidationException(int code, String message, Throwable cause) {
        super(code, message, cause);
    }
}