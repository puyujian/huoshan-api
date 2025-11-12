# 项目结构说明

```
生图API/
├── src/                          # 源代码目录
│   ├── controllers/              # 控制器层
│   │   └── chatController.js     # 聊天补全控制器 (处理主要业务逻辑)
│   │
│   ├── middleware/               # 中间件层
│   │   ├── auth.js              # 认证中间件 (API 密钥验证)
│   │   └── errorHandler.js      # 错误处理中间件 (统一错误格式)
│   │
│   ├── utils/                    # 工具层
│   │   ├── converter.js         # 参数转换工具 (OpenAI ↔ 火山引擎)
│   │   └── volcClient.js        # 火山引擎 API 客户端
│   │
│   └── index.js                 # 主应用入口 (Express 服务器配置)
│
├── examples/                     # 示例代码
│   ├── test.js                  # Node.js 测试脚本
│   └── client.py                # Python 客户端示例
│
├── .env.example                 # 环境变量示例
├── .gitignore                   # Git 忽略文件配置
├── package.json                 # 项目依赖配置
├── README.md                    # 项目主文档
├── QUICKSTART.md                # 快速启动指南
├── CHANGELOG.md                 # 更新日志
└── PROJECT_STRUCTURE.md         # 本文件
```

## 核心模块说明

### 1. 控制器层 (`src/controllers/`)

**chatController.js**
- 处理 `/v1/chat/completions` 端点
- 实现非流式响应处理
- 实现流式响应处理 (SSE)
- 参数验证
- 调用转换工具和 API 客户端

### 2. 中间件层 (`src/middleware/`)

**auth.js**
- 验证 `Authorization` 头
- 支持 `Bearer {token}` 格式
- 将 API 密钥附加到请求对象

**errorHandler.js**
- 全局错误处理
- 转换各种错误为 OpenAI 格式
- 处理特殊错误类型 (认证、网络、超时等)
- 404 处理

### 3. 工具层 (`src/utils/`)

**converter.js**
核心转换逻辑:
- `convertSize()` - Size 参数转换 (比例/像素/分辨率)
- `convertTemperature()` - Temperature 转换为 guidance_scale
- `extractPrompt()` - 从 messages 提取文本
- `extractImages()` - 从 messages 提取图片
- `convertOpenAIToVolc()` - OpenAI → 火山引擎请求转换
- `convertVolcToOpenAI()` - 火山引擎 → OpenAI 响应转换
- `createSSEChunk()` - 生成 SSE 格式数据

**volcClient.js**
火山引擎 API 客户端:
- `generateImage()` - 非流式图片生成
- `generateImageStream()` - 流式图片生成
- `_handleError()` - 错误处理

### 4. 主应用 (`src/index.js`)

- Express 应用初始化
- 路由配置
- 中间件注册
- 服务器启动
- 优雅关闭处理

## 数据流

### 非流式请求流程

```
客户端请求
    ↓
认证中间件 (auth.js)
    ↓
聊天控制器 (chatController.js)
    ↓
参数转换 (converter.js: convertOpenAIToVolc)
    ↓
火山引擎客户端 (volcClient.js: generateImage)
    ↓
火山引擎 API
    ↓
响应转换 (converter.js: convertVolcToOpenAI)
    ↓
返回客户端
```

### 流式请求流程

```
客户端请求
    ↓
认证中间件 (auth.js)
    ↓
聊天控制器 (chatController.js)
    ↓
设置 SSE 响应头
    ↓
参数转换 (converter.js: convertOpenAIToVolc)
    ↓
火山引擎客户端 (volcClient.js: generateImageStream)
    ↓
[流式数据传输]
    ↓
SSE 格式转换 (converter.js: createSSEChunk)
    ↓
流式返回客户端
```

## 设计原则

### 1. 单一职责原则 (SRP)
- 每个模块只负责一个功能
- 控制器处理请求流程
- 转换器处理格式转换
- 客户端处理 API 调用

### 2. 依赖倒置原则 (DIP)
- 使用依赖注入 (API 密钥通过环境变量)
- 客户端可独立测试

### 3. 开闭原则 (OCP)
- 易于扩展新模型
- 易于添加新的尺寸格式
- 易于支持新的参数

### 4. 接口隔离原则 (ISP)
- 清晰的函数接口
- 最小化参数依赖

## 扩展指南

### 添加新的尺寸比例

编辑 `src/utils/converter.js` 中的 `convertSize()`:

```javascript
const ratioMap = {
  '1:1': '2048x2048',
  '3:4': '1728x2304',
  // 添加新比例
  '5:4': '2048x1638'
};
```

### 添加新的模型

无需修改代码,直接在请求中使用新模型 ID:

```json
{
  "model": "新模型ID",
  ...
}
```

### 添加新的中间件

1. 在 `src/middleware/` 创建新文件
2. 在 `src/index.js` 中注册:

```javascript
const newMiddleware = require('./middleware/newMiddleware');
app.use(newMiddleware);
```

### 添加新的端点

1. 在 `src/controllers/` 创建控制器
2. 在 `src/index.js` 中注册路由:

```javascript
const newController = require('./controllers/newController');
app.post('/new/endpoint', authenticateApiKey, newController);
```

## 测试

### 运行 Node.js 测试

```bash
node examples/test.js
```

### 运行 Python 测试

```bash
python examples/client.py
```

## 部署建议

1. **使用进程管理器**: PM2, Forever
2. **反向代理**: Nginx, Apache
3. **日志管理**: Winston, Morgan
4. **监控**: Prometheus + Grafana
5. **容器化**: Docker

## 性能优化建议

1. 添加响应缓存
2. 实现请求限流
3. 连接池管理
4. 压缩响应数据
5. 异步日志记录

## 安全建议

1. 使用 HTTPS
2. 实现 API 密钥数据库验证
3. 添加请求频率限制
4. 输入验证和清理
5. 添加安全响应头 (helmet.js)
