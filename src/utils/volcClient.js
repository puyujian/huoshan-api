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
    try {
      const response = await axios.post(
        `${this.apiBase}/images/generations`,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 120000 // 120秒超时
        }
      );

      return response.data;
    } catch (error) {
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

      response.data.on('data', (chunk) => {
        buffer += chunk.toString();

        // 处理 SSE 格式数据
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // 保留最后一个不完整的行

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();

            if (data === '[DONE]') {
              onEnd();
              return;
            }

            try {
              const parsed = JSON.parse(data);
              onData(parsed);
            } catch (e) {
              // 忽略解析错误的数据
            }
          }
        }
      });

      response.data.on('error', (error) => {
        onError(error);
      });

      response.data.on('end', () => {
        onEnd();
      });

    } catch (error) {
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
