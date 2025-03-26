package com.fitness_centre.service.impl;

import com.baomidou.mybatisplus.core.conditions.Wrapper;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.toolkit.support.SFunction;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.fitness_centre.domain.LoginUser;
import com.fitness_centre.domain.User;
import com.fitness_centre.dto.GeneralResponseResult;
import com.fitness_centre.dto.UserLoginRequest;
import com.fitness_centre.dto.UserRegisterRequest;
import com.fitness_centre.mapper.UserMapper;
import com.fitness_centre.service.MailService;
import com.fitness_centre.service.UserService;
import com.fitness_centre.utils.JwtUtil;
import com.fitness_centre.utils.RecaptchaValidator;
import com.fitness_centre.utils.RedisCache;
import jakarta.mail.MessagingException;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.server.ResponseStatusException;

import java.sql.SQLIntegrityConstraintViolationException;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.function.Function;

/**
 * @author
 * @Classname UserServiceImpl
 * @Description TODO
 * @date 09/03/2025
 */
@Service
public class UserServiceImpl extends ServiceImpl<UserMapper, User> implements UserService{

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private RedisCache redisCache;

    //登录失效的时间
    private final static int loginExpireTime = 1441;

    //重新发送的时间
    private final static int resendTime = 1;

    //验证码失效的时间
    private final static int emailExpireTime = 5;

    @Autowired
    private RecaptchaValidator recaptchaValidator;

    @Autowired
    private MailService mailService;

    @Value("${recaptcha.threshold}")
    private double threshold;

    private static final Map<String, SFunction<User,?>> ALLOW_SORT_MAP = new HashMap<>();
    static{

        ALLOW_SORT_MAP.put("registerTime",User::getRegisterTime);
        ALLOW_SORT_MAP.put("birthday",User::getBirthday);
    }
    //登录
    @Override
    public GeneralResponseResult login(UserLoginRequest loginRequest) {


        // bot check
        boolean recaptchaPassed = recaptchaValidator.verify(
                loginRequest.getRecaptchaToken(),
                threshold,
                "login"
        );

        if(!recaptchaPassed){
            throw new BadCredentialsException("Suspected robot");
        }

        //login check
        UsernamePasswordAuthenticationToken authenticationToken =
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getEmail(),
                        loginRequest.getPassword());
        Authentication authentication = null;
        try {
            authentication = authenticationManager.authenticate((authenticationToken));
        } catch (Exception e) {
            throw new BadCredentialsException("The email address or password is incorrect");
        }



        LoginUser loginUser = (LoginUser) authentication.getPrincipal();
        String email = loginUser.getUser().getEmail();
        String jwt = JwtUtil.createJWT(email);

        redisCache.setCacheObject("login:" + email, loginUser,loginExpireTime, TimeUnit.MINUTES);

        Map<String, String> map = new HashMap<>();
        map.put("token", jwt);

        return new GeneralResponseResult(HttpStatus.OK.value(), "Login Successful", map);
    }

    //登出
    @Override
    public GeneralResponseResult logout() {
        UsernamePasswordAuthenticationToken authenticationToken = (UsernamePasswordAuthenticationToken) SecurityContextHolder.getContext()
                .getAuthentication();
        LoginUser loginUser = (LoginUser) authenticationToken.getPrincipal();
        String email = loginUser.getUser().getEmail();
        boolean flag = redisCache.deleteObject("login:" + email);
        if (flag == false){
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,"Failed to exit");
        }
        return new GeneralResponseResult<>(HttpStatus.OK.value(), "Exit successfully");
    }

    //todo 频繁调用
    //发送验证码
    @Override
    public GeneralResponseResult sendCode(UserRegisterRequest request)  {

        // 机器人检测
        boolean recaptchaPassed = recaptchaValidator.verify(
                request.getRecaptchaToken(),
                threshold,
                "register"
        );

        if(!recaptchaPassed){
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Suspected robot");
        }
        //验证两次密码是否相同
        if(!request.confirmPasswordValid()){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"The confirmation password must be the same as the password");
        }
        //检查邮箱是否被注册了
        boolean exists = this.lambdaQuery()
                .eq(User::getEmail,request.getEmail())
                .exists();
        if(exists){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email already in use");
        }

        //控制发送的频率,一分钟发一次
        String sendFreq = "emailSendFreq:" + request.getEmail();

        if(!Objects.isNull(redisCache.getCacheObject(sendFreq))){
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,"You have sent verification code recently, please wait.");
        }
        redisCache.setCacheObject(sendFreq,LocalDateTime.now(),resendTime,TimeUnit.MINUTES);

        //发送验证码
        String codeEncrypted;

        try {
            codeEncrypted = passwordEncoder.encode(mailService.sendVerificationCode(request.getEmail()));
        } catch (MessagingException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Email sending failed");
        }

        request.setVerifyCode(codeEncrypted);


        //先对密码加密
        request.setPassword(passwordEncoder.encode(request.getPassword()));
        request.setPassword(passwordEncoder.encode(request.getPassword()));
        //存入redis
        redisCache.setCacheObject("register:" + request.getEmail(),request,emailExpireTime,TimeUnit.MINUTES);

        return new GeneralResponseResult(HttpStatus.OK.value(),"The verification code has been sent successfully.");
    }

    //验证后注册用户
    @Override
    public GeneralResponseResult verifyRegister(String email,String verifyCode) {

         UserRegisterRequest request= redisCache.getCacheObject("register:" + email);
        if(Objects.isNull(request)){
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,"Verification code error");
        }
        //让验证码失效
        redisCache.deleteObject(email);

        User user = new User();
        //大型项目用Mapstruct
        BeanUtils.copyProperties(request,user);
        user.setRole("member");
        user.setRegisterTime(LocalDateTime.now());
        //激活用户
        user.setStatus(1);
        //并发控制：数据库中的email是unique
        try{
            this.baseMapper.insert(user);
        } catch (DuplicateKeyException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email already registered");
        }

        return new GeneralResponseResult(HttpStatus.OK.value(),"Successful registration");
    }


    //查询过滤用户
    @Override
    public Page<User> pageQueryUser(String role, Integer status,String userName,String email,List<String> sortFields, List<String> sortOrders, int pageNo, int pageSize) {
        Page<User> page = new Page<>(pageNo,pageSize);
        //查询对应的角色
        LambdaQueryWrapper<User> queryWrapper = new LambdaQueryWrapper<>();
        if(role != null && !role.isEmpty()){
            //role不是列名，不会造成SQL注入
            queryWrapper.eq(User::getRole,role);
        }

        if(status != null){
            queryWrapper.eq(User::getStatus,status);
        }

        if(userName != null && !userName.isEmpty()){
            queryWrapper.eq(User::getUserName,userName);
        }
        if(email != null && !email.isEmpty()){
            queryWrapper.eq(User::getEmail,email);
        }
        if(sortFields != null && sortOrders != null && sortFields.size() == sortOrders.size()){
            for(int i = 0;i < sortFields.size();i++){
                String field  = sortFields.get(i);
                String order = sortOrders.get(i);
                SFunction<User,?> sortFunc = ALLOW_SORT_MAP.get(field);
                if(sortFunc == null){
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Illegal sort field:" + field);
                }
                if("asc".equalsIgnoreCase(order)){
                    queryWrapper.orderByAsc(sortFunc);
                }
                else if("desc".equalsIgnoreCase(order)){
                    queryWrapper.orderByDesc(sortFunc);
                }
                else{
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Illegal sort");
                }
            }
        }
        //调用this.page 内部会自动执行分页拦截
        return this.page(page,queryWrapper);
    }

    @Override
    public int cleanupInactiveUsers() {
        return this.baseMapper.deleteInactiveUsers();
    }

}