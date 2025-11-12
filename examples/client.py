#!/usr/bin/env python3
"""
Python 客户端示例
演示如何使用 Python 调用 API
"""

import requests
import json
import sys

# 配置
API_BASE = "http://localhost:3000"
API_KEY = "your-api-key"  # 替换为实际的 API 密钥


def generate_image(prompt, size="3:4", stream=False, model="doubao-seedream-4.0"):
    """
    生成图片

    Args:
        prompt: 文本提示词
        size: 图片尺寸 (比例格式或像素格式)
        stream: 是否使用流式响应
        model: 模型 ID

    Returns:
        响应数据
    """
    url = f"{API_BASE}/v1/chat/completions"

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}"
    }

    payload = {
        "model": model,
        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ],
        "size": size,
        "stream": stream
    }

    if stream:
        # 流式请求
        response = requests.post(url, headers=headers, json=payload, stream=True)
        response.raise_for_status()

        print("开始接收流式数据...")
        for line in response.iter_lines():
            if line:
                line_str = line.decode('utf-8')
                if line_str.startswith('data: '):
                    data = line_str[6:].strip()
                    if data == '[DONE]':
                        print("流式传输完成")
                        break
                    try:
                        chunk = json.loads(data)
                        if chunk.get('choices'):
                            delta = chunk['choices'][0].get('delta', {})
                            if 'content' in delta:
                                print("收到图片数据")
                    except json.JSONDecodeError:
                        pass
    else:
        # 非流式请求
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()

        data = response.json()

        print(f"✅ 生成成功!")
        print(f"ID: {data.get('id')}")
        print(f"模型: {data.get('model')}")
        print(f"生成图片数量: {len(data.get('choices', []))}")

        for i, choice in enumerate(data.get('choices', [])):
            content = choice.get('message', {}).get('content', [])
            if content and len(content) > 0:
                image_url = content[0].get('image_url', {}).get('url', '')
                print(f"图片 {i+1}: {image_url[:80]}...")

        return data


def generate_multiple_images(prompt, n=3, size="1:1"):
    """
    生成多张图片 (组图模式)

    Args:
        prompt: 文本提示词
        n: 生成数量
        size: 图片尺寸

    Returns:
        响应数据
    """
    url = f"{API_BASE}/v1/chat/completions"

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}"
    }

    payload = {
        "model": "doubao-seedream-4.0",
        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ],
        "n": n,
        "size": size,
        "stream": False
    }

    response = requests.post(url, headers=headers, json=payload)
    response.raise_for_status()

    data = response.json()

    print(f"✅ 组图生成成功!")
    print(f"生成图片数量: {len(data.get('choices', []))}")

    return data


def health_check():
    """健康检查"""
    url = f"{API_BASE}/health"

    try:
        response = requests.get(url)
        response.raise_for_status()

        data = response.json()
        print(f"✅ 服务健康: {data}")
        return True
    except Exception as e:
        print(f"❌ 服务不可用: {e}")
        return False


def main():
    """主函数"""
    print("=" * 60)
    print("OpenAI to Volcano Engine Image API - Python 客户端")
    print("=" * 60)

    # 健康检查
    print("\n1. 健康检查")
    if not health_check():
        print("服务未启动,请先启动服务!")
        sys.exit(1)

    # 测试 1: 文生图 (比例格式)
    print("\n2. 测试文生图 (比例格式 3:4)")
    try:
        generate_image(
            prompt="一只可爱的橘猫在阳光明媚的花园里玩耍",
            size="3:4"
        )
    except Exception as e:
        print(f"❌ 错误: {e}")

    # 测试 2: 文生图 (像素格式)
    print("\n3. 测试文生图 (像素格式 2048x2048)")
    try:
        generate_image(
            prompt="一个科幻风格的未来城市,霓虹灯闪烁",
            size="2048x2048"
        )
    except Exception as e:
        print(f"❌ 错误: {e}")

    # 测试 3: 组图生成
    print("\n4. 测试组图生成 (3张)")
    try:
        generate_multiple_images(
            prompt="可爱的小狗在公园里奔跑",
            n=3,
            size="1:1"
        )
    except Exception as e:
        print(f"❌ 错误: {e}")

    print("\n" + "=" * 60)
    print("测试完成!")
    print("=" * 60)


if __name__ == "__main__":
    main()
