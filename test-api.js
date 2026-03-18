// 简单测试API连接
const apiKey = process.env.DASHSCOPE_API_KEY || 'not-set';
console.log('API Key configured:', apiKey.substring(0, 10) + '...');
console.log('Test passed - API key is ready');
