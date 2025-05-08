import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ProgressChart from '../../src/components/feature/ProgressChart';

describe('ProgressChart Component', () => {
  const mockData = [
    { label: '周一', value: 10 },
    { label: '周二', value: 20 },
    { label: '周三', value: 15 },
    { label: '周四', value: 25 },
    { label: '周五', value: 30 }
  ];

  const title = '每周训练进度';

  it('renders the component with title', () => {
    render(<ProgressChart data={mockData} title={title} />);
    
    expect(screen.getByText(title)).toBeInTheDocument();
    expect(screen.getByTestId('progress-chart')).toBeInTheDocument();
  });

  it('renders bar chart by default when no type is specified', () => {
    render(<ProgressChart data={mockData} title={title} />);
    
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
  });

  it('renders line chart when type is line', () => {
    render(<ProgressChart data={mockData} title={title} type="line" />);
    
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument();
  });

  it('renders no data message when data is empty', () => {
    render(<ProgressChart data={[]} title={title} />);
    
    expect(screen.getByTestId('no-data')).toBeInTheDocument();
    expect(screen.getByText('暂无数据')).toBeInTheDocument();
  });

  it('renders no data message when data is null', () => {
    render(<ProgressChart data={null} title={title} />);
    
    expect(screen.getByTestId('no-data')).toBeInTheDocument();
  });

  it('renders the correct number of bars in bar chart', () => {
    render(<ProgressChart data={mockData} type="bar" />);
    
    const barItems = screen.getAllByTestId('bar-item');
    expect(barItems.length).toBe(mockData.length);
  });

  it('renders the correct number of points in line chart', () => {
    render(<ProgressChart data={mockData} type="line" />);
    
    const chartPoints = screen.getAllByTestId('chart-point');
    expect(chartPoints.length).toBe(mockData.length);
  });

  it('includes data labels in the bar chart', () => {
    render(<ProgressChart data={mockData} type="bar" />);
    
    mockData.forEach(item => {
      expect(screen.getByText(item.label)).toBeInTheDocument();
    });
  });

  it('includes data values in the bar chart', () => {
    render(<ProgressChart data={mockData} type="bar" />);
    
    mockData.forEach(item => {
      expect(screen.getByText(item.value.toString())).toBeInTheDocument();
    });
  });

  it('sets correct aria-labels for accessibility in bar chart', () => {
    render(<ProgressChart data={mockData} type="bar" />);
    
    const barFills = document.querySelectorAll('.bar-fill');
    mockData.forEach((item, index) => {
      expect(barFills[index].getAttribute('aria-label')).toBe(`${item.label}: ${item.value}`);
    });
  });

  it('sets correct aria-labels for accessibility in line chart', () => {
    render(<ProgressChart data={mockData} type="line" />);
    
    const chartPoints = document.querySelectorAll('.chart-point');
    mockData.forEach((item, index) => {
      expect(chartPoints[index].getAttribute('aria-label')).toBe(`${item.label}: ${item.value}`);
    });
  });

  it('handles data updates correctly', () => {
    const { rerender } = render(<ProgressChart data={mockData} type="bar" />);
    
    expect(screen.getAllByTestId('bar-item').length).toBe(5);
    
    const updatedData = mockData.slice(0, 3); // 减少数据点
    rerender(<ProgressChart data={updatedData} type="bar" />);
    
    expect(screen.getAllByTestId('bar-item').length).toBe(3);
  });

  it('handles type changes correctly', () => {
    const { rerender } = render(<ProgressChart data={mockData} type="bar" />);
    
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    
    rerender(<ProgressChart data={mockData} type="line" />);
    
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument();
  });
}); 