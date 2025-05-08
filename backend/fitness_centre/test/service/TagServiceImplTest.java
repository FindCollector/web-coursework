package service;

import com.fitness_centre.domain.Tag;
import com.fitness_centre.mapper.TagMapper;
import com.fitness_centre.service.biz.impl.TagServiceImpl;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Unit tests for TagServiceImpl.getAllTags
 */
@ExtendWith(MockitoExtension.class)
public class TagServiceImplTest {

    @Mock
    private TagMapper tagMapper;

    @InjectMocks
    private TagServiceImpl tagService;

    @Test
    @DisplayName("getAllTags should return map from id to tagName")
    public void testGetAllTags() {
        // Arrange
        List<Tag> mockData = Arrays.asList(
                new Tag(1L, "Yoga"),
                new Tag(2L, "Pilates")
        );
        Mockito.when(tagMapper.selectList(Mockito.any())).thenReturn(mockData);

        // Act
        Map<Long, String> result = tagService.getAllTags();

        // Assert
        Assertions.assertEquals(mockData.stream().collect(Collectors.toMap(Tag::getId, Tag::getTagName)), result);
        // Verify mapper interaction
        Mockito.verify(tagMapper).selectList(Mockito.any());
    }
} 