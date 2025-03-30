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
     * 状态码
     */
    private Integer code;
    /**
     * 提示信息，如果有错误时，前端可以获取该字段进行提示
     */
    private String msg;
    /**
     * 查询到的结果数据，
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