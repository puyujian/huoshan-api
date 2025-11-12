# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2025-01-12

### 新增
- ✨ 完整的 OpenAI Chat Completion API 到火山引擎图片生成 API 转换
- ✨ 支持比例格式尺寸 (1:1, 3:4, 4:3, 16:9, 9:16, 3:2, 2:3, 21:9)
- ✨ 支持像素格式尺寸 (1024x1024, 2048x2048 等)
- ✨ 支持分辨率级别 (1K, 2K, 4K)
- ✨ 流式响应支持 (SSE)
- ✨ 非流式响应支持
- ✨ 组图生成功能 (最多15张)
- ✨ 多图输入支持 (最多10张)
- ✨ 完整的错误处理和 OpenAI 格式错误响应
- ✨ API 密钥认证
- ✨ 健康检查端点
- ✨ 请求日志记录
- 📚 完整的 README 文档
- 📚 Node.js 和 Python 客户端示例

### 支持的模型
- `doubao-seedream-4.0` - 全功能模型 (文生图、单图生图、多图生图、组图生成)
- `doubao-seedream-3.0-t2i` - 文生图模型
- `doubao-seededit-3.0-i2i` - 图生图模型

### 技术实现
- Express 4.x Web 框架
- Axios HTTP 客户端
- 环境变量配置 (dotenv)
- 模块化架构设计
- 完整的参数验证
- 智能 Size 参数转换
- Temperature 到 guidance_scale 转换
