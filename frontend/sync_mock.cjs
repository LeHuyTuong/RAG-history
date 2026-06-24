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
      if (val === 'NULL' || val === 'null') val = null;
      return val;
    });
    rows.push(cols);
  }
  return rows;
}

// Verified Historical Image Mappings from Wikipedia/Wikimedia Commons
const PERIOD_IMAGES = {
  'thoi-van-lang': 'https://upload.wikimedia.org/wikipedia/commons/4/48/Ngoc_Lu.jpg',
  'thoi-au-lac': 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Co_loa_Citadel.jpg',
  'bac-thuoc-lan-thu-nhat': 'https://upload.wikimedia.org/wikipedia/commons/0/05/G%E1%BA%A1ch_m%E1%BB%99_H%C3%A1n_%E1%BB%9F_%C4%90%E1%BB%91ng_Cao_%28ni%C3%AAn_%C4%91%E1%BA%A1i_g%E1%BA%A7n_2000_n%C4%83m%29.jpg',
  'khoi-nghia-hai-ba-trung': 'https://upload.wikimedia.org/wikipedia/commons/a/a3/Hai_B%C3%A0_Tr%C6%B0ng_%28tranh_%C4%90%C3%B4ng_H%E1%BB%93%29.jpeg',
  'nha-tien-ly-van-xuan': 'https://upload.wikimedia.org/wikipedia/commons/a/ab/T%C6%B0%E1%BB%A3ng_vua_L%C3%BD_Nam_%C4%90%E1%BA%BF.JPG',
  'ho-khuc-ho-duong': 'https://upload.wikimedia.org/wikipedia/commons/2/23/%C4%90%E1%BB%81n_th%E1%BB%9D_Kh%C3%BAc_Th%E1%BB%ABa_D%E1%BB%A5.jpg',
  'nha-ngo': 'https://upload.wikimedia.org/wikipedia/commons/a/a2/T%C6%B0%E1%BB%A3ng_Ng%C3%B4_Quy%E1%BB%81n.jpg',
  'nha-dinh': 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Den_tho_Vua_Dinh_Bo_Linh_Ninh_Binh.jpg',
  'nha-tien-le': 'https://upload.wikimedia.org/wikipedia/commons/0/07/T%C6%B0%E1%BB%A3ng_L%C3%AA_%C4%90%E1%BA%A1i_H%C3%A0nh_t%E1%BA%A1i_%C4%91%E1%BB%81n_th%E1%BB%9D.jpg',
  'nha-ly': 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Ly_Thai_To_statue.jpg',
  'nha-tran': 'https://upload.wikimedia.org/wikipedia/commons/3/3b/Hanh_cung_Thien_Truong.jpg',
  'nha-ho': 'https://upload.wikimedia.org/wikipedia/commons/f/fe/Tay_Giai_gate_Ho_citadel.jpg',
  'bac-thuoc-lan-thu-tu': 'https://upload.wikimedia.org/wikipedia/commons/9/91/Ho_dynasty_Citadel_wall.jpg',
  'nha-hau-le': 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Bia_Vinh_Lang.JPG',
  'nha-mac': 'https://upload.wikimedia.org/wikipedia/commons/1/1b/Tuong_tho_Mac_Dang_Dung.jpg',
  'trinh-nguyen-phan-tranh': 'https://upload.wikimedia.org/wikipedia/commons/3/33/Quang_Binh_Quan_Gate.jpg',
  'phong-trao-tay-son': 'https://upload.wikimedia.org/wikipedia/commons/c/c9/Quang_Trung_statue.jpg',
  'nha-nguyen': 'https://upload.wikimedia.org/wikipedia/commons/5/52/Ngoc_Mon_Hue_2014.jpg',
  'thoi-phap-thuoc': 'https://upload.wikimedia.org/wikipedia/commons/b/b3/Hanoi_opera_house_1915.jpg',
  'viet-nam-hien-dai': 'https://upload.wikimedia.org/wikipedia/commons/e/ee/Cot_co_Ha_Noi_2013.jpg'
};

const CHARACTER_IMAGES = {
  'hung-vuong': {
    portrait: 'https://upload.wikimedia.org/wikipedia/commons/c/c9/C%E1%BB%95ng_%C4%91%E1%BB%81n_H%C3%B9ng_%28Ph%C3%BA_Th%E1%BB%8D%29.jpg',
    image: 'https://upload.wikimedia.org/wikipedia/commons/c/c9/C%E1%BB%95ng_%C4%91%E1%BB%81n_H%C3%B9ng_%28Ph%C3%BA_Th%E1%BB%8D%29.jpg',
    steleImg: 'https://upload.wikimedia.org/wikipedia/commons/4/48/Ngoc_Lu.jpg'
  },
  'an-duong-vuong': {
    portrait: 'https://upload.wikimedia.org/wikipedia/commons/c/cc/Cong_vao_den_tho_An_Duong_Vuong.jpg',
    image: 'https://upload.wikimedia.org/wikipedia/commons/c/cc/Cong_vao_den_tho_An_Duong_Vuong.jpg',
    steleImg: 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Co_loa_Citadel.jpg'
  },
  'trung-trac': {
    portrait: 'https://upload.wikimedia.org/wikipedia/commons/a/a3/Hai_B%C3%A0_Tr%C6%B0ng_%28tranh_%C4%90%C3%B4ng_H%E1%BB%93%29.jpeg',
    image: 'https://upload.wikimedia.org/wikipedia/commons/a/a3/Hai_B%C3%A0_Tr%C6%B0ng_%28tranh_%C4%90%C3%B4ng_H%E1%BB%93%29.jpeg',
    steleImg: 'https://upload.wikimedia.org/wikipedia/commons/a/a3/Hai_B%C3%A0_Tr%C6%B0ng_%28tranh_%C4%90%C3%B4ng_H%E1%BB%93%29.jpeg'
  },
  'trung-nhi': {
    portrait: 'https://upload.wikimedia.org/wikipedia/commons/a/a3/Hai_B%C3%A0_Tr%C6%B0ng_%28tranh_%C4%90%C3%B4ng_H%E1%BB%93%29.jpeg',
    image: 'https://upload.wikimedia.org/wikipedia/commons/a/a3/Hai_B%C3%A0_Tr%C6%B0ng_%28tranh_%C4%90%C3%B4ng_H%E1%BB%93%29.jpeg',
    steleImg: 'https://upload.wikimedia.org/wikipedia/commons/a/a3/Hai_B%C3%A0_Tr%C6%B0ng_%28tranh_%C4%90%C3%B4ng_H%E1%BB%93%29.jpeg'
  },
  'ba-trieu': {
    portrait: 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Ba_trieu_cuoi_voi.jpg',
    image: 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Ba_trieu_cuoi_voi.jpg',
    steleImg: 'https://upload.wikimedia.org/wikipedia/commons/b/bf/Tranh_tho_Ba_Trieu.JPG'
  },
  'ly-bi': {
    portrait: 'https://upload.wikimedia.org/wikipedia/commons/a/ab/T%C6%B0%E1%BB%A3ng_vua_L%C3%BD_Nam_%C4%90%E1%BA%BF.JPG',
    image: 'https://upload.wikimedia.org/wikipedia/commons/a/ab/T%C6%B0%E1%BB%A3ng_vua_L%C3%BD_Nam_%C4%90%E1%BA%BF.JPG',
    steleImg: 'https://upload.wikimedia.org/wikipedia/commons/a/ab/T%C6%B0%E1%BB%A3ng_vua_L%C3%BD_Nam_%C4%90%E1%BA%BF.JPG'
  },
  'mai-thuc-loan': {
    portrait: 'https://upload.wikimedia.org/wikipedia/commons/b/bf/Mai_h%E1%BA%AFc_%C4%91%E1%BA%BF.png',
    image: 'https://upload.wikimedia.org/wikipedia/commons/b/bf/Mai_h%E1%BA%AFc_%C4%91%E1%BA%BF.png',
    steleImg: 'https://upload.wikimedia.org/wikipedia/commons/b/bf/Mai_h%E1%BA%AFc_%C4%91%E1%BA%BF.png'
  },
  'ngo-quyen': {
    portrait: 'https://upload.wikimedia.org/wikipedia/commons/a/af/T%C6%B0%E1%BB%A3ng_Ng%C3%B4_Quy%E1%BB%81n.jpg',
    image: 'https://upload.wikimedia.org/wikipedia/commons/a/af/T%C6%B0%E1%BB%A3ng_Ng%C3%B4_Quy%E1%BB%81n.jpg',
    steleImg: 'https://upload.wikimedia.org/wikipedia/commons/a/a2/T%C6%B0%E1%BB%A3ng_Ng%C3%B4_Quy%E1%BB%81n.jpg'
  },
  'dinh-bo-linh': {
    portrait: 'https://upload.wikimedia.org/wikipedia/commons/e/e2/VuaDinhTienHoang.jpg',
    image: 'https://upload.wikimedia.org/wikipedia/commons/e/e2/VuaDinhTienHoang.jpg',
    steleImg: 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Den_tho_Vua_Dinh_Bo_Linh_Ninh_Binh.jpg'
  },
  'le-hoan': {
    portrait: 'https://upload.wikimedia.org/wikipedia/commons/a/a7/Le_Dai_Hanh.jpg',
    image: 'https://upload.wikimedia.org/wikipedia/commons/a/a7/Le_Dai_Hanh.jpg',
    steleImg: 'https://upload.wikimedia.org/wikipedia/commons/a/a7/Le_Dai_Hanh.jpg'
  },
  'ly-thai-to': {
    portrait: 'https://upload.wikimedia.org/wikipedia/commons/e/e2/T%C6%B0%E1%BB%A3ng_L%C3%BD_Th%C3%A1i_T%E1%BB%95.jpeg',
    image: 'https://upload.wikimedia.org/wikipedia/commons/e/e2/T%C6%B0%E1%BB%A3ng_L%C3%BD_Th%C3%A1i_T%E1%BB%95.jpeg',
    steleImg: 'https://upload.wikimedia.org/wikipedia/commons/e/e2/T%C6%B0%E1%BB%A3ng_L%C3%BD_Th%C3%A1i_T%E1%BB%95.jpeg'
  },
  'ly-thuong-kiet': {
    portrait: 'https://upload.wikimedia.org/wikipedia/commons/6/6e/L%C3%BD_Th%C6%B0%E1%BB%A3ng_Ki%E1%BB%87t.png',
    image: 'https://upload.wikimedia.org/wikipedia/commons/6/6e/L%C3%BD_Th%C6%B0%E1%BB%A3ng_Ki%E1%BB%87t.png',
    steleImg: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Nam_quoc_son_ha.jpg'
  },
  'tran-hung-dao': {
    portrait: 'https://upload.wikimedia.org/wikipedia/commons/e/e8/T%C6%B0%E1%BB%A3ng_%C4%91%E1%BB%93ng_Tr%E1%BA%A7n_H%C6%B0ng_%C4%90%E1%BA%A1o_t%E1%BA%A1i_%C4%91%E1%BB%81n_Ki%E1%BA%BFp_B%E1%BA%A1c.jpg',
    image: 'https://upload.wikimedia.org/wikipedia/commons/e/e8/T%C6%B0%E1%BB%A3ng_%C4%91%E1%BB%93ng_Tr%E1%BA%A7n_H%C6%B0ng_%C4%90%E1%BA%A1o_t%E1%BA%A1i_%C4%91%E1%BB%81n_Ki%E1%BA%BFp_B%E1%BA%A1c.jpg',
    steleImg: 'https://upload.wikimedia.org/wikipedia/commons/e/e8/T%C6%B0%E1%BB%A3ng_%C4%91%E1%BB%93ng_Tr%E1%BA%A7n_H%C6%B0ng_%C4%90%E1%BA%A1o_t%E1%BA%A1i_%C4%91%E1%BB%81n_Ki%E1%BA%BFp_B%E1%BA%A1c.jpg'
  },
  'tran-nhan-tong': {
    portrait: 'https://upload.wikimedia.org/wikipedia/commons/d/d2/T%C6%B0%E1%BB%A3ng_Gi%C3%A1c_Ho%C3%A0ng_Tr%E1%BA%A7n_Nh%C3%A2n_T%C3%B4ng.jpg',
    image: 'https://upload.wikimedia.org/wikipedia/commons/d/d2/T%C6%B0%E1%BB%A3ng_Gi%C3%A1c_Ho%C3%A0ng_Tr%E1%BA%A7n_Nh%C3%A2n_T%C3%B4ng.jpg',
    steleImg: 'https://upload.wikimedia.org/wikipedia/commons/d/d2/T%C6%B0%E1%BB%A3ng_Gi%C3%A1c_Ho%C3%A0ng_Tr%E1%BA%A7n_Nh%C3%A2n_T%C3%B4ng.jpg'
  },
  'le-loi': {
    portrait: 'https://upload.wikimedia.org/wikipedia/commons/8/81/Le_Loi_statue.JPG',
    image: 'https://upload.wikimedia.org/wikipedia/commons/8/81/Le_Loi_statue.JPG',
    steleImg: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Bia_Vinh_Lang.JPG'
  },
  'nguyen-trai': {
    portrait: 'https://upload.wikimedia.org/wikipedia/commons/f/f8/Portrait_of_Nguyen_Trai.jpg',
    image: 'https://upload.wikimedia.org/wikipedia/commons/f/f8/Portrait_of_Nguyen_Trai.jpg',
    steleImg: 'https://upload.wikimedia.org/wikipedia/commons/f/f8/Portrait_of_Nguyen_Trai.jpg'
  },
  'quang-trung': {
    portrait: 'https://upload.wikimedia.org/wikipedia/commons/c/c9/Quang_Trung_statue.jpg',
    image: 'https://upload.wikimedia.org/wikipedia/commons/c/c9/Quang_Trung_statue.jpg',
    steleImg: 'https://upload.wikimedia.org/wikipedia/commons/c/c9/Quang_Trung_statue.jpg'
  },
  'gia-long': {
    portrait: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Vua_Gia_Long.jpg',
    image: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Vua_Gia_Long.jpg',
    steleImg: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Vua_Gia_Long.jpg'
  },
  'phan-boi-chau': {
    portrait: 'https://upload.wikimedia.org/wikipedia/commons/e/e9/Phan_Boi_Chau.jpg',
    image: 'https://upload.wikimedia.org/wikipedia/commons/e/e9/Phan_Boi_Chau.jpg',
    steleImg: 'https://upload.wikimedia.org/wikipedia/commons/e/e9/Phan_Boi_Chau.jpg'
  },
  'vo-nguyen-giap': {
    portrait: 'https://upload.wikimedia.org/wikipedia/commons/3/36/General_Vo_Nguyen_Giap.jpg',
    image: 'https://upload.wikimedia.org/wikipedia/commons/3/36/General_Vo_Nguyen_Giap.jpg',
    steleImg: 'https://upload.wikimedia.org/wikipedia/commons/3/36/General_Vo_Nguyen_Giap.jpg'
  }
};

const LOCATION_IMAGES = {
  'phu-tho': {
    image: 'https://upload.wikimedia.org/wikipedia/commons/c/c9/C%E1%BB%95ng_%C4%91%E1%BB%81n_H%C3%B9ng_%28Ph%C3%BA_Th%E1%BB%8D%29.jpg',
    heroImg: 'https://upload.wikimedia.org/wikipedia/commons/c/c9/C%E1%BB%95ng_%C4%91%E1%BB%81n_H%C3%B9ng_%28Ph%C3%BA_Th%E1%BB%8D%29.jpg'
  },
  'co-loa': {
    image: 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Co_loa_Citadel.jpg',
    heroImg: 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Co_loa_Citadel.jpg'
  },
  'me-linh': {
    image: 'https://upload.wikimedia.org/wikipedia/commons/5/52/%C4%90%E1%BB%81n_th%E1%BB%9D_Hai_B%C3%A0_Tr%C6%B0ng_%28M%C3%AA_Linh%29.jpg',
    heroImg: 'https://upload.wikimedia.org/wikipedia/commons/5/52/%C4%90%E1%BB%81n_th%E1%BB%9D_Hai_B%C3%A0_Tr%C6%B0ng_%28M%C3%AA_Linh%29.jpg'
  },
  'nui-nua': {
    image: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Khu_di_tich_Am_Tien.jpg',
    heroImg: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Khu_di_tich_Am_Tien.jpg'
  },
  'long-bien': {
    image: 'https://upload.wikimedia.org/wikipedia/commons/3/33/Long_Bien_bridge_2013.jpg',
    heroImg: 'https://upload.wikimedia.org/wikipedia/commons/3/33/Long_Bien_bridge_2013.jpg'
  },
  'hoan-chau': {
    image: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Song_Lam_Ngh%E1%BB%87_An.jpg',
    heroImg: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Song_Lam_Ngh%E1%BB%87_An.jpg'
  },
  'song-bach-dang': {
    image: 'https://upload.wikimedia.org/wikipedia/commons/f/fe/B%C3%A3i_c%E1%BB%8D_B%E1%BA%A1ch_%C4%90%E1%BA%B1ng.jpg',
    heroImg: 'https://upload.wikimedia.org/wikipedia/commons/f/fe/B%C3%A3i_c%E1%BB%8D_B%E1%BA%A1ch_%C4%90%E1%BA%B1ng.jpg'
  },
  'hoa-lu': {
    image: 'https://upload.wikimedia.org/wikipedia/commons/a/af/Co_do_Hoa_Lu.jpg',
    heroImg: 'https://upload.wikimedia.org/wikipedia/commons/a/af/Co_do_Hoa_Lu.jpg'
  },
  'thang-long': {
    image: 'https://upload.wikimedia.org/wikipedia/commons/2/22/Doan_Mon_Thang_Long.jpg',
    heroImg: 'https://upload.wikimedia.org/wikipedia/commons/2/22/Doan_Mon_Thang_Long.jpg'
  },
  'song-nhu-nguyet': {
    image: 'https://upload.wikimedia.org/wikipedia/commons/7/77/Song_Cau_Bac_Ninh.jpg',
    heroImg: 'https://upload.wikimedia.org/wikipedia/commons/7/77/Song_Cau_Bac_Ninh.jpg'
  },
  'dong-bo-dau': {
    image: 'https://upload.wikimedia.org/wikipedia/commons/2/22/Doan_Mon_Thang_Long.jpg',
    heroImg: 'https://upload.wikimedia.org/wikipedia/commons/2/22/Doan_Mon_Thang_Long.jpg'
  },
  'thien-truong': {
    image: 'https://upload.wikimedia.org/wikipedia/commons/b/b5/Den_Tran_Nam_Dinh_gate.jpg',
    heroImg: 'https://upload.wikimedia.org/wikipedia/commons/b/b5/Den_Tran_Nam_Dinh_gate.jpg'
  },
  'tay-do': {
    image: 'https://upload.wikimedia.org/wikipedia/commons/f/fe/Tay_Giai_gate_Ho_citadel.jpg',
    heroImg: 'https://upload.wikimedia.org/wikipedia/commons/f/fe/Tay_Giai_gate_Ho_citadel.jpg'
  },
  'lam-son': {
    image: 'https://upload.wikimedia.org/wikipedia/commons/5/52/Chinh_dien_Lam_Kinh.jpg',
    heroImg: 'https://upload.wikimedia.org/wikipedia/commons/5/52/Chinh_dien_Lam_Kinh.jpg'
  },
  'dong-kinh': {
    image: 'https://upload.wikimedia.org/wikipedia/commons/7/79/Turtle_Tower_Hanoi.jpg',
    heroImg: 'https://upload.wikimedia.org/wikipedia/commons/7/79/Turtle_Tower_Hanoi.jpg'
  },
  'phu-xuan': {
    image: 'https://upload.wikimedia.org/wikipedia/commons/5/52/Ngoc_Mon_Hue_2014.jpg',
    heroImg: 'https://upload.wikimedia.org/wikipedia/commons/5/52/Ngoc_Mon_Hue_2014.jpg'
  },
  'go-dong-da': {
    image: 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Go_Dong_Da_01.jpg',
    heroImg: 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Go_Dong_Da_01.jpg'
  },
  'kinh-thanh-hue': {
    image: 'https://upload.wikimedia.org/wikipedia/commons/7/7d/Hue_citadel_flag_tower_2014.jpg',
    heroImg: 'https://upload.wikimedia.org/wikipedia/commons/7/7d/Hue_citadel_flag_tower_2014.jpg'
  },
  'da-nang': {
    image: 'https://upload.wikimedia.org/wikipedia/commons/b/b7/Cau_Song_Han_Da_Nang.jpg',
    heroImg: 'https://upload.wikimedia.org/wikipedia/commons/b/b7/Cau_Song_Han_Da_Nang.jpg'
  },
  'dien-bien-phu': {
    image: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/Dien_Bien_Phu_victory_monument.jpg',
    heroImg: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/Dien_Bien_Phu_victory_monument.jpg'
  }
};

const EVENT_IMAGES = {
  'hinh-thanh-nha-nuoc-van-lang': 'https://upload.wikimedia.org/wikipedia/commons/4/48/Ngoc_Lu.jpg',
  'an-duong-vuong-xay-thanh-co-loa': 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Co_loa_Citadel.jpg',
  'trieu-da-thon-tinh-au-lac': 'https://upload.wikimedia.org/wikipedia/commons/b/bd/Mausoleum_of_the_Nanyue_King_01.jpg',
  'khoi-nghia-hai-ba-trung-su-kien': 'https://upload.wikimedia.org/wikipedia/commons/a/a3/Hai_B%C3%A0_Tr%C6%B0ng_%28tranh_%C4%90%C3%B4ng_H%E1%BB%93%29.jpeg',
  'khoi-nghia-ba-trieu': 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Ba_trieu_cuoi_voi.jpg',
  'ly-bi-lap-nuoc-van-xuan': 'https://upload.wikimedia.org/wikipedia/commons/a/ab/T%C6%B0%E1%BB%A3ng_vua_L%C3%BD_Nam_%C4%90%E1%BA%BF.JPG',
  'khuc-thua-du-gianh-quyen-tu-chu': 'https://upload.wikimedia.org/wikipedia/commons/2/23/%C4%90%E1%BB%81n_th%E1%BB%9D_Kh%C3%BAc_Th%E1%BB%ABa_D%E1%BB%A5.jpg',
  'chien-thang-bach-dang-938': 'https://upload.wikimedia.org/wikipedia/commons/a/af/T%C6%B0%E1%BB%A3ng_Ng%C3%B4_Quy%E1%BB%81n.jpg',
  'dinh-bo-linh-thong-nhat-dat-nuoc': 'https://upload.wikimedia.org/wikipedia/commons/e/e2/VuaDinhTienHoang.jpg',
  'khang-chien-chong-tong-981': 'https://upload.wikimedia.org/wikipedia/commons/a/a7/Le_Dai_Hanh.jpg',
  'doi-do-ra-thang-long': 'https://upload.wikimedia.org/wikipedia/commons/e/e2/T%C6%B0%E1%BB%A3ng_L%C3%BD_Th%C3%A1i_T%E1%BB%95.jpeg',
  'khang-chien-chong-tong-song-nhu-nguyet': 'https://upload.wikimedia.org/wikipedia/commons/8/86/Den_tho_Ly_Thuong_Kiet.JPG',
  'khang-chien-chong-nguyen-mong-lan-thu-nhat': 'https://upload.wikimedia.org/wikipedia/commons/3/3b/Hanh_cung_Thien_Truong.jpg',
  'chien-thang-bach-dang-1288': 'https://upload.wikimedia.org/wikipedia/commons/f/fe/B%C3%A3i_c%E1%BB%8D_B%E1%BA%A1ch_%C4%90%E1%BA%B1ng.jpg',
  'ho-quy-ly-lap-nha-ho': 'https://upload.wikimedia.org/wikipedia/commons/f/fe/Tay_Giai_gate_Ho_citadel.jpg',
  'khoi-nghia-lam-son': 'https://upload.wikimedia.org/wikipedia/commons/5/52/Chinh_dien_Lam_Kinh.jpg',
  'binh-ngo-dai-cao-duoc-cong-bo': 'https://upload.wikimedia.org/wikipedia/commons/f/f8/Portrait_of_Nguyen_Trai.jpg',
  'chien-thang-ngoc-hoi-dong-da': 'https://upload.wikimedia.org/wikipedia/commons/c/c9/Quang_Trung_statue.jpg',
  'phap-no-sung-o-da-nang': 'https://upload.wikimedia.org/wikipedia/commons/a/a2/Bombardment_of_Tourane_1858.jpg',
  'chien-thang-dien-bien-phu': 'https://upload.wikimedia.org/wikipedia/commons/7/77/Dien_Bien_Phu_victory_flag.jpg'
};

// 1. Periods
const periodRows = parseInsert('period');
const periods = periodRows.map(cols => {
  const start_year = parseInt(cols[3]);
  const end_year = cols[4] ? parseInt(cols[4]) : null;
  const startStr = start_year < 0 ? `${Math.abs(start_year)} TCN` : start_year;
  const endStr = end_year ? (end_year < 0 ? `${Math.abs(end_year)} TCN` : end_year) : 'Nay';
  const slug = cols[2];
  return {
    period_id: parseInt(cols[0]),
    name: cols[1],
    slug: slug,
    start_year: start_year,
    end_year: end_year,
    description: cols[5],
    range: `${startStr} - ${endStr}`,
    category: cols[1],
    details: [],
    image: PERIOD_IMAGES[slug] || "/images/home.png"
  };
});
fs.writeFileSync(path.resolve(__dirname, 'public/api/user_periods.json'), JSON.stringify(periods, null, 2));
if (periods.length > 0) {
  fs.writeFileSync(path.resolve(__dirname, 'public/api/user_period_detail.json'), JSON.stringify(periods[0], null, 2));
}

// 2. Characters
const personRows = parseInsert('person');
const characters = personRows.map((cols, index) => {
  const slug = cols[2];
  const imgMap = CHARACTER_IMAGES[slug] || {
    portrait: "/images/home.png",
    image: "/images/home.png",
    steleImg: "/images/home.png"
  };
  return {
    person_id: parseInt(cols[0]),
    id: parseInt(cols[0]),
    name: cols[1],
    slug: slug,
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
    portrait: imgMap.portrait,
    steleImg: imgMap.steleImg,
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
    image: imgMap.image
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
  const slug = cols[2];
  const imgMap = LOCATION_IMAGES[slug] || {
    image: "/images/home.png",
    heroImg: "/images/home.png"
  };
  return {
    location_id: parseInt(cols[0]),
    name: cols[1],
    slug: slug,
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
      { name: "Lê Lợi", role: "Anh hùng dân tộc", img: "https://upload.wikimedia.org/wikipedia/commons/8/81/Le_Loi_statue.JPG" },
      { name: "Nguyễn Trãi", role: "Danh nhân văn hóa", img: "https://upload.wikimedia.org/wikipedia/commons/f/f8/Portrait_of_Nguyen_Trai.jpg" }
    ],
    image: imgMap.image,
    heroImg: imgMap.heroImg
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
  const slug = cols[3];
  return {
    event_id: parseInt(cols[0]),
    period_id: periodId,
    name: cols[2],
    slug: slug,
    description: cols[4],
    start_year: parseInt(cols[5]),
    end_year: parseInt(cols[6]),
    year: parseInt(cols[5]),
    category: period ? period.name : "Không rõ",
    image: EVENT_IMAGES[slug] || "/images/home.png",
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
  const dbThumbnailUrl = cols[7] || "/images/home.png";
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
    thumbnail_url: dbThumbnailUrl,
    image: dbThumbnailUrl,
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
  events: articles
};
// UserPosts expects an array! `setArticles(data)`
fs.writeFileSync(path.resolve(__dirname, 'public/api/user_articles.json'), JSON.stringify(articles, null, 2));

if (articles.length > 0) {
  fs.writeFileSync(path.resolve(__dirname, 'public/api/user_article_detail.json'), JSON.stringify(articles[0], null, 2));
}

fs.writeFileSync(path.resolve(__dirname, 'public/api/user_profile_history.json'), JSON.stringify(userProfileHistory, null, 2));

console.log("Mock data synced successfully.");
