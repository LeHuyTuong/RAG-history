const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'public', 'api', 'user_locations.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const updates = {
    'da-nang': '/images/location/danang.jpg',
    'dien-bien-phu': '/images/location/dienbienphu.jpg',
    'dong-kinh': '/images/location/dongkinh.jpg',
    'lam-son': '/images/location/lamson.jpg'
};

data.locations.forEach(loc => {
    if (updates[loc.slug]) {
        loc.image = updates[loc.slug];
        loc.heroImg = updates[loc.slug];
    }
});

fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
console.log("Updated user_locations.json for 4 new locations.");
