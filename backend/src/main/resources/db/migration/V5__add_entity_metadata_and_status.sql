
-- 1. Thêm image_url (LONGTEXT) cho các entity để lưu ảnh Base64
ALTER TABLE person ADD COLUMN image_url LONGTEXT NULL;
ALTER TABLE period ADD COLUMN image_url LONGTEXT NULL;
ALTER TABLE location ADD COLUMN image_url LONGTEXT NULL;
ALTER TABLE event ADD COLUMN image_url LONGTEXT NULL;

-- 2. Chuyển đổi cột thumbnail_url của post sang kiểu LONGTEXT
ALTER TABLE post MODIFY COLUMN thumbnail_url LONGTEXT NULL;
ALTER TABLE person MODIFY biography LONGTEXT;

-- 3. Thêm cột status để hỗ trợ lọc Bản nháp (DRAFT) vs Công khai (PUBLISHED)
ALTER TABLE person ADD COLUMN status VARCHAR(20) DEFAULT 'PUBLISHED';
ALTER TABLE period ADD COLUMN status VARCHAR(20) DEFAULT 'PUBLISHED';
ALTER TABLE location ADD COLUMN status VARCHAR(20) DEFAULT 'PUBLISHED';
ALTER TABLE event ADD COLUMN status VARCHAR(20) DEFAULT 'PUBLISHED';

-- 4. Thêm start_year và end_year cho bài viết (post)
ALTER TABLE post ADD COLUMN start_year INT;
ALTER TABLE post ADD COLUMN end_year INT;

-- 5. Thêm trường dynasty (triều đại) cho địa danh (location)
ALTER TABLE location ADD COLUMN dynasty VARCHAR(500);
