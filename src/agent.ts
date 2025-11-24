import { StateGraph, MessagesAnnotation } from "@langchain/langgraph";
import { callModel, routeModelOutput, toolNode } from './nodes';
import { tools } from './tools';

// 创建工作流
const workflow = new StateGraph(MessagesAnnotation)
  // 定义两个节点
  .addNode("callModel", callModel)
  .addNode("tools", toolNode)
  // 设置入口点为 `callModel`
  .addEdge("__start__", "callModel")
  // 添加条件边，根据模型输出决定下一步
  .addConditionalEdges(
    "callModel",
    routeModelOutput
  )
  // 工具调用后返回到 callModel 节点
  .addEdge("tools", "callModel");

// 编译工作流
const app = workflow.compile();

export default app;

// 添加一个可以直接测试的函数
export async function invokeAgent(input: string) {
  const result = await app.invoke({
    messages: [{ role: "user", content: input }]
  });
  return result;
}