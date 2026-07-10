import requests
import json
import re
import os
from concurrent.futures import ThreadPoolExecutor

def fetch_image_for_slug(slug):
    url = f"https://nguoikesu.com/nhan-vat/{slug}"
    try:
        res = requests.get(url, timeout=10)
        if res.status_code == 200:
            match = re.search(r'<img src="(/images/wiki/[^"]+)" itemprop="thumbnail"', res.text)
            if match:
                return slug, "https://nguoikesu.com" + match.group(1)
            match2 = re.search(r'<div class="item-content">.*?<img.*?src="(/images/[^"]+)"', res.text, re.DOTALL)
            if match2:
                return slug, "https://nguoikesu.com" + match2.group(1)
            match3 = re.search(r'<img src="(/images/[^"]+)"', res.text)
            if match3:
                return slug, "https://nguoikesu.com" + match3.group(1)
    except:
        pass
    return slug, None

def main():
    res = requests.get("http://localhost:8080/api/v1/public/persons?size=500")
    data = res.json()
    items = data.get("data", {}).get("result", []) if "data" in data else data.get("content", [])
    if not items and "items" in data: items = data["items"]
    if not items and isinstance(data, list): items = data
    slugs = [item["slug"] for item in items if "slug" in item]
    print(f"Found {len(slugs)} characters.")
    mapping = {}
    with ThreadPoolExecutor(max_workers=10) as executor:
        for slug, img_url in executor.map(fetch_image_for_slug, slugs):
            if img_url:
                mapping[slug] = img_url
                print(f"Found: {slug}")
    os.makedirs("frontend/src/data", exist_ok=True)
    with open("frontend/src/data/characterImages.json", "w", encoding="utf-8") as f:
        json.dump(mapping, f, ensure_ascii=False, indent=2)
    print("Saved to frontend/src/data/characterImages.json")

main()
