const https = require('https');
const fs = require('fs');
const path = require('path');

const articles = require('./frontend/public/api/user_articles.json');
let mapping = {};
try {
  mapping = JSON.parse(fs.readFileSync(path.join(__dirname, 'frontend', 'src', 'data', 'articleImages.json'), 'utf8'));
} catch (e) {}

const getWikipediaImage = (query) => {
  return new Promise((resolve) => {
    const url = `https://vi.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=original&titles=${encodeURIComponent(query)}`;
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const pages = json.query.pages;
          const pageId = Object.keys(pages)[0];
          if (pageId !== '-1' && pages[pageId].original) {
            resolve(pages[pageId].original.source);
          } else {
            resolve(null);
          }
        } catch (e) {
          resolve(null);
        }
      });
    });
    req.on('error', () => resolve(null));
  });
};

const searchImage = (searchKeyword) => {
  return new Promise((resolve) => {
    const searchUrl = `https://vi.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchKeyword)}&utf8=&format=json`;
    const req = https.get(searchUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
       let data = '';
       res.on('data', chunk => data += chunk);
       res.on('end', () => {
         try {
           const json = JSON.parse(data);
           if (json.query && json.query.search && json.query.search.length > 0) {
             const bestMatch = json.query.search[0].title;
             getWikipediaImage(bestMatch).then(resolve);
           } else {
             resolve(null);
           }
         } catch(e) { resolve(null); }
       });
    });
    req.on('error', () => resolve(null));
  });
};

const main = async () => {
  const manualOverrides = {
    'Văn Lang trong ký ức lịch sử': 'Văn Lang',
    'Họ Khúc và nền tự chủ': 'Khúc Thừa Dụ',
    'Bạch Đằng 938': 'Trận Bạch Đằng (938)',
    'Đinh Bộ Lĩnh và công cuộc thống nhất': 'Đinh Tiên Hoàng',
    'Lê Hoàn và cuộc chiến năm 981': 'Lê Đại Hành',
    'Thăng Long từ Chiếu dời đô': 'Chiếu dời đô',
    'Phòng tuyến Như Nguyệt': 'Trận Như Nguyệt',
    'Nhà Trần trước thử thách Nguyên Mông': 'Nhà Trần',
    'Bạch Đằng 1288': 'Trận Bạch Đằng (1288)',
    'Cải cách thời Hồ Quý Ly': 'Hồ Quý Ly',
    'Lam Sơn từ khởi nghĩa đến thắng lợi': 'Khởi nghĩa Lam Sơn',
    'Bình Ngô đại cáo và ý thức quốc gia': 'Bình Ngô đại cáo',
    'Ngọc Hồi - Đống Đa mùa xuân 1789': 'Trận Ngọc Hồi - Đống Đa',
    'Đà Nẵng 1858 và bước ngoặt cận đại': 'Liên quân Pháp – Tây Ban Nha tấn công Đà Nẵng',
    'Điện Biên Phủ trong lịch sử hiện đại': 'Chiến dịch Điện Biên Phủ'
  };

  for (const article of articles) {
    if (!mapping[article.slug]) {
      let searchKeyword = manualOverrides[article.title] || article.title;
      let img = await getWikipediaImage(searchKeyword);
      if (!img) img = await searchImage(searchKeyword);
      
      if (img) {
        mapping[article.slug] = img;
        console.log(`Mapped ${article.title} -> ${img}`);
      } else {
        console.log(`Still no image for ${article.title}`);
      }
    }
  }
  
  fs.writeFileSync(path.join(__dirname, 'frontend', 'src', 'data', 'articleImages.json'), JSON.stringify(mapping, null, 2), 'utf8');
  console.log("Done part 2");
};

main();
