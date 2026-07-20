const fs = require('fs');
const path = require('path');

async function main() {
    // 1. Login to get token
    const loginRes = await fetch("http://localhost:8080/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "admin01@historyrag.local", password: "Password@123" })
    });
    const loginData = await loginRes.json();
    const token = loginData.data.accessToken || loginData.data.token;
    console.log("Got token.");
    
    // 2. Fetch persons
    const personsRes = await fetch("http://localhost:8080/api/v1/admin/persons?size=500", {
        headers: { "Authorization": `Bearer ${token}` }
    });
    const personsData = await personsRes.json();
    let items = [];
    if (personsData.data && personsData.data.result) items = personsData.data.result;
    else if (personsData.data && Array.isArray(personsData.data)) items = personsData.data;
    else if (personsData.content) items = personsData.content;
    
    const slugs = items.map(i => i.slug).filter(Boolean);
    console.log(`Found ${slugs.length} characters in DB.`);
    
    // 3. Save to a file so we can see
    fs.writeFileSync('slugs.json', JSON.stringify(slugs, null, 2));
}

main().catch(console.error);
