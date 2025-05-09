package com.fitness_centre.security;

import com.alibaba.fastjson.annotation.JSONField;
import com.fitness_centre.constant.UserStatus;
import com.fitness_centre.domain.User;
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

    //Define as member variable to avoid reassigning every time
    //Avoid serializing to stream (Redis does not support this class)
    @JSONField(serialize = false)
    private List<SimpleGrantedAuthority> authorities;

    //Spring Security calls this to obtain permission information
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
        Integer status = user.getStatus();
        if(status.equals(UserStatus.BLOCKED.getStatus())){
            System.out.println("Account blocked");
            return false;
        }
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        Integer status = user.getStatus();

        if(status.equals(UserStatus.WAITING_APPROVAL.getStatus())){
            //todo change prompt message
            return false;
        }
        return true;
    }

    public Long getId(){
        return user.getId();
    }

    public String getRole(){
        return user.getRole();
    }
}