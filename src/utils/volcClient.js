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
    console.log('[Volcano API Stream] Simulating stream via polling...');

    try {
      // Volcano Engine API 暂不支持真正的流式响应。
      // 将 stream 参数强制为 false,以便获取完整响应后再通过 SSE 推送给客户端。
      const nonStreamRequest = {
        ...requestBody,
        stream: false
      };

      const volcResponse = await this.generateImage(nonStreamRequest);

      if (volcResponse && volcResponse.data && Array.isArray(volcResponse.data) && volcResponse.data.length > 0) {
        onData(volcResponse);
        onEnd();
      } else {
        console.error('[Volcano API Stream] Empty response payload:', {
          hasData: !!volcResponse,
          dataKeys: volcResponse ? Object.keys(volcResponse) : []
        });
        const emptyError = new Error('No image data returned from Volcano Engine API');
        emptyError.status = 502;
        emptyError.code = 'empty_response';
        emptyError.volcResponse = volcResponse;
        onError(emptyError);
      }
    } catch (error) {
      console.error('[Volcano API Stream] Error:', error.message);
      onError(error);
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

      const apiError = new Error(data.error?.message || 'Volcano Engine API Error');
      apiError.status = status;
      apiError.code = data.error?.code || 'unknown_error';
      apiError.volcResponse = data;

      throw apiError;
    } else if (error.request) {
      // 请求发送但没有响应
      const timeoutError = new Error('Request timeout or network error');
      timeoutError.status = 504;
      timeoutError.code = 'network_error';
      throw timeoutError;
    } else {
      // 其他错误
      const unknownError = new Error(error.message || 'Unknown error');
      unknownError.status = 500;
      unknownError.code = 'internal_error';
      throw unknownError;
    }
  }
}

module.exports = VolcEngineClient;
