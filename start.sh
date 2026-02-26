#!/bin/bash

# HYROX Advance 一键启动脚本
# 同时启动后端(5000)和前端(5173)

set -e

echo "🏃 HYROX Advance 启动脚本"
echo "=========================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目目录
PROJECT_DIR="/home/admin/openclaw/workspace/hyrox-advance"
CLIENT_DIR="$PROJECT_DIR/client"

# 从.env读取端口
BACKEND_PORT=$(grep -E "^PORT=" "$PROJECT_DIR/.env" | cut -d= -f2 || echo "5001")
FRONTEND_PORT=5173

# 检查端口占用
function check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  端口 $port 已被占用，尝试关闭...${NC}"
        lsof -Pi :$port -sTCP:LISTEN -t | xargs kill -9 2>/dev/null || true
        sleep 1
    fi
}

# 安装依赖（如果需要）
function install_deps() {
    local dir=$1
    local name=$2
    
    if [ ! -d "$dir/node_modules" ]; then
        echo -e "${BLUE}📦 安装 $name 依赖...${NC}"
        cd "$dir"
        npm install
    fi
}

# 清理旧进程
echo -e "${BLUE}🧹 清理旧进程...${NC}"
check_port $BACKEND_PORT
check_port $FRONTEND_PORT
pkill -f "tsx server/index.ts" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
sleep 2

# 安装依赖
echo ""
echo -e "${BLUE}📦 检查依赖...${NC}"
install_deps "$PROJECT_DIR" "后端"
install_deps "$CLIENT_DIR" "前端"

# 创建日志目录
mkdir -p "$PROJECT_DIR/logs"

# 启动后端
echo ""
echo -e "${GREEN}🚀 启动后端服务 (端口 $BACKEND_PORT)...${NC}"
cd "$PROJECT_DIR"
npx tsx server/index.ts > "$PROJECT_DIR/logs/backend.log" 2>&1 &
BACKEND_PID=$!
echo "后端 PID: $BACKEND_PID"

# 等待后端启动
sleep 3

# 检查后端是否成功
if ! curl -s http://localhost:$BACKEND_PORT/api/health > /dev/null 2>&1; then
    echo -e "${RED}❌ 后端启动失败，查看日志: $PROJECT_DIR/logs/backend.log${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 后端启动成功!${NC}"

# 启动前端
echo ""
echo -e "${GREEN}🚀 启动前端服务 (端口 5173)...${NC}"
cd "$CLIENT_DIR"
npm run dev > "$PROJECT_DIR/logs/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo "前端 PID: $FRONTEND_PID"

# 等待前端启动
sleep 5

echo ""
echo -e "${GREEN}==========================${NC}"
echo -e "${GREEN}✅ HYROX Advance 启动完成!${NC}"
echo -e "${GREEN}==========================${NC}"
echo ""
echo -e "🌐 前端地址: ${BLUE}http://localhost:$FRONTEND_PORT${NC}"
echo -e "🔌 后端API: ${BLUE}http://localhost:$BACKEND_PORT${NC}"
echo -e "📊 健康检查: ${BLUE}http://localhost:$BACKEND_PORT/api/health${NC}"
echo ""
echo -e "📁 日志文件:"
echo -e "   后端: $PROJECT_DIR/logs/backend.log"
echo -e "   前端: $PROJECT_DIR/logs/frontend.log"
echo ""
echo -e "🛑 停止服务: ${YELLOW}./stop.sh${NC}"
echo ""

# 保存PID到文件
echo "$BACKEND_PID" > "$PROJECT_DIR/.backend.pid"
echo "$FRONTEND_PID" > "$PROJECT_DIR/.frontend.pid"

# 保持脚本运行
wait