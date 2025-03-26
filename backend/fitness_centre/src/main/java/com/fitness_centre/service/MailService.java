package com.fitness_centre.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.util.FileCopyUtils;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import java.io.IOException;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * @author
 * @Classname MailService
 * @Description DONE
 * @date 11/03/2025
 */
@Service
public class MailService {
    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private SpringTemplateEngine templateEngine;

    @Value("${spring.mail.username}")
    private String fromEmail;

    private String generateCode(int length){
        SecureRandom random = new SecureRandom();
        StringBuilder sb = new StringBuilder();
        for(int i = 0;i < length;i++){
            sb.append(random.nextInt(10));
        }
        return sb.toString();
    }

    public String sendVerificationCode(String toEmail) throws MessagingException {


        Context context = new Context();
        String code = generateCode(6);
        context.setVariable("code", code);

        String htmlContent = templateEngine.process("email_verification", context);

        MimeMessage mimeMessage = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

        helper.setFrom(fromEmail);
        helper.setTo(toEmail);
        helper.setSubject("Registration Verification Code");
        helper.setText(htmlContent, true);

        mailSender.send(mimeMessage);

        return code;
    }
}