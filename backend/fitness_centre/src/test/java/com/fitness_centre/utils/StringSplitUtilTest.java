package com.fitness_centre.utils;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class StringSplitUtilTest {

    @Test
    @DisplayName("splitByComma: 常规输入应按逗号拆分并去空格")
    void testSplitByComma_normal() {
        String input = " a, b ,c,, d";
        List<String> result = StringSplitUtil.splitByComma(input);
        assertIterableEquals(List.of("a", "b", "c", "d"), result);
    }

    @Test
    @DisplayName("splitByComma: 空或null输入应返回空列表")
    void testSplitByComma_empty() {
        assertTrue(StringSplitUtil.splitByComma(null).isEmpty());
        assertTrue(StringSplitUtil.splitByComma("   ").isEmpty());
    }

    @Test
    @DisplayName("splitToList: 支持去重/忽略空/trim 功能")
    void testSplitToList_advanced() {
        String input = " a , b, a,, c";
        List<String> result = StringSplitUtil.splitToList(input, ",", true, true, true);
        assertIterableEquals(List.of("a", "b", "c"), result);
    }

    @Test
    @DisplayName("splitToList: 不去重且保留空项")
    void testSplitToList_keepDuplicates() {
        String input = "x| y|x|| ";
        List<String> result = StringSplitUtil.splitToList(input, "\\|", true, false, false);
        assertIterableEquals(List.of("x", "y", "x", "", ""), result);
    }
} 