#!/bin/bash

# HYROX Advance 停止脚本

set -e

PROJECT_DIR="/home/admin/openclaw/workspace/hyrox-advance"
BACKEND_PORT=$(grep -E "^PORT=" "$PROJECT_DIR/.env" 2>/dev/null | cut -d= -f2 || echo "5001")

echo "🛑 停止 HYROX Advance 服务..."

# 从PID文件读取并停止
if [ -f "$PROJECT_DIR/.backend.pid" ]; then
    BACKEND_PID=$(cat "$PROJECT_DIR/.backend.pid")
    if kill -0 "$BACKEND_PID" 2>/dev/null; then
        echo "停止后端服务 (PID: $BACKEND_PID)..."
        kill -9 "$BACKEND_PID" 2>/dev/null || true
    fi
    rm -f "$PROJECT_DIR/.backend.pid"
fi

if [ -f "$PROJECT_DIR/.frontend.pid" ]; then
    FRONTEND_PID=$(cat "$PROJECT_DIR/.frontend.pid")
    if kill -0 "$FRONTEND_PID" 2>/dev/null; then
        echo "停止前端服务 (PID: $FRONTEND_PID)..."
        kill -9 "$FRONTEND_PID" 2>/dev/null || true
    fi
    rm -f "$PROJECT_DIR/.frontend.pid"
fi

# 兜底：杀掉相关进程
pkill -f "tsx server/index.ts" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true

echo "✅ 服务已停止"

# 检查端口是否释放
sleep 1
if lsof -Pi :$BACKEND_PORT -sTCP:LISTEN -t > /dev/null 2>&1; then
    echo "⚠️  端口$BACKEND_PORT仍被占用，强制释放..."
    lsof -Pi :$BACKEND_PORT -sTCP:LISTEN -t | xargs kill -9 2>/dev/null || true
fi

if lsof -Pi :5173 -sTCP:LISTEN -t > /dev/null 2>&1; then
    echo "⚠️  端口5173仍被占用，强制释放..."
    lsof -Pi :5173 -sTCP:LISTEN -t | xargs kill -9 2>/dev/null || true
fi

echo "✅ 完成"