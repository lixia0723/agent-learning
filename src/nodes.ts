import { MessagesAnnotation } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { llm } from './model';
import { tools } from './tools';
import { buildSystemPrompt } from './prompt';

// 添加PDF处理节点
export const processPdf = async (state: typeof MessagesAnnotation.State & { pdfContent?: string }) => {
  console.log("=== PROCESS PDF FUNCTION ===");
  console.log("Initial state pdfContent:", state.pdfContent ? `Length: ${state.pdfContent.length}` : "None");
  
  // 检查是否有消息以及最后一条消息是否包含内容
  if (!state.messages || state.messages.length === 0) {
    console.log("No messages found");
    return { messages: state.messages };
  }

  const lastMessage = state.messages[state.messages.length - 1];
  console.log("Last message content type:", Array.isArray(lastMessage.content) ? "array" : typeof lastMessage.content);
  if (Array.isArray(lastMessage.content)) {
    console.log("Last message content items:", lastMessage.content.length);
    lastMessage.content.forEach((item, index) => {
      console.log(`Item ${index}: type=${item.type}, mimeType=${(item as any).mimeType}`);
    });
  }
  
  let pdfContent = ""; // 确保每次都是新的空字符串开始，不继承之前的值
  let updatedMessages = [...state.messages];

  // 检查最后一条消息是否包含PDF文件
  if (lastMessage.content && Array.isArray(lastMessage.content)) {
    // 查找文件类型的content部分
    const fileContents = lastMessage.content.filter(item => item.type === "file");
    console.log("Found file contents:", fileContents.length);
    
    for (const fileContent of fileContents) {
      // 检查是否为PDF文件
      if (fileContent.mimeType === "application/pdf") {
        // 打印文件名
        const filename = (fileContent.metadata as any)?.filename || "document";
        console.log("Processing PDF file:", filename);
        console.log("File data length:", (fileContent.data as string).length);
        
        // 提取PDF文本内容
        try {
          // 尝试多种方式导入pdf-parse库
          let pdfData;
          
          try {
            // 方法1: 使用 require 方式
            console.log("Trying method 1: require('pdf-parse')");
            const pdfParse = require('pdf-parse');
            const pdfBuffer = Buffer.from(fileContent.data as string, 'base64');
            console.log("PDF buffer created, size:", pdfBuffer.length);
            pdfData = await pdfParse(pdfBuffer);
            console.log("Method 1 succeeded");
          } catch (method1Error) {
            console.log("Method 1 failed:", method1Error.message);
            try {
              // 方法2: 使用 PDFParse 类
              console.log("Trying method 2: new PDFParse()");
              const { PDFParse } = require("pdf-parse");
              const pdfBuffer = Buffer.from(fileContent.data as string, 'base64');
              const pdfParser = new PDFParse();
              pdfData = await pdfParser.parse(pdfBuffer);
              await pdfParser.destroy(); // 清理资源
              console.log("Method 2 succeeded");
            } catch (method2Error) {
              console.log("Method 2 failed:", method2Error.message);
              try {
                // 方法3: 使用带选项的 PDFParse 类
                console.log("Trying method 3: new PDFParse({ data: buffer })");
                const { PDFParse } = require("pdf-parse");
                const pdfBuffer = Buffer.from(fileContent.data as string, 'base64');
                const pdfParser = new PDFParse({ data: pdfBuffer });
                pdfData = await pdfParser.getText();
                await pdfParser.destroy(); // 清理资源
                console.log("Method 3 succeeded");
              } catch (method3Error) {
                console.log("Method 3 failed:", method3Error.message);
                console.log("All methods failed");
                throw method3Error; // 如果所有方法都失败，则抛出最后一个错误
              }
            }
          }
          
          pdfContent = pdfData?.text || pdfData?.content || ""; // 使用赋值而不是累加，确保只保存当前PDF的内容
          console.log("PDF successfully parsed. Text length:", pdfContent.length);
          
          // 显示前200个字符作为预览
          if (pdfContent.length > 0) {
            console.log("PDF preview:", pdfContent.substring(0, 200) + (pdfContent.length > 200 ? "..." : ""));
          }
          
          // 如果提取到内容，提前结束循环
          if (pdfContent.length > 0) {
            console.log("Successfully extracted PDF content, breaking loop");
            break;
          }
        } catch (parseError: any) {
          console.error("Error parsing PDF:", parseError.message);
          console.error("Stack:", parseError.stack);
        }
      } else {
        console.log("Non-PDF file found with mime type:", fileContent.mimeType);
      }
    }
    
    // 对PDF内容进行处理，使其看起来更像普通文本
    if (pdfContent.length > 0) {
      // 移除可能暴露PDF来源的特征文本
      pdfContent = pdfContent
        .replace(/(?:\r\n|\r|\n)/g, ' ') // 将换行符替换为空格
        .replace(/\s+/g, ' ') // 将多个连续空格替换为单个空格
        .trim(); // 去除首尾空格
      
      // 如果内容太长，截取前4000个字符，避免提示词过长
      if (pdfContent.length > 4000) {
        pdfContent = pdfContent.substring(0, 4000) + '...';
      }
    }
    
    // 不再修改消息内容，保持用户上传的文件信息不变
    console.log("Keeping original messages unchanged");
    updatedMessages = [...state.messages];
  } else {
    console.log("Last message content is not an array or is empty");
  }
  
  // 返回更新后的状态，包括处理后的消息和提取的PDF内容
  console.log("Final pdfContent length:", pdfContent.length);
  console.log("Updated messages count:", updatedMessages.length);
  
  // 显示返回的pdfContent前200个字符作为预览
  if (pdfContent.length > 0) {
    console.log("Returning pdfContent preview:", pdfContent.substring(0, 200) + (pdfContent.length > 200 ? "..." : ""));
  }
  
  return {
    messages: updatedMessages,
    pdfContent: pdfContent
  };
};

// 定义调用模型的节点
export const callModel = async (state: typeof MessagesAnnotation.State & { pdfContent?: string }) => {
  console.log("=== CALL MODEL FUNCTION ===");
  console.log("State messages count:", state.messages?.length || 0);
  console.log("State pdfContent exists:", !!state.pdfContent);
  if (state.pdfContent) {
    console.log("State pdfContent length:", state.pdfContent.length);
    if (state.pdfContent.length > 0) {
      console.log("State pdfContent preview:", state.pdfContent.substring(0, 200) + (state.pdfContent.length > 200 ? "..." : ""));
    }
  } else {
    console.log("State pdfContent is null or undefined");
  }
  
  // 构建系统提示
  let systemPrompt = "你是一个专业、友好且乐于助人的 AI 功能助手。你的主要职责是：\n\n1. **理解用户需求**：仔细分析用户的问题和请求，提供准确、有用的回答\n2. **提供清晰解答**：用简洁明了的语言解释复杂概念，确保用户能够理解\n3. **处理文档内容**：当用户提供文本内容时，你需要基于这些内容回答问题，引用具体的文本来支持你的回答\n4. **保持专业态度**：始终保持礼貌、耐心和专业，即使面对复杂或重复的问题\n\n请根据用户的输入和上下文，提供最有帮助的回答。";
  
  // 检查并拼接内容到系统提示词中，完全隐藏PDF痕迹
  if (state.pdfContent && typeof state.pdfContent === 'string' && state.pdfContent.trim().length > 0) {
    const trimmedPdfContent = state.pdfContent.trim();
    systemPrompt = `${systemPrompt}\n\n以下信息可供你参考，请基于这些内容回答用户的问题：\n\n${trimmedPdfContent}\n\n首先，你要把 PDF 内容显示给用户，让用户知道你已经获取到了 PDF 内容。请仔细阅读上述内容，并根据用户的问题提供准确、相关的回答。`;
    console.log("Content added to system prompt, total system prompt length:", systemPrompt.length);
    console.log("System prompt with content preview:", systemPrompt.substring(0, 500) + (systemPrompt.length > 500 ? "..." : ""));
  } else {
    console.log("No valid content to add to system prompt");
  }
  
  // 过滤掉文件类型的内容，只保留文本内容发送给LLM
  const filteredMessages = state.messages.map((message, index) => {
    console.log(`Processing message ${index}: role=${message.role}`);
    if (Array.isArray(message.content)) {
      console.log(`Message ${index} content items:`, message.content.length);
      // 过滤掉文件类型的内容
      const textContents = message.content.filter(item => {
        const isFile = item.type === "file";
        if (isFile) {
          console.log(`Filtering out file content from message ${index}`);
        }
        return !isFile;
      });
      
      console.log(`Message ${index} original content items:`, message.content.length, "Filtered content items:", textContents.length);
      
      return {
        ...message,
        content: textContents
      };
    }
    return message;
  });
  
  const messagesWithSystemPrompt = [
    { role: "system", content: systemPrompt },
    ...filteredMessages
  ];
  
  console.log("Sending", messagesWithSystemPrompt.length, "messages to LLM");
  messagesWithSystemPrompt.forEach((msg, index) => {
    if (typeof msg.content === 'string') {
      console.log(`Message ${index}: role=${msg.role}, content length=${msg.content.length}`);
    } else if (Array.isArray(msg.content)) {
      console.log(`Message ${index}: role=${msg.role}, content items=${msg.content.length}`);
    } else {
      console.log(`Message ${index}: role=${msg.role}, content type=${typeof msg.content}`);
    }
  });
  
  try {
    const response = await llm.invoke(messagesWithSystemPrompt);
    console.log("LLM Response received");
    
    return {
      messages: [...state.messages, response]
    };
  } catch (error: any) {
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