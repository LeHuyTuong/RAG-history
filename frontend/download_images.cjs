const fs = require('fs');
const path = require('path');
const axios = require('axios');

const outDir = path.resolve('../frontend/public/images/posts');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const posts = [
  { title: 'Trống đồng Đông Sơn', file: 'van-lang.jpg' },
  { title: 'Thành Cổ Loa', file: 'co-loa.jpg' },
  { title: 'An Dương Vương', file: 'au-lac.jpg' },
  { title: 'Hai Bà Trưng', file: 'hai-ba-trung.jpg' },
  { title: 'Bà Triệu', file: 'ba-trieu.jpg' },
  { title: 'Lý Nam Đế', file: 'van-xuan.jpg' },
  { title: 'Khúc Thừa Dụ', file: 'ho-khuc.jpg' },
  { title: 'Trận Bạch Đằng 938', file: 'bach-dang-938.jpg' },
  { title: 'Đinh Tiên Hoàng', file: 'dinh-bo-linh.jpg' },
  { title: 'Lê Đại Hành', file: 'le-hoan.jpg' },
  { title: 'Hoàng thành Thăng Long', file: 'thang-long.jpg' },
  { title: 'Trận Như Nguyệt', file: 'nhu-nguyet.jpg' },
  { title: 'Trần Thủ Độ', file: 'tran-1258.jpg' },
  { title: 'Trận Bạch Đằng 1288', file: 'bach-dang-1288.jpg' },
  { title: 'Hồ Quý Ly', file: 'nha-ho.jpg' },
  { title: 'Khởi nghĩa Lam Sơn', file: 'lam-son.jpg' },
  { title: 'Bình Ngô đại cáo', file: 'binh-ngo-dai-cao.jpg' },
  { title: 'Trận Ngọc Hồi - Đống Đa', file: 'dong-da.jpg' },
  { title: 'Pháo đài Điện Hải', file: 'da-nang-1858.jpg' },
  { title: 'Trận Điện Biên Phủ', file: 'dien-bien-phu.jpg' }
];

async function fetchWikiImage(query, filename) {
  try {
    const searchUrl = `https://vi.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=original&titles=${encodeURIComponent(query)}`;
    const res = await axios.get(searchUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const pages = res.data.query.pages;
    const pageId = Object.keys(pages)[0];
    if (pageId === '-1' || !pages[pageId].original) {
      console.log('No image for', query);
      return;
    }
    const imgUrl = pages[pageId].original.source;
    console.log('Downloading', imgUrl, 'for', query);
    
    require('child_process').execSync(`curl.exe -s -L -A "Mozilla/5.0" -o "${path.join(outDir, filename)}" "${imgUrl}"`);
    console.log('Downloaded', filename);
    await new Promise(r => setTimeout(r, 2000));
  } catch(e) {
    console.log('Error for', query, e.message);
  }
}

async function run() {
  for (let p of posts) {
    await fetchWikiImage(p.title, p.file);
  }
  console.log('Done!');
}
run();
