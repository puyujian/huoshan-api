/**
 * 模型控制器
 * 处理 /v1/models 端点,兼容 OpenAI SDK
 */

/**
 * 支持的模型列表
 */
const SUPPORTED_MODELS = [
  {
    id: 'doubao-seedream-4.0',
    object: 'model',
    created: 1704067200,
    owned_by: 'volcano-engine',
    permission: [],
    root: 'doubao-seedream-4.0',
    parent: null,
    description: '文生图、单图生图、多图生图、组图生成'
  },
  {
    id: 'doubao-seedream-3.0-t2i',
    object: 'model',
    created: 1704067200,
    owned_by: 'volcano-engine',
    permission: [],
    root: 'doubao-seedream-3.0-t2i',
    parent: null,
    description: '文生图'
  },
  {
    id: 'doubao-seededit-3.0-i2i',
    object: 'model',
    created: 1704067200,
    owned_by: 'volcano-engine',
    permission: [],
    root: 'doubao-seededit-3.0-i2i',
    parent: null,
    description: '单图生图'
  }
];

/**
 * 处理模型列表请求
 * 返回支持的模型列表,兼容 OpenAI API 格式
 */
function handleModels(req, res) {
  res.json({
    object: 'list',
    data: SUPPORTED_MODELS
  });
}

module.exports = {
  handleModels,
  SUPPORTED_MODELS
};
