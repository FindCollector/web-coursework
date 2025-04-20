package com.fitness_centre.domain;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * @author
 * @Classname HistoryTag
 * @Description TODO
 * @date 19/04/2025
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@TableName("history_tag")
public class HistoryTag {
    private Long historyId;
    private Long tagId;
}