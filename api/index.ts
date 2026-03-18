// Vercel Serverless Function Entry Point
// 此文件作为 Vercel Serverless Function 的入口

import type { VercelRequest, VercelResponse } from '@vercel/node';

// Simple health check handler
export default function handler(req: VercelRequest, res: VercelResponse) {
  // Health check endpoint
  if (req.url === '/api/health' || req.url === '/api/') {
    return res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'HYROX Advance API',
      environment: 'vercel',
      message: 'API is running. Note: Full API features require server deployment.'
    });
  }

  // For other API routes, return a message about deployment requirements
  return res.status(200).json({
    status: 'ok',
    message: 'HYROX Advance API',
    note: 'This is a static deployment. API features require a server environment.',
    endpoints: {
      health: '/api/health',
      analysis: '/api/analysis - Requires server deployment',
      training: '/api/training - Requires server deployment',
      athletes: '/api/athletes - Requires server deployment',
      results: '/api/results - Requires server deployment'
    }
  });
}
