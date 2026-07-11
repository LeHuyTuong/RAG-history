#!/usr/bin/env bash
# Test nhanh /rag/chat bằng các câu hỏi kiểu đời thường (mơ hồ, nhiều ý,
# hỏi kiểu "ông này ở đâu ra, lịch sử thế nào, sao lại mất").
# Chạy: bash scripts/test_chat_flow.sh
# Cần rag-service đang chạy tại localhost:8001 (uvicorn app.main:app --port 8001).

BASE_URL="${BASE_URL:-http://localhost:8001}"

ask() {
  echo "=================================================================="
  echo "HỎI: $1"
  echo "------------------------------------------------------------------"
  curl -s -X POST "$BASE_URL/rag/chat" \
    -H "Content-Type: application/json" \
    -d "{\"question\": \"$1\", \"topK\": 8}" | python3 -m json.tool
  echo
}

ask "Mạc Đăng Dung là ông nào, ở đâu ra vậy?"
ask "Mạc Đăng Dung cướp ngôi nhà Lê xong sao lại mất ngôi vậy?"
ask "Trịnh Nguyễn phân tranh là sao, hai bên đánh nhau vì cái gì?"
ask "Trong vụ Trịnh Nguyễn phân tranh thì ông nào bị mất họ hàng, đứt luôn quan hệ dòng tộc?"
ask "Chúa Nguyễn với chúa Trịnh có phải bà con gì với nhau không mà lại đánh nhau?"
ask "Nhà Mạc bị diệt xong thì con cháu chạy đi đâu, còn ai sống sót không?"
