import { MessagesAnnotation } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { llm } from './model';
import { tools } from './tools';
import { SYSTEM_PROMPT } from './prompt';

// 定义调用模型的节点
export const callModel = async (state: typeof MessagesAnnotation.State) => {
  console.log("Calling model with messages:", state.messages);
  
  // 在消息历史前添加系统提示
  const messagesWithSystemPrompt = [
    { role: "system", content: SYSTEM_PROMPT },
    ...state.messages
  ];
  
  try {
    const response = await llm.invoke(messagesWithSystemPrompt);
    
    return {
      messages: [...state.messages, response]
    };
  } catch (error) {
    console.error("Error calling DeepSeek LLM:", error);
    const errorMessage = "Sorry, I encountered an error while processing your request with DeepSeek.";
    return {
      messages: [...state.messages, { role: "assistant", content: errorMessage }]
    };
  }
};

// 定义路由函数，决定是否需要调用工具
export const routeModelOutput = (state: typeof MessagesAnnotation.State) => {
  const lastMessage = state.messages[state.messages.length - 1];
  
  // 如果最后一条消息包含工具调用，则路由到工具节点
  if ("tool_calls" in lastMessage && Array.isArray(lastMessage.tool_calls) && lastMessage.tool_calls.length > 0) {
    return "tools";
  }
  
  // 否则结束流程
  return "__end__";
};

// 创建工具节点
export const toolNode = new ToolNode(tools);