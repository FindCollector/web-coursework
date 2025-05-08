import React, { useMemo } from 'react';
import PropTypes from 'prop-types';

/**
 * 进度图表组件，用于显示训练数据的进度
 * @param {Object} props 组件属性
 * @param {Array} props.data 图表数据数组
 * @param {string} props.title 图表标题
 * @param {string} props.type 图表类型 (bar|line)
 * @param {Object} props.config 图表配置
 * @returns {JSX.Element} 进度图表组件
 */
const ProgressChart = ({ data, title, type = 'bar', config = {} }) => {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return { labels: [], values: [] };
    }
    
    return {
      labels: data.map(item => item.label),
      values: data.map(item => item.value)
    };
  }, [data]);
  
  const maxValue = useMemo(() => {
    if (!chartData.values.length) return 100;
    return Math.max(...chartData.values) * 1.2; // 最大值增加20%的空间
  }, [chartData.values]);
  
  const renderBarChart = () => {
    return (
      <div className="bar-chart" data-testid="bar-chart">
        {chartData.labels.map((label, index) => {
          const value = chartData.values[index];
          const percentage = (value / maxValue) * 100;
          
          return (
            <div key={label} className="bar-item" data-testid="bar-item">
              <div className="bar-label">{label}</div>
              <div className="bar-container">
                <div 
                  className="bar-fill" 
                  style={{ width: `${percentage}%` }}
                  data-value={value}
                  aria-label={`${label}: ${value}`}
                ></div>
              </div>
              <div className="bar-value">{value}</div>
            </div>
          );
        })}
      </div>
    );
  };
  
  const renderLineChart = () => {
    // 简化版的线图表示，实际项目中可能会使用第三方库
    return (
      <div className="line-chart" data-testid="line-chart">
        <div className="line-chart-points">
          {chartData.labels.map((label, index) => {
            const value = chartData.values[index];
            const percentage = (value / maxValue) * 100;
            
            return (
              <div 
                key={label}
                className="chart-point"
                style={{ 
                  left: `${(index / (chartData.labels.length - 1)) * 100}%`, 
                  bottom: `${percentage}%` 
                }}
                data-value={value}
                data-label={label}
                aria-label={`${label}: ${value}`}
                data-testid="chart-point"
              ></div>
            );
          })}
        </div>
      </div>
    );
  };
  
  return (
    <div className="progress-chart" data-testid="progress-chart">
      {title && <h3 className="chart-title">{title}</h3>}
      <div className="chart-container">
        {data && data.length > 0 ? (
          type === 'bar' ? renderBarChart() : renderLineChart()
        ) : (
          <div className="no-data" data-testid="no-data">暂无数据</div>
        )}
      </div>
    </div>
  );
};

ProgressChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.number.isRequired
    })
  ),
  title: PropTypes.string,
  type: PropTypes.oneOf(['bar', 'line']),
  config: PropTypes.object
};

export default ProgressChart; 