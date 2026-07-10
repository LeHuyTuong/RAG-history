const fs = require('fs');
const path = require('path');

async function fetchImageForSlug(slug) {
    const url = `https://nguoikesu.com/nhan-vat/${slug}`;
    try {
        const res = await fetch(url);
        if (res.status === 200) {
            const text = await res.text();
            
            let match = text.match(/<img src="(\/images\/wiki\/[^"]+)" itemprop="thumbnail"/);
            if (match) return [slug, "https://nguoikesu.com" + match[1]];
            
            match = text.match(/<div class="item-content">[\s\S]*?<img.*?src="(\/images\/[^"]+)"/);
            if (match) return [slug, "https://nguoikesu.com" + match[1]];
            
            match = text.match(/<img src="(\/images\/[^"]+)"/);
            if (match) return [slug, "https://nguoikesu.com" + match[1]];
        }
    } catch (e) {}
    return [slug, null];
}

async function main() {
    console.log("Reading characters from local JSON...");
    const dataPath = path.join(__dirname, 'frontend', 'public', 'api', 'user_characters.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    let items = data.characters || [];
    const slugs = items.map(i => i.slug).filter(Boolean);
    console.log(`Found ${slugs.length} characters.`);
    
    const mapping = {};
    const promises = slugs.map(async slug => {
        const [s, url] = await fetchImageForSlug(slug);
        if (url) {
            mapping[s] = url;
            console.log("Found: " + s);
        }
    });
    
    await Promise.all(promises);
    
    const dir = path.join(__dirname, 'frontend', 'src', 'data');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    fs.writeFileSync(path.join(dir, 'characterImages.json'), JSON.stringify(mapping, null, 2));
    console.log("Saved to frontend/src/data/characterImages.json");
}

main();
