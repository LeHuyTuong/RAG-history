import urllib.request
import json
import urllib.parse
import ssl
import time

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

periods = {
    1: "Trống đồng Đông Sơn",
    2: "Thành Cổ Loa",
    3: "Bắc thuộc lần thứ nhất",
    4: "Hai Bà Trưng",
    5: "Chùa Trấn Quốc",
    6: "Khúc Thừa Dụ",
    7: "Trận Bạch Đằng (938)",
    8: "Cố đô Hoa Lư",
    9: "Đền Hát Môn",
    10: "Chùa Một Cột",
    11: "Trần Hưng Đạo",
    12: "Thành nhà Hồ",
    13: "Bắc thuộc lần thứ tư",
    14: "Lê Thái Tổ",
    15: "Mạc Thái Tổ",
    16: "Lũy Thầy",
    17: "Quang Trung",
    18: "Hoàng thành Huế",
    19: "Cầu Long Biên",
    20: "Dinh Độc Lập"
}

sql_lines = ["-- Cập nhật hình ảnh (image_url) cho các thời kỳ lịch sử"]

for pid, query in periods.items():
    url = f"https://vi.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=thumbnail&pithumbsize=800&titles={urllib.parse.quote(query)}"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        response = urllib.request.urlopen(req, context=ctx)
        data = json.loads(response.read().decode('utf-8'))
        pages = data.get('query', {}).get('pages', {})
        page = list(pages.values())[0] if pages else {}
        
        if 'thumbnail' in page:
            image_url = page['thumbnail']['source']
            sql_lines.append(f"UPDATE period SET image_url = '{image_url}' WHERE period_id = {pid};")
        else:
            # Fallback search
            search_url = f"https://vi.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch={urllib.parse.quote(query)}&gsrlimit=1&prop=pageimages&piprop=thumbnail&pithumbsize=800&format=json"
            req2 = urllib.request.Request(search_url, headers={'User-Agent': 'Mozilla/5.0'})
            resp2 = urllib.request.urlopen(req2, context=ctx)
            data2 = json.loads(resp2.read().decode('utf-8'))
            pages2 = data2.get('query', {}).get('pages', {})
            
            found = False
            for p2 in pages2.values():
                if 'thumbnail' in p2:
                    image_url = p2['thumbnail']['source']
                    sql_lines.append(f"UPDATE period SET image_url = '{image_url}' WHERE period_id = {pid};")
                    found = True
                    break
            
            if not found:
                # Default generic fallback if search fails
                sql_lines.append(f"UPDATE period SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Ngoc_Lu.jpg/800px-Ngoc_Lu.jpg' WHERE period_id = {pid};")

    except Exception as e:
        sql_lines.append(f"UPDATE period SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Ngoc_Lu.jpg/800px-Ngoc_Lu.jpg' WHERE period_id = {pid};")
    time.sleep(0.5)

with open("backend/src/main/resources/db/migration/V14__add_period_images.sql", "w", encoding='utf-8') as f:
    f.write("\n".join(sql_lines))

print("SQL generated successfully.")
