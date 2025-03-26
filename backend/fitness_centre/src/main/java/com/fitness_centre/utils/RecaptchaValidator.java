package com.fitness_centre.utils;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

/**
 * @author
 * @Classname RecaptchaValidator
 * @Description TODO 需要修改google上的域名允许的范围
 * @date 09/03/2025
 */
@Component
public class RecaptchaValidator {
    @Value("${recaptcha.secretKey}")
    private String secretKey;

    @Value("${recaptcha.API_KEY}")
    private String API_KEY;

    private final RestTemplate restTemplate = new RestTemplate();

    /*
        threshold:Confidence
     */

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