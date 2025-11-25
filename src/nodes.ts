import { MessagesAnnotation } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { llm } from './model';
import { tools } from './tools';
import { SYSTEM_PROMPT } from './prompt';

// 定义调用模型的节点
export const callModel = async (state: typeof MessagesAnnotation.State) => {
  console.log("Calling model with messages:", state.messages);
  
  // 检测最后一条消息是否包含PDF文件
  if (state.messages && state.messages.length > 0) {
    const lastMessage = state.messages[state.messages.length - 1];
    if (lastMessage.content && Array.isArray(lastMessage.content)) {
      // 查找文件类型的content部分
      const fileContents = lastMessage.content.filter(item => item.type === "file");
      for (const fileContent of fileContents) {
        // 检查是否为PDF文件
        if (fileContent.mimeType === "application/pdf") {
          // 打印base64内容和文件名
          console.log("PDF Base64 Content:", fileContent.data);
          console.log("PDF Filename:", fileContent.metadata?.filename);
          
          // 提取PDF文本内容
          try {
            // 使用动态导入方式导入pdf-parse库
            const pdfParseModule = await import('pdf-parse');
            
            // 获取PDF解析类
            const { PDFParse } = pdfParseModule;
            if (typeof PDFParse !== 'function') {
              console.error("PDFParse is not a function:", typeof PDFParse);
              continue;
            }
            
            // 将base64转换为buffer
            const pdfBuffer = Buffer.from(fileContent.data, 'base64');
            console.log("PDF buffer size:", pdfBuffer.length);
            
            // 创建PDFParse实例并解析PDF
            const pdfParser = new PDFParse({ data: pdfBuffer });
            const pdfData = await pdfParser.getText();
            await pdfParser.destroy(); // 清理资源
            console.log("PDF Text Content:", pdfData.text);
          } catch (parseError) {
            console.error("Error parsing PDF:", parseError.message);
            console.error("Stack:", parseError.stack);
          }
        }
      }
    }
  }
  
  // 在消息历史前添加系统提示
  // 过滤掉文件类型的内容，只保留文本内容发送给LLM
  const filteredMessages = state.messages.map(message => {
    if (Array.isArray(message.content)) {
      // 过滤掉文件类型的内容
      const textContents = message.content.filter(item => item.type !== "file");
      return {
        ...message,
        content: textContents
      };
    }
    return message;
  });
  
  const messagesWithSystemPrompt = [
    { role: "system", content: SYSTEM_PROMPT },
    ...filteredMessages
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