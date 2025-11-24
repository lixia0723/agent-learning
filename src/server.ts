import dotenv from 'dotenv';
import app from './agent';
import express, { Request, Response } from 'express';

// 加载环境变量
dotenv.config();

// 创建 Express 应用
const expressApp = express();
expressApp.use(express.json());
expressApp.use(express.static('public'));

// 添加基本的健康检查端点
expressApp.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// LangGraph 兼容的 invoke 端点
expressApp.post('/invoke', async (req: Request, res: Response) => {
  try {
    const { input, thread_id } = req.body;
    if (!input) {
      return res.status(400).json({ error: 'Input is required' });
    }

    // 确保输入格式正确
    const messages = Array.isArray(input.messages) ? input.messages : [{ role: "user", content: input }];

    const result = await app.invoke({
      messages
    }, {
      recursionLimit: 50
    });

    res.json({
      ...result,
      thread_id
    });
  } catch (error) {
    console.error('Error invoking agent:', error);
    res.status(500).json({ error: 'Internal server error', message: (error as Error).message });
  }
});

// 添加 assistant 端点 (LangGraph 兼容)
expressApp.get('/assistants/:assistantId', (req: Request, res: Response) => {
  const { assistantId } = req.params;
  if (assistantId === 'agent') {
    res.json({
      assistant_id: 'agent',
      graph_id: 'agent'
    });
  } else {
    res.status(404).json({ error: 'Assistant not found' });
  }
});

// 启动服务器
const PORT = 2024;
const server = expressApp.listen(PORT, () => {
  console.log(`🚀 LangGraph-compatible server is running on port ${PORT}`);
  console.log(`📡 API endpoint: http://localhost:${PORT}/invoke`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

export default expressApp;