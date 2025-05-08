/**
 * 日期处理工具函数
 */

/**
 * 格式化日期为 YYYY-MM-DD 格式
 * @param {Date|string|number} date 日期对象、ISO日期字符串或时间戳
 * @returns {string} 格式化后的日期字符串
 */
export const formatDate = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  
  // 检查日期是否有效
  if (isNaN(d.getTime())) {
    return '';
  }
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * 格式化日期时间为 YYYY-MM-DD HH:MM:SS 格式
 * @param {Date|string|number} date 日期对象、ISO日期字符串或时间戳
 * @returns {string} 格式化后的日期时间字符串
 */
export const formatDateTime = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  
  // 检查日期是否有效
  if (isNaN(d.getTime())) {
    return '';
  }
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

/**
 * 计算两个日期之间的天数差
 * @param {Date|string|number} startDate 开始日期
 * @param {Date|string|number} endDate 结束日期
 * @returns {number} 天数差，如果输入无效则返回null
 */
export const getDaysBetween = (startDate, endDate) => {
  if (!startDate || !endDate) return null;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // 检查日期是否有效
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return null;
  }
  
  // 清除时间部分，只保留日期
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  
  // 计算天数差
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

/**
 * 获取当前日期前后n天的日期
 * @param {number} days 天数，正数表示未来，负数表示过去
 * @param {Date|string|number} [fromDate=new Date()] 基准日期，默认为当前日期
 * @returns {Date} 计算后的日期
 */
export const getDateOffset = (days, fromDate = new Date()) => {
  const date = new Date(fromDate);
  
  // 检查日期是否有效
  if (isNaN(date.getTime())) {
    return new Date();
  }
  
  date.setDate(date.getDate() + days);
  return date;
};

/**
 * 检查日期是否在有效范围内
 * @param {Date|string|number} date 要检查的日期
 * @param {Date|string|number} minDate 最小日期
 * @param {Date|string|number} maxDate 最大日期
 * @returns {boolean} 是否在范围内
 */
export const isDateInRange = (date, minDate, maxDate) => {
  if (!date) return false;
  
  const d = new Date(date);
  const min = minDate ? new Date(minDate) : null;
  const max = maxDate ? new Date(maxDate) : null;
  
  // 检查日期是否有效
  if (isNaN(d.getTime())) {
    return false;
  }
  
  // 检查最小日期
  if (min && !isNaN(min.getTime()) && d < min) {
    return false;
  }
  
  // 检查最大日期
  if (max && !isNaN(max.getTime()) && d > max) {
    return false;
  }
  
  return true;
}; 