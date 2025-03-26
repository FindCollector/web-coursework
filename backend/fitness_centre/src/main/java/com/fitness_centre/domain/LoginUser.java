package com.fitness_centre.domain;

import com.alibaba.fastjson.annotation.JSONField;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * @author
 * @Classname LoginUser
 * @Description DONE
 * @date 03/03/2025
 */
@Data
@NoArgsConstructor
public class LoginUser implements UserDetails {
    private User user;


    public LoginUser(User user){
        this.user = user;
    }

    //定义成成员变量，避免每一次都去赋值
    //避免序列化到流当中（redis中不支持将这个类）
    @JSONField(serialize = false)
    private List<SimpleGrantedAuthority> authorities;

    //Spring Security调用这个获得的权限信息
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        if(authorities != null){
            return authorities;
        }
        authorities = Collections.singletonList(
                new SimpleGrantedAuthority("ROLE_" + user.getRole())
        );
        //System.out.println(authorities);
        return authorities;
    }

    @Override
    public String getPassword() {
        return user.getPassword();
    }

    @Override
    public String getUsername() {
        return user.getEmail();
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}