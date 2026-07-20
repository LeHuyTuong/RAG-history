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
    console.log("Reading characters from V2__sample_data.sql...");
    const sqlPath = path.join(__dirname, 'backend', 'src', 'main', 'resources', 'db', 'migration', 'V2__sample_data.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    const slugs = [];
    // INSERT INTO person (name, alias, slug, biography) VALUES 
    // ('Vua Hùng', 'Các vua Hùng', 'hung-vuong', ...
    const regex = /INSERT INTO person.*?(?:\n.*?VALUES\s*|\()(.*?)\);/gs;
    let match;
    while ((match = regex.exec(sql)) !== null) {
        const valuesBlock = match[1];
        // Split by '), (' or similar, but simplified: just look for all strings that look like a slug
        const slugRegex = /'([a-z0-9-]+)'/g;
        let slugMatch;
        while ((slugMatch = slugRegex.exec(valuesBlock)) !== null) {
            const potentialSlug = slugMatch[1];
            if (potentialSlug.length > 3 && !potentialSlug.match(/^[0-9]+$/)) {
                slugs.push(potentialSlug);
            }
        }
    }
    
    // De-duplicate
    const uniqueSlugs = [...new Set(slugs)];
    console.log(`Found ${uniqueSlugs.length} potential slugs.`);
    
    const mapping = {};
    const promises = uniqueSlugs.map(async slug => {
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
