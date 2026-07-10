const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'public', 'api', 'user_locations.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

data.locations.forEach(loc => {
    if (loc.slug === 'phu-tho') {
        loc.image = '/images/location/phutho.jpg';
        loc.heroImg = '/images/location/phutho.jpg';
    }
    if (loc.slug === 'co-loa') {
        loc.image = '/images/location/coloa.jpg';
        loc.heroImg = '/images/location/coloa.jpg';
    }
    if (loc.slug === 'me-linh') {
        loc.image = '/images/location/melinh.jpg';
        loc.heroImg = '/images/location/melinh.jpg';
    }
});

fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
console.log("Updated user_locations.json");
