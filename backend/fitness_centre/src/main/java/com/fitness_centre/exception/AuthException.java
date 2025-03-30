package com.fitness_centre.exception;

import com.fitness_centre.constant.ErrorCode;

/**
 * @author
 * @Classname AuthException
 * @Description TODO
 * @date 29/03/2025
 */
public class AuthException extends BaseException{
    public AuthException(ErrorCode errorCode) {
        super(errorCode.getCode(), errorCode.getMessage());
    }

    public AuthException(int code, String message) {
        super(code, message);
    }

    public AuthException(int code, String message, Throwable cause) {
        super(code, message, cause);
    }
}