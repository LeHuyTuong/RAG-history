const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const outDir = path.resolve('../frontend/public/images/posts');

const images = {
  "au-lac.jpg": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/B%E1%BA%A3n_%C4%91%E1%BB%93_V%C4%83n_Lang_%26_Nam_C%C6%B0%C6%A1ng.JPG/800px-B%E1%BA%A3n_%C4%91%E1%BB%93_V%C4%83n_Lang_%26_Nam_C%C6%B0%C6%A1ng.JPG",
  "hai-ba-trung.jpg": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Hai_B%C3%A0_Tr%C6%B0ng_%28tranh_%C4%90%C3%B4ng_H%E1%BB%93%29.jpeg/800px-Hai_B%C3%A0_Tr%C6%B0ng_%28tranh_%C4%90%C3%B4ng_H%E1%BB%93%29.jpeg",
  "ba-trieu.jpg": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Ba_trieu_cuoi_voi.jpg/800px-Ba_trieu_cuoi_voi.jpg",
  "van-xuan.jpg": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Map_of_V%E1%BA%A1n_Xu%C3%A2n_Kingdom_during_Early_L%C3%BD_dynasty.png/800px-Map_of_V%E1%BA%A1n_Xu%C3%A2n_Kingdom_during_Early_L%C3%BD_dynasty.png",
  "dinh-bo-linh.jpg": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/VuaDinhTienHoang.jpg/800px-VuaDinhTienHoang.jpg",
  "le-hoan.jpg": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Le_Dai_Hanh.jpg/800px-Le_Dai_Hanh.jpg",
  "lam-son.jpg": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Map_of_the_Lam_S%C6%A1n_uprising_%282%29.png/800px-Map_of_the_Lam_S%C6%A1n_uprising_%282%29.png",
  "binh-ngo-dai-cao.jpg": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/%E5%B9%B3%E5%90%B3%E5%A4%A7%E8%AA%A51.jpg/800px-%E5%B9%B3%E5%90%B3%E5%A4%A7%E8%AA%A51.jpg",
  "bach-dang-938.jpg": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Ng%C3%B4_Quy%E1%BB%81n_%C4%91%E1%BA%A1i_ph%C3%A1_qu%C3%A2n_Nam_H%C3%A1n_tr%C3%AAn_s%C3%B4ng_B%E1%BA%A1ch_%C4%90%E1%BA%B1ng.jpg/800px-Ng%C3%B4_Quy%E1%BB%81n_%C4%91%E1%BA%A1i_ph%C3%A1_qu%C3%A2n_Nam_H%C3%A1n_tr%C3%AAn_s%C3%B4ng_B%E1%BA%A1ch_%C4%90%E1%BA%B1ng.jpg"
};

async function downloadImages() {
  for (const [filename, url] of Object.entries(images)) {
    try {
      console.log(`Downloading ${url} to ${filename}`);
      execSync(`curl.exe -s -L -A "HistoryRAG/1.0 (https://github.com/historyrag; user@historyrag.com)" -o "${path.join(outDir, filename)}" "${url}"`);
      console.log('Downloaded', filename);
      await new Promise(r => setTimeout(r, 2000));
    } catch (e) {
      console.error('Failed to download', filename, e.message);
    }
  }
}

downloadImages();
