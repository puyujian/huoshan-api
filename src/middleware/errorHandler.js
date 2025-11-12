/**
 * 错误处理中间件
 * 将各种错误转换为 OpenAI 兼容的错误格式
 */

/**
 * 创建 OpenAI 格式的错误响应
 *
 * @param {string} message - 错误消息
 * @param {string} type - 错误类型
 * @param {string} code - 错误代码
 * @param {number} status - HTTP 状态码
 * @returns {Object} OpenAI 格式的错误对象
 */
function createOpenAIError(message, type, code, status = 500) {
  return {
    error: {
      message,
      type,
      code,
      param: null
    },
    status
  };
}

/**
 * 全局错误处理中间件
 */
function errorHandler(err, req, res, next) {
  // 详细错误日志
  console.error('\n' + '!'.repeat(60));
  console.error('[Error Handler] Caught error');
  console.error('[Error Handler] Type:', err.name || 'Unknown');
  console.error('[Error Handler] Message:', err.message);
  console.error('[Error Handler] Code:', err.code || 'N/A');
  console.error('[Error Handler] Status:', err.status || 'N/A');

  if (err.volcResponse) {
    console.error('[Error Handler] Volcano Response:', JSON.stringify(err.volcResponse, null, 2));
  }

  if (err.stack) {
    console.error('[Error Handler] Stack trace:');
    console.error(err.stack);
  }

  console.error('!'.repeat(60) + '\n');

  // 如果已经发送了响应头,则无法再发送错误响应
  if (res.headersSent) {
    console.error('[Error Handler] Response already sent, cannot send error response');
    return next(err);
  }

  let errorResponse;
  let statusCode = 500;

  // 处理参数验证错误
  if (err.name === 'ValidationError' || err.message.includes('required')) {
    errorResponse = createOpenAIError(
      err.message,
      'invalid_request_error',
      'invalid_parameter',
      400
    );
    statusCode = 400;
  }
  // 处理认证错误
  else if (err.status === 401 || err.code === 'authentication_error') {
    errorResponse = createOpenAIError(
      'Invalid API key provided',
      'invalid_request_error',
      'invalid_api_key',
      401
    );
    statusCode = 401;
  }
  // 处理火山引擎 API 错误
  else if (err.volcResponse) {
    const volcError = err.volcResponse.error || {};
    errorResponse = createOpenAIError(
      volcError.message || err.message,
      'api_error',
      volcError.code || err.code || 'volcano_engine_error',
      err.status || 500
    );
    statusCode = err.status || 500;
  }
  // 处理网络超时错误
  else if (err.status === 504 || err.code === 'network_error') {
    errorResponse = createOpenAIError(
      'Request to Volcano Engine API timed out',
      'api_error',
      'timeout',
      504
    );
    statusCode = 504;
  }
  // 处理其他错误
  else {
    errorResponse = createOpenAIError(
      err.message || 'Internal server error',
      'api_error',
      err.code || 'internal_error',
      err.status || 500
    );
    statusCode = err.status || 500;
  }

  res.status(statusCode).json(errorResponse.error);
}

/**
 * 404 处理中间件
 */
function notFoundHandler(req, res) {
  const errorResponse = createOpenAIError(
    `Route ${req.method} ${req.path} not found`,
    'invalid_request_error',
    'not_found',
    404
  );

  res.status(404).json(errorResponse.error);
}

module.exports = {
  errorHandler,
  notFoundHandler,
  createOpenAIError
};
