import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  formatDate,
  formatDateTime,
  getDaysBetween,
  getDateOffset,
  isDateInRange
} from '../../src/utils/dateUtils';

describe('Date Utilities', () => {
  describe('formatDate function', () => {
    it('should format Date object to YYYY-MM-DD', () => {
      const date = new Date(2023, 0, 15); // 2023-01-15
      expect(formatDate(date)).toBe('2023-01-15');
    });
    
    it('should format ISO date string to YYYY-MM-DD', () => {
      const dateString = '2023-02-20T15:30:45.123Z';
      // 需要注意时区影响，可能会导致日期不同
      const expectedDate = new Date(dateString).toISOString().split('T')[0];
      expect(formatDate(dateString)).toBe(expectedDate);
    });
    
    it('should format timestamp to YYYY-MM-DD', () => {
      const timestamp = 1677676800000; // 2023-03-01 in UTC
      const date = new Date(timestamp);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const expected = `${year}-${month}-${day}`;
      expect(formatDate(timestamp)).toBe(expected);
    });
    
    it('should return empty string for null or undefined input', () => {
      expect(formatDate(null)).toBe('');
      expect(formatDate(undefined)).toBe('');
    });
    
    it('should return empty string for invalid date', () => {
      expect(formatDate('not-a-date')).toBe('');
    });
  });
  
  describe('formatDateTime function', () => {
    it('should format Date object to YYYY-MM-DD HH:MM:SS', () => {
      const date = new Date(2023, 0, 15, 14, 30, 25); // 2023-01-15 14:30:25
      expect(formatDateTime(date)).toBe('2023-01-15 14:30:25');
    });
    
    it('should format ISO date string to YYYY-MM-DD HH:MM:SS', () => {
      // 使用模拟的固定日期以避免时区问题
      const mockDate = new Date(2023, 3, 20, 10, 15, 30);
      vi.setSystemTime(mockDate);
      
      const dateString = mockDate.toISOString();
      expect(formatDateTime(dateString)).toBe('2023-04-20 10:15:30');
      
      vi.useRealTimers(); // 恢复真实时间
    });
    
    it('should return empty string for null or undefined input', () => {
      expect(formatDateTime(null)).toBe('');
      expect(formatDateTime(undefined)).toBe('');
    });
    
    it('should return empty string for invalid date', () => {
      expect(formatDateTime('not-a-date')).toBe('');
    });
  });
  
  describe('getDaysBetween function', () => {
    it('should calculate days between two dates', () => {
      const startDate = new Date(2023, 0, 1); // 2023-01-01
      const endDate = new Date(2023, 0, 10); // 2023-01-10
      expect(getDaysBetween(startDate, endDate)).toBe(9);
    });
    
    it('should return same result regardless of date order', () => {
      const date1 = new Date(2023, 0, 1);
      const date2 = new Date(2023, 0, 10);
      expect(getDaysBetween(date1, date2)).toBe(getDaysBetween(date2, date1));
    });
    
    it('should return 0 for same date', () => {
      const date = new Date(2023, 0, 1);
      expect(getDaysBetween(date, date)).toBe(0);
    });
    
    it('should handle date strings correctly', () => {
      expect(getDaysBetween('2023-01-01', '2023-01-10')).toBe(9);
    });
    
    it('should return null for invalid inputs', () => {
      expect(getDaysBetween(null, '2023-01-10')).toBeNull();
      expect(getDaysBetween('2023-01-01', null)).toBeNull();
      expect(getDaysBetween('not-a-date', '2023-01-10')).toBeNull();
    });
  });
  
  describe('getDateOffset function', () => {
    it('should add days to date correctly', () => {
      const baseDate = new Date(2023, 0, 15); // 2023-01-15
      const result = getDateOffset(5, baseDate);
      expect(result.getDate()).toBe(20);
      expect(result.getMonth()).toBe(0);
      expect(result.getFullYear()).toBe(2023);
    });
    
    it('should subtract days from date correctly', () => {
      const baseDate = new Date(2023, 0, 15); // 2023-01-15
      const result = getDateOffset(-5, baseDate);
      expect(result.getDate()).toBe(10);
      expect(result.getMonth()).toBe(0);
      expect(result.getFullYear()).toBe(2023);
    });
    
    it('should handle month transition correctly', () => {
      const baseDate = new Date(2023, 0, 30); // 2023-01-30
      const result = getDateOffset(5, baseDate);
      expect(result.getDate()).toBe(4);
      expect(result.getMonth()).toBe(1); // February
      expect(result.getFullYear()).toBe(2023);
    });
    
    it('should handle year transition correctly', () => {
      const baseDate = new Date(2023, 11, 29); // 2023-12-29
      const result = getDateOffset(5, baseDate);
      expect(result.getDate()).toBe(3);
      expect(result.getMonth()).toBe(0); // January
      expect(result.getFullYear()).toBe(2024);
    });
    
    it('should use current date when no base date is provided', () => {
      // 使用模拟的固定日期
      const now = new Date(2023, 4, 15);
      vi.setSystemTime(now);
      
      const result = getDateOffset(5);
      expect(result.getDate()).toBe(20);
      expect(result.getMonth()).toBe(4);
      expect(result.getFullYear()).toBe(2023);
      
      vi.useRealTimers(); // 恢复真实时间
    });
    
    it('should handle invalid base date by returning a new date', () => {
      const result = getDateOffset(5, 'not-a-date');
      expect(result instanceof Date).toBe(true);
      expect(isNaN(result.getTime())).toBe(false); // 确保是有效日期
    });
  });
  
  describe('isDateInRange function', () => {
    it('should return true when date is in range', () => {
      const date = new Date(2023, 5, 15); // 2023-06-15
      const minDate = new Date(2023, 0, 1); // 2023-01-01
      const maxDate = new Date(2023, 11, 31); // 2023-12-31
      expect(isDateInRange(date, minDate, maxDate)).toBe(true);
    });
    
    it('should return true when date equals min date', () => {
      const date = new Date(2023, 0, 1);
      const minDate = new Date(2023, 0, 1);
      const maxDate = new Date(2023, 11, 31);
      expect(isDateInRange(date, minDate, maxDate)).toBe(true);
    });
    
    it('should return true when date equals max date', () => {
      const date = new Date(2023, 11, 31);
      const minDate = new Date(2023, 0, 1);
      const maxDate = new Date(2023, 11, 31);
      expect(isDateInRange(date, minDate, maxDate)).toBe(true);
    });
    
    it('should return false when date is before min date', () => {
      const date = new Date(2022, 11, 31); // 2022-12-31
      const minDate = new Date(2023, 0, 1); // 2023-01-01
      const maxDate = new Date(2023, 11, 31); // 2023-12-31
      expect(isDateInRange(date, minDate, maxDate)).toBe(false);
    });
    
    it('should return false when date is after max date', () => {
      const date = new Date(2024, 0, 1); // 2024-01-01
      const minDate = new Date(2023, 0, 1); // 2023-01-01
      const maxDate = new Date(2023, 11, 31); // 2023-12-31
      expect(isDateInRange(date, minDate, maxDate)).toBe(false);
    });
    
    it('should handle null min date', () => {
      const date = new Date(2023, 5, 15); // 2023-06-15
      const maxDate = new Date(2023, 11, 31); // 2023-12-31
      expect(isDateInRange(date, null, maxDate)).toBe(true);
    });
    
    it('should handle null max date', () => {
      const date = new Date(2023, 5, 15); // 2023-06-15
      const minDate = new Date(2023, 0, 1); // 2023-01-01
      expect(isDateInRange(date, minDate, null)).toBe(true);
    });
    
    it('should return false for invalid date', () => {
      const minDate = new Date(2023, 0, 1);
      const maxDate = new Date(2023, 11, 31);
      expect(isDateInRange('not-a-date', minDate, maxDate)).toBe(false);
    });
    
    it('should return false for null date', () => {
      const minDate = new Date(2023, 0, 1);
      const maxDate = new Date(2023, 11, 31);
      expect(isDateInRange(null, minDate, maxDate)).toBe(false);
    });
  });
}); 