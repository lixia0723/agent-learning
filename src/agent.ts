import { StateGraph, MessagesAnnotation, Annotation } from "@langchain/langgraph";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { Pool } from "pg";
import { callModel, routeModelOutput, toolNode, processPdf } from './nodes';
import { tools } from './tools';
import config from "./config";

// 扩展状态注解以包含PDF内容
const GraphAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  pdfContent: Annotation<{ content: string; parsed: boolean } | null>({
    reducer: (x, y) => {
      // 如果新的值存在（包括null），则使用新的值，否则保留旧值
      if (y !== undefined) {
        console.log("Reducer: Using new pdfContent value:", y === null ? "Parsing failed" : y.parsed ? `Length: ${y.content.length}` : "Parsing failed");
        return y;
      }
      console.log("Reducer: Keeping old pdfContent value:", x === null ? "Parsing failed" : x.parsed ? `Length: ${x.content.length}` : "Parsing failed");
      return x !== undefined ? x : null;
    },
    default: () => null
  })
});

// 创建 PostgreSQL 检查点器
let checkpointer: PostgresSaver | undefined;
try {
  if (process.env.DB_URL) {
    const pool = new Pool({
      connectionString: process.env.DB_URL
    });
    checkpointer = new PostgresSaver(pool);
    
    // 确保检查点表已设置
    checkpointer.setup();
  } else {
    console.warn("DB_URL not found in environment variables. Using default memory checkpointer.");
  }
} catch (error) {
  console.error("Failed to initialize Postgres checkpointer:", error);
}

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

// 编译工作流，使用 PostgreSQL 检查点器
const app = workflow.compile(checkpointer ? { checkpointer } : undefined);

export default app;

// 添加一个可以直接测试的函数
export async function invokeAgent(input: string, threadId: string = "1") {
  const result = await app.invoke({
    messages: [{ role: "user", content: input }]
  }, {
    configurable: {
      threadId
    }
  });
  return result;
}