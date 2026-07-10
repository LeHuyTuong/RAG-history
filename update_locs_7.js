const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'public', 'api', 'user_locations.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const updates = {
    'nui-nua': '/images/location/nuinua.jpg',
    'long-bien': '/images/location/longbien.jpg',
    'hoan-chau': '/images/location/hoanchau.jpg',
    'song-bach-dang': '/images/location/songbachdang.jpg',
    'hoa-lu': '/images/location/hoalu.jpg',
    'thang-long': '/images/location/thanglong.jpg',
    'dong-bo-dau': '/images/location/dongbodau.jpg'
};

data.locations.forEach(loc => {
    if (updates[loc.slug]) {
        loc.image = updates[loc.slug];
        loc.heroImg = updates[loc.slug];
    }
});

fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
console.log("Updated user_locations.json for 7 new locations.");
