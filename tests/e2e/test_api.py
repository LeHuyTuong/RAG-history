import requests
import sys

BASE_URL = "http://localhost:8080/api/v1"

def test_api():
    print("1. Login as admin")
    res = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "admin01@historyrag.local",
        "password": "Password@123"
    })
    if res.status_code != 200:
        print("Failed to login", res.text)
        return

    token = res.json()["data"]["accessToken"]
    print("✅ Login successful")

    print("\n2. Test Health Endpoint")
    res = requests.get(f"{BASE_URL}/rag/health", headers={"Authorization": f"Bearer {token}"})
    print(f"Health status: {res.status_code}")
    print(res.text)

    print("\n3. Test RAG Chat Endpoint")
    res = requests.post(f"{BASE_URL}/rag/chat", headers={"Authorization": f"Bearer {token}"}, json={
        "question": "Trận Bạch Đằng diễn ra năm nào?",
        "topK": 3,
        "useGraph": False
    })
    print(f"Chat status: {res.status_code}")
    if res.status_code == 200:
        print("✅ Chat successful. Response:", res.text[:200] + "...")
    else:
        print("❌ Chat failed:", res.text)

if __name__ == "__main__":
    test_api()
