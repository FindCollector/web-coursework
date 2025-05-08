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

        // 1) Get username (email) and raw password from request
        String email = authentication.getName();
        String rawPassword = (String) authentication.getCredentials();

        // 2) First check if user exists
        UserDetails userDetails;
        try {
            userDetails = userDetailsService.loadUserByUsername(email);
        } catch (UsernameNotFoundException e) {
            // User not found
            throw new UsernameNotFoundException("User not found");
        }


        // 3) Then check if password is correct
        if (!passwordEncoder.matches(rawPassword, userDetails.getPassword())) {
            throw new BadCredentialsException("Wrong email or password");
        }

        // 4) Finally check if account is blocked or pending approval
        if (userDetails instanceof LoginUser loginUser) {
            if(loginUser.getUser().getStatus().equals(UserStatus.WAITING_APPROVAL.getStatus()) ){
                throw new LockedException("Waiting for administrator review");
            }
            if (loginUser.getUser().getStatus().equals(UserStatus.BLOCKED.getStatus())) {
                throw new LockedException("Your account is blocked.");
            }
        }


        // 5) If all checks pass, construct a successful authentication object
        return new UsernamePasswordAuthenticationToken(
                userDetails,
                userDetails.getPassword(),
                userDetails.getAuthorities()
        );
    }

    @Override
    public boolean supports(Class<?> authentication) {
        // Indicates support for UsernamePasswordAuthenticationToken authentication type
        return UsernamePasswordAuthenticationToken.class.isAssignableFrom(authentication);
    }
}
