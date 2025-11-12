# OpenAI to Volcano Engine Image API Adapter

一个中间层服务,将 OpenAI Chat Completion API 格式的请求转换为火山引擎方舟平台的图片生成 API,并将响应转换回 OpenAI 格式。

## 核心特性

✨ **完整的协议转换**
- 接收标准 OpenAI Chat Completion API 请求
- 自动转换为火山引擎图片生成 API 格式
- 响应转换为 OpenAI 兼容格式

🎨 **灵活的尺寸支持**
- 支持比例格式: `1:1`, `3:4`, `4:3`, `16:9`, `9:16`, `3:2`, `2:3`, `21:9`
- 支持像素格式: `1024x1024`, `2048x2048`, `1792x1024` 等
- 支持分辨率级别: `1K`, `2K`, `4K`

🌊 **流式和非流式响应**
- 支持 SSE (Server-Sent Events) 流式传输
- 支持传统的非流式响应

🛡️ **完善的错误处理**
- 统一的 OpenAI 错误格式
- 详细的错误消息和代码
- 优雅的超时和网络错误处理

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并填入你的配置:

```bash
cp .env.example .env
```

编辑 `.env` 文件:

```env
# 火山引擎 API 配置
VOLC_API_KEY=your_api_key_here
VOLC_API_BASE=https://ark.cn-beijing.volces.com/api/v3

# 服务配置
PORT=3000
NODE_ENV=production

# 可选: 默认模型
DEFAULT_MODEL=doubao-seedream-4.0
```

### 3. 启动服务

```bash
# 生产环境
npm start

# 开发环境 (需要安装 nodemon)
npm run dev
```

服务将在 `http://localhost:3000` 启动。

## API 使用

### 端点

```
POST http://localhost:3000/v1/chat/completions
```

### 认证

使用 `Authorization` 头传递 API 密钥:

```
Authorization: Bearer your-api-key
```

### 请求示例

#### 示例 1: 使用比例格式生成图片

```bash
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "model": "doubao-seedream-4.0",
    "messages": [
      {
        "role": "user",
        "content": "一只可爱的猫咪在花园里玩耍"
      }
    ],
    "size": "3:4",
    "stream": false
  }'
```

#### 示例 2: 使用像素格式生成图片

```bash
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "model": "doubao-seedream-4.0",
    "messages": [
      {
        "role": "user",
        "content": "一只可爱的猫咪在花园里玩耍"
      }
    ],
    "size": "1728x2304",
    "stream": false
  }'
```

#### 示例 3: 流式响应

```bash
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "model": "doubao-seedream-4.0",
    "messages": [
      {
        "role": "user",
        "content": "一只可爱的猫咪在花园里玩耍"
      }
    ],
    "size": "3:4",
    "stream": true
  }'
```

#### 示例 4: 图生图 (单图输入)

```bash
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "model": "doubao-seededit-3.0-i2i",
    "messages": [
      {
        "role": "user",
        "content": [
          {
            "type": "text",
            "text": "将这张图片转换为油画风格"
          },
          {
            "type": "image_url",
            "image_url": {
              "url": "https://example.com/image.jpg"
            }
          }
        ]
      }
    ],
    "stream": false
  }'
```

#### 示例 5: 组图生成

```bash
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "model": "doubao-seedream-4.0",
    "messages": [
      {
        "role": "user",
        "content": "一只可爱的猫咪在花园里玩耍"
      }
    ],
    "n": 3,
    "size": "16:9"
  }'
```

## 参数说明

### 请求参数

| 参数 | 类型 | 必需 | 说明 | 示例 |
|------|------|------|------|------|
| `model` | string | 是 | 模型 ID | `doubao-seedream-4.0` |
| `messages` | array | 是 | 消息数组 | 见上方示例 |
| `size` | string | 否 | 图片尺寸 | `3:4`, `1024x1024`, `2K` |
| `stream` | boolean | 否 | 是否流式响应 | `false` (默认) |
| `temperature` | number | 否 | 温度参数 (0-1) | `0.7` |
| `n` | integer | 否 | 生成图片数量 | `1` (默认) |

### 支持的模型

| 模型 ID | 文生图 | 单图生图 | 多图生图 | 组图生成 |
|---------|-------|---------|---------|---------|
| `doubao-seedream-4.0` | ✅ | ✅ | ✅ (最多10张) | ✅ (最多15张) |
| `doubao-seedream-3.0-t2i` | ✅ | ❌ | ❌ | ❌ |
| `doubao-seededit-3.0-i2i` | ❌ | ✅ | ❌ | ❌ |

### Size 参数转换规则

**比例格式:**
- `1:1` → `2048x2048`
- `4:3` → `2304x1728`
- `3:4` → `1728x2304` ⭐
- `16:9` → `2560x1440`
- `9:16` → `1440x2560`
- `3:2` → `2496x1664`
- `2:3` → `1664x2496`
- `21:9` → `3024x1296`

**像素格式:** 直接传递 (如 `1024x1024`, `2048x2048`)

**分辨率级别:** 直接传递 (如 `1K`, `2K`, `4K`)

## 响应格式

### 非流式响应

```json
{
  "id": "chatcmpl-1234567890",
  "object": "chat.completion",
  "created": 1234567890,
  "model": "doubao-seedream-4.0",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": [
          {
            "type": "image_url",
            "image_url": {
              "url": "https://...",
              "detail": "auto"
            }
          }
        ]
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 0,
    "completion_tokens": 100,
    "total_tokens": 100
  },
  "system_fingerprint": "url_expires_1234654320",
  "system_message": "图片 URL 将在 24 小时内失效,请及时保存"
}
```

### 流式响应

```
data: {"id":"chatcmpl-1234567890","object":"chat.completion.chunk","created":1234567890,"model":"doubao-seedream-4.0","choices":[{"index":0,"delta":{"role":"assistant"},"finish_reason":null}]}

data: {"id":"chatcmpl-1234567890","object":"chat.completion.chunk","created":1234567890,"model":"doubao-seedream-4.0","choices":[{"index":0,"delta":{"content":[{"type":"image_url","image_url":{"url":"https://..."}}]},"finish_reason":null}]}

data: {"id":"chatcmpl-1234567890","object":"chat.completion.chunk","created":1234567890,"model":"doubao-seedream-4.0","choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}

data: [DONE]
```

## 错误处理

所有错误都采用 OpenAI 兼容格式:

```json
{
  "error": {
    "message": "错误描述",
    "type": "invalid_request_error",
    "code": "invalid_parameter",
    "param": null
  }
}
```

### 常见错误码

| HTTP 状态码 | 错误类型 | 说明 |
|------------|---------|------|
| 400 | `invalid_request_error` | 参数验证失败 |
| 401 | `invalid_request_error` | API 密钥无效 |
| 404 | `invalid_request_error` | 路由不存在 |
| 500 | `api_error` | 服务器内部错误 |
| 504 | `api_error` | 请求超时 |

## 健康检查

```bash
curl http://localhost:3000/health
```

响应:

```json
{
  "status": "ok",
  "timestamp": "2025-01-12T10:00:00.000Z",
  "service": "openai-to-volc-image-api",
  "version": "1.0.0"
}
```

## 项目结构

```
.
├── src/
│   ├── controllers/
│   │   └── chatController.js      # 聊天补全控制器
│   ├── middleware/
│   │   ├── auth.js                # 认证中间件
│   │   └── errorHandler.js        # 错误处理中间件
│   ├── utils/
│   │   ├── converter.js           # 参数转换工具
│   │   └── volcClient.js          # 火山引擎 API 客户端
│   └── index.js                   # 主应用入口
├── .env.example                   # 环境变量示例
├── .gitignore
├── package.json
└── README.md
```

## 技术栈

- **Node.js** - 运行时环境
- **Express** - Web 框架
- **Axios** - HTTP 客户端
- **dotenv** - 环境变量管理

## 注意事项

⚠️ **图片 URL 有效期**
- 火山引擎返回的图片 URL 默认 24 小时内有效
- 建议及时下载或保存图片

⚠️ **请求限制**
- 单次请求图片数量最多 15 张 (组图模式)
- 多图输入最多 10 张图片

⚠️ **水印设置**
- 默认不添加水印 (`watermark: false`)
- 可通过额外参数 `add_watermark: true` 启用

## 开发

### 安装开发依赖

```bash
npm install --save-dev nodemon
```

### 运行开发模式

```bash
npm run dev
```

## 许可证

MIT

## 贡献

欢迎提交 Issue 和 Pull Request!
