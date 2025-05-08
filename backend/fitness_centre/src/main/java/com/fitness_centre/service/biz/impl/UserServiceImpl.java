package com.fitness_centre.service.biz.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.core.toolkit.support.SFunction;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.fitness_centre.constant.ErrorCode;
import com.fitness_centre.constant.Provider;
import com.fitness_centre.constant.UserRole;
import com.fitness_centre.constant.UserStatus;
import com.fitness_centre.dto.admin.UserListQueryRequest;
import com.fitness_centre.dto.auth.UserLoginResponse;
import com.fitness_centre.security.LoginUser;
import com.fitness_centre.domain.User;
import com.fitness_centre.dto.GeneralResponseResult;
import com.fitness_centre.dto.auth.UserLoginRequest;
import com.fitness_centre.dto.auth.UserRegisterRequest;
import com.fitness_centre.exception.AuthException;
import com.fitness_centre.exception.BusinessException;
import com.fitness_centre.exception.SystemException;
import com.fitness_centre.exception.ValidationException;
import com.fitness_centre.mapper.UserMapper;
import com.fitness_centre.service.infrastructure.FileService;
import com.fitness_centre.service.infrastructure.MailService;
import com.fitness_centre.service.biz.interfaces.UserService;
import com.fitness_centre.utils.JwtUtil;
import com.fitness_centre.utils.RecaptchaValidator;
import com.fitness_centre.utils.RedisCache;
import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeTokenRequest;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.googleapis.auth.oauth2.GoogleTokenResponse;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.jackson2.JacksonFactory;
import jakarta.jws.soap.SOAPBinding;
import jakarta.mail.MessagingException;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.io.Serializable;
import java.security.GeneralSecurityException;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.TimeUnit;

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

    private final static int basicInfoExpireTime = 45;

    @Value("${google.client-id}")
    private String clientId;

    @Value("${google.client-secret}")
    private String clientSecret;

    @Autowired
    private RecaptchaValidator recaptchaValidator;

    @Autowired
    private MailService mailService;

    @Autowired
    private FileService fileService;


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

        //login check
        UsernamePasswordAuthenticationToken authenticationToken =
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getEmail(),
                        loginRequest.getPassword());
        Authentication authentication  = null;
        try{
            authentication = authenticationManager.authenticate((authenticationToken));
        } catch (AuthenticationException ex) {
            throw new AuthException(ErrorCode.FORBIDDEN.getCode(),ex.getMessage());
        }


        LoginUser loginUser = (LoginUser) authentication.getPrincipal();
        String email = loginUser.getUser().getEmail();
        String jwt = JwtUtil.createJWT(email);

        redisCache.setCacheObject("login:" + email, loginUser,loginExpireTime, TimeUnit.MINUTES);

        Map<String, UserLoginResponse> map = new HashMap<>();
        UserLoginResponse userLoginResponse = new UserLoginResponse();
        BeanUtils.copyProperties(loginUser.getUser(),userLoginResponse);
        userLoginResponse.setToken(jwt);
        map.put("userInfo",userLoginResponse);

        return new GeneralResponseResult(ErrorCode.SUCCESS, map);
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
            throw new AuthException(ErrorCode.CACHE_ERROR.getCode(),"Failed to exit");
        }
        return new GeneralResponseResult<>(ErrorCode.SUCCESS);
    }

    //todo 频繁调用
    //发送验证码
    @Override
    public GeneralResponseResult basicInfoStore(UserRegisterRequest request)  {


        //验证两次密码是否相同
        if(!request.confirmPasswordValid()){
            throw new ValidationException(ErrorCode.PASSWORDS_DO_NOT_MATCH);
        }
        //检查邮箱是否被注册了
        boolean exists = this.lambdaQuery()
                .eq(User::getEmail,request.getEmail())
                .exists();
        if(exists){
            throw new AuthException(ErrorCode.USER_ALREADY_EXISTS);
        }

        //发邮件
        sendCode(request.getEmail());

        //先对密码加密
        request.setPassword(passwordEncoder.encode(request.getPassword()));
        //基本信息存入redis
        redisCache.setCacheObject("register:" + request.getEmail(),request,basicInfoExpireTime,TimeUnit.MINUTES);

        return new GeneralResponseResult(ErrorCode.SUCCESS);
    }

    @Override
    public GeneralResponseResult sendCode(String email) {

        //控制发送的频率,一分钟发一次
        String sendFreq = "emailSendFreq:" + email;
        if(!Objects.isNull(redisCache.getCacheObject(sendFreq))){
            throw new BusinessException(ErrorCode.TOO_MANY_REQUESTS);
        }
        redisCache.setCacheObject(sendFreq,LocalDateTime.now(),resendTime,TimeUnit.MINUTES);


        //验证码密文
        String code;
        try{
            code = mailService.sendVerificationCode(email);
        } catch (MessagingException e) {
            throw new SystemException(ErrorCode.EMAIL_SERVICE_ERROR);
        }


        //验证码存入redis
        redisCache.setCacheObject("verifyCode:" + email,code,emailExpireTime,TimeUnit.MINUTES);
        return new GeneralResponseResult(ErrorCode.SUCCESS);
    }


    //验证后注册用户
    @Override
    public GeneralResponseResult verifyRegister(String email,String verifyCode,String role) {

        UserRegisterRequest request= redisCache.getCacheObject("register:" + email);
        if(Objects.isNull(request)){
            throw new AuthException(ErrorCode.USER_INFO_EXPIRED);
        }
        //校验验证码是否正确
        String code = redisCache.getCacheObject("verifyCode:" + email);
        if(Objects.isNull(code) || code.isEmpty()){
            throw new AuthException(ErrorCode.EMAIL_VERIFICATION_FAILED);
        }
        if(!code.equals(verifyCode)){
            throw new AuthException(ErrorCode.EMAIL_VERIFICATION_FAILED.getCode(),"Verification code error");
        }

        //让验证码失效
        redisCache.deleteObject(email);

        User user = new User();
        //大型项目用Mapstruct
        BeanUtils.copyProperties(request,user);
        user.setRole(user.getRole());
        user.setRegisterTime(LocalDateTime.now());
        //暂时不激活激活用户
        user.setStatus(1);
        user.setProvider(Provider.LOCAL.provider);
        //并发控制：数据库中的email是unique
        try{
            this.baseMapper.insert(user);
        } catch (DuplicateKeyException exception) {
            throw new AuthException(ErrorCode.DB_OPERATION_ERROR.getCode(), "Email already registered");
        }

        return new GeneralResponseResult(ErrorCode.SUCCESS);
    }


    //查询过滤用户
    @Override
    public Page<User> pageQueryUser(UserListQueryRequest queryRequest) {

        String role = queryRequest.getRole();
        Integer status = queryRequest.getStatus();
        String userName = queryRequest.getUserName();
        String email = queryRequest.getEmail();
        List<String> sortFields = queryRequest.getSortFields();
        List<String> sortOrders = queryRequest.getSortOrders();
        int pageNow = queryRequest.getPageNow();
        int pageSize = queryRequest.getPageSize();

        Page<User> page = new Page<>(pageNow,pageSize);
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

    //删除用户
    @Override
    @Transactional
    public GeneralResponseResult deleteById(Serializable id){
        //删除个人照片
        fileService.deleteFileByUseId((Long) id);
        User user = this.baseMapper.selectById(id);
        String loginUser = redisCache.getCacheObject("login:" + user.getEmail());
        if(!Objects.isNull(loginUser)){
            redisCache.deleteObject(user.getEmail());
        }
        if(!removeById(id)){
            System.out.println(id);
            throw new BusinessException(ErrorCode.DB_OPERATION_ERROR);
        }
        return new GeneralResponseResult(ErrorCode.SUCCESS);
    }

    //审批或者封禁用户
    @Override
    public GeneralResponseResult updateStatus(Serializable id,Integer status) {
        LambdaUpdateWrapper<User> updateWrapper = new LambdaUpdateWrapper<>();
        updateWrapper.eq(User::getId,id).set(User::getStatus,status);
        int rowsAffected = this.baseMapper.update(updateWrapper);
        if(rowsAffected == 0){
            throw new BusinessException(ErrorCode.DB_OPERATION_ERROR);
        }

        if(status.equals(UserStatus.BLOCKED)){
            //封禁后马上下线
            User user = this.baseMapper.selectById(id);
            String loginUser = redisCache.getCacheObject("login:" + user.getEmail());
            if(!Objects.isNull(loginUser)){
                redisCache.deleteObject(user.getEmail());
            }
        }
        return new GeneralResponseResult(ErrorCode.SUCCESS);
    }

    @Override
    public GeneralResponseResult userFilter() {

        Map<String,Map> map = new HashMap<>();
        map.put("status",UserStatus.getAllStatus());
        map.put("role", UserRole.getAllRole());
        return new GeneralResponseResult(ErrorCode.SUCCESS,map);
    }

    @Override
    public GeneralResponseResult googleLogin(String idTokenString) {
        GoogleIdToken idToken = verifyGoogleIdToken(idTokenString);
        GoogleIdToken.Payload p = idToken.getPayload();
        String email = p.getEmail();

        User googleUser = selectOneByEmailAndProvider(email,Provider.GOOGLE.provider);

        if (googleUser == null) {
            // 可能已存在本地账号，需要提示走绑定
            boolean localExists = lambdaQuery()
                    .eq(User::getEmail, email)
                    .eq(User::getProvider, Provider.LOCAL.provider)
                    .exists();
            if (localExists) {
                return new GeneralResponseResult(ErrorCode.GOOGLE_EMAIL_ALREADY_EXISTS, Map.of("email", email));
            }
            // 前端跳转到完善资料
            return new GeneralResponseResult(ErrorCode.EMAIL_NOT_BOUND, Map.of("email", email));
        }

        if (googleUser.getStatus() == UserStatus.BLOCKED.getStatus()) {
            throw new AuthException(ErrorCode.FORBIDDEN);
        }
        return buildLoginSuccess(googleUser);
    }

    private User selectOneByEmailAndProvider(String email, String provider) {
        return baseMapper.selectOne(new LambdaQueryWrapper<User>()
                .eq(User::getEmail, email)
                .eq(User::getProvider, provider));
    }

    /**
     * 校验 Google id_token
     */
    private GoogleIdToken verifyGoogleIdToken(String idTokenString) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    GoogleNetHttpTransport.newTrustedTransport(),
                    JacksonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(clientId))
                    .build();
            GoogleIdToken idToken = verifier.verify(idTokenString);
            if (idToken == null) {
                throw new AuthException(ErrorCode.FORBIDDEN.getCode(), "Invalid id_token");
            }
            return idToken;
        } catch (GeneralSecurityException | IOException e) {
            throw new SystemException(ErrorCode.GOOGLE_AUTH_ERROR);
        }
    }


    @Override
    public GeneralResponseResult googleAccountBoundBasicInformation(UserRegisterRequest requestDTO) {
        User exist = selectOneByEmailAndProvider(requestDTO.getEmail(), Provider.GOOGLE.provider);
        if (exist != null) {
            throw new AuthException(ErrorCode.GOOGLE_EMAIL_ALREADY_EXISTS);
        }
        User user = new User();
        BeanUtils.copyProperties(requestDTO,user);
        user.setProvider(Provider.GOOGLE.provider);
        user.setPassword(null);
        user.setRegisterTime(LocalDateTime.now());
        user.setStatus(UserStatus.WAITING_APPROVAL.getStatus());
        int rows = this.baseMapper.insert(user);
        if(rows == 0){
            throw new SystemException(ErrorCode.DB_OPERATION_ERROR);
        }

        return buildLoginSuccess(user);
    }

    @Override
    public GeneralResponseResult emailLinkGoogleAccount(String email) {
        LambdaUpdateWrapper<User> updateWrapper = new LambdaUpdateWrapper<>();
        updateWrapper.eq(User::getEmail,email).set(User::getProvider,Provider.GOOGLE.provider);
        int rows = this.baseMapper.update(updateWrapper);
        if(rows == 0){
            throw new SystemException(ErrorCode.DB_OPERATION_ERROR);
        }
        LambdaQueryWrapper<User> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(User::getEmail,email);
        User user = this.baseMapper.selectOne(queryWrapper);
       return buildLoginSuccess(user);
    }


    private GeneralResponseResult buildLoginSuccess(User user) {
        LoginUser loginUser = new LoginUser(user);
        String token = JwtUtil.createJWT(user.getEmail());

        redisCache.setCacheObject(
                "login:" + user.getEmail(),
                loginUser,
                loginExpireTime,
                TimeUnit.MINUTES);

        if(user.getStatus() == UserStatus.WAITING_APPROVAL.getStatus()){
            throw new BusinessException(ErrorCode.FORBIDDEN.getCode(),"Waiting for administrator review");
        }

        if(user.getStatus() == UserStatus.BLOCKED.getStatus()){
            throw new BusinessException(ErrorCode.FORBIDDEN.getCode(),"Your account is blocked.");
        }

        UserLoginResponse resp = new UserLoginResponse();
        BeanUtils.copyProperties(user, resp);
        resp.setToken(token);

        return new GeneralResponseResult(ErrorCode.SUCCESS, Map.of("userInfo", resp));
    }



}