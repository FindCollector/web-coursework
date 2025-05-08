package integration;

import org.springframework.boot.SpringBootConfiguration;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.jackson.JacksonAutoConfiguration;
import org.springframework.boot.autoconfigure.web.servlet.HttpEncodingAutoConfiguration;
import org.springframework.boot.autoconfigure.web.servlet.DispatcherServletAutoConfiguration;
import org.springframework.boot.autoconfigure.web.servlet.ServletWebServerFactoryAutoConfiguration;
import org.springframework.boot.autoconfigure.web.servlet.WebMvcAutoConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.FilterType;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.converter.StringHttpMessageConverter;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.config.annotation.ContentNegotiationConfigurer;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice;
import com.fitness_centre.controller.MemberController;
import com.fitness_centre.controller.CoachController;
import com.fitness_centre.controller.AuthController;
import com.fitness_centre.dto.GeneralResponseResult;
import com.fitness_centre.service.biz.interfaces.LocationService;
import com.fitness_centre.service.biz.interfaces.AvailabilityService;
import com.fitness_centre.service.biz.interfaces.CoachService;
import com.fitness_centre.service.biz.interfaces.SubscriptionService;
import com.fitness_centre.service.biz.interfaces.SessionBookingService;
import com.fitness_centre.service.biz.interfaces.TrainingHistoryService;
import com.fitness_centre.service.biz.interfaces.TagService;
import com.fitness_centre.service.biz.interfaces.UserService;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

import static org.mockito.Mockito.mock;

@SpringBootConfiguration
@EnableAutoConfiguration(exclude = {
        com.baomidou.mybatisplus.autoconfigure.MybatisPlusAutoConfiguration.class
})
@Import({
        JacksonAutoConfiguration.class,
        WebMvcAutoConfiguration.class,
        DispatcherServletAutoConfiguration.class,
        ServletWebServerFactoryAutoConfiguration.class,
        HttpEncodingAutoConfiguration.class
})
@ComponentScan(
    basePackageClasses = {MemberController.class, CoachController.class, AuthController.class},
    includeFilters = @ComponentScan.Filter(
        type = FilterType.ASSIGNABLE_TYPE,
        classes = {MemberController.class, CoachController.class, AuthController.class}
    ),
    useDefaultFilters = false
)
public class TestApplication implements WebMvcConfigurer {
    
    @Bean
    public LocationService locationService() {
        LocationService mockLocationService = mock(LocationService.class);
        return mockLocationService;
    }
    
    @Bean
    public AvailabilityService availabilityService() {
        AvailabilityService mockAvailabilityService = mock(AvailabilityService.class);
        return mockAvailabilityService;
    }
    
    @Bean
    public CoachService coachService() {
        CoachService mockCoachService = mock(CoachService.class);
        return mockCoachService;
    }
    
    @Bean
    public SubscriptionService subscriptionService() {
        SubscriptionService mockSubscriptionService = mock(SubscriptionService.class);
        return mockSubscriptionService;
    }
    
    @Bean
    public SessionBookingService sessionBookingService() {
        SessionBookingService mockSessionBookingService = mock(SessionBookingService.class);
        return mockSessionBookingService;
    }
    
    @Bean
    public TrainingHistoryService trainingHistoryService() {
        TrainingHistoryService mockTrainingHistoryService = mock(TrainingHistoryService.class);
        return mockTrainingHistoryService;
    }
    
    @Bean
    public TagService tagService() {
        TagService mockTagService = mock(TagService.class);
        return mockTagService;
    }
    
    @Bean
    public UserService userService() {
        UserService mockUserService = mock(UserService.class);
        return mockUserService;
    }
    
    @Bean
    public MappingJackson2HttpMessageConverter mappingJackson2HttpMessageConverter() {
        MappingJackson2HttpMessageConverter converter = new MappingJackson2HttpMessageConverter();
        converter.setDefaultCharset(StandardCharsets.UTF_8);
        converter.setSupportedMediaTypes(List.of(MediaType.APPLICATION_JSON));
        return converter;
    }
    
    @Bean
    public StringHttpMessageConverter stringHttpMessageConverter() {
        StringHttpMessageConverter converter = new StringHttpMessageConverter();
        converter.setDefaultCharset(StandardCharsets.UTF_8);
        return converter;
    }
    
    @Bean
    public JsonResponseBodyAdvice jsonResponseBodyAdvice() {
        return new JsonResponseBodyAdvice();
    }
    
    @Override
    public void configureMessageConverters(List<HttpMessageConverter<?>> converters) {
        converters.add(mappingJackson2HttpMessageConverter());
        converters.add(stringHttpMessageConverter());
    }
    
    @Override
    public void configureContentNegotiation(ContentNegotiationConfigurer configurer) {
        configurer.defaultContentType(MediaType.APPLICATION_JSON);
    }
    
    @ControllerAdvice(annotations = RestController.class)
    public static class JsonResponseBodyAdvice implements ResponseBodyAdvice<Object> {
        @Override
        public boolean supports(MethodParameter returnType, Class<? extends HttpMessageConverter<?>> converterType) {
            return true;
        }
        
        @Override
        public Object beforeBodyWrite(Object body, MethodParameter returnType, MediaType selectedContentType,
                                     Class<? extends HttpMessageConverter<?>> selectedConverterType,
                                     ServerHttpRequest request, ServerHttpResponse response) {
            response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
            if (body instanceof GeneralResponseResult) {
                GeneralResponseResult<?> result = (GeneralResponseResult<?>) body;
                return result;
            }
            return body;
        }
    }
} 