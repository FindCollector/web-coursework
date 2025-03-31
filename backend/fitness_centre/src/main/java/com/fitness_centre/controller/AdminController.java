package com.fitness_centre.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.fitness_centre.domain.User;
import com.fitness_centre.dto.GeneralResponseResult;
import com.fitness_centre.service.impl.UserServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * @author
 * @Classname AdminController
 * @Description TODO
 * @date 24/03/2025
 */
@RestController
@RequestMapping("/user")
public class AdminController {
    @Autowired
    private UserServiceImpl userService;

    @PreAuthorize("hasRole('admin')")
    @GetMapping("/list")
    public Page<User> userList(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) String userName,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) List<String> sortField,
            @RequestParam(required = false) List<String> sortOrder,
            @RequestParam(defaultValue = "1") int pageNow,
            @RequestParam(defaultValue = "10")int pageSize
    ){
        Page<User> pageResult = userService.pageQueryUser(role,status,userName,email,sortField,sortOrder,pageNow,pageSize);
        return pageResult;
    }

    @DeleteMapping("/{id}")
    public GeneralResponseResult deleteUser(@PathVariable Integer id){
        return userService.deleteById(id);
    }

    @PatchMapping("/{id}")
    public GeneralResponseResult updateStatus(@PathVariable Integer id,@RequestBody Map<String, Object> requestBody){
        Integer status = (Integer) requestBody.get("status");
        return userService.updateStatus(id,status);
    }


}