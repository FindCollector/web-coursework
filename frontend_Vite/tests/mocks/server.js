import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// 创建 MSW 服务器实例，使用已定义的处理器
export const server = setupServer(...handlers);

// 导出处理器以便在测试中直接使用
export { handlers }; 