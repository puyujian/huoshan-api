# Changelog

## [v1.1.0] - 2025-01-12

### 新增功能

- ✨ **动态 API 密钥支持**: API 密钥现在通过 `Authorization: Bearer` 头动态传递，不再需要在环境变量中预配置
- 🎯 **模型列表端点**: 新增 `GET /v1/models` 端点，兼容 OpenAI SDK，返回支持的模型列表
- 🔧 **API 基础地址自定义**: 支持通过 `X-Volc-Api-Base` 请求头为单次请求指定火山引擎 API 基础地址

### 改进

- 📝 更新文档，说明新的认证方式
- 🐳 简化 Docker 部署配置，不再要求必须配置 `VOLC_API_KEY` 环境变量
- 📦 更新示例代码，展示模型列表获取功能

### 架构变更

- 移除服务启动时的 `VOLC_API_KEY` 环境变量验证
- `VOLC_API_KEY` 现在作为可选的默认密钥，优先使用请求头中的密钥
- 新增 `src/controllers/modelsController.js` 模块

### 向后兼容

- ✅ 仍支持通过环境变量 `VOLC_API_KEY` 配置默认密钥
- ✅ 所有现有的 API 端点和功能保持不变

## [v1.0.0] - 2025-01-11

### 初始版本

- 完整的 OpenAI 到 Volcano Engine 图片生成 API 转换
- 支持流式和非流式响应
- 灵活的尺寸格式支持
- Docker 部署支持
- GitHub Actions 自动构建
