package com.fitness_centre.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.fitness_centre.domain.User;
import com.fitness_centre.dto.GeneralResponseResult;
import com.fitness_centre.dto.admin.UserListQueryRequest;
import com.fitness_centre.service.biz.impl.UserServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * @author
 * @Classname AdminController
 * @Description DONE
 * @date 24/03/2025
 */
@RestController
@RequestMapping("/user")
public class AdminController {
    @Autowired
    private UserServiceImpl userService;

    @PreAuthorize("hasRole(T(com.fitness_centre.constant.UserRole).ADMIN.getRole())")
    @GetMapping("/list")
    public Page<User> userList(@ModelAttribute UserListQueryRequest queryRequest){
        Page<User> pageResult = userService.pageQueryUser(queryRequest);
        return pageResult;
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole(T(com.fitness_centre.constant.UserRole).ADMIN.getRole())")
    public GeneralResponseResult deleteUser(@PathVariable Long id){
        return userService.deleteById(id);
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasRole(T(com.fitness_centre.constant.UserRole).ADMIN.getRole())")
    public GeneralResponseResult updateStatus(@PathVariable Long id,@RequestBody Map<String, Object> requestBody){
        Integer status = (Integer) requestBody.get("status");
        return userService.updateStatus(id,status);
    }
}