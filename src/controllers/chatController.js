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
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  console.log(`[${requestId}] Starting chat completion handler...`);

  try {
    const { stream = false } = req.body;

    // 如果是流式请求,转发到流式处理器
    if (stream) {
      console.log(`[${requestId}] Routing to stream handler...`);
      return handleChatCompletionStream(req, res, next);
    }

    console.log(`[${requestId}] Processing non-stream request...`);

    // 验证必需参数
    if (!req.body.model) {
      console.error(`[${requestId}] Validation Error: Missing model parameter`);
      const error = new Error('Missing required parameter: model');
      error.name = 'ValidationError';
      throw error;
    }

    if (!req.body.messages || req.body.messages.length === 0) {
      console.error(`[${requestId}] Validation Error: Missing messages parameter`);
      const error = new Error('Missing required parameter: messages');
      error.name = 'ValidationError';
      throw error;
    }

    console.log(`[${requestId}] Converting request to Volcano format...`);
    // 转换请求参数
    const volcRequest = convertOpenAIToVolc(req.body);

    const apiKey = req.apiKey || process.env.VOLC_API_KEY;
    if (!apiKey) {
      console.error(`[${requestId}] Authentication Error: Missing API key`);
      const error = new Error('Missing Volcano Engine API key');
      error.status = 401;
      error.code = 'authentication_error';
      throw error;
    }

    const apiBase = req.headers['x-volc-api-base'] || process.env.VOLC_API_BASE;
    console.log(`[${requestId}] API Base: ${apiBase || 'default'}`);

    // 创建火山引擎客户端
    console.log(`[${requestId}] Creating Volcano Engine client...`);
    const volcClient = new VolcEngineClient(
      apiKey,
      apiBase
    );

    // 调用火山引擎 API
    console.log(`[${requestId}] Calling Volcano Engine API...`);
    const volcResponse = await volcClient.generateImage(volcRequest);

    console.log(`[${requestId}] Converting response to OpenAI format...`);
    // 转换响应为 OpenAI 格式
    const openaiResponse = convertVolcToOpenAI(volcResponse, req.body.model);

    // 添加 URL 过期提醒
    if (!openaiResponse.system_message) {
      openaiResponse.system_message = '图片 URL 将在 24 小时内失效,请及时保存';
    }

    console.log(`[${requestId}] Success! Sending response...`);
    res.json(openaiResponse);

  } catch (error) {
    console.error(`[${requestId}] Error caught:`, error.message);
    console.error(`[${requestId}] Error stack:`, error.stack);
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

    const apiKey = req.apiKey || process.env.VOLC_API_KEY;
    if (!apiKey) {
      const error = new Error('Missing Volcano Engine API key');
      error.status = 401;
      error.code = 'authentication_error';
      throw error;
    }

    const apiBase = req.headers['x-volc-api-base'] || process.env.VOLC_API_BASE;

    // 创建火山引擎客户端
    const volcClient = new VolcEngineClient(
      apiKey,
      apiBase
    );

    let imageIndex = 0;
    let completedReceived = false;

    // 调用火山引擎流式 API
    await volcClient.generateImageStream(
      volcRequest,
      // onData 回调 - 处理火山引擎流式事件
      (eventData) => {
        if (eventData.type === 'partial_succeeded') {
          // 图片生成成功事件
          const imageUrl = eventData.url || (eventData.b64_json
            ? `data:image/png;base64,${eventData.b64_json}`
            : null);

          if (imageUrl) {
            console.log(`[Stream] Image ${eventData.image_index} succeeded: ${eventData.size || 'unknown size'}`);
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
        } else if (eventData.type === 'partial_failed') {
          // 图片生成失败事件
          console.error(`[Stream] Image ${eventData.image_index} failed:`, eventData.error);
          // 可以选择发送错误信息给客户端
          res.write(createSSEChunk(
            chatId,
            model,
            timestamp,
            {
              content: `图片 ${eventData.image_index + 1} 生成失败: ${eventData.error?.message || '未知错误'}`
            },
            imageIndex,
            null
          ));
          imageIndex++;
        } else if (eventData.type === 'completed') {
          // 所有图片处理完成事件
          console.log('[Stream] All images completed, usage:', eventData.usage);
          completedReceived = true;
          // 发送完成标记
          res.write(createSSEChunk(
            chatId,
            model,
            timestamp,
            {},
            imageIndex > 0 ? imageIndex - 1 : 0,
            'stop'
          ));
        }
      },
      // onError 回调 - 处理请求级别的错误
      (error) => {
        console.error('[Stream Error]', error.message);
        if (!res.headersSent) {
          // 如果还没有发送响应头，可以返回标准错误
          throw error;
        } else {
          // 如果已经开始发送数据，发送错误事件
          res.write(`data: {"error": {"message": "${error.message}", "code": "${error.code || 'unknown'}"}}\n\n`);
          res.write('data: [DONE]\n\n');
          res.end();
        }
      },
      // onEnd 回调 - 流结束
      () => {
        console.log('[Stream] Connection ended');
        // 只有在没有收到 completed 事件时才发送完成标记
        if (!completedReceived && imageIndex > 0) {
          res.write(createSSEChunk(
            chatId,
            model,
            timestamp,
            {},
            imageIndex - 1,
            'stop'
          ));
        }
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
