const https = require('https');
const fs = require('fs');
const path = require('path');

const articles = require('./frontend/public/api/user_articles.json');

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

const main = async () => {
  const mapping = {};
  console.log(`Processing ${articles.length} articles`);
  for (const article of articles) {
    let searchKeyword = article.title
      .replace(/trong ký ức lịch sử|và dấu ấn Âu Lạc|sau năm 179 trước Công nguyên|và khát vọng tự chủ|trong thế kỷ III|và tuyên ngôn độc lập sớm|và nền tự chủ|và công cuộc thống nhất|và cuộc chiến năm 981|từ Chiếu dời đô|trước thử thách Nguyên Mông|thời Hồ Quý Ly|từ khởi nghĩa đến thắng lợi|và ý thức quốc gia|mùa xuân 1789|và bước ngoặt cận đại|trong lịch sử hiện đại/gi, '')
      .replace(/Ngọc Hồi - Đống Đa/gi, 'Trận Ngọc Hồi - Đống Đa')
      .replace(/Lam Sơn/gi, 'Khởi nghĩa Lam Sơn')
      .trim();

    let img = await getWikipediaImage(searchKeyword);
    if (!img) {
      const searchUrl = `https://vi.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchKeyword)}&utf8=&format=json`;
      img = await new Promise((resolve) => {
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
    }
    
    if (img) {
      mapping[article.slug] = img;
      console.log(`Mapped ${article.title} -> ${img}`);
    } else {
      console.log(`No image for ${article.title}`);
    }
  }
  
  fs.writeFileSync(path.join(__dirname, 'frontend', 'src', 'data', 'articleImages.json'), JSON.stringify(mapping, null, 2), 'utf8');
  console.log("Done");
};

main();
