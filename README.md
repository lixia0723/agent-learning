# LangGraph Server

A TypeScript + Node.js project with dotenv configuration and LangGraph AI Agent service.

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Development

Run the development server with ts-node:
```bash
npm run dev
```

### Building

Build the TypeScript code to JavaScript:
```bash
npm run build
```

### Production

Start the production server:
```bash
npm start
```

## LangGraph Agent Service

This project includes a basic LangGraph AI Agent implementation that can be run with the LangGraph CLI.

### Running the Agent Service

To run the agent service with LangGraph CLI:
```bash
npm run langgraph:dev
```

This will start the LangGraph development server with hot reloading.

### Testing the Agent

You can test the agent directly:
```bash
npm run test:agent
```

### Agent Implementation

The agent is implemented in [src/agent.ts](file:///D:/AI/langgraph-server/src/agent.ts) and demonstrates:
- Basic state management with LangGraph
- Simple node processing logic
- Graph workflow definition
- Integration with LangChain.js core components
- Integration with DeepSeek's large language models

### Configuration

To use the LLM features, you need to set up your DeepSeek API key in the `.env` file:

```
DEEPSEEK_API_KEY=your_actual_deepseek_api_key_here
```

Without a valid API key, the agent will return error messages.

## Features

- TypeScript support
- dotenv for environment variable management
- Proper project structure
- Pre-configured npm scripts
- LangGraph AI Agent service
- LangGraph CLI integration
- DeepSeek LLM integration

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
PORT=3000
USER_NAME=Developer
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=myapp
DB_USER=admin
DB_PASSWORD=password
DEEPSEEK_API_KEY=your-deepseek-api-key-here
```

These values are just examples - adjust them according to your needs.