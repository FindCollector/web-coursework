package com.fitness_centre.utils;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * @author
 * @Classname StringSplitUtil
 * @Description TODO
 * @date 05/04/2025
 */

import java.util.*;
import java.util.stream.Collectors;

/**
 * 字符串拆分工具类
 */
public class StringSplitUtil {

    /**
     * 1. 最简单用法：按逗号拆分，并去除首尾空格
     * @param input  需要拆分的字符串
     * @return 拆分后的字符串列表
     */
    public static List<String> splitByComma(String input) {
        if (input == null || input.trim().isEmpty()) {
            return Collections.emptyList();
        }
        // 先用逗号分割，再把每个元素trim一下
        String[] parts = input.split(",");
        List<String> result = new ArrayList<>();
        for (String part : parts) {
            String trimmed = part.trim();
            if (!trimmed.isEmpty()) {
                result.add(trimmed);
            }
        }
        return result;
    }

    /**
     * 2. 更通用的拆分：可指定分隔符、是否需要去重等
     * @param input       需要拆分的字符串
     * @param delimiter   分隔符（如 "," / ";" / "\\|" 等）
     * @param trim        是否去除每一项的首尾空格
     * @param ignoreEmpty 是否忽略空字符串
     * @param distinct    是否去重
     * @return 拆分后的字符串列表
     */
    public static List<String> splitToList(String input, String delimiter,
                                           boolean trim, boolean ignoreEmpty, boolean distinct) {
        if (input == null || input.isEmpty()) {
            return Collections.emptyList();
        }

        String[] parts = input.split(delimiter);
        List<String> list = new ArrayList<>();
        for (String part : parts) {
            String item = trim ? part.trim() : part;
            if (ignoreEmpty && item.isEmpty()) {
                // 跳过空字符串
                continue;
            }
            list.add(item);
        }
        // 如果需要去重，则用LinkedHashSet保留顺序
        if (distinct) {
            list = new ArrayList<>(new LinkedHashSet<>(list));
        }
        return list;
    }

    // 如果还有更多需求，可在此继续添加方法
}
