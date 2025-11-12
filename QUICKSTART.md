# 快速启动指南

本指南将帮助你在 5 分钟内启动并运行服务。

## 前置要求

- Node.js 14.x 或更高版本
- npm 或 yarn
- 火山引擎 API 密钥

## 第一步: 安装依赖

```bash
npm install
```

## 第二步: 配置环境变量

1. 复制环境变量示例文件:

```bash
cp .env.example .env
```

2. 编辑 `.env` 文件,填入你的火山引擎 API 密钥:

```env
VOLC_API_KEY=your_actual_api_key_here
VOLC_API_BASE=https://ark.cn-beijing.volces.com/api/v3
PORT=3000
```

⚠️ **重要**: 请确保替换 `your_actual_api_key_here` 为你的实际 API 密钥!

## 第三步: 启动服务

```bash
npm start
```

你应该看到类似如下的输出:

```
============================================================
OpenAI to Volcano Engine Image API Adapter
============================================================
Server running on http://localhost:3000
Health check: http://localhost:3000/health
API endpoint: POST http://localhost:3000/v1/chat/completions
============================================================
```

## 第四步: 测试服务

### 方法 1: 使用 curl

```bash
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-key" \
  -d '{
    "model": "doubao-seedream-4.0",
    "messages": [
      {
        "role": "user",
        "content": "一只可爱的猫咪"
      }
    ],
    "size": "3:4"
  }'
```

### 方法 2: 使用 Node.js 测试脚本

先安装 axios (如果还没安装):

```bash
npm install axios
```

然后运行测试脚本:

```bash
node examples/test.js
```

### 方法 3: 使用 Python 客户端

先安装 requests:

```bash
pip install requests
```

然后运行 Python 客户端:

```bash
python examples/client.py
```

## 常见问题

### Q: 出现 "VOLC_API_KEY environment variable is required" 错误

**A**: 请确保:
1. 已创建 `.env` 文件
2. `.env` 文件中已设置 `VOLC_API_KEY`
3. 重启服务

### Q: 出现 401 错误

**A**: 检查:
1. 请求头中是否包含 `Authorization: Bearer {your-key}`
2. API 密钥是否有效

### Q: 出现 504 超时错误

**A**: 可能原因:
1. 网络连接问题
2. 火山引擎 API 响应慢
3. 图片生成时间较长 (正常情况下可能需要数十秒)

### Q: 如何修改端口?

**A**: 在 `.env` 文件中设置:

```env
PORT=8080
```

## 下一步

- 查看 [README.md](README.md) 了解完整功能
- 查看 [examples/](examples/) 目录中的示例代码
- 阅读 [API 参数说明](README.md#参数说明)

## 高级配置

### 开发模式 (自动重启)

安装 nodemon:

```bash
npm install --save-dev nodemon
```

运行开发模式:

```bash
npm run dev
```

### 生产部署建议

1. 使用进程管理器 (如 PM2):

```bash
npm install -g pm2
pm2 start src/index.js --name "image-api"
```

2. 配置反向代理 (如 Nginx)

3. 启用 HTTPS

4. 设置日志轮转

## 技术支持

如有问题,请:
1. 查看 [README.md](README.md)
2. 检查服务日志
3. 提交 Issue

祝使用愉快! 🎉
