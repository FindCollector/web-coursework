package service;

import com.fitness_centre.dto.admin.UserListQueryRequest;
import com.fitness_centre.exception.BusinessException;
import com.fitness_centre.service.biz.impl.UserServiceImpl;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/**
 * Tests for UserServiceImpl.pageQueryUser sorting validation.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
public class UserServicePageQueryTest {

    private UserServiceImpl createSpyService() {
        UserServiceImpl svc = Mockito.spy(new UserServiceImpl());
        // Stub the page(..) call to avoid database interaction
        Mockito.doReturn(new Page<>()).when(svc).page(Mockito.any(), Mockito.any());
        return svc;
    }

    @Test
    @DisplayName("pageQueryUser should throw ResponseStatusException for illegal sort field")
    public void testIllegalSortField() {
        UserServiceImpl svc = createSpyService();
        UserListQueryRequest req = new UserListQueryRequest();
        req.setSortFields(List.of("notExist"));
        req.setSortOrders(List.of("asc"));

        Assertions.assertThrows(ResponseStatusException.class, () -> svc.pageQueryUser(req));
    }

    @Test
    @DisplayName("pageQueryUser should throw ResponseStatusException for illegal sort order")
    public void testIllegalSortOrder() {
        UserServiceImpl svc = createSpyService();
        UserListQueryRequest req = new UserListQueryRequest();
        req.setSortFields(List.of("birthday"));
        req.setSortOrders(List.of("boom"));

        Assertions.assertThrows(ResponseStatusException.class, () -> svc.pageQueryUser(req));
    }

    @Test
    @DisplayName("pageQueryUser should proceed with legal sort params")
    public void testLegalSort() {
        UserServiceImpl svc = createSpyService();
        UserListQueryRequest req = new UserListQueryRequest();
        req.setSortFields(List.of("registerTime"));
        req.setSortOrders(List.of("DESC"));

        Assertions.assertDoesNotThrow(() -> svc.pageQueryUser(req));
        // Verify page method invoked
        Mockito.verify(svc).page(Mockito.any(), Mockito.any());
    }
} 