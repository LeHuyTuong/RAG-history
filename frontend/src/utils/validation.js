/**
 * Kiểm tra tính hợp lệ của mật khẩu (Password Strength)
 * - Ít nhất 6 ký tự
 * - Phải có ít nhất 1 chữ hoa
 * - Phải có ít nhất 1 chữ thường
 * - Phải có ít nhất 1 chữ số
 * - Phải có ít nhất 1 ký tự đặc biệt
 */
export const validatePasswordStrength = (password) => {
  if (!password || password.length < 6) return false;
  return /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])/.test(password);
};

/**
 * Kiểm tra định dạng slug hợp lệ
 * @param {string} slug
 * @returns {boolean} true nếu hợp lệ
 */
export const validateSlug = (slug) => {
  if (!slug) return false;
  return /^[a-z0-9-]+$/.test(slug);
};

/**
 * Kiểm tra khoảng thời gian hợp lệ (Năm bắt đầu <= Năm kết thúc)
 * Xử lý cả TCN (trước Công Nguyên - số âm) và SCN (sau Công Nguyên - số dương)
 * @param {number|string} startVal 
 * @param {string} startEra 'TCN' hoặc 'SCN'
 * @param {number|string} endVal 
 * @param {string} endEra 'TCN' hoặc 'SCN'
 * @returns {boolean}
 */
export const validateYearRange = (startVal, startEra, endVal, endEra) => {
  if (startVal === '' || endVal === '' || startVal === null || endVal === null || startVal === undefined || endVal === undefined) return true;
  
  const start = startEra === 'TCN' ? -Math.abs(Number(startVal)) : Math.abs(Number(startVal));
  const end = endEra === 'TCN' ? -Math.abs(Number(endVal)) : Math.abs(Number(endVal));
  
  return start <= end;
};

/**
 * Kiểm tra ngày xuất bản không được ở tương lai nếu trạng thái là PUBLISHED
 * @param {string} status 'draft' | 'published' | 'DRAFT' | 'PUBLISHED'
 * @param {string|Date} publishedAt 
 * @returns {boolean}
 */
export const validatePublishDate = (status, publishedAt) => {
  const normalizedStatus = (status || '').toUpperCase();
  if (normalizedStatus !== 'PUBLISHED') return true;
  if (!publishedAt) return true;
  
  const publishDate = new Date(publishedAt);
  const now = new Date();
  
  // So sánh ở mức ngày, cho phép ngày hôm nay
  publishDate.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  
  return publishDate.getTime() <= now.getTime();
};
