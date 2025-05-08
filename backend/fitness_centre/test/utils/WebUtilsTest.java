package utils;

import com.fitness_centre.utils.WebUtils;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.io.PrintWriter;
import java.io.StringWriter;

/**
 * Unit tests for WebUtils
 */
public class WebUtilsTest {

    @Test
    @DisplayName("renderString should write JSON string and set response headers")
    public void testRenderString() throws Exception {
        // Arrange
        HttpServletResponse response = Mockito.mock(HttpServletResponse.class);
        StringWriter out = new StringWriter();
        PrintWriter printWriter = new PrintWriter(out);
        Mockito.when(response.getWriter()).thenReturn(printWriter);

        String json = "{\"message\":\"ok\"}";

        // Act
        String result = WebUtils.renderString(response, json);

        // Flush writer to ensure content is in StringWriter
        printWriter.flush();

        // Assert
        Assertions.assertNull(result);
        Assertions.assertEquals(json, out.toString());
        Mockito.verify(response).setStatus(200);
        Mockito.verify(response).setContentType("application/json");
        Mockito.verify(response).setCharacterEncoding("utf-8");
    }
} 