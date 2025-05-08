package infrastructure;

import com.fitness_centre.exception.BusinessException;
import com.fitness_centre.exception.SystemException;
import com.fitness_centre.service.infrastructure.FileService;
import org.apache.commons.io.FileUtils;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

/**
 * Tests for FileService upload and delete logic.
 */
@ExtendWith(MockitoExtension.class)
public class FileServiceTest {

    private static Path tempDir;

    private FileService buildService() throws IOException {
        FileService svc = new FileService();
        if (tempDir == null) {
            tempDir = Files.createTempDirectory("fs-test");
        }
        ReflectionTestUtils.setField(svc, "tempPath", tempDir.toString());
        ReflectionTestUtils.setField(svc, "formalPath", tempDir.toString());
        return svc;
    }

    @Test
    @DisplayName("uploadFileToTemp should reject non-image file")
    public void testUploadInvalidImage() throws Exception {
        FileService svc = buildService();
        MockMultipartFile nonImg = new MockMultipartFile("file", "test.txt", "text/plain", "hello".getBytes());
        Assertions.assertThrows(BusinessException.class, () -> svc.uploadFileToTemp(nonImg, 1L));
    }

    @Test
    @DisplayName("uploadFileToTemp should store jpeg/png and return path")
    public void testUploadSuccess() throws Exception {
        FileService svc = buildService();

        // Create small 1x1 png image in memory
        BufferedImage img = new BufferedImage(1, 1, BufferedImage.TYPE_INT_RGB);
        byte[] imgBytes;
        try (java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream()) {
            ImageIO.write(img, "png", baos);
            imgBytes = baos.toByteArray();
        }
        MockMultipartFile file = new MockMultipartFile("file", "avatar.png", "image/png", imgBytes);

        String path = svc.uploadFileToTemp(file, 42L);
        Assertions.assertEquals("/temp/42.png", path);
        // Ensure file exists
        File saved = new File(tempDir.toFile(), "42.png");
        Assertions.assertTrue(saved.exists());
    }

    @Test
    @DisplayName("deleteFileByUseId should delete existing files")
    public void testDeleteFile() throws Exception {
        FileService svc = buildService();
        // Prepare a dummy file
        File f = new File(tempDir.toFile(), "99.jpg");
        FileUtils.writeStringToFile(f, "x", "UTF-8");
        Assertions.assertTrue(f.exists());

        Assertions.assertDoesNotThrow(() -> svc.deleteFileByUseId(99L));
        Assertions.assertFalse(f.exists());
    }
} 