import { StateGraph, MessagesAnnotation, Annotation } from "@langchain/langgraph";
import { callModel, routeModelOutput, toolNode, processPdf } from './nodes';
import { tools } from './tools';

// 扩展状态注解以包含PDF内容
const GraphAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  pdfContent: Annotation<string>({
    reducer: (x, y) => {
      // 如果新的值存在且不为空，则使用新的值，否则保留旧值
      if (y && y.trim().length > 0) {
        console.log("Reducer: Using new pdfContent value, length:", y.length);
        return y;
      }
      console.log("Reducer: Keeping old pdfContent value, length:", x?.length || 0);
      return x || "";
    },
    default: () => ""
  })
});

// 创建工作流
const workflow = new StateGraph(GraphAnnotation)
  // 定义节点
  .addNode("processPdf", processPdf)
  .addNode("callModel", callModel)
  .addNode("tools", toolNode)
  // 设置入口点为 `processPdf`
  .addEdge("__start__", "processPdf")
  // 从 processPdf 连接到 callModel
  .addEdge("processPdf", "callModel")
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