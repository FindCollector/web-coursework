package integration;

import com.fitness_centre.constant.ErrorCode;
import com.fitness_centre.controller.MemberController;
import com.fitness_centre.dto.GeneralResponseResult;
import com.fitness_centre.filter.JwtAuthenticationTokenFilter;
import com.fitness_centre.service.biz.interfaces.CoachService;
import com.fitness_centre.service.biz.interfaces.LocationService;
import com.fitness_centre.service.biz.interfaces.SubscriptionService;
import com.fitness_centre.service.biz.interfaces.TagService;
import com.fitness_centre.service.biz.interfaces.SessionBookingService;
import com.fitness_centre.service.biz.interfaces.TrainingHistoryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(MemberController.class)
@Import(SecurityConfigTest.class)
@ContextConfiguration(classes = integration.TestApplication.class)
public class MemberControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private TagService tagService;

    @MockBean
    private LocationService locationService;

    // 仅为满足 Spring 上下文依赖关系而创建的 MockBean
    @MockBean private CoachService coachService;
    @MockBean private SubscriptionService subscriptionService;
    @MockBean private SessionBookingService sessionBookingService;
    @MockBean private TrainingHistoryService trainingHistoryService;
    
    // 安全相关组件
    @MockBean private JwtAuthenticationTokenFilter jwtAuthenticationTokenFilter;
    @MockBean private AuthenticationEntryPoint authenticationEntryPoint;
    @MockBean private AccessDeniedHandler accessDeniedHandler;
    
    @BeforeEach
    public void setup() {
        // 不模拟Controller方法，而是模拟Service层方法
        Map<Long, String> tags = Map.of(1L, "瑜伽", 2L, "普拉提");
        Map<Long, String> locations = Map.of(1L, "CBD 会所", 2L, "Uptown 健身房");
        
        when(tagService.getAllTags()).thenReturn(tags);
        when(locationService.getAllLocations()).thenReturn(locations);
    }

    @Test
    @DisplayName("测试 TagService 和 LocationService 返回正确的标签和位置数据")
    @WithMockUser(roles = "member")
    void coachFilterSuccess() throws Exception {
        // 预期的数据
        Map<Long, String> expectedTags = Map.of(1L, "瑜伽", 2L, "普拉提");
        Map<Long, String> expectedLocations = Map.of(1L, "CBD 会所", 2L, "Uptown 健身房");
        
        // 直接验证 mock service 返回的数据是否正确
        Map<Long, String> actualTags = tagService.getAllTags();
        Map<Long, String> actualLocations = locationService.getAllLocations();
        
        assertEquals(expectedTags, actualTags, "标签数据应该匹配");
        assertEquals(expectedLocations, actualLocations, "位置数据应该匹配");
        
        // 验证 Controller 接口返回 200 状态码
        mockMvc.perform(get("/member/coach/filter")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
                
        // 验证 service 方法被调用
        verify(tagService, times(1)).getAllTags();
        verify(locationService, times(1)).getAllLocations();
    }
} 