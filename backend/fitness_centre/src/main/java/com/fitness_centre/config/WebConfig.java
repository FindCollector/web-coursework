package com.fitness_centre.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * @author
 * @Classname WebConfig
 * @Description TODO
 * @date 01/04/2025
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Value("${upload.temp-path}")
    private String tempPath;

    @Value("${upload.formal-path}")
    private String formalPath;
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
//        空实现不需要
//        WebMvcConfigurer.super.addResourceHandlers(registry);
        registry.addResourceHandler("/temp/**")
                .addResourceLocations("file:" + tempPath + "/");
        registry.addResourceHandler("/formal/**")
                .addResourceLocations("file:" + formalPath + "/");

    }
}