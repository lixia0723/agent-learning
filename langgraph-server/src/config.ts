import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  dbHost: string;
  dbPort: number;
  dbName: string;
  dbUser: string;
  dbPassword: string;
  deepseekApiKey: string;
}

const config: Config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  dbHost: process.env.DB_HOST || 'localhost',
  dbPort: parseInt(process.env.DB_PORT || '5432', 10),
  dbName: process.env.DB_NAME || 'myapp',
  dbUser: process.env.DB_USER || 'admin',
  dbPassword: process.env.DB_PASSWORD || 'password',
  deepseekApiKey: process.env.DEEPSEEK_API_KEY || 'sk-f9cbf3a3faa0490cabde05ddccaafa9b',
};

export default config;