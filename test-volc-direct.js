/**
 * 直接测试火山引擎 API
 * 用于验证修复后的功能
 */

const VolcEngineClient = require('./src/utils/volcClient');

// 使用提供的测试密钥
const API_KEY = '541619ec-9cf8-4f6f-8991-c38f5f9bedd8';
const API_BASE = 'https://ark.cn-beijing.volces.com/api/v3';

// 测试非流式请求
async function testNonStream() {
  console.log('\n=== 测试非流式图片生成 ===');
  console.log('API Base:', API_BASE);
  console.log('Model: doubao-seedream-4-0-250828');

  const client = new VolcEngineClient(API_KEY, API_BASE);

  try {
    const request = {
      model: 'doubao-seedream-4-0-250828',
      prompt: '一只可爱的橘猫在阳光下',
      size: '2048x2048',
      stream: false,
      watermark: false,
      response_format: 'url'
    };

    console.log('\n发送请求...');
    const response = await client.generateImage(request);

    console.log('\n✅ 请求成功!');
    console.log('Model:', response.model);
    console.log('Created:', new Date(response.created * 1000).toLocaleString());
    console.log('生成图片数:', response.data?.length || 0);

    if (response.data && response.data.length > 0) {
      response.data.forEach((item, index) => {
        if (item.error) {
          console.log(`\n图片 ${index + 1}: ❌ 失败`);
          console.log('  错误码:', item.error.code);
          console.log('  错误信息:', item.error.message);
        } else {
          console.log(`\n图片 ${index + 1}: ✅ 成功`);
          console.log('  尺寸:', item.size);
          console.log('  URL:', item.url ? item.url.substring(0, 80) + '...' : 'N/A');
        }
      });
    }

    if (response.usage) {
      console.log('\n用量信息:');
      console.log('  成功生成图片数:', response.usage.generated_images);
      console.log('  输出 tokens:', response.usage.output_tokens);
      console.log('  总 tokens:', response.usage.total_tokens);
    }

  } catch (error) {
    console.error('\n❌ 请求失败!');
    console.error('错误消息:', error.message);
    console.error('错误码:', error.code);
    if (error.volcResponse) {
      console.error('火山引擎响应:', JSON.stringify(error.volcResponse, null, 2));
    }
  }
}

// 测试流式请求
async function testStream() {
  console.log('\n\n=== 测试流式图片生成 ===');
  console.log('API Base:', API_BASE);
  console.log('Model: doubao-seedream-4-0-250828');

  const client = new VolcEngineClient(API_KEY, API_BASE);

  try {
    const request = {
      model: 'doubao-seedream-4-0-250828',
      prompt: '一片宁静的湖泊,倒映着雪山',
      size: '2048x2048',
      stream: true,
      watermark: false,
      response_format: 'url',
      sequential_image_generation: 'auto',
      sequential_image_generation_options: {
        max_images: 3
      }
    };

    console.log('\n发送流式请求...');
    console.log('最大图片数: 3');

    let imageCount = 0;
    let failCount = 0;
    let completed = false;

    await client.generateImageStream(
      request,
      // onData
      (eventData) => {
        if (eventData.type === 'partial_succeeded') {
          imageCount++;
          console.log(`\n✅ 图片 ${eventData.image_index + 1} 生成成功`);
          console.log('   尺寸:', eventData.size);
          console.log('   URL:', eventData.url ? eventData.url.substring(0, 60) + '...' : 'N/A');
        } else if (eventData.type === 'partial_failed') {
          failCount++;
          console.log(`\n❌ 图片 ${eventData.image_index + 1} 生成失败`);
          console.log('   错误码:', eventData.error?.code);
          console.log('   错误信息:', eventData.error?.message);
        } else if (eventData.type === 'completed') {
          completed = true;
          console.log('\n🎉 所有图片处理完成!');
          console.log('用量信息:');
          console.log('  成功生成图片数:', eventData.usage?.generated_images);
          console.log('  输出 tokens:', eventData.usage?.output_tokens);
          console.log('  总 tokens:', eventData.usage?.total_tokens);
        }
      },
      // onError
      (error) => {
        console.error('\n❌ 流式请求错误:', error.message);
      },
      // onEnd
      () => {
        console.log('\n流式连接结束');
        console.log('总计: 成功 ' + imageCount + ' 张, 失败 ' + failCount + ' 张');
        if (!completed) {
          console.log('⚠️  警告: 未收到 completed 事件');
        }
      }
    );

    // 等待一下确保流完全结束
    await new Promise(resolve => setTimeout(resolve, 1000));

  } catch (error) {
    console.error('\n❌ 流式请求失败!');
    console.error('错误消息:', error.message);
    console.error('错误码:', error.code);
    if (error.volcResponse) {
      console.error('火山引擎响应:', JSON.stringify(error.volcResponse, null, 2));
    }
  }
}

// 运行测试
async function runTests() {
  console.log('========================================');
  console.log('火山引擎 API 测试');
  console.log('========================================');
  console.log('开始时间:', new Date().toLocaleString());

  try {
    // 先测试非流式
    await testNonStream();

    // 等待一下
    console.log('\n\n等待 2 秒...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 再测试流式
    await testStream();

  } catch (error) {
    console.error('测试过程出错:', error);
  }

  console.log('\n========================================');
  console.log('测试完成!');
  console.log('结束时间:', new Date().toLocaleString());
  console.log('========================================');
}

// 执行
if (require.main === module) {
  runTests().catch(error => {
    console.error('测试执行失败:', error);
    process.exit(1);
  });
}

module.exports = { testNonStream, testStream };
