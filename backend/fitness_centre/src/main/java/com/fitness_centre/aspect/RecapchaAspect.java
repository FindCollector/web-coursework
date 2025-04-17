package com.fitness_centre.aspect;

import com.fitness_centre.annotation.RequireRecaptcha;
import com.fitness_centre.constant.ErrorCode;
import com.fitness_centre.exception.AuthException;
import jakarta.servlet.http.HttpServletRequest;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.HashMap;
import java.util.Map;

/**
 * @author
 * @Classname RecapchaAspect
 * @Description TODO
 * @date 28/03/2025
 */
@Aspect
@Component
public class RecapchaAspect {
    @Value("${recaptcha.secretKey}")
    private String secretKey;

    @Value("${recaptcha.API_KEY}")
    private String API_KEY;

    private final RestTemplate restTemplate = new RestTemplate();

    /*
        threshold:Confidence
     */

    @Around("@annotation(requireRecaptcha)")
    public Object validateRecaptcha(
            ProceedingJoinPoint joinPoint,
            RequireRecaptcha requireRecaptcha
    ) throws Throwable {
        // ... 前面做各种校验, 包括 reCAPTCHA 验证 ...
        // 1. 获取当前 Request 上下文
        ServletRequestAttributes attributes =
                (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();

        // 2. 拿到 HttpServletRequest
        HttpServletRequest request = attributes.getRequest();

        // 3. 从请求头里获取 recaptchatoken
        String recaptchaToken = request.getHeader("X-Recaptcha-Token");
        String action = request.getHeader("X-Action");
        double minScore = requireRecaptcha.minScore();

        if(!verify(recaptchaToken,minScore,action)){
            throw new AuthException(ErrorCode.CAPTCHA_ERROR);
        }
        // 如果验证通过，就执行原方法：
        return joinPoint.proceed();
    }

    public boolean verify(String recaptchaToken,double threshold,String expectedAction){
        if(recaptchaToken == null || recaptchaToken.isEmpty()){
            return false;
        }

        String verifyUrl = "https://recaptchaenterprise.googleapis.com/v1/projects/"
                + "my-project-4899-1741522706419"
                + "/assessments?key=" + API_KEY ;


        Map<String, Object> requestBody = new HashMap<>();
        Map<String, String> eventMap = new HashMap<>();

        eventMap.put("token",recaptchaToken);
        eventMap.put("expectedAction",expectedAction);
        eventMap.put("siteKey",secretKey);

        requestBody.put("event",eventMap);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String,Object>> httpEntity = new HttpEntity<>(requestBody,headers);

        Map<?,?> responseBody;

        try{
            responseBody = restTemplate.postForObject(verifyUrl,httpEntity,Map.class);
        }
        catch (Exception ex){
            return false;
        }


        if(responseBody == null){
            return false;
        }

        // get tokenProperties from responseBody
        Map<String, Object> tokenProperties = (Map<String, Object>) responseBody.get("tokenProperties");
        if (tokenProperties == null) {
            return false;
        }

        Boolean valid = (Boolean) tokenProperties.get("valid");
        String action = (String) tokenProperties.get("action");

        // get riskAnalysis
        Map<String, Object> riskAnalysis = (Map<String, Object>) responseBody.get("riskAnalysis");
        if (riskAnalysis == null) {
            return false;
        }

        Object rawScore =  riskAnalysis.get("score");

        if (valid == null || !valid) {
            // token  invalidReason
            return false;
        }
        if (rawScore instanceof Number) {
            Number numScore = (Number) rawScore;
            double score = numScore.doubleValue();
            if(score < threshold){
                return false;
            }
        }
        if (expectedAction != null && !expectedAction.equals(action)) {
            return false;
        }
        return true;
    }
}