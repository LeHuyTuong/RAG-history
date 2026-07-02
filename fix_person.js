const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'frontend', 'src', 'data', 'characterImages.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

data['ba-trieu'] = '/images/person/batrieu.jpg';
data['hai-ba-trung'] = '/images/person/haibatrung.jpg';
data['trung-nhi'] = '/images/person/haibatrung.jpg';
data['trung-trac'] = '/images/person/haibatrung.jpg';
data['ly-bi'] = '/images/person/lybi.jpg';
data['ly-nam-de'] = '/images/person/lybi.jpg';
data['mai-thuc-loan'] = '/images/person/maithucloan.jpg';
data['mai-hac-de'] = '/images/person/maithucloan.jpg';
data['quang-trung'] = '/images/person/quangtrung.jpg';
data['nguyen-hue'] = '/images/person/quangtrung.jpg';

fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
