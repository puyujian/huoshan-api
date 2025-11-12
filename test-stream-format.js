/**
 * 测试流式响应格式
 * 验证 delta.content 是否为 string 类型
 */

const axios = require('axios');

const API_KEY = '541619ec-9cf8-4f6f-8991-c38f5f9bedd8';
const API_BASE = 'http://localhost:3000';

async function testStreamFormat() {
  console.log('========================================');
  console.log('测试流式响应格式');
  console.log('========================================\n');

  try {
    const response = await axios.post(
      `${API_BASE}/v1/chat/completions`,
      {
        model: 'doubao-seedream-4-0-250828',
        messages: [
          {
            role: 'user',
            content: '生成一张可爱的小猫图片'
          }
        ],
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

    console.log('✅ 开始接收流式数据...\n');

    let buffer = '';
    let chunkCount = 0;

    response.data.on('data', (chunk) => {
      buffer += chunk.toString();

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();

          if (data === '[DONE]') {
            console.log('\n✅ 流式传输完成');
            return;
          }

          try {
            const parsed = JSON.parse(data);
            chunkCount++;

            console.log(`\n--- Chunk ${chunkCount} ---`);
            console.log('ID:', parsed.id);
            console.log('Object:', parsed.object);

            if (parsed.choices && parsed.choices[0]) {
              const choice = parsed.choices[0];
              const delta = choice.delta;

              console.log('Delta keys:', Object.keys(delta));

              if (delta.content !== undefined) {
                const contentType = typeof delta.content;
                const isString = contentType === 'string';

                console.log('Content type:', contentType);
                console.log('Is string:', isString ? '✅' : '❌');

                if (isString) {
                  console.log('Content preview:', delta.content.substring(0, 100));
                } else {
                  console.log('❌ ERROR: Content is not a string!');
                  console.log('Content value:', JSON.stringify(delta.content, null, 2));
                }
              }

              if (choice.finish_reason) {
                console.log('Finish reason:', choice.finish_reason);
              }
            }
          } catch (e) {
            console.error('解析错误:', e.message);
          }
        }
      }
    });

    response.data.on('error', (error) => {
      console.error('\n❌ 流错误:', error.message);
    });

    response.data.on('end', () => {
      console.log(`\n总共收到 ${chunkCount} 个数据块`);
    });

    // 等待流结束
    await new Promise((resolve, reject) => {
      response.data.on('end', resolve);
      response.data.on('error', reject);
    });

  } catch (error) {
    console.error('\n❌ 请求失败:', error.message);
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }

  console.log('\n========================================');
  console.log('测试完成');
  console.log('========================================');
}

// 执行测试
if (require.main === module) {
  testStreamFormat().catch(console.error);
}

module.exports = { testStreamFormat };
