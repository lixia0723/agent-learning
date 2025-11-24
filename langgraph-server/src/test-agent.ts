import { invokeAgent } from './agent';
import { HumanMessage } from "@langchain/core/messages";

async function testAgent() {
  console.log('Testing LangGraph Agent with LLM');
  console.log('--------------------------------');
  
  // 测试不同的输入
  const testInputs = [
    "Hello, how are you today?",
    "What is artificial intelligence?",
    "Tell me a short joke",
    "What's the weather like?",
    "Goodbye!"
  ];
  
  for (const input of testInputs) {
    console.log(`\n📝 Input: "${input}"`);
    console.log('🤖 Agent Response:');
    try {
      const result = await invokeAgent(input);
      // 获取最后一条消息作为输出
      const lastMessage = result.messages[result.messages.length - 1];
      console.log(`   "${lastMessage.content}"`);
    } catch (error) {
      console.error('   Error:', error);
    }
    console.log('--------------------------------');
  }
  
  console.log('\n✅ Testing completed!');
}

// 运行测试
testAgent();