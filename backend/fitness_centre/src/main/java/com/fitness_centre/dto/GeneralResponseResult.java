package com.fitness_centre.dto;

import com.fitness_centre.constant.ErrorCode;
import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * @author
 * @Classname GeneralResponseResult
 * @Description DONE
 * @date 04/03/2025
 */
@Data
@AllArgsConstructor
public class GeneralResponseResult<T> {

    /**
     * Status code
     */
    private Integer code;
    /**
     * Prompt message, if there is an error, the frontend can get this field for prompt
     */
    private String msg;
    /**
     * Query result data
     */
    private T data;

    public GeneralResponseResult(Integer code, String msg) {
        this.code = code;
        this.msg = msg;
    }


    public GeneralResponseResult(ErrorCode errorCode){
        this.code = errorCode.getCode();
        this.msg = errorCode.getMessage();
    }
    public GeneralResponseResult(ErrorCode errorCode,T data){
        this.code = errorCode.getCode();
        this.msg = errorCode.getMessage();
        this.data = data;
    }
}