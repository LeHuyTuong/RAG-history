const fs = require('fs');
const path = require('path');
const https = require('https');

function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

async function scrapePage(start) {
    const url = `https://nguoikesu.com/nhan-vat?start=${start}`;
    try {
        const html = await fetchUrl(url);
        const mapping = {};
        
        // Match blocks containing the image and the link
        const itemRegex = /<img src="([^"]+)" itemprop="thumbnail"[\s\S]*?<a href="\/nhan-vat\/([^"]+)"/g;
        let match;
        while ((match = itemRegex.exec(html)) !== null) {
            let imgUrl = match[1];
            if (imgUrl.startsWith('/')) imgUrl = 'https://nguoikesu.com' + imgUrl;
            let slug = match[2];
            mapping[slug] = imgUrl;
        }
        return mapping;
    } catch (e) {
        console.error(`Error fetching page start=${start}`, e);
        return {};
    }
}

async function main() {
    console.log("Starting scrape of nguoikesu.com/nhan-vat ...");
    let allMappings = {};
    
    // We have 291 pages, so start goes from 0 to 1450 step 5
    const starts = [];
    for (let i = 0; i <= 1450; i += 5) {
        starts.push(i);
    }
    
    // Fetch in batches of 30 to not overwhelm the server
    const batchSize = 30;
    for (let i = 0; i < starts.length; i += batchSize) {
        const batch = starts.slice(i, i + batchSize);
        console.log(`Fetching batch ${i/batchSize + 1} / ${Math.ceil(starts.length/batchSize)}...`);
        const results = await Promise.all(batch.map(start => scrapePage(start)));
        for (const res of results) {
            Object.assign(allMappings, res);
        }
    }
    
    const count = Object.keys(allMappings).length;
    console.log(`Finished scraping! Found ${count} character images.`);
    
    const dir = path.join(__dirname, 'frontend', 'src', 'data');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    fs.writeFileSync(path.join(dir, 'characterImages.json'), JSON.stringify(allMappings, null, 2));
    console.log("Saved mapping to frontend/src/data/characterImages.json");
}

main();
