package com.fitness_centre.dto.admin;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * @author
 * @Classname UserListQueryRequest
 * @Description TODO
 * @date 05/04/2025
 */
@Data
@NoArgsConstructor
public class UserListQueryRequest {
    // 字段对应原先方法里的参数
    private String role;
    private Integer status;
    private String userName;
    private String email;

    // 列表类型需要接收多个同名参数或逗号分隔参数
    private List<String> sortFields;
    private List<String> sortOrders;

    // 给分页默认值，避免前端没传分页参数时导致空值
    private int pageNow = 1;
    private int pageSize = 10;
}