const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'src', 'data', 'characterImages.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

data['trung-trac'] = '/images/haibatrung.jpg';
data['trung-nhi'] = '/images/haibatrung.jpg';

fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
console.log("Updated characterImages.json");
