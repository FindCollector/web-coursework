package com.fitness_centre.annotation;

/**
 * @author
 * @Classname ReuqireRecaptcha
 * @Description TODO
 * @date 28/03/2025
 */
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RequireRecaptcha {
    double minScore() default 0.5;
}