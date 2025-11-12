/**
 * 参数转换工具模块
 * 负责 OpenAI ↔ 火山引擎参数格式转换
 */

/**
 * Size 参数转换函数
 * 支持比例格式 (如 "3:4")、像素格式 (如 "1024x1024") 和分辨率级别 (如 "2K")
 *
 * @param {string} size - 输入的尺寸参数
 * @returns {string} 火山引擎支持的尺寸格式
 */
function convertSize(size) {
  if (!size) {
    return '4K'; // 默认尺寸 4K
  }

  // 如果是比例格式 (如 "3:4")
  if (size.includes(':')) {
    const ratioMap = {
      '1:1': '2048x2048',
      '4:3': '2304x1728',
      '3:4': '1728x2304',
      '16:9': '2560x1440',
      '9:16': '1440x2560',
      '3:2': '2496x1664',
      '2:3': '1664x2496',
      '21:9': '3024x1296'
    };
    return ratioMap[size] || '4K';
  }

  // 如果是分辨率级别或像素格式,直接返回
  return size;
}

/**
 * 将 OpenAI temperature (0-1) 转换为火山引擎 guidance_scale (1-10)
 *
 * @param {number} temperature - OpenAI temperature 值
 * @returns {number} 火山引擎 guidance_scale 值
 */
function convertTemperature(temperature) {
  if (temperature === undefined || temperature === null) {
    return 5; // 默认值
  }
  return 1 + temperature * 9;
}

/**
 * 从 OpenAI messages 中提取文本 prompt
 *
 * @param {Array} messages - OpenAI messages 数组
 * @returns {string} 提取的文本内容
 */
function extractPrompt(messages) {
  if (!messages || messages.length === 0) {
    throw new Error('Messages array is empty');
  }

  const lastMessage = messages[messages.length - 1];

  if (typeof lastMessage.content === 'string') {
    return lastMessage.content;
  }

  // 处理数组格式的 content
  if (Array.isArray(lastMessage.content)) {
    const textContent = lastMessage.content.find(item => item.type === 'text');
    if (textContent) {
      return textContent.text;
    }
  }

  throw new Error('No text content found in messages');
}

/**
 * 从 OpenAI messages 中提取图片 URL 或 Base64
 *
 * @param {Array} messages - OpenAI messages 数组
 * @returns {Array|null} 图片 URL 数组或 null
 */
function extractImages(messages) {
  if (!messages || messages.length === 0) {
    return null;
  }

  const lastMessage = messages[messages.length - 1];

  // 如果 content 是字符串,没有图片
  if (typeof lastMessage.content === 'string') {
    return null;
  }

  // 处理数组格式的 content
  if (Array.isArray(lastMessage.content)) {
    const imageContents = lastMessage.content.filter(item => item.type === 'image_url');
    if (imageContents.length === 0) {
      return null;
    }

    return imageContents.map(item => {
      if (item.image_url && item.image_url.url) {
        return item.image_url.url;
      }
      return null;
    }).filter(url => url !== null);
  }

  return null;
}

/**
 * 转换 OpenAI 请求为火山引擎请求格式
 *
 * @param {Object} openaiRequest - OpenAI 格式的请求体
 * @returns {Object} 火山引擎格式的请求体
 */
function convertOpenAIToVolc(openaiRequest) {
  const {
    model,
    messages,
    stream = false,
    temperature,
    n = 1,
    size,
    // 额外参数支持
    add_watermark = false,
    response_format = 'url',
    sequential_image_generation
  } = openaiRequest;

  // 验证必需参数
  if (!model) {
    throw new Error('Model parameter is required');
  }
  if (!messages || messages.length === 0) {
    throw new Error('Messages parameter is required');
  }

  // 提取 prompt 和 images
  const images = extractImages(messages);

  let prompt;
  try {
    prompt = extractPrompt(messages);
  } catch (error) {
    // 没有提供文本提示词时,使用默认提示词
    if (images && images.length > 0) {
      prompt = 'Transform this image with artistic style';
    } else {
      prompt = 'Generate a beautiful image';
    }
  }

  // 构建火山引擎请求体
  const volcRequest = {
    model,
    prompt,
    stream,
    watermark: add_watermark,
    response_format
  };

  // 添加可选参数
  if (size) {
    volcRequest.size = convertSize(size);
  }

  if (temperature !== undefined) {
    volcRequest.guidance_scale = convertTemperature(temperature);
  }

  if (images && images.length > 0) {
    // 单图
    if (images.length === 1) {
      volcRequest.image = images[0];
    } else {
      // 多图 (最多10张)
      volcRequest.image = images.slice(0, 10);
    }
  }

  // 组图生成配置
  if (n > 1 || sequential_image_generation) {
    volcRequest.sequential_image_generation = sequential_image_generation || 'auto';
    volcRequest.sequential_image_generation_options = {
      max_images: Math.min(n, 15) // 最多15张
    };
  }

  return volcRequest;
}

/**
 * 转换火山引擎响应为 OpenAI 格式 (非流式)
 *
 * @param {Object} volcResponse - 火山引擎响应
 * @param {string} model - 模型名称
 * @returns {Object} OpenAI 格式的响应
 */
function convertVolcToOpenAI(volcResponse, model) {
  const timestamp = Math.floor(Date.now() / 1000);
  const chatId = `chatcmpl-${timestamp}`;

  // 处理图片结果
  const images = volcResponse.data || [];
  const successCount = images.filter(item => !item.error).length;
  const failCount = images.filter(item => item.error).length;

  console.log(`[Converter] Processing ${images.length} items: ${successCount} succeeded, ${failCount} failed`);

  const choices = images.map((imageData, index) => {
    // 检查是否是错误项
    if (imageData.error) {
      console.error(`[Converter] Image ${index} failed:`, imageData.error);
      return {
        index,
        message: {
          role: 'assistant',
          content: `图片 ${index + 1} 生成失败: ${imageData.error.message || '未知错误'} (错误码: ${imageData.error.code || 'unknown'})`
        },
        finish_reason: 'error'
      };
    }

    // 处理成功的图片
    const imageUrl = imageData.url || (imageData.b64_json
      ? `data:image/png;base64,${imageData.b64_json}`
      : null);

    if (!imageUrl) {
      console.warn(`[Converter] Image ${index} has no url or b64_json`);
    }

    // 非流式响应：使用 Markdown 格式返回图片
    // 注意：为了兼容各种客户端，message.content 使用 string 类型
    const imageSize = imageData.size || 'N/A';
    const content = imageUrl
      ? `![Generated Image ${index + 1}](${imageUrl})\n\n图片尺寸: ${imageSize}`
      : '图片生成失败';

    return {
      index,
      message: {
        role: 'assistant',
        content
      },
      finish_reason: 'stop'
    };
  });

  return {
    id: chatId,
    object: 'chat.completion',
    created: timestamp,
    model,
    choices,
    usage: {
      prompt_tokens: 0,
      completion_tokens: volcResponse.usage?.output_tokens || 0,
      total_tokens: volcResponse.usage?.total_tokens || 0
    },
    system_fingerprint: `url_expires_${timestamp + 86400}`, // 24小时后过期
    // 添加额外信息
    volcengine: {
      generated_images: volcResponse.usage?.generated_images || successCount,
      success_count: successCount,
      fail_count: failCount
    }
  };
}

/**
 * 生成 SSE 格式的流式响应数据块
 *
 * @param {string} chatId - 会话 ID
 * @param {string} model - 模型名称
 * @param {number} timestamp - 时间戳
 * @param {Object} delta - 增量数据
 * @param {number} index - 选项索引
 * @param {string|null} finishReason - 完成原因
 * @returns {string} SSE 格式的数据
 */
function createSSEChunk(chatId, model, timestamp, delta, index = 0, finishReason = null) {
  const chunk = {
    id: chatId,
    object: 'chat.completion.chunk',
    created: timestamp,
    model,
    choices: [
      {
        index,
        delta,
        finish_reason: finishReason
      }
    ]
  };

  return `data: ${JSON.stringify(chunk)}\n\n`;
}

module.exports = {
  convertSize,
  convertTemperature,
  extractPrompt,
  extractImages,
  convertOpenAIToVolc,
  convertVolcToOpenAI,
  createSSEChunk
};
