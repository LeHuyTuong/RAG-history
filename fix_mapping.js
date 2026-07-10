const fs = require('fs');
const path = require('path');

const articles = require('./frontend/public/api/user_articles.json');
const mappingFile = path.join(__dirname, 'frontend', 'src', 'data', 'articleImages.json');
let mapping = JSON.parse(fs.readFileSync(mappingFile, 'utf8'));

for (const article of articles) {
  if (!mapping[article.slug]) {
    mapping[article.slug] = 'https://upload.wikimedia.org/wikipedia/commons/4/48/Ngoc_Lu.jpg';
  }
}

fs.writeFileSync(mappingFile, JSON.stringify(mapping, null, 2), 'utf8');
