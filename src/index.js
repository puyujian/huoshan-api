/**
 * OpenAI to Volcano Engine Image API Adapter
 * 主应用入口
 */

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');

const { handleChatCompletion } = require('./controllers/chatController');
const { handleModels } = require('./controllers/modelsController');
const { authenticateApiKey } = require('./middleware/auth');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// 请求日志中间件
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'openai-to-volc-image-api',
    version: '1.0.0'
  });
});

// API 路由
app.get('/v1/models', authenticateApiKey, handleModels);
app.post('/v1/chat/completions', authenticateApiKey, handleChatCompletion);

// 404 处理
app.use(notFoundHandler);

// 错误处理中间件
app.use(errorHandler);

// 启动服务器
app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('OpenAI to Volcano Engine Image API Adapter');
  console.log('='.repeat(60));
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`\nAPI Endpoints:`);
  console.log(`  GET  http://localhost:${PORT}/v1/models`);
  console.log(`  POST http://localhost:${PORT}/v1/chat/completions`);
  console.log(`\nAuthentication: Bearer token via Authorization header`);
  console.log('='.repeat(60));
  console.log('\nSupported models:');
  console.log('  - doubao-seedream-4.0 (文生图、单图生图、多图生图、组图生成)');
  console.log('  - doubao-seedream-3.0-t2i (文生图)');
  console.log('  - doubao-seededit-3.0-i2i (单图生图)');
  console.log('\nSize formats:');
  console.log('  - Ratio: 1:1, 3:4, 4:3, 16:9, 9:16, 3:2, 2:3, 21:9');
  console.log('  - Pixels: 1024x1024, 2048x2048, 1792x1024, etc.');
  console.log('  - Resolution: 1K, 2K, 4K');
  console.log('='.repeat(60));
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('\nReceived SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nReceived SIGINT, shutting down gracefully...');
  process.exit(0);
});

module.exports = app;
