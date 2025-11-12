/**
 * 认证中间件
 * 验证 API 密钥
 */

/**
 * 验证 Authorization 头中的 API 密钥
 */
function authenticateApiKey(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    const error = new Error('Missing Authorization header');
    error.status = 401;
    error.code = 'authentication_error';
    return next(error);
  }

  // 支持 "Bearer {token}" 格式
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    const error = new Error('Invalid Authorization header format. Expected: Bearer {token}');
    error.status = 401;
    error.code = 'authentication_error';
    return next(error);
  }

  const apiKey = match[1];

  // 验证 API 密钥 (这里简单验证是否存在,实际应用中应该验证密钥是否有效)
  if (!apiKey || apiKey.trim() === '') {
    const error = new Error('Invalid API key');
    error.status = 401;
    error.code = 'authentication_error';
    return next(error);
  }

  // 将 API 密钥附加到请求对象
  req.apiKey = apiKey;
  next();
}

module.exports = {
  authenticateApiKey
};
