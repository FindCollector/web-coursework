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
 * String splitting utility class
 */
public class StringSplitUtil {

    /**
     * 1. Simplest usage: Split by comma and remove leading/trailing whitespace
     * @param input  String to be split
     * @return List of split strings
     */
    public static List<String> splitByComma(String input) {
        if (input == null || input.trim().isEmpty()) {
            return Collections.emptyList();
        }
        // First split by comma, then trim each element
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
     * 2. More general splitting: Can specify delimiter, whether to remove duplicates, etc.
     * @param input       String to be split
     * @param delimiter   Delimiter (such as "," / ";" / "\\|" etc.)
     * @param trim        Whether to remove leading/trailing whitespace from each item
     * @param ignoreEmpty Whether to ignore empty strings
     * @param distinct    Whether to remove duplicates
     * @return List of split strings
     */
    public static List<String> splitToList(String input, String delimiter,
                                           boolean trim, boolean ignoreEmpty, boolean distinct) {
        if (input == null || input.isEmpty()) {
            return Collections.emptyList();
        }

        // Use -1 as the limit parameter to force keeping trailing empty strings
        String[] parts = input.split(delimiter, -1);
        List<String> list = new ArrayList<>();
        for (String part : parts) {
            String item = trim ? part.trim() : part;
            if (ignoreEmpty && item.isEmpty()) {
                // Skip empty strings
                continue;
            }
            list.add(item);
        }
        // If deduplication is needed, use LinkedHashSet to preserve order
        if (distinct) {
            list = new ArrayList<>(new LinkedHashSet<>(list));
        }
        return list;
    }

    // Additional methods can be added here if needed
}
