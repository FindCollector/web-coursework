package integration;

import com.fitness_centre.controller.CoachController;
import com.fitness_centre.dto.GeneralResponseResult;
import com.fitness_centre.dto.coach.AvailabilitySetRequest;
import com.fitness_centre.filter.JwtAuthenticationTokenFilter;
import com.fitness_centre.security.LoginUser;
import com.fitness_centre.service.biz.interfaces.*;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalTime;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@WebMvcTest(CoachController.class)
@Import(SecurityConfigTest.class)
@ContextConfiguration(classes = integration.TestApplication.class)
public class CoachControllerIntegrationTest {

    @Autowired
    private CoachController coachController;

    @MockBean private CoachService coachService;
    @MockBean private SubscriptionService subscriptionService;
    @MockBean private AvailabilityService availabilityService;
    @MockBean private SessionBookingService sessionBookingService;
    @MockBean private TrainingHistoryService trainingHistoryService;
    @MockBean private TagService tagService;
    
    // 安全相关组件
    @MockBean private JwtAuthenticationTokenFilter jwtAuthenticationTokenFilter;
    @MockBean private AuthenticationEntryPoint authenticationEntryPoint;
    @MockBean private AccessDeniedHandler accessDeniedHandler;
    
    @BeforeEach
    public void setup() {
        // 设置 Security Context
        SecurityContext securityContext = SecurityContextHolder.createEmptyContext();
        LoginUser loginUser = mock(LoginUser.class);
        when(loginUser.getId()).thenReturn(1L);
        
        List<SimpleGrantedAuthority> authorities = 
            Collections.singletonList(new SimpleGrantedAuthority("ROLE_coach"));
        
        Authentication auth = 
            new UsernamePasswordAuthenticationToken(loginUser, null, authorities);
        
        securityContext.setAuthentication(auth);
        SecurityContextHolder.setContext(securityContext);
    }
    
    @AfterEach
    public void tearDown() {
        // 清理 Security Context
        SecurityContextHolder.clearContext();
    }
    
    // 手动创建一个简化版的测试
    @Test
    @DisplayName("直接测试 CoachController.updateAvailability 方法")
    void directUpdateAvailabilityTest() {
        // 1. 准备测试数据
        AvailabilitySetRequest request = new AvailabilitySetRequest();
        request.setDayOfWeek(1);
        request.setStartTime(LocalTime.parse("09:00"));
        request.setEndTime(LocalTime.parse("10:00"));
        
        // 2. 创建模拟 Authentication 对象 - 现在从SecurityContext中获取
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        // 3. 设置模拟服务返回值
        when(availabilityService.updateAvailability(any(), any(), any()))
            .thenReturn(new GeneralResponseResult<>(0, "success", null));
        
        // 4. 直接调用控制器方法
        GeneralResponseResult result = coachController.updateAvailability(1L, request, authentication);
        
        // 5. 验证结果
        assertNotNull(result);
        assertEquals(0, result.getCode());
        
        // 6. 验证服务方法被正确调用
        verify(availabilityService).updateAvailability(eq(1L), eq(1L), eq(request));
    }
} 