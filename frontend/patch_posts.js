import fs from 'fs';

const path = './src/pages/user/articles/UserPosts.jsx';
if (fs.existsSync(path)) {
  let content = fs.readFileSync(path, 'utf8');

  // Add optional chaining
  content = content.replace(
    /featuredArt\.readTime\.toUpperCase\(\)/g,
    "(featuredArt.readTime || '').toUpperCase()"
  );

  content = content.replace(
    /a\.title \|\| ""/g,
    "(a.title || '')"
  );
  
  content = content.replace(
    /a\.summary \|\| ""/g,
    "(a.summary || '')"
  );
  
  content = content.replace(
    /a\.dynasty \|\| ""/g,
    "(a.dynasty || '')"
  );

  // Maybe 'art.slug' or something is undefined?
  // Let's just make sure we are not crashing.
  
  fs.writeFileSync(path, content);
  console.log("Successfully patched UserPosts.jsx");
} else {
  console.log("File not found:", path);
}
