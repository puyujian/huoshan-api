/**
 * 聊天补全控制器
 * 处理 /v1/chat/completions 端点
 */

const VolcEngineClient = require('../utils/volcClient');
const {
  convertOpenAIToVolc,
  convertVolcToOpenAI,
  createSSEChunk
} = require('../utils/converter');

/**
 * 处理聊天补全请求 (非流式)
 */
async function handleChatCompletion(req, res, next) {
  try {
    const { stream = false } = req.body;

    // 如果是流式请求,转发到流式处理器
    if (stream) {
      return handleChatCompletionStream(req, res, next);
    }

    // 验证必需参数
    if (!req.body.model) {
      const error = new Error('Missing required parameter: model');
      error.name = 'ValidationError';
      throw error;
    }

    if (!req.body.messages || req.body.messages.length === 0) {
      const error = new Error('Missing required parameter: messages');
      error.name = 'ValidationError';
      throw error;
    }

    // 转换请求参数
    const volcRequest = convertOpenAIToVolc(req.body);

    // 创建火山引擎客户端
    const volcClient = new VolcEngineClient(
      process.env.VOLC_API_KEY,
      process.env.VOLC_API_BASE
    );

    // 调用火山引擎 API
    const volcResponse = await volcClient.generateImage(volcRequest);

    // 转换响应为 OpenAI 格式
    const openaiResponse = convertVolcToOpenAI(volcResponse, req.body.model);

    // 添加 URL 过期提醒
    if (!openaiResponse.system_message) {
      openaiResponse.system_message = '图片 URL 将在 24 小时内失效,请及时保存';
    }

    res.json(openaiResponse);

  } catch (error) {
    next(error);
  }
}

/**
 * 处理聊天补全请求 (流式)
 */
async function handleChatCompletionStream(req, res, next) {
  try {
    // 验证必需参数
    if (!req.body.model) {
      const error = new Error('Missing required parameter: model');
      error.name = 'ValidationError';
      throw error;
    }

    if (!req.body.messages || req.body.messages.length === 0) {
      const error = new Error('Missing required parameter: messages');
      error.name = 'ValidationError';
      throw error;
    }

    // 转换请求参数
    const volcRequest = convertOpenAIToVolc(req.body);

    // 设置 SSE 响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const timestamp = Math.floor(Date.now() / 1000);
    const chatId = `chatcmpl-${timestamp}`;
    const model = req.body.model;

    // 发送初始 chunk (role)
    res.write(createSSEChunk(
      chatId,
      model,
      timestamp,
      { role: 'assistant' },
      0,
      null
    ));

    // 创建火山引擎客户端
    const volcClient = new VolcEngineClient(
      process.env.VOLC_API_KEY,
      process.env.VOLC_API_BASE
    );

    let imageIndex = 0;

    // 调用火山引擎流式 API
    await volcClient.generateImageStream(
      volcRequest,
      // onData 回调
      (data) => {
        // 处理每个数据块
        if (data.data && Array.isArray(data.data)) {
          data.data.forEach((imageData) => {
            const imageUrl = imageData.url || (imageData.b64_json
              ? `data:image/png;base64,${imageData.b64_json}`
              : null);

            if (imageUrl) {
              // 发送图片数据
              res.write(createSSEChunk(
                chatId,
                model,
                timestamp,
                {
                  content: [
                    {
                      type: 'image_url',
                      image_url: {
                        url: imageUrl,
                        detail: 'auto'
                      }
                    }
                  ]
                },
                imageIndex,
                null
              ));
              imageIndex++;
            }
          });
        }
      },
      // onError 回调
      (error) => {
        console.error('[Stream Error]', error);
        // 发送错误并关闭连接
        res.write(`data: {"error": "${error.message}"}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
      },
      // onEnd 回调
      () => {
        // 发送完成标记
        res.write(createSSEChunk(
          chatId,
          model,
          timestamp,
          {},
          imageIndex > 0 ? imageIndex - 1 : 0,
          'stop'
        ));
        res.write('data: [DONE]\n\n');
        res.end();
      }
    );

  } catch (error) {
    // 对于流式响应,如果还没有发送数据,可以返回错误
    if (!res.headersSent) {
      next(error);
    } else {
      // 如果已经开始发送数据,关闭连接
      res.write(`data: {"error": "${error.message}"}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    }
  }
}

module.exports = {
  handleChatCompletion,
  handleChatCompletionStream
};
