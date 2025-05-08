package utils;

import com.fitness_centre.utils.StringSplitUtil;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

/**
 * StringSplitUtil 的单元测试
 */
public class StringSplitUtilTest {

    @Test
    @DisplayName("splitByComma 基本场景")
    public void testSplitByCommaBasic() {
        String input = "a, b ,c,, d";
        List<String> result = StringSplitUtil.splitByComma(input);
        Assertions.assertEquals(List.of("a", "b", "c", "d"), result);
    }

    @Test
    @DisplayName("splitByComma 空字符串/Null 场景")
    public void testSplitByCommaEmpty() {
        Assertions.assertTrue(StringSplitUtil.splitByComma("").isEmpty());
        Assertions.assertTrue(StringSplitUtil.splitByComma("   ").isEmpty());
        Assertions.assertTrue(StringSplitUtil.splitByComma(null).isEmpty());
    }

    @Test
    @DisplayName("splitToList 多参数场景：去空格、去重、忽略空串")
    public void testSplitToListAdvanced() {
        String input = "apple| banana||apple| |";
        List<String> result = StringSplitUtil.splitToList(input, "\\|", true, true, true);
        Assertions.assertEquals(List.of("apple", "banana"), result);
    }

    @Test
    @DisplayName("splitToList 保留空串并允许重复")
    public void testSplitToListKeepEmptyAndDuplicates() {
        String input = "x;;y;";
        List<String> result = StringSplitUtil.splitToList(input, ";", false, false, false);
        Assertions.assertEquals(List.of("x", "", "y", ""), result);
    }
} 