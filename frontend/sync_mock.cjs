const fs = require('fs');
const path = require('path');

const sqlPath = path.resolve(__dirname, '../backend/src/main/resources/db/migration/V2__sample_data.sql');
const sqlContent = fs.readFileSync(sqlPath, 'utf8');

function parseInsert(tableName) {
  const regex = new RegExp(`INSERT INTO ${tableName} \\([\\s\\S]*?\\) VALUES\\s*([\\s\\S]*?);`, 'i');
  const match = sqlContent.match(regex);
  if (!match) return [];

  const valuesStr = match[1];
  const rows = [];
  const rowRegex = /\((.*?)\)/g;
  let rowMatch;
  while ((rowMatch = rowRegex.exec(valuesStr)) !== null) {
    const cols = rowMatch[1].split(/,(?=(?:[^']*'[^']*')*[^']*$)/).map(s => {
      let val = s.trim();
      if (val.startsWith("'") && val.endsWith("'")) {
        val = val.substring(1, val.length - 1);
      }
      if (val === 'NULL') val = null;
      return val;
    });
    rows.push(cols);
  }
  return rows;
}

// 1. Periods
const periodRows = parseInsert('period');
const periods = periodRows.map(cols => {
  const start_year = parseInt(cols[3]);
  const end_year = cols[4] ? parseInt(cols[4]) : null;
  const startStr = start_year < 0 ? `${Math.abs(start_year)} TCN` : start_year;
  const endStr = end_year ? (end_year < 0 ? `${Math.abs(end_year)} TCN` : end_year) : 'Nay';
  return {
    period_id: parseInt(cols[0]),
    name: cols[1],
    slug: cols[2],
    start_year: start_year,
    end_year: end_year,
    description: cols[5],
    range: `${startStr} - ${endStr}`,
    category: cols[1],
    details: [],
    image: "/images/home.png"
  };
});
fs.writeFileSync(path.resolve(__dirname, 'public/api/user_periods.json'), JSON.stringify(periods, null, 2));
if (periods.length > 0) {
  fs.writeFileSync(path.resolve(__dirname, 'public/api/user_period_detail.json'), JSON.stringify(periods[0], null, 2));
}

// 2. Characters
const personRows = parseInsert('person');
const characters = personRows.map((cols, index) => {
  return {
    person_id: parseInt(cols[0]),
    id: parseInt(cols[0]),
    name: cols[1],
    slug: cols[2],
    alias: cols[3],
    birth_date: cols[4],
    death_date: cols[5],
    biography: cols[6],
    description: cols[6],
    years: `${cols[4] ? cols[4].split('-')[0] : '?'} - ${cols[5] ? cols[5].split('-')[0] : '?'}`,
    dynasty: periods[index % periods.length].name,
    dynastyTitle: periods[index % periods.length].name,
    templeName: cols[3] || "Không rõ",
    eraName: "Không rõ",
    reign: "? - ?",
    quote: "Một câu nói nổi tiếng hoặc triết lý sống của nhân vật này.",
    portrait: "/images/home.png",
    steleImg: "/images/home.png",
    milestones: [
      { time: cols[4] ? cols[4].split('-')[0] : "Chưa rõ", title: "Khởi thủy", desc: `${cols[1]} cất tiếng khóc chào đời, mở ra một cuộc đời đầy biến động.`, isSpecial: false },
      { time: "Dấu mốc", title: "Đỉnh cao sự nghiệp", desc: `Những đóng góp to lớn của ${cols[1]} cho tiến trình lịch sử dân tộc.`, isSpecial: true },
      { time: cols[5] ? cols[5].split('-')[0] : "Chưa rõ", title: "Khép lại", desc: `Sự ra đi của ${cols[1]} để lại nhiều di sản vô giá.`, isSpecial: false }
    ],
    relatedFigures: [
      { name: "Nhân vật liên quan 1", role: "Đồng minh / Tri kỷ", img: "/images/home.png" },
      { name: "Nhân vật liên quan 2", role: "Đối trọng / Kẻ thù", img: "/images/home.png" }
    ],
    achievements: [
      "Đóng góp quan trọng vào sự phát triển của quốc gia.",
      "Lãnh đạo hoặc tham gia các sự kiện lịch sử mang tính bước ngoặt.",
      "Để lại di sản văn hóa, tư tưởng hoặc quân sự."
    ],
    image: "/images/home.png"
  };
});
const userChars = {
  periods: ["Tất cả thời kỳ"],
  characters: characters
};
fs.writeFileSync(path.resolve(__dirname, 'public/api/user_characters.json'), JSON.stringify(userChars, null, 2));
if (characters.length > 0) {
  fs.writeFileSync(path.resolve(__dirname, 'public/api/user_character_detail.json'), JSON.stringify(characters[0], null, 2));
}

// 3. Locations
const locationRows = parseInsert('location');
const locations = locationRows.map((cols, index) => {
  return {
    location_id: parseInt(cols[0]),
    name: cols[1],
    slug: cols[2],
    location_type: cols[3],
    latitude: parseFloat(cols[4]),
    longitude: parseFloat(cols[5]),
    description: cols[6],
    type: cols[3],
    period: periods[index % periods.length].name,
    coordinates: [parseFloat(cols[5]), parseFloat(cols[4])],
    x: ((parseFloat(cols[5]) - 102.1) / (109.5 - 102.1)) * 100,
    y: ((23.4 - parseFloat(cols[4])) / (23.4 - 8.5)) * 100,
    importance: [
      "Địa danh đóng vai trò chiến lược trong các cuộc kháng chiến bảo vệ tổ quốc.",
      "Là trung tâm văn hóa, chính trị của khu vực trong nhiều thế kỷ, lưu giữ những giá trị truyền thống cốt lõi."
    ],
    stats: [
      { label: "Năm thành lập", value: cols[4] ? "Thế kỷ " + Math.ceil(Math.abs(parseFloat(cols[4])) / 100) : "TCN" },
      { label: "Quy mô", value: "Đặc biệt" },
      { label: "Bảo tồn", value: "Cấp Quốc gia" }
    ],
    timeline: [
      { year: "Sơ kỳ", title: "Khởi dựng", desc: `Giai đoạn đầu hình thành và phát triển của ${cols[1]}.` },
      { year: "Trung kỳ", title: "Phát triển", desc: `Trở thành một địa điểm quan trọng trong lịch sử.` },
      { year: "Hiện đại", title: "Bảo tồn", desc: `Được công nhận là di tích lịch sử và văn hóa.` }
    ],
    famousCharacters: [
      { name: "Lê Lợi", role: "Anh hùng dân tộc", img: "/images/home.png" },
      { name: "Nguyễn Trãi", role: "Danh nhân văn hóa", img: "/images/home.png" }
    ],
    image: "/images/home.png",
    heroImg: "/images/home.png"
  };
});
const userLocs = {
  types: [...new Set(locations.map(l => l.type))],
  locations: locations
};
fs.writeFileSync(path.resolve(__dirname, 'public/api/user_locations.json'), JSON.stringify(userLocs, null, 2));
if (locations.length > 0) {
  fs.writeFileSync(path.resolve(__dirname, 'public/api/user_location_detail.json'), JSON.stringify(locations[0], null, 2));
}

// 4. Events
const eventRows = parseInsert('event');
const events = eventRows.map(cols => {
  const periodId = parseInt(cols[1]);
  const period = periods.find(p => p.period_id === periodId);
  return {
    event_id: parseInt(cols[0]),
    period_id: periodId,
    name: cols[2],
    slug: cols[3],
    description: cols[4],
    start_year: parseInt(cols[5]),
    end_year: parseInt(cols[6]),
    year: parseInt(cols[5]),
    category: period ? period.name : "Không rõ",
    image: "/images/home.png",
    relatedFigures: [],
    locations: []
  };
});
const userEvents = {
  categories: ["Tất cả"],
  events: events
};
fs.writeFileSync(path.resolve(__dirname, 'public/api/user_events.json'), JSON.stringify(userEvents, null, 2));
if (events.length > 0) {
  fs.writeFileSync(path.resolve(__dirname, 'public/api/user_event_detail.json'), JSON.stringify(events[0], null, 2));
}

// 5. Articles (Posts)
const postRows = parseInsert('post');
const articles = postRows.map((cols, index) => {
  return {
    id: parseInt(cols[0]),
    article_id: parseInt(cols[0]),
    post_id: parseInt(cols[0]),
    title: cols[3],
    slug: cols[4],
    summary: cols[5],
    content: [
      { type: 'paragraph', text: cols[6] },
      { type: 'heading', text: 'Bối cảnh lịch sử' },
      { type: 'paragraph', text: 'Những diễn biến xoay quanh bối cảnh của sự kiện này...' },
      { type: 'blockquote', text: 'Ghi chép từ Đại Việt Sử Ký Toàn Thư.' }
    ],
    thumbnail_url: "/images/home.png",
    image: cols[7] || "/images/home.png",
    status: cols[8],
    published_at: cols[9],
    dynasty: periods[index % periods.length].name,
    readTime: "5 phút đọc",
    author: "Admin",
    publishedDate: cols[9],
    tags: [periods[index % periods.length].name, "Lịch sử"],
    relatedEntities: [
      { title: "Nhân vật liên quan", type: "Nhân vật", icon: "person", link: "/characters" },
      { title: "Di tích liên quan", type: "Di tích", icon: "account_balance", link: "/locations" }
    ],
    featured: index === 0,
    post_tags: [{ tag_name: "Lịch sử" }],
    likes: 0,
    comments: 0
  };
});
const engagementRows = parseInsert('engagement');

// Map comments to articles
articles.forEach(article => {
  article.commentsList = engagementRows
    .filter(cols => cols[4] === 'COMMENT' && cols[6] === 'VISIBLE' && parseInt(cols[2]) === article.id)
    .map(cols => {
      const memberId = parseInt(cols[1]);
      return {
        engagement_id: parseInt(cols[0]),
        member_id: memberId,
        post_id: article.id,
        parent_engagement_id: cols[3] ? parseInt(cols[3]) : null,
        engagement_type: 'COMMENT',
        comment_content: cols[5],
        comment_status: cols[6],
        rating_value: cols[7] ? parseInt(cols[7]) : null,
        created_at: cols[8],
        updated_at: cols[9],
        member_name: `Người dùng ${memberId}`
      };
    });
});

const userProfileHistory = engagementRows
  .filter(cols => cols[4] === 'LIKE' || cols[4] === 'COMMENT')
  .slice(0, 5)
  .map(cols => {
    const postId = parseInt(cols[2]);
    const article = articles.find(a => a.id === postId);
    return {
      title: article ? article.title : "Bài viết không xác định",
      type: "BÀI VIẾT",
      interaction: cols[4] === 'LIKE' ? "Đã thích" : "Đã bình luận",
      date: cols[8] ? cols[8].split(' ')[0] : "Hôm nay",
      img: article ? article.image : "/images/home.png",
      link: `/articles/${postId}`
    };
  });

const userArticles = {
  categories: ["Tất cả"],
  articles: articles
};
// UserPosts expects an array! `setArticles(data)`
fs.writeFileSync(path.resolve(__dirname, 'public/api/user_articles.json'), JSON.stringify(articles, null, 2));

if (articles.length > 0) {
  fs.writeFileSync(path.resolve(__dirname, 'public/api/user_article_detail.json'), JSON.stringify(articles[0], null, 2));
}

fs.writeFileSync(path.resolve(__dirname, 'public/api/user_profile_history.json'), JSON.stringify(userProfileHistory, null, 2));

console.log("Mock data synced successfully.");
