package com.fitness_centre.security;

import com.fitness_centre.constant.UserStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AuthenticationProviderImpl implements AuthenticationProvider {

    @Autowired
    private UserDetailsService userDetailsService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public Authentication authenticate(Authentication authentication) throws AuthenticationException {

        // 1) 获取请求里的用户名(邮箱)、原始密码
        String email = authentication.getName();
        String rawPassword = (String) authentication.getCredentials();

        // 2) 先加载用户是否存在
        UserDetails userDetails;
        try {
            userDetails = userDetailsService.loadUserByUsername(email);
        } catch (UsernameNotFoundException e) {
            // 用户不存在
            throw new UsernameNotFoundException("User not found");
        }

        // 3) 再检查密码是否正确
        if (!passwordEncoder.matches(rawPassword, userDetails.getPassword())) {
            throw new BadCredentialsException("Wrong email or password");
        }

        // 4) 最后再检查是否被封禁或者还未审核

        if (userDetails instanceof LoginUser loginUser) {
            if(loginUser.getUser().getStatus().equals(UserStatus.WAITING_APPROVAL.getStatus()) ){
                throw new LockedException("Waiting for administrator review");
            }
            if (loginUser.getUser().getStatus().equals(UserStatus.BLOCKED.getStatus())) {
                throw new LockedException("Your account is blocked.");
            }
        }


        // 5) 如果都通过，构造一个认证成功的对象
        return new UsernamePasswordAuthenticationToken(
                userDetails,
                userDetails.getPassword(),
                userDetails.getAuthorities()
        );
    }

    @Override
    public boolean supports(Class<?> authentication) {
        // 表示支持 UsernamePasswordAuthenticationToken 这种认证类型
        return UsernamePasswordAuthenticationToken.class.isAssignableFrom(authentication);
    }
}
