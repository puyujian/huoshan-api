/**
 * 模型控制器
 * 处理 /v1/models 端点,兼容 OpenAI SDK
 */

/**
 * 支持的模型列表
 */
const SUPPORTED_MODELS = [
  {
    id: 'doubao-seedream-4-0-250828',
    object: 'model',
    created: 1704067200,
    owned_by: 'volcano-engine',
    permission: [],
    root: 'doubao-seedream-4-0-250828',
    parent: null,
    description: '文生图、图生图(单图/多图融合)、组图生成',
    metadata: {
      legacy_ids: ['doubao-seedream-4.0', 'doubao-seedream-4-0']
    }
  },
  {
    id: 'doubao-seedream-3-0-t2i-250415',
    object: 'model',
    created: 1704067200,
    owned_by: 'volcano-engine',
    permission: [],
    root: 'doubao-seedream-3-0-t2i-250415',
    parent: null,
    description: '文生图',
    metadata: {
      legacy_ids: ['doubao-seedream-3.0-t2i']
    }
  },
  {
    id: 'doubao-seededit-3-0-i2i-250628',
    object: 'model',
    created: 1704067200,
    owned_by: 'volcano-engine',
    permission: [],
    root: 'doubao-seededit-3-0-i2i-250628',
    parent: null,
    description: '图生图/图片编辑',
    metadata: {
      legacy_ids: ['doubao-seededit-3.0-i2i']
    }
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
