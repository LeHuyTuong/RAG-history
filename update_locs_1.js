const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'public', 'api', 'user_locations.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const updates = {
    'song-nhu-nguyet': '/images/location/songnhunguyet.jpg'
};

data.locations.forEach(loc => {
    if (updates[loc.slug]) {
        loc.image = updates[loc.slug];
        loc.heroImg = updates[loc.slug];
    }
});

fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
console.log("Updated user_locations.json for Song Nhu Nguyet.");
