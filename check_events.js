const fs = require('fs');
const path = require('path');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'frontend', 'public', 'api', 'user_events.json'), 'utf8'));
data.events.forEach(e => console.log(e.name, e.slug));
