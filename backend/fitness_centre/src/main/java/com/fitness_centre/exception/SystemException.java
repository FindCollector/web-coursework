package com.fitness_centre.exception;

import com.fitness_centre.constant.ErrorCode;

/**
 * @author
 * @Classname SystemException
 * @Description TODO
 * @date 29/03/2025
 */
public class SystemException extends BaseException{
    public SystemException(ErrorCode errorCode) {
        super(errorCode.getCode(), errorCode.getMessage());
    }

    public SystemException(int code, String message) {
        super(code, message);
    }

    public SystemException(int code, String message, Throwable cause) {
        super(code, message, cause);
    }
}