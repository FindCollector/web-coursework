package com.fitness_centre.config;

import org.hibernate.validator.HibernateValidator;
import org.hibernate.validator.HibernateValidatorConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;

@Configuration
public class ValidationConfig {

    @Bean
    public Validator validator() {
        // 1. 创建 Hibernate Validator 配置对象
        HibernateValidatorConfiguration configuration = Validation
                .byProvider(HibernateValidator.class)
                .configure();

        // 2. 启用 fail-fast 模式
        configuration.failFast(true);

        // 3. 构建 ValidatorFactory 并返回 Validator
        ValidatorFactory validatorFactory = configuration.buildValidatorFactory();
        return validatorFactory.getValidator();
    }
}