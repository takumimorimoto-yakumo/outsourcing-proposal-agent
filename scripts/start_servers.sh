#!/bin/bash

# Proposal Generator - サーバー起動スクリプト

echo "====================================="
echo "Proposal Generator - サーバー起動"
echo "====================================="

# プロジェクトルートに移動
cd "$(dirname "$0")/.."
PROJECT_ROOT=$(pwd)

echo ""
echo "1. Python APIサーバーを起動中..."
echo "   http://localhost:8000"
source "$PROJECT_ROOT/.venv/bin/activate"
python -m uvicorn src.api.server:app --reload --port 8000 &
API_PID=$!

sleep 2

echo ""
echo "2. Next.js フロントエンドを起動中..."
echo "   http://localhost:3005"
cd "$PROJECT_ROOT/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "====================================="
echo "サーバーが起動しました！"
echo ""
echo "  API:       http://localhost:8000"
echo "  Frontend:  http://localhost:3005"
echo ""
echo "終了するには Ctrl+C を押してください"
echo "====================================="

# 終了シグナルをキャッチ
trap "kill $API_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM

# 待機
wait
