/**
 * 测试脚本示例
 * 演示如何调用 API
 */

const axios = require('axios');

// 配置
const API_BASE = 'http://localhost:3000';
const API_KEY = 'your-api-key'; // 替换为实际的 API 密钥

// 测试用例 1: 文生图 (比例格式)
async function testTextToImageWithRatio() {
  console.log('\n=== 测试 1: 文生图 (比例格式 3:4) ===');

  try {
    const response = await axios.post(
      `${API_BASE}/v1/chat/completions`,
      {
        model: 'doubao-seedream-4.0',
        messages: [
          {
            role: 'user',
            content: '一只可爱的橘猫在阳光明媚的花园里玩耍,背景是樱花树'
          }
        ],
        size: '3:4',
        stream: false
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        }
      }
    );

    console.log('✅ 请求成功');
    console.log('ID:', response.data.id);
    console.log('模型:', response.data.model);
    console.log('图片数量:', response.data.choices.length);

    response.data.choices.forEach((choice, index) => {
      const imageUrl = choice.message.content[0]?.image_url?.url;
      console.log(`图片 ${index + 1}:`, imageUrl ? imageUrl.substring(0, 80) + '...' : 'N/A');
    });

    console.log('Token 使用:', response.data.usage);
  } catch (error) {
    console.error('❌ 请求失败:', error.response?.data || error.message);
  }
}

// 测试用例 2: 文生图 (像素格式)
async function testTextToImageWithPixels() {
  console.log('\n=== 测试 2: 文生图 (像素格式 2048x2048) ===');

  try {
    const response = await axios.post(
      `${API_BASE}/v1/chat/completions`,
      {
        model: 'doubao-seedream-4.0',
        messages: [
          {
            role: 'user',
            content: '一个科幻风格的未来城市,霓虹灯闪烁,飞行汽车穿梭其中'
          }
        ],
        size: '2048x2048',
        temperature: 0.8,
        stream: false
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        }
      }
    );

    console.log('✅ 请求成功');
    console.log('ID:', response.data.id);
    console.log('模型:', response.data.model);

    const imageUrl = response.data.choices[0]?.message.content[0]?.image_url?.url;
    console.log('图片 URL:', imageUrl ? imageUrl.substring(0, 80) + '...' : 'N/A');
  } catch (error) {
    console.error('❌ 请求失败:', error.response?.data || error.message);
  }
}

// 测试用例 3: 流式响应
async function testStreamResponse() {
  console.log('\n=== 测试 3: 流式响应 ===');

  try {
    const response = await axios.post(
      `${API_BASE}/v1/chat/completions`,
      {
        model: 'doubao-seedream-4.0',
        messages: [
          {
            role: 'user',
            content: '一片宁静的湖泊,倒映着雪山和蓝天'
          }
        ],
        size: '16:9',
        stream: true
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        responseType: 'stream'
      }
    );

    console.log('✅ 开始接收流式数据...');

    let buffer = '';
    response.data.on('data', (chunk) => {
      buffer += chunk.toString();

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();

          if (data === '[DONE]') {
            console.log('✅ 流式传输完成');
            return;
          }

          try {
            const parsed = JSON.parse(data);
            if (parsed.choices?.[0]?.delta?.content) {
              console.log('📸 收到图片数据');
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    });

    response.data.on('error', (error) => {
      console.error('❌ 流错误:', error.message);
    });

  } catch (error) {
    console.error('❌ 请求失败:', error.response?.data || error.message);
  }
}

// 测试用例 4: 组图生成
async function testMultipleImages() {
  console.log('\n=== 测试 4: 组图生成 (3张图片) ===');

  try {
    const response = await axios.post(
      `${API_BASE}/v1/chat/completions`,
      {
        model: 'doubao-seedream-4.0',
        messages: [
          {
            role: 'user',
            content: '可爱的小狗在公园里奔跑'
          }
        ],
        n: 3,
        size: '1:1',
        stream: false
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        }
      }
    );

    console.log('✅ 请求成功');
    console.log('ID:', response.data.id);
    console.log('生成图片数量:', response.data.choices.length);

    response.data.choices.forEach((choice, index) => {
      const imageUrl = choice.message.content[0]?.image_url?.url;
      console.log(`图片 ${index + 1}:`, imageUrl ? 'URL 已生成' : 'N/A');
    });
  } catch (error) {
    console.error('❌ 请求失败:', error.response?.data || error.message);
  }
}

// 测试健康检查
async function testHealth() {
  console.log('\n=== 测试健康检查 ===');

  try {
    const response = await axios.get(`${API_BASE}/health`);
    console.log('✅ 服务健康状态:', response.data);
  } catch (error) {
    console.error('❌ 健康检查失败:', error.message);
  }
}

// 运行所有测试
async function runAllTests() {
  console.log('开始运行测试...');
  console.log('API 地址:', API_BASE);

  await testHealth();
  await testTextToImageWithRatio();
  await testTextToImageWithPixels();
  await testMultipleImages();
  await testStreamResponse();

  console.log('\n所有测试完成!');
}

// 执行测试
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testTextToImageWithRatio,
  testTextToImageWithPixels,
  testStreamResponse,
  testMultipleImages,
  testHealth
};
