import dotenv from 'dotenv';
import config from './config';
import app from './agent';
import express, { Request, Response } from 'express';
import { HumanMessage } from "@langchain/core/messages";

// 加载环境变量
dotenv.config();

// 创建 Express 应用
const expressApp = express();
expressApp.use(express.json());

console.log('Hello, TypeScript + Node.js with dotenv!');

// 输出环境变量示例
console.log('Environment Variables:');
console.log('PORT:', config.port);
console.log('NODE_ENV:', config.nodeEnv);
console.log('DB_HOST:', config.dbHost);
console.log('DB_PORT:', config.dbPort);

// 检查 DeepSeek API 密钥
if (!config.deepseekApiKey || config.deepseekApiKey === 'sk-f9cbf3a3faa0490cabde05ddccaafa9b') {
  console.warn('Warning: DEEPSEEK_API_KEY is not set in the .env file. LLM features will not work properly.');
}

// 简单示例函数
function greet(name: string): string {
  return `Hello, ${name}!`;
}

// 添加路由来处理 LangGraph 请求
expressApp.post('/invoke', async (req: Request, res: Response) => {
  try {
    const { input, threadId = "1" } = req.body;
    if (!input) {
      return res.status(400).json({ error: 'Input is required' });
    }

    const result = await app.invoke({
      messages: [new HumanMessage(input)]
    }, {
      configurable: {
        threadId
      }
    });

    res.json(result);
  } catch (error) {
    console.error('Error invoking agent:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 启动服务器
const server = expressApp.listen(config.port, () => {
  console.log(`Server is running on port ${config.port}`);
  console.log(`API endpoint: http://localhost:${config.port}/invoke`);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

console.log(greet(config.dbUser));

export { greet, expressApp };
export default expressApp;