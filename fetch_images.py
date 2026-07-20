import urllib.request
import json
import urllib.parse
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

periods = {
    1: "Trống đồng Ngọc Lũ",
    2: "Thành Cổ Loa",
    3: "Trống đồng Đông Sơn",
    4: "Hai Bà Trưng",
    5: "Chùa Trấn Quốc",
    6: "Khúc Thừa Dụ",
    7: "Trận Bạch Đằng (938)",
    8: "Cố đô Hoa Lư",
    9: "Đền Lê Đại Hành",
    10: "Chùa Một Cột",
    11: "Trần Hưng Đạo",
    12: "Thành nhà Hồ",
    13: "Khởi nghĩa Lam Sơn",
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
    url = f"https://vi.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=original&titles={urllib.parse.quote(query)}"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        response = urllib.request.urlopen(req, context=ctx)
        data = json.loads(response.read().decode('utf-8'))
        pages = data['query']['pages']
        page = list(pages.values())[0]
        if 'original' in page:
            image_url = page['original']['source']
            sql_lines.append(f"UPDATE period SET image_url = '{image_url}' WHERE period_id = {pid};")
    except Exception as e:
        pass

with open("backend/src/main/resources/db/migration/V14__add_period_images.sql", "w", encoding='utf-8') as f:
    f.write("\n".join(sql_lines))

print("SQL generated successfully.")
