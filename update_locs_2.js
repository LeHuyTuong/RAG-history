const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'public', 'api', 'user_locations.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const updates = {
    'thien-truong': '/images/location/thientruong.jpg',
    'tay-do': '/images/location/taydo.jpg'
};

data.locations.forEach(loc => {
    if (updates[loc.slug]) {
        loc.image = updates[loc.slug];
        loc.heroImg = updates[loc.slug];
    }
});

fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
console.log("Updated user_locations.json for 2 new locations.");
