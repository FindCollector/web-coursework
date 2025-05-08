package com.fitness_centre.exception;

/**
 * @author
 * @Classname BaseException
 * @Description TODO
 * @date 29/03/2025
 */
public abstract class BaseException extends  RuntimeException{
    private final Integer code;
    private final String message;

    public BaseException(Integer code,String message){
        super(message);
        this.code = code;
        this.message = message;
    }

    public BaseException(Integer code,String message,Throwable cause){
        super(message);
        this.code = code;
        this.message = message;
    }



    public Integer getCode(){
        return code;
    }

    @Override
    public String getMessage() {
        return message;
    }
}