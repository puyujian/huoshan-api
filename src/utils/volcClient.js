/**
 * 火山引擎 API 客户端
 * 处理与火山引擎图片生成 API 的通信
 */

const axios = require('axios');

class VolcEngineClient {
  constructor(apiKey, apiBase) {
    this.apiKey = apiKey;
    this.apiBase = apiBase || 'https://ark.cn-beijing.volces.com/api/v3';
  }

  /**
   * 调用火山引擎图片生成 API (非流式)
   *
   * @param {Object} requestBody - 请求体
   * @returns {Promise<Object>} API 响应
   */
  async generateImage(requestBody) {
    const startTime = Date.now();
    const endpoint = `${this.apiBase}/images/generations`;

    console.log('[Volcano API] Calling image generation API...');
    console.log('[Volcano API] Endpoint:', endpoint);
    console.log('[Volcano API] Request:', JSON.stringify({
      model: requestBody.model,
      req_key: requestBody.req_key,
      hasImageData: !!(requestBody.image_data || requestBody.image_urls)
    }, null, 2));

    try {
      const response = await axios.post(
        endpoint,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 120000 // 120秒超时
        }
      );

      const duration = Date.now() - startTime;
      console.log(`[Volcano API] Success - took ${duration}ms`);
      console.log('[Volcano API] Response:', JSON.stringify({
        dataLength: response.data.data?.length,
        hasImages: !!response.data.data?.[0]?.url
      }, null, 2));

      return response.data;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[Volcano API] Error after ${duration}ms`);
      this._handleError(error);
    }
  }

  /**
   * 调用火山引擎图片生成 API (流式)
   *
   * @param {Object} requestBody - 请求体
   * @param {Function} onData - 数据回调函数
   * @param {Function} onError - 错误回调函数
   * @param {Function} onEnd - 结束回调函数
   * @returns {Promise<void>}
   */
  async generateImageStream(requestBody, onData, onError, onEnd) {
    const startTime = Date.now();
    console.log('[Volcano API] Starting stream request...');
    console.log('[Volcano API] Request:', JSON.stringify({
      model: requestBody.model,
      stream: requestBody.stream,
      hasImage: !!requestBody.image
    }, null, 2));

    try {
      const response = await axios.post(
        `${this.apiBase}/images/generations`,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          responseType: 'stream',
          timeout: 120000
        }
      );

      let buffer = '';
      let eventCount = 0;

      response.data.on('data', (chunk) => {
        buffer += chunk.toString();

        // 处理 SSE 格式数据
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // 保留最后一个不完整的行

        for (const line of lines) {
          const trimmedLine = line.trim();

          // 跳过空行和注释
          if (!trimmedLine || trimmedLine.startsWith(':')) {
            continue;
          }

          // 处理 SSE 数据行
          if (trimmedLine.startsWith('data:')) {
            const data = trimmedLine.slice(5).trim();

            // 检查是否是结束标记
            if (data === '[DONE]') {
              console.log('[Volcano API] Received [DONE] marker');
              onEnd();
              return;
            }

            try {
              const parsed = JSON.parse(data);
              eventCount++;
              console.log(`[Volcano API] Event ${eventCount}: type=${parsed.type}, image_index=${parsed.image_index}`);

              // 根据事件类型处理数据
              if (parsed.type === 'image_generation.partial_succeeded') {
                // 图片生成成功事件
                onData({
                  type: 'partial_succeeded',
                  image_index: parsed.image_index,
                  url: parsed.url,
                  b64_json: parsed.b64_json,
                  size: parsed.size,
                  model: parsed.model,
                  created: parsed.created
                });
              } else if (parsed.type === 'image_generation.partial_failed') {
                // 图片生成失败事件
                onData({
                  type: 'partial_failed',
                  image_index: parsed.image_index,
                  error: parsed.error,
                  model: parsed.model,
                  created: parsed.created
                });
              } else if (parsed.type === 'image_generation.completed') {
                // 所有图片处理完成事件
                console.log(`[Volcano API] Completed - generated ${parsed.usage?.generated_images} images`);
                onData({
                  type: 'completed',
                  usage: parsed.usage,
                  model: parsed.model,
                  created: parsed.created
                });
              } else if (parsed.error) {
                // 请求级别的错误
                console.error('[Volcano API] Error event:', parsed.error);
                const error = new Error(parsed.error.message || 'Unknown error');
                error.code = parsed.error.code;
                onError(error);
              }
            } catch (e) {
              console.error('[Volcano API] Failed to parse SSE data:', e.message);
              console.error('[Volcano API] Raw data:', data);
            }
          }
        }
      });

      response.data.on('error', (error) => {
        const duration = Date.now() - startTime;
        console.error(`[Volcano API] Stream error after ${duration}ms:`, error.message);
        onError(error);
      });

      response.data.on('end', () => {
        const duration = Date.now() - startTime;
        console.log(`[Volcano API] Stream ended - took ${duration}ms, received ${eventCount} events`);
        onEnd();
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[Volcano API] Stream request failed after ${duration}ms`);
      this._handleError(error);
    }
  }

  /**
   * 处理 API 错误
   * @private
   */
  _handleError(error) {
    if (error.response) {
      // API 返回错误响应
      const status = error.response.status;
      const data = error.response.data;

      console.error('[Volcano API] Error response:', {
        status,
        error: data.error
      });

      const apiError = new Error(data.error?.message || 'Volcano Engine API Error');
      apiError.status = status;
      apiError.code = data.error?.code || 'unknown_error';
      apiError.volcResponse = data;

      throw apiError;
    } else if (error.request) {
      // 请求发送但没有响应
      console.error('[Volcano API] No response received');
      const timeoutError = new Error('Request timeout or network error');
      timeoutError.status = 504;
      timeoutError.code = 'network_error';
      throw timeoutError;
    } else {
      // 其他错误
      console.error('[Volcano API] Request setup error:', error.message);
      const unknownError = new Error(error.message || 'Unknown error');
      unknownError.status = 500;
      unknownError.code = 'internal_error';
      throw unknownError;
    }
  }
}

module.exports = VolcEngineClient;
