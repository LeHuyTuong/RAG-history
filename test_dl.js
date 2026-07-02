const https = require('https');
const url = 'https://upload.wikimedia.org/wikipedia/commons/c/c9/C%E1%BB%95ng_%C4%91%E1%BB%81n_H%C3%B9ng_%28Ph%C3%BA_Th%E1%BB%8D%29.jpg';
https.get(url, (res) => {
    console.log('Status Code:', res.statusCode);
    if(res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        console.log("Redirect to:", res.headers.location);
    }
}).on('error', (e) => {
    console.error(e);
});
