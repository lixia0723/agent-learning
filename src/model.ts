import { ChatDeepSeek } from "@langchain/deepseek";
import config from './config';
import { tools } from './tools';

// 创建 DeepSeek LLM 实例，绑定工具
export const llm = new ChatDeepSeek({
  modelName: "deepseek-chat",
  temperature: 0.7,
  apiKey: config.deepseekApiKey
}).bindTools(tools);