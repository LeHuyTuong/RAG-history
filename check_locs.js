const fs = require('fs');
const path = require('path');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'frontend', 'public', 'api', 'user_locations.json'), 'utf8'));
data.locations.forEach(loc => console.log(loc.name, loc.image));
