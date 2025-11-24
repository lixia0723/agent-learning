import { TavilySearch } from "@langchain/tavily";

// 创建 Tavily 搜索工具
export const tavilySearchTool = new TavilySearch({
  maxResults: 3,
  topic: "general",
});

// 导出工具数组
export const tools = [tavilySearchTool];