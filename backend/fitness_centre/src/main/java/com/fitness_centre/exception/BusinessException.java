package com.fitness_centre.exception;

import com.fitness_centre.constant.ErrorCode;

/**
 * @author
 * @Classname BusinessException
 * @Description TODO
 * @date 29/03/2025
 */
public class BusinessException extends BaseException{
    /**
     * 使用 ErrorCode 枚举的构造方法
     */
    public BusinessException(ErrorCode errorCode) {
        super(errorCode.getCode(), errorCode.getMessage());
    }

    /**
     * 允许手动指定 code & message
     */
    public BusinessException(int code, String message) {
        super(code, message);
    }

    /**
     * 允许在抛异常时，传入 cause 方便记录堆栈
     */
    public BusinessException(int code, String message, Throwable cause) {
        super(code, message, cause);
    }
}