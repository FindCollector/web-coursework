import '@testing-library/jest-dom';
import { server } from './mocks/server';

// 在所有测试之前启动 MSW 服务器
beforeAll(() => {
  // 启动服务器并开始监听网络请求
  server.listen({ onUnhandledRequest: 'warn' });
});

// 每个测试之后重置请求处理器
// 确保一个测试的数据不会影响下一个测试
afterEach(() => {
  server.resetHandlers();
});

// 所有测试完成后关闭 MSW 服务器
afterAll(() => {
  server.close();
});

// 添加 localStorage 和 sessionStorage 模拟
// 确保每个测试开始前都是干净的存储状态 
beforeEach(() => {
  // 清空 localStorage 和 sessionStorage
  localStorage.clear();
  sessionStorage.clear();
});

// polyfill window.matchMedia for Ant Design responsive features
if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
} 